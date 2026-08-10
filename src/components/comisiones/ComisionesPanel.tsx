// src/components/comisiones/ComisionesPanel.tsx

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronsUpDown,
  CircleDollarSign,
  Filter,
  RefreshCcw,
  Search,
  Target,
  TrendingUp,
  Trophy,
  UsersRound,
  Wallet,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useComisionesStore
} from "../../store/comisionesStore";
import { LiquidacionesComisionesSection } from "./components/LiquidacionesComisionesSection";
import { ComisionesSellerView } from "./components/ComisionesSellerView";
import { ComisionesAllSellersView } from "./components/ComisionesAllSellersView";
import { ComisionesAnnualMatrix } from "./components/ComisionesAnnualMatrix";

type SelectOption = {
  value: string;
  label: string;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

type TabKey = "mis-comisiones" | "todos" | "liquidaciones" | "matriz";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];


function parseMoney(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const normalized = String(value || "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatUsd(value: string | number | null | undefined): string {
  const parsed = parseMoney(value);

  return `USD ${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(parsed)}`;
}

function getMonthLabel(mes: string, anio: string): string {
  const index = Number(mes) - 1;
  return `${MONTH_NAMES[index] || mes} ${anio}`;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#64748b]">
      {children}
    </label>
  );
}

function NosturSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar"
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <div className={["relative", open ? "z-[140]" : "z-0"].join(" ")}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-full items-center justify-between gap-2 rounded-[10px] border border-black/10 bg-white px-3 text-left text-[12px] font-normal text-[#172033] outline-none transition hover:bg-[#f8fafc]"
      >
        <span className={selected ? "truncate" : "truncate text-[#94a3b8]"}>
          {selected?.label || placeholder}
        </span>

        <ChevronDown
          size={13}
          strokeWidth={1.8}
          className={["shrink-0 text-[#64748b] transition", open ? "rotate-180" : ""].join(" ")}
        />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
            tabIndex={-1}
            aria-label="Cerrar selector"
          />

          <div className="absolute left-0 right-0 top-[36px] z-[150] max-h-56 overflow-auto rounded-[14px] border border-black/10 bg-white p-1 shadow-xl">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-[12px] font-normal text-[#94a3b8]">
                Sin opciones
              </div>
            ) : (
              options.map((option) => {
                const active = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={[
                      "flex h-8 w-full items-center rounded-[10px] px-3 text-left text-[12px] font-medium transition",
                      active
                        ? "bg-[#4f7c90] text-white"
                        : "text-[#334155] hover:bg-[#f1f5f9]"
                    ].join(" ")}
                  >
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      onClose();
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed right-5 top-5 z-[260] w-[300px] rounded-[14px] border border-black/10 bg-white px-3.5 py-3 text-[12px] shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={[
              "mb-0.5 font-semibold",
              toast.type === "success" ? "text-emerald-700" : "text-red-700"
            ].join(" ")}
          >
            {toast.type === "success" ? "Operación exitosa" : "Atención"}
          </div>

          <div className="font-normal leading-relaxed text-[#334155]">{toast.message}</div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#172033]"
          aria-label="Cerrar aviso"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[14px] border border-black/10 bg-white/62 px-3 py-2.5 shadow-sm backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[10.5px] font-medium text-[#64748b]">{label}</div>
          <div className="mt-0.5 truncate text-[18px] font-semibold tracking-tight text-[#172033]">
            {value}
          </div>
        </div>

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-nostur-orange ring-1 ring-orange-100">
          <Icon size={14} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-7 items-center gap-1.5 rounded-[10px] px-2.5 text-[11px] font-medium transition",
        active
          ? "bg-[#4f7c90] text-white shadow-sm"
          : "bg-white/80 text-[#334155] ring-1 ring-black/10 hover:bg-white"
      ].join(" ")}
    >
      <Icon size={13} strokeWidth={1.8} />
      {label}
    </button>
  );
}

export function ComisionesPanel() {
  const loading = useComisionesStore((state) => state.loading);
  const error = useComisionesStore((state) => state.error);
  const currentProfile = useComisionesStore((state) => state.currentProfile);
  const filters = useComisionesStore((state) => state.filters);
  const catalogos = useComisionesStore((state) => state.catalogos);
  const selectedVendedorId = useComisionesStore((state) => state.selectedVendedorId);

  const loadComisiones = useComisionesStore((state) => state.loadComisiones);
  const setFilter = useComisionesStore((state) => state.setFilter);
  const clearError = useComisionesStore((state) => state.clearError);
  const selectVendedor = useComisionesStore((state) => state.selectVendedor);

  const getMensualFiltrado = useComisionesStore((state) => state.getMensualFiltrado);
  const getSemanalFiltrado = useComisionesStore((state) => state.getSemanalFiltrado);
  const getVentasFiltradas = useComisionesStore((state) => state.getVentasFiltradas);
  const getSelectedMensual = useComisionesStore((state) => state.getSelectedMensual);
  const getMetrics = useComisionesStore((state) => state.getMetrics);
  const getMatrizAnual = useComisionesStore((state) => state.getMatrizAnual);

  const mensual = getMensualFiltrado();
  const semanal = getSemanalFiltrado();
  const ventas = getVentasFiltradas();
  const matrizAnual = getMatrizAnual();
  const metrics = getMetrics();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("mis-comisiones");
  const [toast, setToast] = useState<ToastState>(null);

  const selectedMensual = useMemo(
    () => getSelectedMensual(),
    [mensual, selectedVendedorId, getSelectedMensual]
  );

  useEffect(() => {
    loadComisiones();
  }, [loadComisiones]);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ type, message });
  }

  const monthOptions: SelectOption[] = MONTH_NAMES.map((month, index) => ({
    value: String(index + 1).padStart(2, "0"),
    label: month
  }));

  const vendedorOptions: SelectOption[] = [
    { value: "todos", label: "Todos" },
    ...catalogos.vendedores.map((item) => ({
      value: item.id,
      label: `${item.nombre} ${item.apellido}`.trim() || item.email || "Usuario"
    }))
  ];

  const sucursalOptions: SelectOption[] = [
    { value: "todos", label: "Todas" },
    ...catalogos.sucursales.map((item) => ({
      value: item.id,
      label: item.nombre
    }))
  ];

  const selectedVendedorFilterLabel =
    vendedorOptions.find((option) => option.value === filters.vendedorId)?.label || "Todos";

  const selectedSucursalFilterLabel =
    sucursalOptions.find((option) => option.value === filters.sucursalId)?.label || "Todas";

  const selectedVentas = selectedMensual
    ? ventas.filter((venta) => venta.vendedor_id === selectedMensual.vendedor_id)
    : ventas;

  const myWeekly = selectedMensual
    ? semanal.find((item) => item.vendedor_id === selectedMensual.vendedor_id) || null
    : semanal[0] || null;

  const visibleMensual =
    activeTab === "mis-comisiones" && currentProfile
      ? mensual.filter((item) => item.vendedor_id === currentProfile.id)
      : mensual;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#edf3f7] text-[#172033]">
      <header className="shrink-0 border-b border-black/10 bg-white/78 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] font-semibold tracking-tight text-[#172033]">
                Comisiones
              </h1>

              <span className="rounded-md bg-orange-50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-nostur-orange ring-1 ring-orange-100">
                Comercial
              </span>
            </div>

            <p className="mt-1 text-[12px] font-normal text-[#64748b]">
              Comisiones, metas y matriz de vendedores. Por defecto cada vendedor ve su panel,
              pero puede filtrar por todos.
            </p>
          </div>

          <button
            type="button"
            onClick={loadComisiones}
            disabled={loading}
            className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-[10px] bg-white px-2.5 text-[11px] font-medium text-[#334155] shadow-sm ring-1 ring-black/10 transition hover:bg-[#f8fafc] disabled:opacity-50"
          >
            <RefreshCcw size={13} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-auto p-3.5">
        {error ? (
          <div className="mb-3 flex items-start justify-between gap-3 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-medium text-red-700">
            <span>{error}</span>

            <button type="button" onClick={clearError} className="text-red-500 hover:text-red-700">
              <X size={14} />
            </button>
          </div>
        ) : null}

        <section className="relative z-[60] mb-3 rounded-[16px] border border-black/10 bg-white/62 p-3 shadow-sm backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
              className="min-w-0 flex-1 text-left"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Filter size={14} className="text-[#4f7c90]" />

                <h2 className="text-[12px] font-semibold text-[#172033]">Filtros</h2>

                <span className="rounded-md bg-orange-50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-nostur-orange ring-1 ring-orange-100">
                  {getMonthLabel(filters.mes, filters.anio)}
                </span>
              </div>

              <div className="mt-1 truncate text-[11.5px] font-normal text-[#64748b]">
                Mes: {filters.mes}/{filters.anio} · Vendedor: {selectedVendedorFilterLabel} ·
                Sucursal: {selectedSucursalFilterLabel}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
              className="inline-flex h-7 items-center gap-1.5 rounded-[10px] bg-white px-2.5 text-[11px] font-medium text-[#334155] shadow-sm ring-1 ring-black/10 hover:bg-[#f8fafc]"
            >
              {filtersOpen ? "Ocultar" : "Mostrar"}
              <ChevronsUpDown size={13} strokeWidth={1.8} />
            </button>
          </div>

          {filtersOpen ? (
            <>
              <div className="mt-3 grid gap-2.5 lg:grid-cols-[1fr_90px_1fr_1fr]">
                <div>
                  <FieldLabel>Mes</FieldLabel>
                  <NosturSelect
                    value={filters.mes}
                    onChange={(value) => setFilter("mes", value)}
                    options={monthOptions}
                  />
                </div>

                <div>
                  <FieldLabel>Año</FieldLabel>
                  <input
                    value={filters.anio}
                    onChange={(event) =>
                      setFilter("anio", event.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="2026"
                    inputMode="numeric"
                    className="h-8 w-full rounded-[10px] border border-black/10 bg-white px-3 text-[12px] font-normal text-[#172033] outline-none transition placeholder:text-[#94a3b8] focus:border-[#4f7c90]"
                  />
                </div>

                <div>
                  <FieldLabel>Vendedor</FieldLabel>
                  <NosturSelect
                    value={filters.vendedorId}
                    onChange={(value) => setFilter("vendedorId", value)}
                    options={vendedorOptions}
                  />
                </div>

                <div>
                  <FieldLabel>Sucursal</FieldLabel>
                  <NosturSelect
                    value={filters.sucursalId}
                    onChange={(value) => setFilter("sucursalId", value)}
                    options={sucursalOptions}
                  />
                </div>
              </div>

              <div className="mt-2.5 grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="flex h-8 items-center gap-2 rounded-[10px] border border-black/10 bg-white px-3">
                  <Search size={14} className="shrink-0 text-[#94a3b8]" />

                  <input
                    value={filters.search}
                    onChange={(event) => setFilter("search", event.target.value)}
                    placeholder="Buscar por vendedor, sucursal, pasajero, carrito o file..."
                    className="h-full min-w-0 flex-1 bg-transparent text-[12px] font-normal text-[#172033] outline-none placeholder:text-[#94a3b8]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    loadComisiones();
                    showToast("Comisiones actualizadas.");
                  }}
                  className="h-8 rounded-[10px] bg-white px-3 text-[12px] font-medium text-[#334155] shadow-sm ring-1 ring-black/10 hover:bg-[#f8fafc]"
                >
                  Aplicar
                </button>
              </div>
            </>
          ) : null}
        </section>

        <section className="relative z-0 mb-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard label="Vendedores" value={metrics.vendedores} icon={UsersRound} />
          <MetricCard label="Utilidad" value={formatUsd(metrics.utilidadTotalUsd)} icon={TrendingUp} />
          <MetricCard
            label="Facturación"
            value={formatUsd(metrics.facturacionTotalUsd)}
            icon={BarChart3}
          />
          <MetricCard
            label="Comisión"
            value={formatUsd(metrics.comisionTotalUsd)}
            icon={CircleDollarSign}
          />
          <MetricCard label="Logrados" value={metrics.logrados} icon={Trophy} />
          <MetricCard label="Bajo piso" value={metrics.bajoPiso} icon={Target} />
        </section>

        <section className="relative z-0 mb-3 flex flex-wrap items-center gap-2">
          <TabButton
            active={activeTab === "mis-comisiones"}
            icon={Wallet}
            label="Mis comisiones"
            onClick={() => {
              setActiveTab("mis-comisiones");
              if (currentProfile?.id) selectVendedor(currentProfile.id);
            }}
          />

          <TabButton
            active={activeTab === "todos"}
            icon={UsersRound}
            label="Todos los vendedores"
            onClick={() => {
              setActiveTab("todos");
              selectVendedor(null);
            }}
          />

          <TabButton
            active={activeTab === "liquidaciones"}
            icon={CircleDollarSign}
            label="Liquidaciones"
            onClick={() => {
              setActiveTab("liquidaciones");
            }}
          />

          <TabButton
            active={activeTab === "matriz"}
            icon={CalendarDays}
            label="Matriz"
            onClick={() => {
              setActiveTab("matriz");
              selectVendedor(null);
            }}
          />
        </section>

        {activeTab === "matriz" ? (
          <ComisionesAnnualMatrix
            matriz={matrizAnual}
            anio={filters.anio}
          />
        ) : activeTab === "liquidaciones" ? (
          <LiquidacionesComisionesSection
            vendedorId={
              selectedVendedorId ||
              (filters.vendedorId !== "todos" ? filters.vendedorId : null)
            }
          />
        ) : activeTab === "todos" ? (
          <ComisionesAllSellersView
            loading={loading}
            mensual={visibleMensual}
            selected={selectedMensual}
            periodoLabel={getMonthLabel(filters.mes, filters.anio)}
            onSelect={selectVendedor}
          />
        ) : (
          <ComisionesSellerView
            loading={loading}
            selected={selectedMensual}
            weekly={myWeekly}
            ventas={selectedVentas}
          />
        )}
      </main>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default ComisionesPanel;