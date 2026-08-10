import {
  Bot,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  ContactRound,
  FileClock,
  FolderOpen,
  Landmark,
  LayoutTemplate,
  Link2,
  MessageCircleMore,
  Receipt,
  Settings,
  Sparkles,
  Target,
  UserRound,
  UsersRound,
  WalletCards,
  X
} from "lucide-react";
import {
  useEffect,
  useState
} from "react";
import type { LucideIcon } from "lucide-react";

type MobileMenuItem = {
  id: string;
  label: string;
  description?: string;
  appId: string;
  icon: LucideIcon;
};

type MobileMenuGroup = {
  id: string;
  title: string;
  items: MobileMenuItem[];
};

const MENU_GROUPS: MobileMenuGroup[] = [
  {
    id: "ventas",
    title: "Ventas",
    items: [
      {
        id: "presupuestos-v3",
        label: "Presupuestos",
        description: "Crear y administrar propuestas de viaje",
        appId: "presupuestos-v3",
        icon: LayoutTemplate
      },
      {
        id: "carritos",
        label: "Carritos",
        description: "Ventas realizadas por ALMUNDO",
        appId: "carritos",
        icon: CheckSquare
      },
      {
        id: "files",
        label: "Files",
        description: "Ventas por operadores externos",
        appId: "files",
        icon: FolderOpen
      },
      {
        id: "cuentas-corrientes",
        label: "Cuentas corrientes",
        description: "Saldos y movimientos de clientes",
        appId: "ctas-ctes",
        icon: WalletCards
      },

      {
        id: "control-ventas",
        label: "Control de ventas",
        description: "Seguimiento administrativo",
        appId: "control-ventas",
        icon: CheckSquare
      },
      {
        id: "riesgos",
        label: "Riesgos",
        description: "Ventas pendientes de pago",
        appId: "riesgos",
        icon: FileClock
      },
      {
        id: "metas",
        label: "Metas",
        description: "Objetivos comerciales",
        appId: "metas",
        icon: Target
      },
      {
        id: "comisiones",
        label: "Comisiones",
        description: "Liquidaciones de vendedores",
        appId: "comisiones",
        icon: CircleDollarSign
      }
    ]
  },
  {
    id: "administracion",
    title: "Administración",
    items: [
      {
        id: "pagos-operadores",
        label: "Pagos a operadores",
        appId: "pagos-operadores",
        icon: Landmark
      },
      {
        id: "facturas-cobrar",
        label: "Facturas a cobrar",
        appId: "facturas-cobrar",
        icon: Receipt
      },
      {
        id: "facturas-pagar",
        label: "Facturas a pagar",
        appId: "facturas-pagar",
        icon: Receipt
      },
      {
        id: "cashflow",
        label: "Cashflow",
        appId: "cashflow",
        icon: CircleDollarSign
      }
    ]
  },
  {
    id: "gestion",
    title: "Gestión",
    items: [
      {
        id: "contactos",
        label: "Contactos",
        appId: "contactos",
        icon: ContactRound
      },
      {
        id: "pendientes",
        label: "Pendientes",
        appId: "pendientes",
        icon: CheckSquare
      },
      {
        id: "calendario",
        label: "Calendario de pasajeros",
        appId: "calendario-pax",
        icon: CalendarDays
      },
      {
        id: "horarios",
        label: "Horarios",
        appId: "horarios",
        icon: Clock3
      },
      {
        id: "colaborativo",
        label: "Colaborativo",
        appId: "colaborativo",
        icon: UsersRound
      },
      {
        id: "links-utiles",
        label: "Links útiles",
        appId: "links-utiles",
        icon: Link2
      }
    ]
  },
  {
    id: "comunicaciones",
    title: "Comunicaciones",
    items: [
      {
        id: "livenos",
        label: "LiveNos",
        appId: "livenos",
        icon: MessageCircleMore
      },
      {
        id: "oportunidades",
        label: "Oportunidades",
        appId: "oportunidades",
        icon: Sparkles
      },
      {
        id: "cande",
        label: "CANDE",
        appId: "cande",
        icon: Bot
      },
      {
        id: "nia",
        label: "NIA",
        appId: "nia",
        icon: Bot
      },
      {
        id: "control-ia",
        label: "Control IA",
        appId: "control-ia",
        icon: Sparkles
      }
    ]
  },
  {
    id: "cuenta",
    title: "Cuenta",
    items: [
      {
        id: "mi-perfil",
        label: "Mi perfil",
        appId: "mi-perfil",
        icon: UserRound
      },
      {
        id: "configuracion",
        label: "Configuración",
        appId: "configuracion",
        icon: Settings
      }
    ]
  }
];

export function MobileMoreMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleOpenMenu() {
      setOpen(true);
    }

    window.addEventListener(
      "nostur:open-mobile-menu",
      handleOpenMenu
    );

    return () => {
      window.removeEventListener(
        "nostur:open-mobile-menu",
        handleOpenMenu
      );
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [open]);

  function openModule(item: MobileMenuItem) {
    setOpen(false);

    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("nostur:open-internal", {
          detail: {
            moduleId: item.appId,
            appId: item.appId,
            url: `internal://${item.appId}`,
            title: item.label
          }
        })
      );
    }, 50);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] md:hidden">
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
      />

      <section className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-[24px] bg-[#f8fafc] shadow-[0_-24px_70px_rgba(15,23,42,0.24)]">
        <div className="flex shrink-0 items-start justify-between border-b border-black/5 bg-white px-5 pb-4 pt-3">
          <div>
            <div className="mb-3 h-1 w-10 rounded-full bg-slate-300" />

            <h2 className="text-lg font-black text-[#172033]">
              Más opciones
            </h2>

            <p className="mt-0.5 text-xs font-medium text-[#64748b]">
              Todos los módulos de NOSTUR
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f5f9] text-[#475569] active:bg-[#e2e8f0]"
          >
            <X size={19} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4">
          <div className="space-y-5">
            {MENU_GROUPS.map((group) => (
              <section key={group.id}>
                <h3 className="mb-2 px-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#94a3b8]">
                  {group.title}
                </h3>

                <div className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
                  {group.items.map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openModule(item)}
                        className={[
                          "flex min-h-[58px] w-full items-center gap-3 px-4 text-left active:bg-[#f8fafc]",
                          index > 0
                            ? "border-t border-black/5"
                            : ""
                        ].join(" ")}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff1ee] text-[#ff634a]">
                          <Icon size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-[#172033]">
                            {item.label}
                          </div>

                          {item.description ? (
                            <div className="mt-0.5 truncate text-[11px] font-medium text-[#94a3b8]">
                              {item.description}
                            </div>
                          ) : null}
                        </div>

                        <ChevronRight
                          size={17}
                          className="shrink-0 text-[#cbd5e1]"
                        />
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
