import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileText,
  ShoppingCart
} from "lucide-react";
import { formatMoneyAR } from "../../../lib/formatters";
import { CardMetric } from "./CarritosDisplayComponents";

type CarritosMetricsData = {
  carritos: number;
  totalVenta: number;
  totalPagado: number;
  saldo: number;
  riesgos: number;
  enControl: number;
};

type CarritosMetricsProps = {
  metrics: CarritosMetricsData;
};

export function CarritosMetrics({
  metrics
}: CarritosMetricsProps) {
  return (
    <section className="carritos-kpis relative z-0 mb-3 grid gap-2.5">
      <CardMetric
        label="Carritos"
        value={metrics.carritos}
        icon={ShoppingCart}
      />

      <CardMetric
        label="Total venta"
        value={formatMoneyAR(metrics.totalVenta)}
        icon={FileText}
      />

      <CardMetric
        label="Pagado"
        value={formatMoneyAR(metrics.totalPagado)}
        icon={CheckCircle2}
        tone="green"
      />

      <CardMetric
        label="Saldo"
        value={formatMoneyAR(metrics.saldo)}
        icon={AlertTriangle}
        tone="red"
      />

      <CardMetric
        label="Riesgos"
        value={metrics.riesgos}
        icon={AlertTriangle}
        tone="red"
      />

      <CardMetric
        label="En control"
        value={metrics.enControl}
        icon={Eye}
        tone="blue"
      />
    </section>
  );
}
