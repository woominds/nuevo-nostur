import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  TrendingUp,
  Trophy,
  UsersRound
} from "lucide-react";
import type { MatrizVendedorAnual } from "../../../store/comisionesStore";

type MatrizMetric = "utilidad" | "facturacion";

type ComisionesAnnualMatrixProps = {
  matriz: MatrizVendedorAnual[];
  anio: string;
};

const MONTH_SHORT_NAMES = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC"
];

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

function formatCompact(value: string | number | null | undefined): string {
  const parsed = getNumber(value);

  if (!parsed) return "—";

  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(parsed);
}

function MetricCard({
  label,
  value,
  icon: Icon,
  positive = false
}: {
  label: string;
  value: string | number;
  icon: typeof TrendingUp;
  positive?: boolean;
}) {
  return (
    <div className="rounded-[12px] border border-black/10 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[9.5px] font-semibold uppercase tracking-wide text-[#64748b]">
            {label}
          </div>

          <div
            className={[
              "mt-1 truncate text-[16px] font-semibold",
              positive ? "text-emerald-700" : "text-[#172033]"
            ].join(" ")}
          >
            {value}
          </div>
        </div>

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[#eef6f7] text-[#4f7c90]">
          <Icon size={14} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

function SellerSummaryCard({
  vendedor,
  metric
}: {
  vendedor: MatrizVendedorAnual;
  metric: MatrizMetric;
}) {
  const total =
    metric === "utilidad"
      ? vendedor.total_utilidad_usd
      : vendedor.total_facturacion_usd;

  const mesesConActividad = Object.values(vendedor.meses).filter((item) => {
    const value =
      metric === "utilidad"
        ? item.utilidad_usd
        : item.facturacion_usd;

    return value > 0;
  }).length;

  return (
    <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold text-[#172033]">
            {vendedor.vendedor || "Sin vendedor"}
          </div>

          <div className="mt-0.5 truncate text-[10px] text-[#64748b]">
            {vendedor.sucursal || "Sin sucursal"}
          </div>
        </div>

        <span className="rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700">
          {mesesConActividad} meses
        </span>
      </div>

      <div className="mt-3 text-[15px] font-semibold text-[#4f7c90]">
        {formatUsd(total)}
      </div>

      <div className="mt-0.5 text-[9.5px] text-[#64748b]">
        {metric === "utilidad"
          ? "Utilidad acumulada"
          : "Facturación acumulada"}
      </div>
    </div>
  );
}

export function ComisionesAnnualMatrix({
  matriz,
  anio
}: ComisionesAnnualMatrixProps) {
  const [metric, setMetric] = useState<MatrizMetric>("utilidad");

  const currentYear = new Date().getFullYear();
  const currentMonth =
    Number(anio) === currentYear ? new Date().getMonth() + 1 : null;

  const totalsByMonth = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;

        return matriz.reduce((total, vendedor) => {
          const value =
            metric === "utilidad"
              ? vendedor.meses[month]?.utilidad_usd || 0
              : vendedor.meses[month]?.facturacion_usd || 0;

          return total + value;
        }, 0);
      }),
    [matriz, metric]
  );

  const grandTotal = totalsByMonth.reduce(
    (total, value) => total + value,
    0
  );

  const bestMonthIndex = totalsByMonth.reduce(
    (bestIndex, value, index, values) =>
      value > values[bestIndex] ? index : bestIndex,
    0
  );

  const vendedoresConActividad = matriz.filter((vendedor) => {
    const total =
      metric === "utilidad"
        ? vendedor.total_utilidad_usd
        : vendedor.total_facturacion_usd;

    return total > 0;
  }).length;

  const topVendedor =
    matriz
      .slice()
      .sort((a, b) => {
        const totalA =
          metric === "utilidad"
            ? a.total_utilidad_usd
            : a.total_facturacion_usd;

        const totalB =
          metric === "utilidad"
            ? b.total_utilidad_usd
            : b.total_facturacion_usd;

        return totalB - totalA;
      })[0] || null;

  return (
    <section className="min-w-0 overflow-hidden rounded-[16px] border border-black/10 bg-white/68 shadow-sm backdrop-blur-xl">
      <header className="border-b border-black/10 bg-white/75 px-4 py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#eef6f7] text-[#4f7c90]">
              <CalendarDays size={16} />
            </div>

            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-[#172033]">
                Matriz anual de vendedores
              </h2>

              <p className="mt-0.5 text-[11px] text-[#64748b]">
                Evolución mensual de utilidad y facturación expresada en USD.
              </p>
            </div>
          </div>

          <div className="flex h-8 overflow-hidden rounded-[12px] border border-black/10 bg-[#f8fafc] p-0.5">
            <button
              type="button"
              onClick={() => setMetric("utilidad")}
              className={[
                "rounded-[9px] px-3 text-[10.5px] font-medium transition",
                metric === "utilidad"
                  ? "bg-[#172033] text-white shadow-sm"
                  : "text-[#64748b] hover:bg-white hover:text-[#172033]"
              ].join(" ")}
            >
              Utilidad
            </button>

            <button
              type="button"
              onClick={() => setMetric("facturacion")}
              className={[
                "rounded-[9px] px-3 text-[10.5px] font-medium transition",
                metric === "facturacion"
                  ? "bg-[#172033] text-white shadow-sm"
                  : "text-[#64748b] hover:bg-white hover:text-[#172033]"
              ].join(" ")}
            >
              Facturación
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-2 border-b border-black/10 bg-[#f8fafc] p-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Año analizado"
          value={anio}
          icon={CalendarDays}
        />

        <MetricCard
          label="Vendedores activos"
          value={vendedoresConActividad}
          icon={UsersRound}
        />

        <MetricCard
          label="Total anual"
          value={formatUsd(grandTotal)}
          icon={TrendingUp}
          positive={metric === "utilidad"}
        />

        <MetricCard
          label="Mejor mes"
          value={
            grandTotal > 0
              ? MONTH_SHORT_NAMES[bestMonthIndex]
              : "—"
          }
          icon={Trophy}
        />
      </div>

      <div className="overflow-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-black/10 bg-[#f8fafc] text-[9px] uppercase tracking-[0.12em] text-[#64748b]">
              <th className="sticky left-0 z-20 min-w-[210px] bg-[#f8fafc] px-3 py-2.5 font-semibold">
                Vendedor
              </th>

              {MONTH_SHORT_NAMES.map((month) => (
                <th
                  key={month}
                  className="min-w-[78px] px-2 py-2.5 text-right font-semibold"
                >
                  {month}
                </th>
              ))}

              <th className="min-w-[110px] bg-[#eef6f7] px-3 py-2.5 text-right font-semibold text-[#4f7c90]">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {matriz.length === 0 ? (
              <tr>
                <td
                  colSpan={14}
                  className="px-3 py-10 text-center text-[12px] text-[#64748b]"
                >
                  No hay información anual para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              matriz.map((vendedor) => {
                const rowTotal =
                  metric === "utilidad"
                    ? vendedor.total_utilidad_usd
                    : vendedor.total_facturacion_usd;

                return (
                  <tr
                    key={`${vendedor.vendedor_id}-${vendedor.sucursal_id || "sin-sucursal"}`}
                    className="border-b border-black/5 bg-white transition last:border-0 hover:bg-[#f8fafc]"
                  >
                    <td className="sticky left-0 z-10 bg-white px-3 py-3">
                      <div className="font-semibold text-[#172033]">
                        {vendedor.vendedor || "Sin vendedor"}
                      </div>

                      <div className="mt-0.5 text-[9.5px] text-[#64748b]">
                        {vendedor.sucursal || "Sin sucursal"}
                      </div>
                    </td>

                    {Array.from({ length: 12 }, (_, index) => {
                      const month = index + 1;

                      const value =
                        metric === "utilidad"
                          ? vendedor.meses[month]?.utilidad_usd || 0
                          : vendedor.meses[month]?.facturacion_usd || 0;

                      return (
                        <td
                          key={`${vendedor.vendedor_id}-${month}`}
                          className={[
                            "px-2 py-3 text-right font-semibold",
                            currentMonth === month
                              ? "bg-[#eef6f7] text-[#172033]"
                              : value > 0
                                ? "text-[#334155]"
                                : "text-[#cbd5e1]"
                          ].join(" ")}
                        >
                          {formatCompact(value)}
                        </td>
                      );
                    })}

                    <td className="bg-[#eef6f7]/70 px-3 py-3 text-right font-semibold text-[#4f7c90]">
                      {formatCompact(rowTotal)}
                    </td>
                  </tr>
                );
              })
            )}

            {matriz.length > 0 ? (
              <tr className="border-t border-black/10 bg-[#f8fafc]">
                <td className="sticky left-0 z-10 bg-[#f8fafc] px-3 py-3 font-semibold text-[#172033]">
                  Total mensual
                </td>

                {totalsByMonth.map((value, index) => (
                  <td
                    key={index}
                    className={[
                      "px-2 py-3 text-right font-semibold",
                      currentMonth === index + 1
                        ? "bg-[#eef6f7] text-[#172033]"
                        : "text-[#334155]"
                    ].join(" ")}
                  >
                    {formatCompact(value)}
                  </td>
                ))}

                <td className="bg-[#dfecef] px-3 py-3 text-right font-semibold text-[#172033]">
                  {formatCompact(grandTotal)}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <footer className="border-t border-black/10 bg-[#f8fafc] p-3">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-[#4f7c90]" />

            <div>
              <h3 className="text-[12px] font-semibold text-[#172033]">
                Ranking anual
              </h3>

              <p className="text-[10px] text-[#64748b]">
                Acumulado por vendedor para la métrica seleccionada.
              </p>
            </div>
          </div>

          {topVendedor ? (
            <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-right">
              <div className="text-[9px] font-semibold uppercase tracking-wide text-amber-700">
                Mayor acumulado
              </div>

              <div className="mt-0.5 text-[11px] font-semibold text-amber-900">
                {topVendedor.vendedor || "Sin vendedor"}
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {matriz
            .slice()
            .sort((a, b) => {
              const totalA =
                metric === "utilidad"
                  ? a.total_utilidad_usd
                  : a.total_facturacion_usd;

              const totalB =
                metric === "utilidad"
                  ? b.total_utilidad_usd
                  : b.total_facturacion_usd;

              return totalB - totalA;
            })
            .slice(0, 4)
            .map((vendedor) => (
              <SellerSummaryCard
                key={`${vendedor.vendedor_id}-${vendedor.sucursal_id || "sin-sucursal"}`}
                vendedor={vendedor}
                metric={metric}
              />
            ))}
        </div>
      </footer>
    </section>
  );
}

export default ComisionesAnnualMatrix;
