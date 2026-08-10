import {
  CircleDollarSign,
  Target,
  TrendingUp,
  UsersRound
} from "lucide-react";
import type { ComisionMensual } from "../../../store/comisionesStore";

type ComisionesAllSellersViewProps = {
  loading: boolean;
  mensual: ComisionMensual[];
  selected: ComisionMensual | null;
  periodoLabel: string;
  onSelect: (vendedorId: string) => void;
};

function getNumber(value: string | number | null | undefined): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatUsd(value: string | number | null | undefined): string {
  return `USD ${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(getNumber(value))}`;
}

function formatPct(value: string | number | null | undefined): string {
  return `${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(getNumber(value))}%`;
}

function getNivelLabel(value: string): string {
  const labels: Record<string, string> = {
    SIN_META: "Sin configurar",
    BAJO_PISO: "Bajo piso",
    PISO: "Piso",
    MEDIO: "Medio",
    LOGRADO: "Logrado"
  };

  return labels[value] || value;
}

function getNivelClasses(value: string): {
  badge: string;
  dot: string;
} {
  if (value === "LOGRADO") {
    return {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500"
    };
  }

  if (value === "MEDIO") {
    return {
      badge: "border-sky-200 bg-sky-50 text-sky-700",
      dot: "bg-sky-500"
    };
  }

  if (value === "PISO") {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      dot: "bg-amber-500"
    };
  }

  if (value === "BAJO_PISO") {
    return {
      badge: "border-orange-200 bg-orange-50 text-orange-700",
      dot: "bg-orange-500"
    };
  }

  return {
    badge: "border-slate-200 bg-slate-50 text-slate-700",
    dot: "bg-slate-400"
  };
}

function ProgressBar({
  value
}: {
  value: number;
}) {
  const safeValue = Math.max(0, Math.min(value, 100));

  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
      <div
        className="h-full rounded-full bg-[#4f7c90] transition-all"
        style={{
          width: `${safeValue}%`
        }}
      />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
  positive = false
}: {
  label: string;
  value: string;
  strong?: boolean;
  positive?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-3 py-1.5",
        strong ? "border-t border-black/10 pt-2.5" : ""
      ].join(" ")}
    >
      <span
        className={[
          "text-[11px]",
          strong
            ? "font-semibold text-[#172033]"
            : "font-normal text-[#64748b]"
        ].join(" ")}
      >
        {label}
      </span>

      <span
        className={[
          "text-right text-[11.5px] font-semibold",
          positive ? "text-emerald-700" : "text-[#172033]"
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function SummaryGroup({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
      <div className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
        {title}
      </div>

      {children}
    </section>
  );
}

function SellerCard({
  item,
  selected,
  onSelect
}: {
  item: ComisionMensual;
  selected: boolean;
  onSelect: () => void;
}) {
  const avance = getNumber(item.porcentaje_avance_piso);
  const nivelClasses = getNivelClasses(item.nivel_alcanzado);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full rounded-[14px] border p-3 text-left transition",
        selected
          ? "border-[#4f7c90]/55 bg-[#eef6f7] shadow-sm"
          : "border-black/10 bg-white hover:border-[#4f7c90]/25 hover:bg-[#f8fafc]"
      ].join(" ")}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-[#172033]">
            {item.vendedor || "Sin vendedor"}
          </div>

          <div className="mt-0.5 truncate text-[10.5px] text-[#64748b]">
            {item.sucursal || "Sin sucursal"}
          </div>
        </div>

        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[9.5px] font-semibold",
            nivelClasses.badge
          ].join(" ")}
        >
          <span
            className={[
              "h-1.5 w-1.5 rounded-full",
              nivelClasses.dot
            ].join(" ")}
          />

          {getNivelLabel(item.nivel_alcanzado)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[11px] border border-black/10 bg-[#f8fafc] p-2.5">
          <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-[#64748b]">
            <TrendingUp size={10} />
            Utilidad
          </div>

          <div className="mt-1 text-[12px] font-semibold text-emerald-700">
            {formatUsd(item.utilidad_total_usd)}
          </div>
        </div>

        <div className="rounded-[11px] border border-black/10 bg-[#f8fafc] p-2.5">
          <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-[#64748b]">
            <CircleDollarSign size={10} />
            Comisión
          </div>

          <div className="mt-1 text-[12px] font-semibold text-[#4f7c90]">
            {formatUsd(item.comision_estimada_usd)}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[10.5px] text-[#64748b]">
          Avance al piso
        </span>

        <span className="text-[10.5px] font-semibold text-[#4f7c90]">
          {formatPct(avance)}
        </span>
      </div>

      <div className="mt-1.5">
        <ProgressBar value={avance} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[9.5px]">
        <div>
          <div className="uppercase tracking-wide text-[#64748b]">
            Piso
          </div>

          <div className="mt-0.5 truncate font-semibold text-[#172033]">
            {formatUsd(item.meta_piso_usd)}
          </div>
        </div>

        <div>
          <div className="uppercase tracking-wide text-[#64748b]">
            Medio
          </div>

          <div className="mt-0.5 truncate font-semibold text-[#172033]">
            {formatUsd(item.meta_medio_usd)}
          </div>
        </div>

        <div>
          <div className="uppercase tracking-wide text-[#64748b]">
            Lograda
          </div>

          <div className="mt-0.5 truncate font-semibold text-[#172033]">
            {formatUsd(item.meta_logrado_usd)}
          </div>
        </div>
      </div>
    </button>
  );
}

export function ComisionesAllSellersView({
  loading,
  mensual,
  selected,
  periodoLabel,
  onSelect
}: ComisionesAllSellersViewProps) {
  if (loading) {
    return (
      <div className="rounded-[16px] border border-black/10 bg-white/68 p-8 text-center text-[12px] text-[#64748b] shadow-sm backdrop-blur-xl">
        Cargando vendedores...
      </div>
    );
  }

  if (mensual.length === 0) {
    return (
      <div className="rounded-[16px] border border-black/10 bg-white/68 p-8 text-center text-[12px] text-[#64748b] shadow-sm backdrop-blur-xl">
        No hay vendedores con datos para el período seleccionado.
      </div>
    );
  }

  const totalUtilidad = mensual.reduce(
    (total, item) => total + getNumber(item.utilidad_total_usd),
    0
  );

  const totalComision = mensual.reduce(
    (total, item) => total + getNumber(item.comision_estimada_usd),
    0
  );

  const vendedoresLogrados = mensual.filter(
    (item) => item.nivel_alcanzado === "LOGRADO"
  ).length;

  const selectedNivelClasses = selected
    ? getNivelClasses(selected.nivel_alcanzado)
    : null;

  return (
    <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
      <main className="min-w-0 rounded-[16px] border border-black/10 bg-white/68 shadow-sm backdrop-blur-xl">
        <header className="border-b border-black/10 bg-white/75 px-4 py-3.5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#eef6f7] text-[#4f7c90]">
                <UsersRound size={16} />
              </div>

              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-[#172033]">
                  Progreso de vendedores
                </h2>

                <p className="mt-0.5 text-[11px] text-[#64748b]">
                  Comparación de utilidad, metas y comisión proyectada.
                </p>
              </div>
            </div>

            <div className="rounded-[10px] border border-black/10 bg-[#f8fafc] px-3 py-2 text-right">
              <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#64748b]">
                Período
              </div>

              <div className="mt-0.5 text-[11px] font-semibold text-[#172033]">
                {periodoLabel}
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-2 border-b border-black/10 bg-[#f8fafc] p-3 md:grid-cols-3">
          <div className="rounded-[12px] border border-black/10 bg-white p-3">
            <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-[#64748b]">
              <UsersRound size={11} />
              Vendedores
            </div>

            <div className="mt-1 text-[16px] font-semibold text-[#172033]">
              {mensual.length}
            </div>
          </div>

          <div className="rounded-[12px] border border-black/10 bg-white p-3">
            <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-[#64748b]">
              <TrendingUp size={11} />
              Utilidad total
            </div>

            <div className="mt-1 text-[16px] font-semibold text-emerald-700">
              {formatUsd(totalUtilidad)}
            </div>
          </div>

          <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-emerald-700">
              <CircleDollarSign size={11} />
              Comisión estimada
            </div>

            <div className="mt-1 text-[16px] font-semibold text-emerald-800">
              {formatUsd(totalComision)}
            </div>
          </div>
        </div>

        <div className="grid gap-2.5 p-3 md:grid-cols-2">
          {mensual.map((item) => (
            <SellerCard
              key={`${item.vendedor_id}-${item.sucursal_id || "sin-sucursal"}`}
              item={item}
              selected={selected?.vendedor_id === item.vendedor_id}
              onSelect={() => onSelect(item.vendedor_id)}
            />
          ))}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 bg-[#f8fafc] px-3 py-2 text-[10.5px] text-[#64748b]">
          <span>{mensual.length} vendedores con actividad</span>

          <span className="font-semibold text-[#172033]">
            {vendedoresLogrados} con meta lograda
          </span>
        </footer>
      </main>

      <aside className="min-w-0 rounded-[16px] border border-black/10 bg-white/68 p-3 shadow-sm backdrop-blur-xl">
        {!selected ? (
          <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-5 text-center text-[12px] text-[#64748b]">
            Seleccioná un vendedor para ver su resumen.
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-[14px] font-semibold text-[#172033]">
                  {selected.vendedor || "Sin vendedor"}
                </h2>

                <p className="mt-0.5 truncate text-[11px] text-[#64748b]">
                  {selected.sucursal || "Sin sucursal"}
                </p>
              </div>

              {selectedNivelClasses ? (
                <span
                  className={[
                    "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[9.5px] font-semibold",
                    selectedNivelClasses.badge
                  ].join(" ")}
                >
                  <span
                    className={[
                      "h-1.5 w-1.5 rounded-full",
                      selectedNivelClasses.dot
                    ].join(" ")}
                  />

                  {getNivelLabel(selected.nivel_alcanzado)}
                </span>
              ) : null}
            </div>

            <div className="mt-3 grid gap-2">
              <SummaryGroup title="Utilidad comisionable">
                <SummaryRow
                  label="Carritos"
                  value={formatUsd(selected.utilidad_carritos_usd)}
                />

                <SummaryRow
                  label="Files"
                  value={formatUsd(selected.utilidad_files_usd)}
                />

                <SummaryRow
                  label="Utilidad total"
                  value={formatUsd(selected.utilidad_total_usd)}
                  strong
                  positive
                />
              </SummaryGroup>

              <SummaryGroup title="Meta mensual">
                <SummaryRow
                  label="Piso"
                  value={formatUsd(selected.meta_piso_usd)}
                />

                <SummaryRow
                  label="Medio"
                  value={formatUsd(selected.meta_medio_usd)}
                />

                <SummaryRow
                  label="Lograda"
                  value={formatUsd(selected.meta_logrado_usd)}
                />

                <SummaryRow
                  label="Falta para piso"
                  value={formatUsd(selected.falta_para_piso_usd)}
                  strong
                />
              </SummaryGroup>

              <SummaryGroup title="Comisión proyectada">
                <SummaryRow
                  label="Porcentaje"
                  value={formatPct(selected.porcentaje_comision)}
                />

                <SummaryRow
                  label="Facturación"
                  value={formatUsd(selected.facturacion_total_usd)}
                />
              </SummaryGroup>
            </div>

            <div className="mt-2 rounded-[14px] border border-emerald-200 bg-emerald-50 p-3.5">
              <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                <CircleDollarSign size={12} />
                Comisión estimada
              </div>

              <div className="mt-1.5 text-[23px] font-semibold tracking-tight text-emerald-800">
                {formatUsd(selected.comision_estimada_usd)}
              </div>
            </div>

            <div className="mt-2 rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                  <Target size={11} />
                  Avance al piso
                </div>

                <span className="text-[11px] font-semibold text-[#4f7c90]">
                  {formatPct(selected.porcentaje_avance_piso)}
                </span>
              </div>

              <ProgressBar
                value={getNumber(selected.porcentaje_avance_piso)}
              />
            </div>
          </>
        )}
      </aside>
    </section>
  );
}

export default ComisionesAllSellersView;
