insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'presupuesto-templates',
  'presupuesto-templates',
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

drop policy if exists "Usuarios internos pueden ver miniaturas de templates"
  on storage.objects;

create policy "Usuarios internos pueden ver miniaturas de templates"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'presupuesto-templates'
);

drop policy if exists "Usuarios internos pueden subir miniaturas de templates"
  on storage.objects;

create policy "Usuarios internos pueden subir miniaturas de templates"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'presupuesto-templates'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Usuarios pueden actualizar sus miniaturas de templates"
  on storage.objects;

create policy "Usuarios pueden actualizar sus miniaturas de templates"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'presupuesto-templates'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'presupuesto-templates'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Usuarios pueden eliminar sus miniaturas de templates"
  on storage.objects;

create policy "Usuarios pueden eliminar sus miniaturas de templates"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'presupuesto-templates'
  and (storage.foldername(name))[1] = auth.uid()::text
);
