create table if not exists public.presupuesto_recursos (
  id uuid primary key default gen_random_uuid(),

  nombre text not null,

  descripcion text,

  categoria text not null default 'otros'
    check (
      categoria in (
        'logos',
        'fondos',
        'destinos',
        'operadores',
        'sellos',
        'iconos',
        'banners',
        'otros'
      )
    ),

  etiquetas text[] not null default '{}',

  archivo_url text not null,
  storage_path text not null,

  mime_type text not null,
  extension text,

  ancho integer,
  alto integer,

  peso_bytes bigint not null default 0,

  creado_por uuid not null
    references public.profiles(id)
    on delete cascade,

  visibilidad text not null default 'personal'
    check (
      visibilidad in (
        'personal',
        'empresa'
      )
    ),

  favorito boolean not null default false,

  usos integer not null default 0,

  activo boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists presupuesto_recursos_creado_por_idx
  on public.presupuesto_recursos(creado_por);

create index if not exists presupuesto_recursos_categoria_idx
  on public.presupuesto_recursos(categoria);

create index if not exists presupuesto_recursos_visibilidad_idx
  on public.presupuesto_recursos(visibilidad);

create index if not exists presupuesto_recursos_activo_idx
  on public.presupuesto_recursos(activo);

create index if not exists presupuesto_recursos_updated_at_idx
  on public.presupuesto_recursos(updated_at desc);

create index if not exists presupuesto_recursos_etiquetas_idx
  on public.presupuesto_recursos
  using gin(etiquetas);

create or replace function public.set_presupuesto_recurso_updated_at()
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

drop trigger if exists trg_presupuesto_recursos_updated_at
  on public.presupuesto_recursos;

create trigger trg_presupuesto_recursos_updated_at
before update on public.presupuesto_recursos
for each row
execute function public.set_presupuesto_recurso_updated_at();

alter table public.presupuesto_recursos
enable row level security;

drop policy if exists "Usuarios internos pueden ver recursos"
  on public.presupuesto_recursos;

create policy "Usuarios internos pueden ver recursos"
on public.presupuesto_recursos
for select
to authenticated
using (
  activo = true
  and (
    visibilidad = 'empresa'
    or creado_por = auth.uid()
  )
);

drop policy if exists "Usuarios internos pueden crear recursos"
  on public.presupuesto_recursos;

create policy "Usuarios internos pueden crear recursos"
on public.presupuesto_recursos
for insert
to authenticated
with check (
  creado_por = auth.uid()
);

drop policy if exists "Autores pueden actualizar recursos"
  on public.presupuesto_recursos;

create policy "Autores pueden actualizar recursos"
on public.presupuesto_recursos
for update
to authenticated
using (
  creado_por = auth.uid()
)
with check (
  creado_por = auth.uid()
);

drop policy if exists "Autores pueden eliminar recursos"
  on public.presupuesto_recursos;

create policy "Autores pueden eliminar recursos"
on public.presupuesto_recursos
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
  'presupuesto-recursos',
  'presupuesto-recursos',
  true,
  15728640,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Usuarios internos pueden ver archivos de recursos"
  on storage.objects;

create policy "Usuarios internos pueden ver archivos de recursos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'presupuesto-recursos'
);

drop policy if exists "Usuarios internos pueden subir archivos de recursos"
  on storage.objects;

create policy "Usuarios internos pueden subir archivos de recursos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'presupuesto-recursos'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
);

drop policy if exists "Usuarios pueden actualizar sus archivos de recursos"
  on storage.objects;

create policy "Usuarios pueden actualizar sus archivos de recursos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'presupuesto-recursos'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
)
with check (
  bucket_id = 'presupuesto-recursos'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
);

drop policy if exists "Usuarios pueden eliminar sus archivos de recursos"
  on storage.objects;

create policy "Usuarios pueden eliminar sus archivos de recursos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'presupuesto-recursos'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
);
