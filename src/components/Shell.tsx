import {
  Suspense,
  useEffect,
  useState
} from "react";
import {
  BriefcaseBusiness,
  CircleDollarSign,
  Home as HomeIcon,
  Menu,
  UsersRound
} from "lucide-react";

import {
  Sidebar
} from "./Sidebar";
import type {
  AppSection
} from "./Sidebar";

import {
  DashboardHome
} from "./DashboardHome";
import GlobalWhatsappNotifications from "./GlobalWhatsappNotifications";
import {
  NiaFloatingWidget
} from "./NiaFloatingWidget";
import {
  MobileMoreMenu
} from "./navigation/MobileMoreMenu";

import { NovedadesBar } from "./NovedadesBar";

import {
  CajaPanel,
  CalendarioPaxPanel,
  CandePanel,
  CarritosPanel,
  CashflowPanel,
  ClientesPanel,
  ColaborativoPanel,
  ComisionesPanel,
  ConfigPanel,
  ContactosLivePanel,
  ControlIaPanel,
  ControlVentasPanel,
  CtasCtesPanel,
  FacturasCobrarPanel,
  FacturasPagarPanel,
  FilesPanel,
  HistorialesLivePanel,
  HorariosPanel,
  ImportadorCatalogosPanel,
  LinksUtilesPanel,
  LiveNosPanel,
  MetasPanel,
  MiPerfilPanel,
  NiaPanel,
  OportunidadesPanel,
  PagosOperadoresPanel,
  PendientesPanel,
  PresupuestosPanel,
  RiesgosPanel,
  SectionLoadingFallback
} from "./lazySections";



type InternalOpenEventDetail = {
  moduleId?: string;
  appId?: string;
  route?: string;
  url?: string;
  title?: string;
  params?: Record<
    string,
    unknown
  >;
};

type MobileNavigationItem = {
  id:
    | "home"
    | "ventas"
    | "clientes"
    | "caja"
    | "mas";
  label: string;
  icon: typeof HomeIcon;
};

const MOBILE_ITEMS: MobileNavigationItem[] = [
  {
    id: "home",
    label: "Inicio",
    icon: HomeIcon
  },
  {
    id: "ventas",
    label: "Ventas",
    icon: BriefcaseBusiness
  },
  {
    id: "clientes",
    label: "Clientes",
    icon: UsersRound
  },
  {
    id: "caja",
    label: "Caja",
    icon: CircleDollarSign
  },
  {
    id: "mas",
    label: "Más",
    icon: Menu
  }
];

const SALES_SECTIONS: AppSection[] = [
  "presupuestos-v3",
  "carritos",
  "files",
  "ctas-ctes",
  "control-ventas",
  "comisiones"
];

const CASH_SECTIONS: AppSection[] = [
  "caja",
  "facturas-pagar",
  "facturas-cobrar",
  "cashflow",
  "pagos-operadores",
  "riesgos"
];

function normalizeSection(
  value:
    | string
    | null
    | undefined
): AppSection | null {
  const normalized = String(
    value || ""
  )
    .replace(
      /^internal:\/\//,
      ""
    )
    .trim();

  if (!normalized) {
    return null;
  }

  if (
    normalized === "contactos"
  ) {
    return "oportunidades";
  }

  if (
    normalized === "config" ||
    normalized === "settings"
  ) {
    return "configuracion";
  }

  const validSections: AppSection[] = [
    "home",
    "livenos",
    "contactos-live",
    "historiales-live",
    "oportunidades",
    "cande",
    "nia",
    "control-ia",
    "clientes",
    "presupuestos-v3",
    "carritos",
    "files",
    "ctas-ctes",
    "comisiones",
    "caja",
    "control-ventas",
    "facturas-pagar",
    "cashflow",
    "facturas-cobrar",
    "metas",
    "pagos-operadores",
    "riesgos",
    "calendario-pax",
    "horarios",
    "pendientes",
    "colaborativo",
    "links-utiles",
    "mi-perfil",
    "configuracion",
    "importador-catalogos"
  ];

  return validSections.includes(
    normalized as AppSection
  )
    ? normalized as AppSection
    : null;
}

function getInitialSection(): AppSection {
  const storedSection = normalizeSection(
    window.sessionStorage.getItem(
      "nostur:active-section"
    )
  );

  return storedSection || "home";
}

function renderSection(
  section: AppSection
) {
  if (section === "home") {
    return <DashboardHome />;
  }

  if (section === "livenos") {
    return <LiveNosPanel />;
  }

  if (
    section === "contactos-live"
  ) {
    return <ContactosLivePanel />;
  }

  if (
    section === "historiales-live"
  ) {
    return <HistorialesLivePanel />;
  }

  if (
    section === "oportunidades"
  ) {
    return <OportunidadesPanel />;
  }

  if (section === "cande") {
    return <CandePanel />;
  }

  if (section === "nia") {
    return <NiaPanel />;
  }

  if (
    section === "control-ia"
  ) {
    return <ControlIaPanel />;
  }

  if (
    section === "mi-perfil"
  ) {
    return <MiPerfilPanel />;
  }

  if (section === "clientes") {
    return <ClientesPanel />;
  }

  if (
    section === "presupuestos-v3"
  ) {
    return <PresupuestosPanel />;
  }

  if (section === "carritos") {
    return <CarritosPanel />;
  }

  if (section === "files") {
    return <FilesPanel />;
  }

  if (section === "ctas-ctes") {
    return <CtasCtesPanel />;
  }

  if (
    section === "control-ventas"
  ) {
    return <ControlVentasPanel />;
  }

  if (
    section ===
    "pagos-operadores"
  ) {
    return <PagosOperadoresPanel />;
  }

  if (section === "riesgos") {
    return <RiesgosPanel />;
  }

  if (section === "caja") {
    return <CajaPanel />;
  }

  if (
    section ===
    "facturas-cobrar"
  ) {
    return <FacturasCobrarPanel />;
  }

  if (
    section ===
    "facturas-pagar"
  ) {
    return <FacturasPagarPanel />;
  }

  if (section === "cashflow") {
    return <CashflowPanel />;
  }

  if (section === "metas") {
    return <MetasPanel />;
  }

  if (
    section === "comisiones"
  ) {
    return <ComisionesPanel />;
  }

  if (
    section === "pendientes"
  ) {
    return <PendientesPanel />;
  }

  if (
    section === "links-utiles"
  ) {
    return <LinksUtilesPanel />;
  }

  if (
    section === "calendario-pax"
  ) {
    return <CalendarioPaxPanel />;
  }

  if (section === "horarios") {
    return <HorariosPanel />;
  }

  if (
    section === "colaborativo"
  ) {
    return <ColaborativoPanel />;
  }

  if (
    section === "configuracion"
  ) {
    return <ConfigPanel />;
  }

  if (
    section ===
    "importador-catalogos"
  ) {
    return (
      <ImportadorCatalogosPanel />
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-6 text-center text-sm font-medium text-[#64748b]">
      Módulo no disponible.
    </div>
  );
}

export function Shell() {
  useEffect(() => {
    console.log("🟢 SHELL MOUNT");

    return () => {
      console.log("🔴 SHELL UNMOUNT");
    };
  }, []);

  const [
    activeSection,
    setActiveSection
  ] = useState<AppSection>(
    getInitialSection
  );

  const [
    visitedSections,
    setVisitedSections
  ] = useState<AppSection[]>(() => [
    getInitialSection()
  ]);

  function navigateToSection(
    section: AppSection
  ) {
    setVisitedSections((current) => {
      if (current.includes(section)) {
        return current;
      }

      return [
        ...current,
        section
      ];
    });

    setActiveSection(section);
  }

  useEffect(() => {
    window.sessionStorage.setItem(
      "nostur:active-section",
      activeSection
    );
  }, [activeSection]);

  useEffect(() => {
    function handleInternalOpen(
      event: Event
    ) {
      const customEvent =
        event as CustomEvent<InternalOpenEventDetail>;

      const detail =
        customEvent.detail || {};

      const section =
        normalizeSection(
          detail.moduleId ||
            detail.appId ||
            detail.route ||
            detail.url
        );

      if (!section) {
        return;
      }

      navigateToSection(section);
    }

    window.addEventListener(
      "nostur:open-internal",
      handleInternalOpen
    );

    return () => {
      window.removeEventListener(
        "nostur:open-internal",
        handleInternalOpen
      );
    };
  }, []);

  function handleMobileNavigation(
    item: MobileNavigationItem
  ) {
    if (item.id === "home") {
      navigateToSection("home");
      return;
    }

    if (item.id === "ventas") {
      navigateToSection("carritos");
      return;
    }

    if (
      item.id === "clientes"
    ) {
      navigateToSection("clientes");
      return;
    }

    if (item.id === "caja") {
      navigateToSection("caja");
      return;
    }

    window.dispatchEvent(
      new CustomEvent(
        "nostur:open-mobile-menu"
      )
    );
  }

  function isMobileItemActive(
    item: MobileNavigationItem
  ) {
    if (item.id === "home") {
      return (
        activeSection === "home"
      );
    }

    if (item.id === "ventas") {
      return SALES_SECTIONS.includes(
        activeSection
      );
    }

    if (
      item.id === "clientes"
    ) {
      return (
        activeSection === "clientes"
      );
    }

    if (item.id === "caja") {
      return CASH_SECTIONS.includes(
        activeSection
      );
    }

    return false;
  }

  const editorActive =
    activeSection ===
    "presupuestos-v3";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#eef1f6] text-[#172033]">
      <Sidebar
        activeSection={
          activeSection
        }
        onNavigate={
          navigateToSection
        }
      />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <main
          className={[
            "min-h-0 flex-1 overflow-x-hidden",
            editorActive
              ? "overflow-hidden"
              : "overflow-y-auto overscroll-contain pb-[72px] md:pb-0"
          ].join(" ")}
        >
          {visitedSections.map(
            (section) => {
              const active =
                section === activeSection;

              return (
                <div
                  key={section}
                  aria-hidden={!active}
                  className={
                    active
                      ? "h-full min-h-0"
                      : "hidden"
                  }
                >
                  <Suspense
                    fallback={
                      <SectionLoadingFallback />
                    }
                  >
                    {renderSection(section)}
                  </Suspense>
                </div>
              );
            }
          )}
        </main>
      </div>

      {!editorActive ? (
        <nav
          aria-label="Navegación principal"
          className="fixed inset-x-0 bottom-0 z-[120] border-t border-black/10 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden"
        >
          <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
            {MOBILE_ITEMS.map(
              (item) => {
                const Icon = item.icon;
                const active =
                  isMobileItemActive(
                    item
                  );

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      handleMobileNavigation(
                        item
                      )
                    }
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={[
                      "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-lg px-1 transition",
                      active
                        ? "bg-[#fff1ee] text-[#ff634a]"
                        : "text-[#64748b] active:bg-[#f1f5f9] active:text-[#172033]"
                    ].join(" ")}
                  >
                    <Icon
                      size={20}
                      strokeWidth={
                        active
                          ? 2.4
                          : 2
                      }
                    />

                    <span
                      className={[
                        "text-[10px] leading-none",
                        active
                          ? "font-bold"
                          : "font-medium"
                      ].join(" ")}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </nav>
      ) : null}

      <MobileMoreMenu />

      <GlobalWhatsappNotifications />

      {!editorActive ? (
        <NiaFloatingWidget
          activeUrl={`internal://${activeSection}`}
        />
      ) : null}
          <NovedadesBar />
</div>
  );
}

export default Shell;
