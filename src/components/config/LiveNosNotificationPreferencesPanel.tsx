// src/components/config/LiveNosNotificationPreferencesPanel.tsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Bell,
  BellOff,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageCircleMore,
  Monitor,
  RefreshCcw,
  Save,
  ShoppingBag,
  UsersRound,
  Volume2,
  VolumeX
} from "lucide-react";

import {
  supabase
} from "../../lib/supabase";

type ProfileRow = {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  rol: string | null;
  activo: boolean | null;
};

type NotificationPreferences = {
  user_id: string;
  sound_enabled: boolean;
  system_notification_enabled: boolean;
  toast_enabled: boolean;
  cande_enabled: boolean;
  internal_messages_enabled: boolean;
  new_conversations_enabled: boolean;
  budgets_enabled: boolean;
  opportunities_enabled: boolean;
  do_not_disturb_enabled: boolean;
  do_not_disturb_from: string | null;
  do_not_disturb_until: string | null;
};

type NoticeState = {
  type: "success" | "error" | "info";
  message: string;
} | null;

const DEFAULT_PREFERENCES: NotificationPreferences = {
  user_id: "",
  sound_enabled: true,
  system_notification_enabled: true,
  toast_enabled: true,
  cande_enabled: true,
  internal_messages_enabled: true,
  new_conversations_enabled: true,
  budgets_enabled: true,
  opportunities_enabled: true,
  do_not_disturb_enabled: false,
  do_not_disturb_from: "23:00",
  do_not_disturb_until: "08:00"
};

function normalizeRole(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getProfileName(profile: ProfileRow): string {
  const fullName = [
    profile.nombre,
    profile.apellido
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    profile.email ||
    "Usuario sin nombre"
  );
}

function normalizeTime(value: string | null): string {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

function PreferenceSwitch(props: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  icon: typeof Bell;
  onChange: (checked: boolean) => void;
}) {
  const Icon = props.icon;

  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={() => {
        props.onChange(!props.checked);
      }}
      className={[
        "flex w-full items-center gap-3 rounded-[12px] border p-3 text-left transition",
        props.checked
          ? "border-[#4f7c90]/20 bg-[#f3f8f9]"
          : "border-black/10 bg-white",
        props.disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:border-[#4f7c90]/30 hover:bg-[#f8fafc]"
      ].join(" ")}
    >
      <div
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
          props.checked
            ? "bg-[#4f7c90] text-white"
            : "bg-[#f1f5f9] text-[#64748b]"
        ].join(" ")}
      >
        <Icon
          size={17}
          strokeWidth={1.8}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-[#172033]">
          {props.label}
        </div>

        <div className="mt-0.5 text-[11px] leading-4 text-[#64748b]">
          {props.description}
        </div>
      </div>

      <div
        className={[
          "relative h-5 w-9 shrink-0 rounded-full transition",
          props.checked
            ? "bg-[#4f7c90]"
            : "bg-[#cbd5e1]"
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition",
            props.checked
              ? "left-[18px]"
              : "left-0.5"
          ].join(" ")}
        />
      </div>
    </button>
  );
}

export function LiveNosNotificationPreferencesPanel() {
  const [
    profiles,
    setProfiles
  ] = useState<ProfileRow[]>([]);

  const [
    selectedUserId,
    setSelectedUserId
  ] = useState("");

  const [
    preferences,
    setPreferences
  ] = useState<NotificationPreferences>(
    DEFAULT_PREFERENCES
  );

  const [
    currentUserIsGerencia,
    setCurrentUserIsGerencia
  ] = useState(false);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    saving,
    setSaving
  ] = useState(false);

  const [
    notice,
    setNotice
  ] = useState<NoticeState>(null);

  const selectedProfile = useMemo(
    () =>
      profiles.find(
        (profile) =>
          profile.id === selectedUserId
      ) || null,
    [
      profiles,
      selectedUserId
    ]
  );

  const loadPreferences =
    useCallback(
      async (
        userId: string
      ) => {
        if (!userId) {
          setPreferences(
            DEFAULT_PREFERENCES
          );

          return;
        }

        const {
          data,
          error
        } = await supabase
          .from(
            "livenos_notification_preferences"
          )
          .select(
            [
              "user_id",
              "sound_enabled",
              "system_notification_enabled",
              "toast_enabled",
              "cande_enabled",
              "internal_messages_enabled",
              "new_conversations_enabled",
              "budgets_enabled",
              "opportunities_enabled",
              "do_not_disturb_enabled",
              "do_not_disturb_from",
              "do_not_disturb_until"
            ].join(",")
          )
          .eq(
            "user_id",
            userId
          )
          .maybeSingle();

        if (error) {
          setNotice({
            type: "error",
            message:
              "No se pudieron cargar las preferencias del usuario."
          });

          return;
        }

        const stored =
          (data ||
            {}) as unknown as Partial<NotificationPreferences>;

        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...stored,
          user_id: userId,
          do_not_disturb_from:
            normalizeTime(
              stored.do_not_disturb_from ||
                DEFAULT_PREFERENCES.do_not_disturb_from
            ),
          do_not_disturb_until:
            normalizeTime(
              stored.do_not_disturb_until ||
                DEFAULT_PREFERENCES.do_not_disturb_until
            )
        });
      },
      []
    );

  const loadData =
    useCallback(async () => {
      setLoading(true);
      setNotice(null);

      try {
        const {
          data: authData,
          error: authError
        } = await supabase.auth.getUser();

        if (
          authError ||
          !authData.user
        ) {
          throw new Error(
            "No se pudo identificar al usuario actual."
          );
        }

        const [
          currentProfileResult,
          profilesResult
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id,rol,activo"
            )
            .eq(
              "id",
              authData.user.id
            )
            .maybeSingle(),

          supabase
            .from("profiles")
            .select(
              [
                "id",
                "nombre",
                "apellido",
                "email",
                "rol",
                "activo"
              ].join(",")
            )
            .order(
              "nombre",
              {
                ascending: true
              }
            )
        ]);

        if (
          currentProfileResult.error
        ) {
          throw currentProfileResult.error;
        }

        if (profilesResult.error) {
          throw profilesResult.error;
        }

        const currentProfile =
          currentProfileResult.data as unknown as {
            rol?: string | null;
            activo?: boolean | null;
          } | null;

        setCurrentUserIsGerencia(
          currentProfile?.activo !== false &&
            normalizeRole(
              currentProfile?.rol
            ) === "gerencia"
        );

        const loadedProfiles =
          (profilesResult.data ||
            []) as unknown as ProfileRow[];

        setProfiles(
          loadedProfiles
        );

        const nextUserId =
          selectedUserId &&
          loadedProfiles.some(
            (profile) =>
              profile.id ===
              selectedUserId
          )
            ? selectedUserId
            : loadedProfiles[0]?.id ||
              "";

        setSelectedUserId(
          nextUserId
        );

        await loadPreferences(
          nextUserId
        );
      } catch (error) {
        setNotice({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "No se pudo cargar la configuración."
        });
      } finally {
        setLoading(false);
      }
    }, [
      loadPreferences,
      selectedUserId
    ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleUserChange(
    userId: string
  ) {
    setSelectedUserId(userId);
    setNotice(null);
    setLoading(true);

    await loadPreferences(userId);

    setLoading(false);
  }

  function updatePreference<
    Key extends keyof NotificationPreferences
  >(
    key: Key,
    value: NotificationPreferences[Key]
  ) {
    setPreferences(
      (current) => ({
        ...current,
        [key]: value
      })
    );
  }

  async function handleSave() {
    if (
      !currentUserIsGerencia ||
      !selectedUserId
    ) {
      return;
    }

    setSaving(true);
    setNotice(null);

    const payload = {
      user_id: selectedUserId,
      sound_enabled:
        preferences.sound_enabled,
      system_notification_enabled:
        preferences.system_notification_enabled,
      toast_enabled:
        preferences.toast_enabled,
      cande_enabled:
        preferences.cande_enabled,
      internal_messages_enabled:
        preferences.internal_messages_enabled,
      new_conversations_enabled:
        preferences.new_conversations_enabled,
      budgets_enabled:
        preferences.budgets_enabled,
      opportunities_enabled:
        preferences.opportunities_enabled,
      do_not_disturb_enabled:
        preferences.do_not_disturb_enabled,
      do_not_disturb_from:
        preferences.do_not_disturb_enabled
          ? preferences.do_not_disturb_from ||
            null
          : null,
      do_not_disturb_until:
        preferences.do_not_disturb_enabled
          ? preferences.do_not_disturb_until ||
            null
          : null
    };

    const {
      error
    } = await supabase
      .from(
        "livenos_notification_preferences"
      )
      .upsert(
        payload,
        {
          onConflict: "user_id"
        }
      );

    if (error) {
      setNotice({
        type: "error",
        message:
          error.message ||
          "No se pudieron guardar las preferencias."
      });

      setSaving(false);
      return;
    }

    setNotice({
      type: "success",
      message:
        "Preferencias actualizadas. El usuario recibirá los cambios sin recargar NOSTUR."
    });

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-[16px] border border-black/10 bg-white/70">
        <div className="flex items-center gap-2 text-[12px] font-medium text-[#64748b]">
          <Loader2
            size={16}
            className="animate-spin"
          />
          Cargando preferencias…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <section className="rounded-[16px] border border-black/10 bg-white/68 p-3 shadow-sm backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Bell
                size={15}
                className="text-[#4f7c90]"
              />

              <h3 className="text-[13px] font-semibold text-[#172033]">
                Preferencias por usuario
              </h3>
            </div>

            <p className="mt-1 text-[11.5px] leading-5 text-[#64748b]">
              Solo gerencia puede modificar sonidos, avisos visuales, toasts y tipos de notificación.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadData();
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-white px-3 text-[11px] font-semibold text-[#334155] shadow-sm ring-1 ring-black/10 transition hover:bg-[#f8fafc]"
          >
            <RefreshCcw
              size={13}
              strokeWidth={1.8}
            />
            Actualizar
          </button>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(240px,360px)_1fr]">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#475569]">
              Usuario
            </span>

            <select
              value={selectedUserId}
              onChange={(event) => {
                void handleUserChange(
                  event.target.value
                );
              }}
              className="h-10 w-full rounded-[10px] border border-black/10 bg-white px-3 text-[12px] font-medium text-[#172033] outline-none transition focus:border-[#4f7c90]/40 focus:ring-2 focus:ring-[#4f7c90]/10"
            >
              {profiles.map(
                (profile) => (
                  <option
                    key={profile.id}
                    value={profile.id}
                  >
                    {getProfileName(
                      profile
                    )}
                    {" · "}
                    {profile.rol ||
                      "sin rol"}
                    {profile.activo === false
                      ? " · inactivo"
                      : ""}
                  </option>
                )
              )}
            </select>
          </label>

          <div className="flex items-end">
            <div className="w-full rounded-[10px] bg-[#f8fafc] px-3 py-2.5 ring-1 ring-black/5">
              <div className="text-[11px] font-semibold text-[#172033]">
                {selectedProfile
                  ? getProfileName(
                      selectedProfile
                    )
                  : "Sin usuario seleccionado"}
              </div>

              <div className="mt-0.5 text-[10.5px] text-[#64748b]">
                Rol:{" "}
                {selectedProfile?.rol ||
                  "sin rol"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {!currentUserIsGerencia ? (
        <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11.5px] font-medium text-amber-800">
          Esta configuración es de solo lectura. Únicamente gerencia puede modificarla.
        </div>
      ) : null}

      {notice ? (
        <div
          className={[
            "rounded-[12px] border px-3 py-2.5 text-[11.5px] font-medium",
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : notice.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-blue-200 bg-blue-50 text-blue-700"
          ].join(" ")}
        >
          {notice.message}
        </div>
      ) : null}

      <section className="rounded-[16px] border border-black/10 bg-white/68 p-3 shadow-sm backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2">
          <Monitor
            size={14}
            className="text-[#4f7c90]"
          />

          <h3 className="text-[12px] font-semibold text-[#172033]">
            Canales de aviso
          </h3>
        </div>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          <PreferenceSwitch
            label="Sonido"
            description="Reproduce un aviso sonoro dentro de NOSTUR."
            checked={
              preferences.sound_enabled
            }
            disabled={
              !currentUserIsGerencia
            }
            icon={
              preferences.sound_enabled
                ? Volume2
                : VolumeX
            }
            onChange={(checked) =>
              updatePreference(
                "sound_enabled",
                checked
              )
            }
          />

          <PreferenceSwitch
            label="Notificación visual"
            description="Muestra avisos de macOS, Windows o PWA."
            checked={
              preferences.system_notification_enabled
            }
            disabled={
              !currentUserIsGerencia
            }
            icon={Monitor}
            onChange={(checked) =>
              updatePreference(
                "system_notification_enabled",
                checked
              )
            }
          />

          <PreferenceSwitch
            label="Toast interno"
            description="Muestra avisos dentro de la aplicación."
            checked={
              preferences.toast_enabled
            }
            disabled={
              !currentUserIsGerencia
            }
            icon={MessageCircleMore}
            onChange={(checked) =>
              updatePreference(
                "toast_enabled",
                checked
              )
            }
          />
        </div>
      </section>

      <section className="rounded-[16px] border border-black/10 bg-white/68 p-3 shadow-sm backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2">
          <Bell
            size={14}
            className="text-[#4f7c90]"
          />

          <h3 className="text-[12px] font-semibold text-[#172033]">
            Tipos de notificación
          </h3>
        </div>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          <PreferenceSwitch
            label="CANDE"
            description="Derivaciones y eventos comerciales de CANDE."
            checked={
              preferences.cande_enabled
            }
            disabled={
              !currentUserIsGerencia
            }
            icon={Bot}
            onChange={(checked) =>
              updatePreference(
                "cande_enabled",
                checked
              )
            }
          />

          <PreferenceSwitch
            label="Mensajes internos"
            description="Notas y mensajes entre integrantes del equipo."
            checked={
              preferences.internal_messages_enabled
            }
            disabled={
              !currentUserIsGerencia
            }
            icon={UsersRound}
            onChange={(checked) =>
              updatePreference(
                "internal_messages_enabled",
                checked
              )
            }
          />

          <PreferenceSwitch
            label="Conversaciones nuevas"
            description="Nuevos pasajeros y conversaciones sin atender."
            checked={
              preferences.new_conversations_enabled
            }
            disabled={
              !currentUserIsGerencia
            }
            icon={MessageCircleMore}
            onChange={(checked) =>
              updatePreference(
                "new_conversations_enabled",
                checked
              )
            }
          />

          <PreferenceSwitch
            label="Presupuestos"
            description="Eventos relacionados con presupuestos comerciales."
            checked={
              preferences.budgets_enabled
            }
            disabled={
              !currentUserIsGerencia
            }
            icon={ShoppingBag}
            onChange={(checked) =>
              updatePreference(
                "budgets_enabled",
                checked
              )
            }
          />

          <PreferenceSwitch
            label="Oportunidades"
            description="Cambios y alertas de oportunidades comerciales."
            checked={
              preferences.opportunities_enabled
            }
            disabled={
              !currentUserIsGerencia
            }
            icon={BriefcaseBusiness}
            onChange={(checked) =>
              updatePreference(
                "opportunities_enabled",
                checked
              )
            }
          />
        </div>
      </section>

      <section className="rounded-[16px] border border-black/10 bg-white/68 p-3 shadow-sm backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2">
          <Clock3
            size={14}
            className="text-[#4f7c90]"
          />

          <h3 className="text-[12px] font-semibold text-[#172033]">
            No molestar
          </h3>
        </div>

        <PreferenceSwitch
          label="Activar horario silencioso"
          description="Durante este horario no se reproducen sonidos ni avisos del sistema. Los toasts internos permanecen disponibles."
          checked={
            preferences.do_not_disturb_enabled
          }
          disabled={
            !currentUserIsGerencia
          }
          icon={
            preferences.do_not_disturb_enabled
              ? BellOff
              : Bell
          }
          onChange={(checked) =>
            updatePreference(
              "do_not_disturb_enabled",
              checked
            )
          }
        />

        {preferences.do_not_disturb_enabled ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-[11px] font-semibold text-[#475569]">
                Desde
              </span>

              <input
                type="time"
                value={
                  preferences.do_not_disturb_from ||
                  ""
                }
                disabled={
                  !currentUserIsGerencia
                }
                onChange={(event) =>
                  updatePreference(
                    "do_not_disturb_from",
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-[10px] border border-black/10 bg-white px-3 text-[12px] font-medium text-[#172033] outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-[11px] font-semibold text-[#475569]">
                Hasta
              </span>

              <input
                type="time"
                value={
                  preferences.do_not_disturb_until ||
                  ""
                }
                disabled={
                  !currentUserIsGerencia
                }
                onChange={(event) =>
                  updatePreference(
                    "do_not_disturb_until",
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-[10px] border border-black/10 bg-white px-3 text-[12px] font-medium text-[#172033] outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          </div>
        ) : null}
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={
            !currentUserIsGerencia ||
            saving ||
            !selectedUserId
          }
          onClick={() => {
            void handleSave();
          }}
          className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-[#ff634a] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#f2553d] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {saving ? (
            <Loader2
              size={14}
              className="animate-spin"
            />
          ) : (
            <Save
              size={14}
              strokeWidth={1.8}
            />
          )}

          {saving
            ? "Guardando…"
            : "Guardar preferencias"}
        </button>
      </div>

      {notice?.type === "success" ? (
        <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-700">
          <CheckCircle2
            size={13}
          />
          Configuración sincronizada.
        </div>
      ) : null}
    </div>
  );
}

export default LiveNosNotificationPreferencesPanel;
