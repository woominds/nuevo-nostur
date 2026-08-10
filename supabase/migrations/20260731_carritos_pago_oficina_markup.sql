-- ============================================================
-- NOSTUR Travel
-- Carritos: pago diferente en oficina y markup adicional
-- ============================================================

alter table public.carritos
  add column if not exists pago_diferente_oficina boolean not null default false,
  add column if not exists forma_pago_oficina_id uuid null,
  add column if not exists forma_pago_oficina text null,
  add column if not exists observacion_pago_diferente text null,
  add column if not exists usa_markup_adicional boolean not null default false,
  add column if not exists markup_adicional_pct numeric(7,3) null;

-- La forma de pago real utiliza el mismo catálogo ya existente.
-- La FK se agrega solamente si todavía no existe.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'carritos_forma_pago_oficina_id_fkey'
  ) then
    alter table public.carritos
      add constraint carritos_forma_pago_oficina_id_fkey
      foreign key (forma_pago_oficina_id)
      references public.formas_pago(id)
      on update cascade
      on delete set null;
  end if;
end
$$;

-- El porcentaje solamente puede existir cuando se indicó markup,
-- y debe ser mayor que cero.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'carritos_markup_adicional_pct_check'
  ) then
    alter table public.carritos
      add constraint carritos_markup_adicional_pct_check
      check (
        (
          usa_markup_adicional = false
          and markup_adicional_pct is null
        )
        or
        (
          usa_markup_adicional = true
          and markup_adicional_pct > 0
          and markup_adicional_pct <= 100
        )
      );
  end if;
end
$$;

-- Consistencia de pago diferente en oficina.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'carritos_pago_diferente_oficina_check'
  ) then
    alter table public.carritos
      add constraint carritos_pago_diferente_oficina_check
      check (
        (
          pago_diferente_oficina = false
          and forma_pago_oficina_id is null
          and forma_pago_oficina is null
          and observacion_pago_diferente is null
        )
        or
        (
          pago_diferente_oficina = true
          and forma_pago_oficina_id is not null
        )
      );
  end if;
end
$$;

comment on column public.carritos.pago_diferente_oficina is
  'Indica que la forma de pago real recibida en la oficina difiere de la informada en ALMUNDO.';

comment on column public.carritos.forma_pago_oficina_id is
  'Forma de pago real recibida por la oficina, tomada del catálogo formas_pago.';

comment on column public.carritos.forma_pago_oficina is
  'Nombre histórico de la forma de pago real recibida en la oficina.';

comment on column public.carritos.observacion_pago_diferente is
  'Detalle opcional sobre la diferencia entre el pago informado en ALMUNDO y el recibido en oficina.';

comment on column public.carritos.usa_markup_adicional is
  'Indica que la venta utilizó un porcentaje de markup adicional.';

comment on column public.carritos.markup_adicional_pct is
  'Porcentaje de markup adicional utilizado en la venta. Dato informativo para uso posterior.';
