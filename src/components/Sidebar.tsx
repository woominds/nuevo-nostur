import {
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CircleUserRound,
  ClipboardCheck,
  Clock3,
  ContactRound,
  FileClock,
  FileSpreadsheet,
  Gauge,
  HandCoins,
  Home,
  Landmark,
  LayoutTemplate,
  Link2,
  LogOut,
  Menu,
  MessageCircleMore,
  Plane,
  Receipt,
  Settings,
  ShieldAlert,
  Sparkles,
  Target,
  UsersRound,
  WalletCards
} from "lucide-react";
import type {
  LucideIcon
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  getVisibleAppsForProfile
} from "../registry/appRegistry";
import {
  brandAssets,
  brandText
} from "../lib/brandAssets";
import {
  useAuthStore
} from "../store/authStore";

export type AppSection =
  | "home"
  | "livenos"
  | "contactos-live"
  | "historiales-live"
  | "oportunidades"
  | "cande"
  | "nia"
  | "control-ia"
  | "clientes"
  | "presupuestos-v3"
  | "carritos"
  | "files"
  | "ctas-ctes"
  | "comisiones"
  | "caja"
  | "control-ventas"
  | "facturas-pagar"
  | "cashflow"
  | "facturas-cobrar"
  | "metas"
  | "pagos-operadores"
  | "riesgos"
  | "calendario-pax"
  | "horarios"
  | "pendientes"
  | "colaborativo"
  | "links-utiles"
  | "mi-perfil"
  | "configuracion"
  | "importador-catalogos";

type SidebarSectionKey =
  | "comunicaciones"
  | "ventas"
  | "administracion"
  | "operaciones";

type ProfileLike = {
  id?: string | null;
  rol?: string | null;
  activo?: boolean | null;
  is_super_admin?: boolean | null;
  is_support_user?: boolean | null;
};

type SidebarItem = {
  id: AppSection;
  label: string;
  icon: LucideIcon;
};

type SidebarProps = {
  activeSection: AppSection;
  onNavigate: (
    section: AppSection
  ) => void;
};

const STORAGE_KEY =
  "nostur:sidebar-compact";

const SECTION_LABELS: Record<
  SidebarSectionKey,
  string
> = {
  comunicaciones: "Comunicaciones",
  ventas: "Ventas",
  administracion: "Administración",
  operaciones: "Operaciones"
};

const SECTION_ICONS: Record<
  SidebarSectionKey,
  LucideIcon
> = {
  comunicaciones: Bot,
  ventas: BriefcaseBusiness,
  administracion: CircleDollarSign,
  operaciones: Plane
};

const SECTION_COLORS: Record<
  SidebarSectionKey,
  string
> = {
  comunicaciones: "#14b8a6",
  ventas: "#ff634a",
  administracion: "#0ea5e9",
  operaciones: "#8b5cf6"
};

const COMMUNICATION_ITEMS: SidebarItem[] = [
  {
    id: "livenos",
    label: "LiveNos",
    icon: MessageCircleMore
  },
  {
    id: "contactos-live",
    label: "Contactos Live",
    icon: ContactRound
  },
  {
    id: "historiales-live",
    label: "Historiales Live",
    icon: FileClock
  },
  {
    id: "oportunidades",
    label: "Oportunidades",
    icon: Target
  },
  {
    id: "cande",
    label: "Cande",
    icon: Sparkles
  },
  {
    id: "nia",
    label: "NIA",
    icon: Bot
  },
  {
    id: "control-ia",
    label: "Control IA",
    icon: ClipboardCheck
  }
];

const SALES_ITEMS: SidebarItem[] = [
  {
    id: "clientes",
    label: "Clientes",
    icon: UsersRound
  },
  {
    id: "presupuestos-v3",
    label: "Presupuestos",
    icon: LayoutTemplate
  },
  {
    id: "carritos",
    label: "Carritos",
    icon: BriefcaseBusiness
  },
  {
    id: "files",
    label: "Files",
    icon: FileSpreadsheet
  },
  {
    id: "ctas-ctes",
    label: "Cuentas corrientes",
    icon: WalletCards
  },
  {
    id: "comisiones",
    label: "Comisiones",
    icon: HandCoins
  }
];

const ADMINISTRATION_ITEMS: SidebarItem[] = [
  {
    id: "caja",
    label: "Caja",
    icon: Landmark
  },
  {
    id: "control-ventas",
    label: "Control de ventas",
    icon: ClipboardCheck
  },
  {
    id: "facturas-pagar",
    label: "Facturas a pagar",
    icon: Receipt
  },
  {
    id: "cashflow",
    label: "Cashflow",
    icon: Gauge
  },
  {
    id: "facturas-cobrar",
    label: "Facturas a cobrar",
    icon: CircleDollarSign
  },
  {
    id: "metas",
    label: "Metas",
    icon: Target
  },
  {
    id: "pagos-operadores",
    label: "Pago a operadores",
    icon: HandCoins
  },
  {
    id: "riesgos",
    label: "Riesgos",
    icon: ShieldAlert
  },
  {
    id: "importador-catalogos",
    label: "Importar catálogos",
    icon: FileSpreadsheet
  }
];

const OPERATIONS_ITEMS: SidebarItem[] = [
  {
    id: "calendario-pax",
    label: "Calendario Pax",
    icon: CalendarDays
  },
  {
    id: "horarios",
    label: "Horarios",
    icon: Clock3
  },
  {
    id: "pendientes",
    label: "Pendientes",
    icon: CheckSquare
  },
  {
    id: "colaborativo",
    label: "Colaborativo",
    icon: UsersRound
  },
  {
    id: "links-utiles",
    label: "Links útiles",
    icon: Link2
  },
  {
    id: "mi-perfil",
    label: "Mi perfil",
    icon: CircleUserRound
  }
];

const SECTION_ITEMS: Record<
  SidebarSectionKey,
  SidebarItem[]
> = {
  comunicaciones: COMMUNICATION_ITEMS,
  ventas: SALES_ITEMS,
  administracion: ADMINISTRATION_ITEMS,
  operaciones: OPERATIONS_ITEMS
};

function isAdminLike(
  profile: ProfileLike | null
): boolean {
  const role = String(
    profile?.rol || ""
  ).toLowerCase();

  return Boolean(
    profile?.activo &&
      (
        profile?.is_super_admin ||
        profile?.is_support_user ||
        role === "admin_general" ||
        role === "gerencia" ||
        role === "gerente" ||
        role === "administracion"
      )
  );
}

function BrandIcon({
  size = 36
}: {
  size?: number;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/10"
      style={{
        width: size,
        height: size
      }}
    >
      <img
        src={brandAssets.iconoColor}
        alt={brandText.appName}
        draggable={false}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

function getInitialCompact(): boolean {
  try {
    return (
      window.localStorage.getItem(
        STORAGE_KEY
      ) === "true"
    );
  } catch {
    return false;
  }
}

export function Sidebar({
  activeSection,
  onNavigate
}: SidebarProps) {
  const signOut = useAuthStore(
    (state) => state.signOut
  );

  const currentProfile = useAuthStore(
    (state: any) =>
      state.profile ||
      state.currentProfile ||
      state.userProfile ||
      state.sessionProfile ||
      state.profileData ||
      null
  ) as ProfileLike | null;

  const [compact, setCompact] =
    useState(getInitialCompact);

  const [openSections, setOpenSections] =
    useState<
      Record<SidebarSectionKey, boolean>
    >({
      comunicaciones: true,
      ventas: true,
      administracion: true,
      operaciones: true
    });

  const adminLike =
    isAdminLike(currentProfile);

  const visibleAppIds = useMemo(() => {
    return new Set(
      getVisibleAppsForProfile(
        currentProfile
      ).map((app) => app.id)
    );
  }, [currentProfile]);

  const visibleSections = useMemo(() => {
    const result = {} as Record<
      SidebarSectionKey,
      SidebarItem[]
    >;

    (
      Object.keys(
        SECTION_ITEMS
      ) as SidebarSectionKey[]
    ).forEach((section) => {
      if (
        section === "administracion" &&
        !adminLike
      ) {
        result[section] = [];
        return;
      }

      result[section] =
        SECTION_ITEMS[section].filter(
          (item) =>
            item.id ===
              "presupuestos-v3" ||
            adminLike ||
            visibleAppIds.has(item.id)
        );
    });

    return result;
  }, [
    adminLike,
    visibleAppIds
  ]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        String(compact)
      );
    } catch {
      // Sin acción.
    }
  }, [compact]);

  function toggleCompact() {
    setCompact(
      (current) => !current
    );
  }

  function toggleSection(
    section: SidebarSectionKey
  ) {
    if (compact) {
      setCompact(false);
      setOpenSections((current) => ({
        ...current,
        [section]: true
      }));
      return;
    }

    setOpenSections((current) => ({
      ...current,
      [section]: !current[section]
    }));
  }

  function isSectionActive(
    section: SidebarSectionKey
  ) {
    return visibleSections[
      section
    ].some(
      (item) =>
        item.id === activeSection
    );
  }

  function renderExpandedSection(
    section: SidebarSectionKey
  ) {
    const items =
      visibleSections[section];

    if (items.length === 0) {
      return null;
    }

    const SectionIcon =
      SECTION_ICONS[section];

    const open =
      openSections[section];

    const active =
      isSectionActive(section);

    const color =
      SECTION_COLORS[section];

    return (
      <section
        key={section}
        className="space-y-1"
      >
        <button
          type="button"
          onClick={() =>
            toggleSection(section)
          }
          className={[
            "flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-left transition",
            active
              ? "bg-white text-[#172033] shadow-sm ring-1 ring-black/5"
              : "text-[#64748b] hover:bg-white/80 hover:text-[#172033]"
          ].join(" ")}
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
            style={{
              backgroundColor: color
            }}
          >
            <SectionIcon
              size={15}
              strokeWidth={2}
            />
          </span>

          <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
            {SECTION_LABELS[section]}
          </span>

          {open ? (
            <ChevronDown
              size={14}
              className="text-[#94a3b8]"
            />
          ) : (
            <ChevronRight
              size={14}
              className="text-[#94a3b8]"
            />
          )}
        </button>

        {open ? (
          <div className="ml-[22px] border-l border-black/10 pl-3">
            <div className="space-y-0.5 py-1">
              {items.map((item) => {
                const Icon = item.icon;
                const itemActive =
                  item.id === activeSection;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      onNavigate(item.id)
                    }
                    className={[
                      "flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left transition",
                      itemActive
                        ? "bg-white text-[#172033] shadow-sm ring-1 ring-black/5"
                        : "text-[#64748b] hover:bg-white/80 hover:text-[#172033]"
                    ].join(" ")}
                  >
                    <Icon
                      size={14}
                      strokeWidth={
                        itemActive
                          ? 2.2
                          : 1.8
                      }
                      className="shrink-0"
                    />

                    <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  function renderCompactItems() {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto px-1 py-2">
        <button
          type="button"
          onClick={() =>
            onNavigate("home")
          }
          title="Inicio"
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition",
            activeSection === "home"
              ? "bg-white text-[#172033] shadow-sm ring-1 ring-black/10"
              : "text-[#64748b] hover:bg-white hover:text-[#172033]"
          ].join(" ")}
        >
          <Home
            size={18}
            strokeWidth={2}
          />
        </button>

        <div className="my-1 h-px w-8 shrink-0 bg-black/10" />

        {(
          Object.keys(
            visibleSections
          ) as SidebarSectionKey[]
        ).flatMap((section) =>
          visibleSections[section].map(
            (item) => {
              const Icon = item.icon;
              const active =
                item.id === activeSection;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onNavigate(item.id)
                  }
                  title={item.label}
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition",
                    active
                      ? "bg-white text-[#172033] shadow-sm ring-1 ring-black/10"
                      : "text-[#64748b] hover:bg-white hover:text-[#172033]"
                  ].join(" ")}
                >
                  <Icon
                    size={17}
                    strokeWidth={
                      active ? 2.2 : 1.8
                    }
                  />
                </button>
              );
            }
          )
        )}
      </div>
    );
  }

  return (
    <aside
      className={[
        "nostur-no-drag hidden h-screen shrink-0 flex-col border-r border-black/10 bg-[#f8fafc] transition-[width] duration-200 md:flex",
        compact
          ? "w-[64px]"
          : "w-[250px]"
      ].join(" ")}
    >
      <div
        className={[
          "relative flex h-[64px] shrink-0 items-center border-b border-black/10",
          compact
            ? "justify-center px-2"
            : "gap-3 px-3"
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() =>
            onNavigate("home")
          }
          aria-label="Ir al inicio"
          className="shrink-0"
        >
          <BrandIcon
            size={compact ? 38 : 40}
          />
        </button>

        {compact ? (
          <button
            type="button"
            onClick={toggleCompact}
            title="Abrir sidebar"
            aria-label="Abrir sidebar"
            className="absolute -right-3 top-1/2 z-30 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white text-[#64748b] shadow-sm transition hover:text-[#172033]"
          >
            <ChevronRight
              size={15}
              strokeWidth={2.2}
            />
          </button>
        ) : null}

        {!compact ? (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-[#172033]">
              {brandText.appName}
            </div>

            <div className="mt-1 truncate text-[10px] text-[#94a3b8]">
              {brandText.appDescription}
            </div>
          </div>
        ) : null}

        {!compact ? (
          <button
            type="button"
            onClick={toggleCompact}
            title="Compactar sidebar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#64748b] transition hover:bg-white hover:text-[#172033]"
          >
            <ChevronLeft
              size={17}
              strokeWidth={2}
            />
          </button>
        ) : null}
      </div>

      {compact ? (
        renderCompactItems()
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          <button
            type="button"
            onClick={() =>
              onNavigate("home")
            }
            className={[
              "mb-2 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left transition",
              activeSection === "home"
                ? "bg-white text-[#172033] shadow-sm ring-1 ring-black/5"
                : "text-[#64748b] hover:bg-white/80 hover:text-[#172033]"
            ].join(" ")}
          >
            <Home
              size={17}
              strokeWidth={2}
            />

            <span className="text-[12px] font-semibold">
              Inicio
            </span>
          </button>

          <div className="space-y-2">
            {renderExpandedSection(
              "comunicaciones"
            )}

            {renderExpandedSection(
              "ventas"
            )}

            {renderExpandedSection(
              "administracion"
            )}

            {renderExpandedSection(
              "operaciones"
            )}
          </div>
        </div>
      )}

      <div className="shrink-0 border-t border-black/10 p-2">
        {compact ? (
          <div className="flex flex-col items-center gap-1">
            {adminLike ? (
              <button
                type="button"
                onClick={() =>
                  onNavigate(
                    "configuracion"
                  )
                }
                title="Configuración"
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-lg transition",
                  activeSection ===
                  "configuracion"
                    ? "bg-white text-[#172033] shadow-sm ring-1 ring-black/10"
                    : "text-[#64748b] hover:bg-white hover:text-[#172033]"
                ].join(" ")}
              >
                <Settings
                  size={17}
                  strokeWidth={2}
                />
              </button>
            ) : null}

            <button
              type="button"
              onClick={signOut}
              title="Cerrar sesión"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#64748b] transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut
                size={17}
                strokeWidth={2}
              />
            </button>

            <button
              type="button"
              onClick={toggleCompact}
              title="Abrir sidebar"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#64748b] transition hover:bg-white hover:text-[#172033]"
            >
              <Menu
                size={18}
                strokeWidth={2}
              />
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {adminLike ? (
              <button
                type="button"
                onClick={() =>
                  onNavigate(
                    "configuracion"
                  )
                }
                className={[
                  "flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left transition",
                  activeSection ===
                  "configuracion"
                    ? "bg-white text-[#172033] shadow-sm ring-1 ring-black/5"
                    : "text-[#64748b] hover:bg-white hover:text-[#172033]"
                ].join(" ")}
              >
                <Settings
                  size={16}
                  strokeWidth={2}
                />

                <span className="text-[12px] font-medium">
                  Configuración
                </span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={signOut}
              className="flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-[#64748b] transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut
                size={16}
                strokeWidth={2}
              />

              <span className="text-[12px] font-medium">
                Cerrar sesión
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
