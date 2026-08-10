create sequence if not exists public.presupuestos_v3_numero_seq
  start with 1
  increment by 1
  minvalue 1
  no maxvalue
  cache 1;

create table if not exists public.presupuestos_v3 (
  id uuid primary key default gen_random_uuid(),

  numero bigint not null
    default nextval(
      'public.presupuestos_v3_numero_seq'
    ),

  nombre text not null,

  cliente_id uuid
    references public.clientes(id)
    on delete set null,

  contacto_nombre text not null,
  contacto_telefono text not null default '',

  destino text,
  estado text not null default 'draft'
    check (
      estado in (
        'draft',
        'editing',
        'completed'
      )
    ),

  observaciones text,

  template_id text,

  documento jsonb not null,

  creado_por uuid not null
    references public.profiles(id)
    on delete restrict,

  vendedor_id uuid
    references public.profiles(id)
    on delete set null,

  sucursal_id uuid
    references public.sucursales(id)
    on delete set null,

  activo boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint presupuestos_v3_numero_unique
    unique (numero)
);

create index if not exists presupuestos_v3_cliente_id_idx
  on public.presupuestos_v3(cliente_id);

create index if not exists presupuestos_v3_creado_por_idx
  on public.presupuestos_v3(creado_por);

create index if not exists presupuestos_v3_vendedor_id_idx
  on public.presupuestos_v3(vendedor_id);

create index if not exists presupuestos_v3_sucursal_id_idx
  on public.presupuestos_v3(sucursal_id);

create index if not exists presupuestos_v3_estado_idx
  on public.presupuestos_v3(estado);

create index if not exists presupuestos_v3_activo_idx
  on public.presupuestos_v3(activo);

create index if not exists presupuestos_v3_updated_at_idx
  on public.presupuestos_v3(updated_at desc);

create or replace function public.set_presupuestos_v3_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_presupuestos_v3_updated_at
  on public.presupuestos_v3;

create trigger trg_presupuestos_v3_updated_at
before update on public.presupuestos_v3
for each row
execute function public.set_presupuestos_v3_updated_at();

alter table public.presupuestos_v3
enable row level security;

drop policy if exists "Usuarios internos pueden ver presupuestos"
  on public.presupuestos_v3;

create policy "Usuarios internos pueden ver presupuestos"
on public.presupuestos_v3
for select
to authenticated
using (
  activo = true
  and (
    creado_por = auth.uid()
    or vendedor_id = auth.uid()
    or exists (
      select 1
      from public.profiles profile
      where profile.id = auth.uid()
        and profile.activo = true
        and (
          profile.rol in (
            'admin_general',
            'gerencia',
            'administracion'
          )
          or profile.is_super_admin = true
          or profile.is_support_user = true
        )
    )
  )
);

drop policy if exists "Usuarios internos pueden crear presupuestos"
  on public.presupuestos_v3;

create policy "Usuarios internos pueden crear presupuestos"
on public.presupuestos_v3
for insert
to authenticated
with check (
  creado_por = auth.uid()
);

drop policy if exists "Usuarios internos pueden actualizar presupuestos"
  on public.presupuestos_v3;

create policy "Usuarios internos pueden actualizar presupuestos"
on public.presupuestos_v3
for update
to authenticated
using (
  creado_por = auth.uid()
  or vendedor_id = auth.uid()
  or exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.activo = true
      and (
        profile.rol in (
          'admin_general',
          'gerencia',
          'administracion'
        )
        or profile.is_super_admin = true
        or profile.is_support_user = true
      )
  )
)
with check (
  creado_por = auth.uid()
  or vendedor_id = auth.uid()
  or exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.activo = true
      and (
        profile.rol in (
          'admin_general',
          'gerencia',
          'administracion'
        )
        or profile.is_super_admin = true
        or profile.is_support_user = true
      )
  )
);

drop policy if exists "Usuarios internos pueden desactivar presupuestos"
  on public.presupuestos_v3;

create policy "Usuarios internos pueden desactivar presupuestos"
on public.presupuestos_v3
for delete
to authenticated
using (
  creado_por = auth.uid()
  or exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.activo = true
      and (
        profile.rol in (
          'admin_general',
          'gerencia'
        )
        or profile.is_super_admin = true
        or profile.is_support_user = true
      )
  )
);
