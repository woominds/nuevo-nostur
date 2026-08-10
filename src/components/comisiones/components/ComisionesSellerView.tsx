import {
  CircleDollarSign,
  FileText,
  ShoppingCart,
  Target,
  TrendingUp
} from "lucide-react";
import type {
  ComisionMensual,
  ComisionSemanal,
  VentaComision
} from "../../../store/comisionesStore";

type ComisionesSellerViewProps = {
  loading: boolean;
  selected: ComisionMensual | null;
  weekly: ComisionSemanal | null;
  ventas: VentaComision[];
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

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const [year, month, day] = value.slice(0, 10).split("-");

  if (!year || !month || !day) return "—";

  return `${day}/${month}/${year}`;
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

function VentaRow({
  venta
}: {
  venta: VentaComision;
}) {
  const isCarrito = venta.origen === "CARRITO";

  return (
    <div className="grid min-w-[760px] grid-cols-[118px_minmax(190px,1fr)_118px_118px_90px] items-center gap-3 border-b border-black/5 bg-white px-3 py-3 transition last:border-0 hover:bg-[#f8fafc]">
      <div className="min-w-0">
        <div className="truncate text-[11.5px] font-semibold text-[#172033]">
          {venta.numero}
        </div>

        <div className="mt-1 flex items-center gap-1.5">
          <span
            className={[
              "rounded px-1 py-0.5 text-[8.5px] font-semibold uppercase tracking-wide",
              isCarrito
                ? "bg-sky-50 text-sky-700"
                : "bg-violet-50 text-violet-700"
            ].join(" ")}
          >
            {venta.origen}
          </span>

          <span className="text-[9.5px] text-[#94a3b8]">
            {formatDate(venta.fecha)}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <div className="truncate text-[11.5px] font-semibold text-[#172033]">
          {venta.pasajero || "Sin pasajero"}
        </div>

        <div className="mt-1 truncate text-[10px] text-[#64748b]">
          {venta.sucursal_nombre || "Sin sucursal"} · {venta.moneda}
        </div>
      </div>

      <div>
        <div className="text-[11.5px] font-semibold text-[#172033]">
          {formatUsd(venta.facturacion_usd)}
        </div>

        <div className="mt-0.5 text-[9.5px] text-[#64748b]">
          Facturación
        </div>
      </div>

      <div>
        <div className="text-[11.5px] font-semibold text-emerald-700">
          {formatUsd(venta.utilidad_usd)}
        </div>

        <div className="mt-0.5 text-[9.5px] text-[#64748b]">
          Utilidad USD
        </div>
      </div>

      <div className="text-right">
        <div className="text-[11.5px] font-semibold text-[#4f7c90]">
          {venta.moneda === "ARS"
            ? getNumber(venta.tc_promedio_usd_ars).toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4
              })
            : "—"}
        </div>

        <div className="mt-0.5 text-[9.5px] text-[#64748b]">
          TC promedio
        </div>
      </div>
    </div>
  );
}

export function ComisionesSellerView({
  loading,
  selected,
  weekly,
  ventas
}: ComisionesSellerViewProps) {
  if (!selected) {
    return (
      <div className="rounded-[16px] border border-black/10 bg-white/68 p-8 text-center text-[12px] text-[#64748b] shadow-sm backdrop-blur-xl">
        No hay información del vendedor para el período seleccionado.
      </div>
    );
  }

  const nivelClasses = getNivelClasses(selected.nivel_alcanzado);
  const avance = getNumber(selected.porcentaje_avance_piso);

  return (
    <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
      <main className="min-w-0 overflow-hidden rounded-[16px] border border-black/10 bg-white/68 shadow-sm backdrop-blur-xl">
        <header className="border-b border-black/10 bg-white/75 px-4 py-3.5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#eef6f7] text-[#4f7c90]">
                  <TrendingUp size={16} />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-semibold text-[#172033]">
                      {selected.vendedor || "Sin vendedor"}
                    </h2>

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

                      {getNivelLabel(selected.nivel_alcanzado)}
                    </span>
                  </div>

                  <p className="mt-0.5 text-[11px] text-[#64748b]">
                    {selected.sucursal || "Sin sucursal"} ·{" "}
                    {String(selected.mes).padStart(2, "0")}/{selected.anio}
                  </p>
                </div>
              </div>
            </div>

            {weekly ? (
              <div className="min-w-[190px] rounded-[12px] border border-sky-200 bg-sky-50 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-sky-700">
                  <Target size={11} />
                  Meta semanal
                </div>

                <div className="mt-1 text-[11.5px] font-semibold text-sky-900">
                  {formatUsd(weekly.utilidad_semana_usd)} /{" "}
                  {formatUsd(weekly.meta_unica_usd)}
                </div>

                <div className="mt-1.5">
                  <ProgressBar value={getNumber(weekly.porcentaje_avance)} />
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <div className="grid gap-2 border-b border-black/10 bg-[#f8fafc] p-3 md:grid-cols-3">
          <div className="rounded-[12px] border border-black/10 bg-white p-3">
            <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-[#64748b]">
              <ShoppingCart size={11} />
              Utilidad Carritos
            </div>

            <div className="mt-1 text-[15px] font-semibold text-emerald-700">
              {formatUsd(selected.utilidad_carritos_usd)}
            </div>
          </div>

          <div className="rounded-[12px] border border-black/10 bg-white p-3">
            <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-[#64748b]">
              <FileText size={11} />
              Utilidad Files
            </div>

            <div className="mt-1 text-[15px] font-semibold text-emerald-700">
              {formatUsd(selected.utilidad_files_usd)}
            </div>
          </div>

          <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-emerald-700">
              <CircleDollarSign size={11} />
              Comisión estimada
            </div>

            <div className="mt-1 text-[15px] font-semibold text-emerald-800">
              {formatUsd(selected.comision_estimada_usd)}
            </div>
          </div>
        </div>

        <div className="overflow-auto">
          <div className="grid min-w-[760px] grid-cols-[118px_minmax(190px,1fr)_118px_118px_90px] gap-3 border-b border-black/10 bg-[#f8fafc] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
            <div>Operación</div>
            <div>Cliente / referencia</div>
            <div>Facturación</div>
            <div>Utilidad USD</div>
            <div className="text-right">TC promedio</div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-[12px] text-[#64748b]">
              Cargando ventas...
            </div>
          ) : ventas.length === 0 ? (
            <div className="p-8 text-center text-[12px] text-[#64748b]">
              No hay ventas para el período seleccionado.
            </div>
          ) : (
            ventas.map((venta) => (
              <VentaRow
                key={`${venta.origen}-${venta.origen_id}`}
                venta={venta}
              />
            ))
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 bg-[#f8fafc] px-3 py-2 text-[10.5px] text-[#64748b]">
          <span>{ventas.length} operaciones comisionables</span>

          <span className="font-semibold text-[#172033]">
            Utilidad total {formatUsd(selected.utilidad_total_usd)}
          </span>
        </footer>
      </main>

      <aside className="min-w-0 rounded-[16px] border border-black/10 bg-white/68 p-3 shadow-sm backdrop-blur-xl">
        <div>
          <h2 className="text-[14px] font-semibold text-[#172033]">
            Resumen mensual
          </h2>

          <p className="mt-0.5 text-[11px] text-[#64748b]">
            Proyección antes del cierre de liquidación
          </p>
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
              label="Nivel actual"
              value={getNivelLabel(selected.nivel_alcanzado)}
              strong
            />
          </SummaryGroup>

          <SummaryGroup title="Avance">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[11px] text-[#64748b]">
                Avance al piso
              </span>

              <span className="text-[11.5px] font-semibold text-[#4f7c90]">
                {formatPct(avance)}
              </span>
            </div>

            <ProgressBar value={avance} />

            <div className="mt-2 text-[10.5px] text-[#64748b]">
              Faltan{" "}
              <strong className="font-semibold text-[#172033]">
                {formatUsd(selected.falta_para_piso_usd)}
              </strong>{" "}
              para alcanzar el piso.
            </div>
          </SummaryGroup>

          <SummaryGroup title="Comisión estimada">
            <SummaryRow
              label="Porcentaje aplicado"
              value={formatPct(selected.porcentaje_comision)}
            />

            <SummaryRow
              label="Base total"
              value={formatUsd(selected.utilidad_total_usd)}
            />
          </SummaryGroup>
        </div>

        <div className="mt-2 rounded-[14px] border border-emerald-200 bg-emerald-50 p-3.5">
          <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
            <CircleDollarSign size={12} />
            Comisión proyectada
          </div>

          <div className="mt-1.5 text-[23px] font-semibold tracking-tight text-emerald-800">
            {formatUsd(selected.comision_estimada_usd)}
          </div>

          <div className="mt-1 text-[10.5px] text-emerald-700">
            El importe definitivo se confirma al cerrar la liquidación mensual.
          </div>
        </div>
      </aside>
    </section>
  );
}

export default ComisionesSellerView;
