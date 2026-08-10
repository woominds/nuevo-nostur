create table if not exists public.livenos_notification_preferences (
  user_id uuid primary key
    references public.profiles(id)
    on delete cascade,

  sound_enabled boolean not null default true,
  system_notification_enabled boolean not null default true,
  toast_enabled boolean not null default true,

  cande_enabled boolean not null default true,
  internal_messages_enabled boolean not null default true,
  new_conversations_enabled boolean not null default true,
  budgets_enabled boolean not null default true,
  opportunities_enabled boolean not null default true,

  do_not_disturb_enabled boolean not null default false,
  do_not_disturb_from time without time zone null,
  do_not_disturb_until time without time zone null,

  updated_by uuid null
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.livenos_notification_preferences is
  'Preferencias de notificaciones de LiveNos por usuario. Solo gerencia puede modificarlas.';

comment on column public.livenos_notification_preferences.sound_enabled is
  'Habilita sonidos de notificación dentro de NOSTUR.';

comment on column public.livenos_notification_preferences.system_notification_enabled is
  'Habilita notificaciones visuales del navegador, macOS, Windows y PWA.';

comment on column public.livenos_notification_preferences.toast_enabled is
  'Habilita toasts internos dentro de la aplicación.';

comment on column public.livenos_notification_preferences.cande_enabled is
  'Habilita notificaciones relacionadas con CANDE y sus derivaciones.';

comment on column public.livenos_notification_preferences.internal_messages_enabled is
  'Habilita notificaciones de mensajes internos.';

comment on column public.livenos_notification_preferences.new_conversations_enabled is
  'Habilita notificaciones de conversaciones nuevas o sin atender.';

comment on column public.livenos_notification_preferences.budgets_enabled is
  'Habilita notificaciones relacionadas con presupuestos.';

comment on column public.livenos_notification_preferences.opportunities_enabled is
  'Habilita notificaciones relacionadas con oportunidades.';

create or replace function public.set_livenos_notification_preferences_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();

  if auth.uid() is not null then
    new.updated_by = auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_livenos_notification_preferences_updated_at
  on public.livenos_notification_preferences;

create trigger trg_livenos_notification_preferences_updated_at
before update
on public.livenos_notification_preferences
for each row
execute function public.set_livenos_notification_preferences_updated_at();

insert into public.livenos_notification_preferences (
  user_id
)
select profile.id
from public.profiles profile
where profile.activo = true
on conflict (user_id) do nothing;

create or replace function public.create_default_livenos_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.livenos_notification_preferences (
    user_id
  )
  values (
    new.id
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_create_default_livenos_notification_preferences
  on public.profiles;

create trigger trg_create_default_livenos_notification_preferences
after insert
on public.profiles
for each row
execute function public.create_default_livenos_notification_preferences();

alter table public.livenos_notification_preferences
enable row level security;

drop policy if exists
  "Usuarios pueden ver sus preferencias LiveNos"
  on public.livenos_notification_preferences;

create policy
  "Usuarios pueden ver sus preferencias LiveNos"
on public.livenos_notification_preferences
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.activo = true
      and profile.rol = 'gerencia'
  )
);

drop policy if exists
  "Gerencia puede crear preferencias LiveNos"
  on public.livenos_notification_preferences;

create policy
  "Gerencia puede crear preferencias LiveNos"
on public.livenos_notification_preferences
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.activo = true
      and profile.rol = 'gerencia'
  )
);

drop policy if exists
  "Gerencia puede actualizar preferencias LiveNos"
  on public.livenos_notification_preferences;

create policy
  "Gerencia puede actualizar preferencias LiveNos"
on public.livenos_notification_preferences
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.activo = true
      and profile.rol = 'gerencia'
  )
)
with check (
  exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.activo = true
      and profile.rol = 'gerencia'
  )
);

drop policy if exists
  "Gerencia puede eliminar preferencias LiveNos"
  on public.livenos_notification_preferences;

create policy
  "Gerencia puede eliminar preferencias LiveNos"
on public.livenos_notification_preferences
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.activo = true
      and profile.rol = 'gerencia'
  )
);

grant select
on public.livenos_notification_preferences
to authenticated;

grant insert, update, delete
on public.livenos_notification_preferences
to authenticated;
