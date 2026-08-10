create table if not exists public.presupuesto_componentes (
  id uuid primary key default gen_random_uuid(),

  nombre text not null,
  descripcion text,

  categoria text not null default 'otros'
    check (
      categoria in (
        'encabezados',
        'pies',
        'incluye',
        'no-incluye',
        'hoteles',
        'vuelos',
        'cruceros',
        'precios',
        'contacto',
        'sellos',
        'llamadas',
        'otros'
      )
    ),

  etiquetas text[] not null default '{}',

  visibilidad text not null default 'personal'
    check (
      visibilidad in (
        'personal',
        'empresa'
      )
    ),

  thumbnail_url text,

  ancho numeric not null default 0,
  alto numeric not null default 0,

  elementos jsonb not null default '[]'::jsonb,

  creado_por uuid not null
    references public.profiles(id)
    on delete cascade,

  usos integer not null default 0,

  activo boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists presupuesto_componentes_creado_por_idx
  on public.presupuesto_componentes(creado_por);

create index if not exists presupuesto_componentes_categoria_idx
  on public.presupuesto_componentes(categoria);

create index if not exists presupuesto_componentes_visibilidad_idx
  on public.presupuesto_componentes(visibilidad);

create index if not exists presupuesto_componentes_activo_idx
  on public.presupuesto_componentes(activo);

create index if not exists presupuesto_componentes_updated_at_idx
  on public.presupuesto_componentes(updated_at desc);

create index if not exists presupuesto_componentes_etiquetas_idx
  on public.presupuesto_componentes
  using gin(etiquetas);

create or replace function public.set_presupuesto_componente_updated_at()
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

drop trigger if exists trg_presupuesto_componentes_updated_at
  on public.presupuesto_componentes;

create trigger trg_presupuesto_componentes_updated_at
before update on public.presupuesto_componentes
for each row
execute function public.set_presupuesto_componente_updated_at();

alter table public.presupuesto_componentes
enable row level security;

drop policy if exists "Usuarios internos pueden ver componentes"
  on public.presupuesto_componentes;

create policy "Usuarios internos pueden ver componentes"
on public.presupuesto_componentes
for select
to authenticated
using (
  activo = true
  and (
    visibilidad = 'empresa'
    or creado_por = auth.uid()
  )
);

drop policy if exists "Usuarios internos pueden crear componentes"
  on public.presupuesto_componentes;

create policy "Usuarios internos pueden crear componentes"
on public.presupuesto_componentes
for insert
to authenticated
with check (
  creado_por = auth.uid()
);

drop policy if exists "Autores pueden actualizar componentes"
  on public.presupuesto_componentes;

create policy "Autores pueden actualizar componentes"
on public.presupuesto_componentes
for update
to authenticated
using (
  creado_por = auth.uid()
)
with check (
  creado_por = auth.uid()
);

drop policy if exists "Autores pueden eliminar componentes"
  on public.presupuesto_componentes;

create policy "Autores pueden eliminar componentes"
on public.presupuesto_componentes
for delete
to authenticated
using (
  creado_por = auth.uid()
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'presupuesto-componentes',
  'presupuesto-componentes',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Usuarios internos pueden ver miniaturas de componentes"
  on storage.objects;

create policy "Usuarios internos pueden ver miniaturas de componentes"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'presupuesto-componentes'
);

drop policy if exists "Usuarios internos pueden subir miniaturas de componentes"
  on storage.objects;

create policy "Usuarios internos pueden subir miniaturas de componentes"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'presupuesto-componentes'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
);

drop policy if exists "Usuarios pueden actualizar sus miniaturas de componentes"
  on storage.objects;

create policy "Usuarios pueden actualizar sus miniaturas de componentes"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'presupuesto-componentes'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
)
with check (
  bucket_id = 'presupuesto-componentes'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
);

drop policy if exists "Usuarios pueden eliminar sus miniaturas de componentes"
  on storage.objects;

create policy "Usuarios pueden eliminar sus miniaturas de componentes"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'presupuesto-componentes'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
);
