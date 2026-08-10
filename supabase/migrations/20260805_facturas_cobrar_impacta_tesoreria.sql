begin;

alter table public.facturas_cobrar_cobros
  add column if not exists forma_pago_id uuid null references public.formas_pago(id),
  add column if not exists movimiento_caja_id uuid null references public.caja_movimientos(id);

create or replace function public.registrar_cobro_facturas_cobrar(
  p_fecha_cobro date,
  p_moneda text,
  p_sucursal_id uuid,
  p_sucursal text,
  p_total_facturas numeric,
  p_importe_ingresado numeric,
  p_total_retenciones numeric,
  p_forma_pago_id uuid,
  p_caja_id uuid,
  p_referencia text,
  p_observaciones text,
  p_factura_ids uuid[],
  p_items jsonb,
  p_carrito_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_forma_pago public.formas_pago%rowtype;
  v_caja public.cajas%rowtype;
  v_cobro_id uuid;
  v_movimiento_id uuid;
  v_item jsonb;
begin
  if v_user_id is null then
    raise exception 'No hay usuario autenticado.';
  end if;

  select * into v_forma_pago
  from public.formas_pago
  where id = p_forma_pago_id and activo = true;

  if not found then
    raise exception 'La forma de pago no existe o está inactiva.';
  end if;

  if coalesce(array_length(p_factura_ids, 1), 0) = 0 then
    raise exception 'No se recibieron facturas para cobrar.';
  end if;

  if exists (
    select 1
    from public.facturas_cobrar
    where id = any(p_factura_ids)
      and (cobrado = true or estado = 'COBRADA')
  ) then
    raise exception 'Una o más facturas ya están cobradas.';
  end if;

  if v_forma_pago.impacta_tesoreria then
    if p_caja_id is null then
      raise exception 'La forma de pago impacta tesorería y requiere una caja.';
    end if;

    select * into v_caja
    from public.cajas
    where id = p_caja_id
      and coalesce(activo, true) = true
      and coalesce(activa, true) = true;

    if not found then
      raise exception 'La caja no existe o está inactiva.';
    end if;

    if upper(coalesce(v_caja.moneda, '')) <> upper(coalesce(p_moneda, '')) then
      raise exception 'La moneda de la caja no coincide con la moneda del cobro.';
    end if;

    if p_importe_ingresado <= 0 then
      raise exception 'El importe ingresado debe ser mayor a cero.';
    end if;
  end if;

  insert into public.facturas_cobrar_cobros (
    fecha_cobro,
    moneda,
    sucursal_id,
    sucursal,
    total_facturas,
    importe_ingresado_banco,
    total_retenciones,
    caja_id,
    caja,
    forma_cobro,
    forma_pago_id,
    referencia,
    observaciones,
    created_by
  ) values (
    p_fecha_cobro,
    p_moneda,
    p_sucursal_id,
    p_sucursal,
    p_total_facturas,
    p_importe_ingresado,
    p_total_retenciones,
    case when v_forma_pago.impacta_tesoreria then p_caja_id else null end,
    case when v_forma_pago.impacta_tesoreria then v_caja.nombre else null end,
    v_forma_pago.nombre,
    v_forma_pago.id,
    nullif(trim(coalesce(p_referencia, '')), ''),
    nullif(trim(coalesce(p_observaciones, '')), ''),
    v_user_id
  ) returning id into v_cobro_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.facturas_cobrar_cobros_items (
      cobro_id,
      factura_id,
      numero_documento,
      moneda,
      importe_factura,
      importe_cobrado,
      importe_retencion
    ) values (
      v_cobro_id,
      (v_item->>'factura_id')::uuid,
      v_item->>'numero_documento',
      v_item->>'moneda',
      (v_item->>'importe_factura')::numeric,
      (v_item->>'importe_cobrado')::numeric,
      (v_item->>'importe_retencion')::numeric
    );
  end loop;

  if v_forma_pago.impacta_tesoreria then
    insert into public.caja_movimientos (
      caja_id,
      fecha,
      tipo,
      categoria,
      descripcion,
      sucursal_id,
      moneda,
      importe,
      forma_pago,
      origen,
      referencia_tipo,
      referencia_id,
      referencia_texto,
      observaciones,
      created_by,
      updated_by,
      activo
    ) values (
      p_caja_id,
      p_fecha_cobro,
      'INGRESO',
      'Factura a cobrar',
      'Cobro de facturas ' || array_to_string(p_factura_ids, ', '),
      p_sucursal_id,
      p_moneda,
      p_importe_ingresado,
      v_forma_pago.nombre,
      'FACTURA_COBRAR',
      'COBRO_FACTURAS',
      v_cobro_id,
      nullif(trim(coalesce(p_referencia, '')), ''),
      nullif(trim(coalesce(p_observaciones, '')), ''),
      v_user_id,
      v_user_id,
      true
    ) returning id into v_movimiento_id;

    update public.facturas_cobrar_cobros
    set movimiento_caja_id = v_movimiento_id
    where id = v_cobro_id;
  end if;

  update public.facturas_cobrar
  set
    estado = 'COBRADA',
    cobrado = true,
    cobrado_at = now(),
    cobrado_by = v_user_id,
    forma_cobro = v_forma_pago.nombre,
    caja_id = case when v_forma_pago.impacta_tesoreria then p_caja_id else null end,
    caja = case when v_forma_pago.impacta_tesoreria then v_caja.nombre else null end,
    referencia_cobro = nullif(trim(coalesce(p_referencia, '')), ''),
    no_impacta_caja = not v_forma_pago.impacta_tesoreria,
    observaciones = nullif(trim(coalesce(p_observaciones, '')), ''),
    updated_at = now()
  where id = any(p_factura_ids);

  if coalesce(array_length(p_carrito_ids, 1), 0) > 0 then
    update public.carritos
    set
      cobrado = true,
      fecha_cobro = p_fecha_cobro,
      updated_at = now()
    where id = any(p_carrito_ids);
  end if;

  return v_cobro_id;
end;
$$;

revoke all on function public.registrar_cobro_facturas_cobrar(
  date, text, uuid, text, numeric, numeric, numeric, uuid, uuid, text, text, uuid[], jsonb, uuid[]
) from public;

grant execute on function public.registrar_cobro_facturas_cobrar(
  date, text, uuid, text, numeric, numeric, numeric, uuid, uuid, text, text, uuid[], jsonb, uuid[]
) to authenticated;

commit;
