create table if not exists public.presupuesto_templates (
  id uuid primary key default gen_random_uuid(),

  nombre text not null,
  descripcion text,
  categoria text not null default 'general',

  canvas jsonb not null,
  elements jsonb not null default '[]'::jsonb,

  thumbnail_url text,

  creado_por uuid not null references public.profiles(id) on delete cascade,

  visibilidad text not null default 'personal'
    check (
      visibilidad in (
        'personal',
        'empresa'
      )
    ),

  activo boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists presupuesto_templates_creado_por_idx
  on public.presupuesto_templates(creado_por);

create index if not exists presupuesto_templates_visibilidad_idx
  on public.presupuesto_templates(visibilidad);

create index if not exists presupuesto_templates_activo_idx
  on public.presupuesto_templates(activo);

create or replace function public.set_presupuesto_template_updated_at()
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

drop trigger if exists trg_presupuesto_templates_updated_at
  on public.presupuesto_templates;

create trigger trg_presupuesto_templates_updated_at
before update on public.presupuesto_templates
for each row
execute function public.set_presupuesto_template_updated_at();

alter table public.presupuesto_templates
enable row level security;

drop policy if exists "Usuarios internos pueden ver templates"
  on public.presupuesto_templates;

create policy "Usuarios internos pueden ver templates"
on public.presupuesto_templates
for select
to authenticated
using (
  activo = true
  and (
    visibilidad = 'empresa'
    or creado_por = auth.uid()
  )
);

drop policy if exists "Usuarios internos pueden crear templates"
  on public.presupuesto_templates;

create policy "Usuarios internos pueden crear templates"
on public.presupuesto_templates
for insert
to authenticated
with check (
  creado_por = auth.uid()
);

drop policy if exists "Autores pueden actualizar templates personales"
  on public.presupuesto_templates;

create policy "Autores pueden actualizar templates personales"
on public.presupuesto_templates
for update
to authenticated
using (
  creado_por = auth.uid()
)
with check (
  creado_por = auth.uid()
);

drop policy if exists "Autores pueden eliminar templates"
  on public.presupuesto_templates;

create policy "Autores pueden eliminar templates"
on public.presupuesto_templates
for delete
to authenticated
using (
  creado_por = auth.uid()
);
