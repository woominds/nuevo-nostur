create table if not exists public.carritos_reversiones_almundo (
  id uuid primary key default gen_random_uuid(),

  carrito_id uuid not null
    references public.carritos(id)
    on delete restrict,

  numero_carrito text not null,

  fecha_reversion date not null default current_date,

  utilidad_almundo numeric(14,2) not null,
  regalias numeric(14,2) not null,
  utilidad_nossix numeric(14,2) not null,
  importe_facturar numeric(14,2) not null,

  motivo text not null default 'CANCELACION_ALMUNDO',

  observaciones text null,

  created_by uuid null
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint carritos_reversiones_almundo_utilidad_negativa
    check (utilidad_almundo < 0),

  constraint carritos_reversiones_almundo_regalias_negativas
    check (regalias <= 0),

  constraint carritos_reversiones_almundo_utilidad_nossix_negativa
    check (utilidad_nossix <= 0),

  constraint carritos_reversiones_almundo_importe_facturar_negativo
    check (importe_facturar <= 0)
);

create index if not exists idx_carritos_reversiones_almundo_carrito
  on public.carritos_reversiones_almundo(carrito_id);

create index if not exists idx_carritos_reversiones_almundo_numero
  on public.carritos_reversiones_almundo(numero_carrito);

create index if not exists idx_carritos_reversiones_almundo_fecha
  on public.carritos_reversiones_almundo(fecha_reversion);

alter table public.carritos_reversiones_almundo
  enable row level security;

drop policy if exists
  "carritos_reversiones_almundo_select_authenticated"
  on public.carritos_reversiones_almundo;

create policy
  "carritos_reversiones_almundo_select_authenticated"
on public.carritos_reversiones_almundo
for select
to authenticated
using (true);

drop policy if exists
  "carritos_reversiones_almundo_insert_management"
  on public.carritos_reversiones_almundo;

create policy
  "carritos_reversiones_almundo_insert_management"
on public.carritos_reversiones_almundo
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and (
        p.is_super_admin = true
        or p.is_support_user = true
        or p.rol in (
          'admin_general',
          'gerencia',
          'administracion',
          'soporte'
        )
      )
  )
);

drop policy if exists
  "carritos_reversiones_almundo_update_management"
  on public.carritos_reversiones_almundo;

create policy
  "carritos_reversiones_almundo_update_management"
on public.carritos_reversiones_almundo
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and (
        p.is_super_admin = true
        or p.is_support_user = true
        or p.rol in (
          'admin_general',
          'gerencia',
          'administracion',
          'soporte'
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and (
        p.is_super_admin = true
        or p.is_support_user = true
        or p.rol in (
          'admin_general',
          'gerencia',
          'administracion',
          'soporte'
        )
      )
  )
);

comment on table public.carritos_reversiones_almundo is
'Movimientos negativos informados por ALMUNDO por cancelaciones o devoluciones de carritos. No reemplazan la utilidad original del carrito.';

comment on column public.carritos_reversiones_almundo.utilidad_almundo is
'Importe negativo de utilidad ALMUNDO devuelta.';

comment on column public.carritos_reversiones_almundo.regalias is
'Importe negativo de regalías devueltas.';

comment on column public.carritos_reversiones_almundo.utilidad_nossix is
'Resultado negativo para NOSSIX: utilidad ALMUNDO menos regalías, ambos con signo negativo.';

comment on column public.carritos_reversiones_almundo.importe_facturar is
'Importe negativo correspondiente al ajuste de facturación, incluyendo IVA según la lógica de Control de Ventas.';
