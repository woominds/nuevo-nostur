import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShoppingCart
} from "lucide-react";

import {
  formatMoneyAR
} from "../../../lib/formatters";

type FilesMetricsData = {
  files: number;
  totalVenta: number;
  netoOperador: number;
  margenEstimado: number;
  totalPagado: number;
  saldo: number;
};

type MetricTone =
  | "orange"
  | "blue"
  | "green"
  | "red";

type FilesMetricsProps = {
  metrics: FilesMetricsData;
};

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "orange"
}: {
  label: string;
  value: string | number;
  icon: typeof ShoppingCart;
  tone?: MetricTone;
}) {
  const toneClass: Record<
    MetricTone,
    string
  > = {
    orange:
      "bg-orange-50 text-nostur-orange ring-orange-100",
    blue:
      "bg-sky-50 text-sky-700 ring-sky-100",
    green:
      "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red:
      "bg-red-50 text-red-700 ring-red-100"
  };

  return (
    <div className="rounded-[14px] border border-black/10 bg-white/62 px-3 py-2.5 shadow-sm backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[10.5px] font-medium text-[#64748b]">
            {label}
          </div>

          <div className="mt-0.5 truncate text-[18px] font-semibold tracking-tight text-[#172033]">
            {value}
          </div>
        </div>

        <div
          className={[
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1",
            toneClass[tone]
          ].join(" ")}
        >
          <Icon
            size={14}
            strokeWidth={1.8}
          />
        </div>
      </div>
    </div>
  );
}

export function FilesMetrics({
  metrics
}: FilesMetricsProps) {
  return (
    <section className="relative z-0 mb-3 grid gap-2.5 md:grid-cols-3 xl:grid-cols-6">
      <MetricCard
        label="Files"
        value={metrics.files}
        icon={ShoppingCart}
      />

      <MetricCard
        label="Total venta"
        value={formatMoneyAR(
          metrics.totalVenta
        )}
        icon={FileText}
      />

      <MetricCard
        label="Neto operador"
        value={formatMoneyAR(
          metrics.netoOperador
        )}
        icon={FileText}
        tone="blue"
      />

      <MetricCard
        label="Margen est."
        value={formatMoneyAR(
          metrics.margenEstimado
        )}
        icon={CheckCircle2}
        tone="green"
      />

      <MetricCard
        label="Pagado"
        value={formatMoneyAR(
          metrics.totalPagado
        )}
        icon={CheckCircle2}
        tone="green"
      />

      <MetricCard
        label="Saldo"
        value={formatMoneyAR(
          metrics.saldo
        )}
        icon={AlertTriangle}
        tone="red"
      />
    </section>
  );
}
