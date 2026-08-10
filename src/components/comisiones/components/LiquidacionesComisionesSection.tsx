import { useMemo, useState } from "react";
import {
  Ban,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  LockKeyhole,
  ReceiptText,
  RefreshCcw,
  RotateCcw,
  ShoppingCart
} from "lucide-react";
import {
  useComisionesStore,
  type LiquidacionComision,
  type LiquidacionComisionDetalle,
  type LiquidacionComisionEstado
} from "../../../store/comisionesStore";

type LiquidacionesComisionesSectionProps = {
  vendedorId: string | null;
};

type ConfirmAction =
  | {
      type: "cerrar";
      liquidacion: LiquidacionComision;
    }
  | {
      type: "pagar";
      liquidacion: LiquidacionComision;
    }
  | {
      type: "anular";
      liquidacion: LiquidacionComision;
    }
  | null;

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

function formatDateTime(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Cordoba"
  }).format(date);
}

function getEstadoClass(estado: LiquidacionComisionEstado): string {
  if (estado === "PAGADA") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (estado === "CERRADA") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (estado === "CALCULADA") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (estado === "AJUSTADA") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (estado === "ANULADA") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getEstadoDotClass(estado: LiquidacionComisionEstado): string {
  if (estado === "PAGADA") return "bg-emerald-500";
  if (estado === "CERRADA") return "bg-sky-500";
  if (estado === "CALCULADA") return "bg-amber-500";
  if (estado === "AJUSTADA") return "bg-orange-500";
  if (estado === "ANULADA") return "bg-red-500";

  return "bg-slate-400";
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

function getVendedorNombre(liquidacion: LiquidacionComision): string {
  const vendedor = liquidacion.vendedor;

  if (!vendedor) return "Sin vendedor";

  return (
    `${vendedor.nombre || ""} ${vendedor.apellido || ""}`.trim() ||
    vendedor.email ||
    "Sin vendedor"
  );
}

function isReversionAlmundo(
  item: LiquidacionComisionDetalle
): boolean {
  const detalle = item.detalle_origen || {};

  return (
    item.tipo_movimiento === "AJUSTE_NEGATIVO" &&
    detalle["tipo"] === "REVERSION_ALMUNDO"
  );
}

function getDetalleOrigenValue(
  item: LiquidacionComisionDetalle,
  key: string
): string | number | null {
  const detalle = item.detalle_origen || {};
  const value = detalle[key];

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return value;
  }

  return null;
}

function EstadoBadge({
  estado
}: {
  estado: LiquidacionComisionEstado;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[9.5px] font-semibold",
        getEstadoClass(estado)
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          getEstadoDotClass(estado)
        ].join(" ")}
      />

      {estado}
    </span>
  );
}

function LiquidacionCard({
  liquidacion,
  selected,
  onSelect
}: {
  liquidacion: LiquidacionComision;
  selected: boolean;
  onSelect: () => void;
}) {
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
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-[#172033]">
            {getVendedorNombre(liquidacion)}
          </div>

          <div className="mt-0.5 truncate text-[10.5px] text-[#64748b]">
            {liquidacion.sucursal?.nombre || "Sin sucursal"}
          </div>
        </div>

        <EstadoBadge estado={liquidacion.estado} />
      </div>

      <div className="rounded-[11px] border border-black/10 bg-[#f8fafc] px-2.5 py-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-medium text-[#64748b]">
            Período
          </span>

          <span className="text-[11px] font-semibold text-[#172033]">
            {String(liquidacion.mes).padStart(2, "0")}/{liquidacion.anio}
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-3">
          <span className="text-[10px] font-medium text-[#64748b]">
            Nivel
          </span>

          <span className="text-[11px] font-semibold text-[#172033]">
            {getNivelLabel(liquidacion.nivel_alcanzado)}
          </span>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="rounded-[10px] border border-black/5 bg-white/70 p-2">
          <div className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-[#64748b]">
            <ShoppingCart size={10} />
            Carritos
          </div>

          <div className="mt-0.5 text-[11.5px] font-semibold text-[#172033]">
            {liquidacion.cantidad_carritos}
          </div>
        </div>

        <div className="rounded-[10px] border border-black/5 bg-white/70 p-2">
          <div className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-[#64748b]">
            <FileText size={10} />
            Files
          </div>

          <div className="mt-0.5 text-[11.5px] font-semibold text-[#172033]">
            {liquidacion.cantidad_files}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[9px] font-medium uppercase tracking-wide text-[#64748b]">
            Utilidad
          </div>

          <div className="truncate text-[12px] font-semibold text-emerald-700">
            {formatUsd(liquidacion.utilidad_total_usd)}
          </div>
        </div>

        <div className="min-w-0 text-right">
          <div className="text-[9px] font-medium uppercase tracking-wide text-[#64748b]">
            Total a pagar
          </div>

          <div className="truncate text-[12px] font-semibold text-[#4f7c90]">
            {formatUsd(liquidacion.comision_final_usd)}
          </div>
        </div>
      </div>
    </button>
  );
}

function DetalleRow({
  item
}: {
  item: LiquidacionComisionDetalle;
}) {
  const isAdjustment = item.tipo_movimiento !== "ORIGINAL";
  const isReversion = isReversionAlmundo(item);

  const fechaVentaOriginal = isReversion
    ? String(
        getDetalleOrigenValue(
          item,
          "fecha_venta_original"
        ) || ""
      )
    : "";

  const base = getNumber(item.utilidad_comisionable_usd);
  const comision = getNumber(item.comision_operacion_usd);

  return (
    <div
      className={[
        "grid min-w-[760px] grid-cols-[118px_minmax(190px,1fr)_118px_100px_118px] items-center gap-3 border-b border-black/5 px-3 py-3 last:border-0",
        isReversion
          ? "bg-red-50/70"
          : isAdjustment
            ? "bg-orange-50/75"
            : "bg-white transition hover:bg-[#f8fafc]"
      ].join(" ")}
    >
      <div className="min-w-0">
        <div
          className={[
            "truncate text-[11.5px] font-semibold",
            isReversion
              ? "text-red-700"
              : "text-[#172033]"
          ].join(" ")}
        >
          {item.numero}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {isReversion ? (
            <span className="rounded bg-red-100 px-1 py-0.5 text-[8.5px] font-semibold uppercase tracking-wide text-red-700">
              Reversión ALMUNDO
            </span>
          ) : (
            <span
              className={[
                "rounded px-1 py-0.5 text-[8.5px] font-semibold uppercase tracking-wide",
                item.origen === "CARRITO"
                  ? "bg-sky-50 text-sky-700"
                  : "bg-violet-50 text-violet-700"
              ].join(" ")}
            >
              {item.origen}
            </span>
          )}

          <span className="text-[9.5px] text-[#94a3b8]">
            {formatDate(item.fecha_venta)}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <div className="truncate text-[11.5px] font-semibold text-[#172033]">
          {item.pasajero || "Sin pasajero"}
        </div>

        {isReversion ? (
          <>
            <div className="mt-1 truncate text-[10px] font-medium text-red-700">
              Devolución de comisión por cancelación
            </div>

            {fechaVentaOriginal ? (
              <div className="mt-0.5 truncate text-[9.5px] text-[#64748b]">
                Venta original: {formatDate(fechaVentaOriginal)}
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-1 truncate text-[10px] text-[#64748b]">
            {isAdjustment
              ? `${item.tipo_movimiento}${
                  item.motivo_ajuste
                    ? ` · ${item.motivo_ajuste}`
                    : ""
                }`
              : item.moneda_original === "ARS"
                ? `ARS · TC promedio ${getNumber(
                    item.tc_promedio_usd_ars
                  ).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4
                  })}`
                : "Operación original en USD"}
          </div>
        )}
      </div>

      <div>
        <div
          className={[
            "text-[11.5px] font-semibold",
            base < 0
              ? "text-red-700"
              : "text-emerald-700"
          ].join(" ")}
        >
          {formatUsd(base)}
        </div>

        <div className="mt-0.5 text-[9.5px] text-[#64748b]">
          {isReversion
            ? "Base revertida"
            : "Base comisionable"}
        </div>
      </div>

      <div>
        <div className="text-[11.5px] font-semibold text-[#172033]">
          {formatPct(item.porcentaje_comision)}
        </div>

        <div className="mt-0.5 text-[9.5px] text-[#64748b]">
          {isReversion
            ? "Original"
            : "Aplicado"}
        </div>
      </div>

      <div className="text-right">
        <div
          className={[
            "text-[11.5px] font-semibold",
            comision < 0
              ? "text-red-700"
              : "text-[#4f7c90]"
          ].join(" ")}
        >
          {formatUsd(comision)}
        </div>

        <div className="mt-0.5 text-[9.5px] text-[#64748b]">
          {isReversion
            ? "Ajuste comisión"
            : "Comisión"}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
  positive = false,
  negative = false
}: {
  label: string;
  value: string;
  strong?: boolean;
  positive?: boolean;
  negative?: boolean;
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
          positive
            ? "text-emerald-700"
            : negative
              ? "text-red-700"
              : "text-[#172033]"
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

function ActionModal({
  action,
  saving,
  onClose,
  onConfirm
}: {
  action: ConfirmAction;
  saving: boolean;
  onClose: () => void;
  onConfirm: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");

  if (!action) return null;

  const isCerrar = action.type === "cerrar";
  const isPagar = action.type === "pagar";

  const title = isCerrar
    ? "Cerrar liquidación"
    : isPagar
      ? "Marcar liquidación como pagada"
      : "Anular liquidación";

  const description = isCerrar
    ? "La liquidación quedará congelada. Los cambios posteriores deberán registrarse como ajustes."
    : isPagar
      ? "Se registrará la fecha y el usuario responsable del pago."
      : "La liquidación conservará todo su historial. El motivo es obligatorio.";

  return (
    <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[18px] border border-black/10 bg-white p-4 shadow-2xl">
        <h3 className="text-[16px] font-semibold text-[#172033]">
          {title}
        </h3>

        <p className="mt-1 text-[12px] leading-relaxed text-[#64748b]">
          {description}
        </p>

        {!isCerrar ? (
          <div className="mt-4">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#64748b]">
              {isPagar ? "Observaciones" : "Motivo de anulación"}
            </label>

            <textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={
                isPagar
                  ? "Detalle opcional del pago..."
                  : "Indicá por qué se anula..."
              }
              className="min-h-[90px] w-full resize-none rounded-[10px] border border-black/10 bg-white px-3 py-2 text-[12px] text-[#172033] outline-none focus:border-[#4f7c90]"
            />
          </div>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="h-8 rounded-[10px] px-3 text-[12px] font-medium text-[#64748b] hover:bg-[#f1f5f9]"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={
              saving ||
              (action.type === "anular" && !value.trim())
            }
            onClick={() => onConfirm(value)}
            className={[
              "h-8 rounded-[10px] px-4 text-[12px] font-medium text-white disabled:opacity-50",
              action.type === "anular"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#4f7c90] hover:bg-[#406b7d]"
            ].join(" ")}
          >
            {saving ? "Procesando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LiquidacionesComisionesSection({
  vendedorId
}: LiquidacionesComisionesSectionProps) {
  const saving = useComisionesStore((state) => state.saving);

  const canManage = useComisionesStore(
    (state) => state.canManageComisiones
  );

  const filters = useComisionesStore((state) => state.filters);

  const liquidaciones = useComisionesStore(
    (state) => state.liquidaciones
  );

  const detalle = useComisionesStore(
    (state) => state.liquidacionDetalle
  );

  const selectedLiquidacionId = useComisionesStore(
    (state) => state.selectedLiquidacionId
  );

  const calcularLiquidacion = useComisionesStore(
    (state) => state.calcularLiquidacion
  );

  const cerrarLiquidacion = useComisionesStore(
    (state) => state.cerrarLiquidacion
  );

  const marcarLiquidacionPagada = useComisionesStore(
    (state) => state.marcarLiquidacionPagada
  );

  const anularLiquidacion = useComisionesStore(
    (state) => state.anularLiquidacion
  );

  const selectLiquidacion = useComisionesStore(
    (state) => state.selectLiquidacion
  );

  const loadComisiones = useComisionesStore(
    (state) => state.loadComisiones
  );

  const selectedLiquidacion = useComisionesStore(
    (state) => state.getSelectedLiquidacion()
  );

  const [action, setAction] = useState<ConfirmAction>(null);

  const detailMetrics = useMemo(() => {
    const reversiones = detalle.filter(
      (item) => isReversionAlmundo(item)
    );

    const otrosAjustes = detalle.filter(
      (item) =>
        item.tipo_movimiento !== "ORIGINAL" &&
        !isReversionAlmundo(item)
    );

    return {
      carritos: detalle.filter(
        (item) =>
          item.origen === "CARRITO" &&
          item.tipo_movimiento === "ORIGINAL"
      ).length,

      files: detalle.filter(
        (item) =>
          item.origen === "FILE" &&
          item.tipo_movimiento === "ORIGINAL"
      ).length,

      ajustes: detalle.filter(
        (item) => item.tipo_movimiento !== "ORIGINAL"
      ).length,

      reversiones: reversiones.length,

      reversionesComisionUsd: reversiones.reduce(
        (total, item) =>
          total + getNumber(item.comision_operacion_usd),
        0
      ),

      otrosAjustesComisionUsd: otrosAjustes.reduce(
        (total, item) =>
          total + getNumber(item.comision_operacion_usd),
        0
      )
    };
  }, [detalle]);

  async function handleCalculate() {
    if (!vendedorId) return;

    await calcularLiquidacion(
      vendedorId,
      Number(filters.anio),
      Number(filters.mes)
    );
  }

  async function handleConfirm(value: string) {
    if (!action) return;

    if (action.type === "cerrar") {
      await cerrarLiquidacion(action.liquidacion.id);
    }

    if (action.type === "pagar") {
      await marcarLiquidacionPagada(
        action.liquidacion.id,
        value.trim()
      );
    }

    if (action.type === "anular") {
      await anularLiquidacion(
        action.liquidacion.id,
        value.trim()
      );
    }

    setAction(null);
  }

  const canRecalculate =
    selectedLiquidacion?.estado === "BORRADOR" ||
    selectedLiquidacion?.estado === "CALCULADA";

  return (
    <>
      <section className="grid min-w-0 gap-3 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        <aside className="min-w-0 rounded-[16px] border border-black/10 bg-white/68 p-3 shadow-sm backdrop-blur-xl">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-semibold text-[#172033]">
                Liquidaciones
              </h2>

              <p className="text-[11px] text-[#64748b]">
                {liquidaciones.length} del período seleccionado
              </p>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={loadComisiones}
              className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-white text-[#64748b] ring-1 ring-black/10 hover:bg-[#f8fafc] disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCcw
                size={13}
                className={saving ? "animate-spin" : ""}
              />
            </button>
          </div>

          {canManage ? (
            <button
              type="button"
              disabled={!vendedorId || saving}
              onClick={handleCalculate}
              className="mb-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#4f7c90] px-3 text-[12px] font-medium text-white shadow-sm hover:bg-[#406b7d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Calculator size={14} />
              Calcular liquidación
            </button>
          ) : null}

          {!vendedorId && canManage ? (
            <div className="mb-3 rounded-[12px] border border-amber-200 bg-amber-50 p-2.5 text-[11px] font-medium text-amber-700">
              Seleccioná un vendedor para calcular.
            </div>
          ) : null}

          {liquidaciones.length === 0 ? (
            <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-5 text-center text-[12px] text-[#64748b]">
              No hay liquidaciones para el período.
            </div>
          ) : (
            <div className="grid gap-2">
              {liquidaciones.map((item) => (
                <LiquidacionCard
                  key={item.id}
                  liquidacion={item}
                  selected={selectedLiquidacionId === item.id}
                  onSelect={() => selectLiquidacion(item.id)}
                />
              ))}
            </div>
          )}
        </aside>

        <main className="min-w-0 overflow-hidden rounded-[16px] border border-black/10 bg-white/68 shadow-sm backdrop-blur-xl">
          {!selectedLiquidacion ? (
            <div className="m-3 rounded-[14px] border border-black/10 bg-[#f8fafc] p-8 text-center text-[12px] text-[#64748b]">
              Seleccioná una liquidación para revisar sus operaciones.
            </div>
          ) : (
            <>
              <div className="border-b border-black/10 bg-white/75 px-4 py-3.5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#eef6f7] text-[#4f7c90]">
                        <ReceiptText size={16} />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-[15px] font-semibold text-[#172033]">
                            Liquidación{" "}
                            {String(selectedLiquidacion.mes).padStart(2, "0")}/
                            {selectedLiquidacion.anio}
                          </h2>

                          <EstadoBadge estado={selectedLiquidacion.estado} />
                        </div>

                        <p className="mt-0.5 text-[11px] text-[#64748b]">
                          {getVendedorNombre(selectedLiquidacion)} ·{" "}
                          {selectedLiquidacion.sucursal?.nombre || "Sin sucursal"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid min-w-[180px] gap-1 text-right">
                    <div>
                      <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#64748b]">
                        Período liquidado
                      </div>

                      <div className="mt-0.5 text-[11px] font-semibold text-[#172033]">
                        {formatDate(selectedLiquidacion.periodo_desde)} →{" "}
                        {formatDate(selectedLiquidacion.periodo_hasta)}
                      </div>
                    </div>

                    <div className="text-[10px] text-[#94a3b8]">
                      Documento versión {selectedLiquidacion.version_calculo}
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-auto">
                <div className="grid min-w-[760px] grid-cols-[118px_minmax(190px,1fr)_118px_100px_118px] gap-3 border-b border-black/10 bg-[#f8fafc] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                  <div>Operación</div>
                  <div>Cliente / referencia</div>
                  <div>Utilidad USD</div>
                  <div>Porcentaje</div>
                  <div className="text-right">Comisión</div>
                </div>

                {detalle.length === 0 ? (
                  <div className="p-8 text-center text-[12px] text-[#64748b]">
                    La liquidación no tiene detalle disponible.
                  </div>
                ) : (
                  detalle.map((item) => (
                    <DetalleRow key={item.id} item={item} />
                  ))
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 bg-[#f8fafc] px-3 py-2">
                <div className="text-[10.5px] text-[#64748b]">
                  {detailMetrics.carritos} carritos · {detailMetrics.files} files ·{" "}
                  {detailMetrics.reversiones} reversiones ·{" "}
                  {detailMetrics.ajustes} ajustes totales
                </div>

                <div className="text-[10.5px] font-semibold text-[#172033]">
                  {detalle.length} movimientos registrados
                </div>
              </div>
            </>
          )}
        </main>

        <aside className="min-w-0 rounded-[16px] border border-black/10 bg-white/68 p-3 shadow-sm backdrop-blur-xl">
          {!selectedLiquidacion ? (
            <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-5 text-center text-[12px] text-[#64748b]">
              Seleccioná una liquidación.
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div>
                <h2 className="text-[14px] font-semibold text-[#172033]">
                  Resumen de liquidación
                </h2>

                <p className="mt-0.5 text-[11px] text-[#64748b]">
                  Documento expresado íntegramente en USD
                </p>
              </div>

              <div className="mt-3 grid gap-2">
                <SummaryGroup title="Utilidad">
                  <SummaryRow
                    label="Carritos"
                    value={formatUsd(selectedLiquidacion.utilidad_carritos_usd)}
                  />

                  <SummaryRow
                    label="Files"
                    value={formatUsd(selectedLiquidacion.utilidad_files_usd)}
                  />

                  <SummaryRow
                    label="Utilidad total"
                    value={formatUsd(selectedLiquidacion.utilidad_total_usd)}
                    strong
                    positive
                  />
                </SummaryGroup>

                <SummaryGroup title="Meta mensual">
                  <SummaryRow
                    label="Piso"
                    value={formatUsd(selectedLiquidacion.meta_piso_usd)}
                  />

                  <SummaryRow
                    label="Medio"
                    value={formatUsd(selectedLiquidacion.meta_medio_usd)}
                  />

                  <SummaryRow
                    label="Lograda"
                    value={formatUsd(selectedLiquidacion.meta_logrado_usd)}
                  />

                  <SummaryRow
                    label="Nivel alcanzado"
                    value={getNivelLabel(selectedLiquidacion.nivel_alcanzado)}
                    strong
                  />
                </SummaryGroup>

                <SummaryGroup title="Comisión">
                  <SummaryRow
                    label="Porcentaje del mes"
                    value={formatPct(selectedLiquidacion.porcentaje_comision)}
                  />

                  <SummaryRow
                    label="Comisión por ventas"
                    value={formatUsd(selectedLiquidacion.comision_calculada_usd)}
                    positive={getNumber(selectedLiquidacion.comision_calculada_usd) > 0}
                  />

                  {detailMetrics.reversiones > 0 ? (
                    <SummaryRow
                      label={`Reversiones ALMUNDO (${detailMetrics.reversiones})`}
                      value={formatUsd(detailMetrics.reversionesComisionUsd)}
                      negative={detailMetrics.reversionesComisionUsd < 0}
                    />
                  ) : null}

                  {Math.abs(detailMetrics.otrosAjustesComisionUsd) > 0.0001 ? (
                    <SummaryRow
                      label="Otros ajustes"
                      value={formatUsd(detailMetrics.otrosAjustesComisionUsd)}
                      positive={detailMetrics.otrosAjustesComisionUsd > 0}
                      negative={detailMetrics.otrosAjustesComisionUsd < 0}
                    />
                  ) : null}

                  <SummaryRow
                    label="Ajustes netos"
                    value={formatUsd(selectedLiquidacion.ajuste_comision_usd)}
                    strong
                    positive={getNumber(selectedLiquidacion.ajuste_comision_usd) > 0}
                    negative={getNumber(selectedLiquidacion.ajuste_comision_usd) < 0}
                  />
                </SummaryGroup>
              </div>

              {detailMetrics.reversiones > 0 ? (
                <div className="mt-2 rounded-[14px] border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-red-700">
                    <RotateCcw size={13} />
                    Reversiones ALMUNDO aplicadas
                  </div>

                  <div className="mt-1 text-[10.5px] leading-relaxed text-red-700/90">
                    Esta liquidación contiene {detailMetrics.reversiones}{" "}
                    {detailMetrics.reversiones === 1
                      ? "reversión"
                      : "reversiones"}{" "}
                    de operaciones anteriores. El descuento utiliza el porcentaje
                    de comisión originalmente aplicado a cada carrito.
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3 border-t border-red-200 pt-2">
                    <span className="text-[10px] font-medium text-red-700">
                      Comisión devuelta
                    </span>

                    <strong className="text-[11.5px] text-red-700">
                      {formatUsd(detailMetrics.reversionesComisionUsd)}
                    </strong>
                  </div>
                </div>
              ) : null}

              {detailMetrics.reversiones > 0 ? (
                <div className="mt-2 rounded-[14px] border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-red-700">
                    <RotateCcw size={13} />
                    Reversiones ALMUNDO aplicadas
                  </div>

                  <div className="mt-1 text-[10.5px] leading-relaxed text-red-700/90">
                    Esta liquidación contiene {detailMetrics.reversiones}{" "}
                    {detailMetrics.reversiones === 1
                      ? "reversión"
                      : "reversiones"}{" "}
                    de operaciones anteriores. El descuento utiliza el porcentaje
                    de comisión originalmente aplicado a cada carrito.
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3 border-t border-red-200 pt-2">
                    <span className="text-[10px] font-medium text-red-700">
                      Comisión devuelta
                    </span>

                    <strong className="text-[11.5px] text-red-700">
                      {formatUsd(detailMetrics.reversionesComisionUsd)}
                    </strong>
                  </div>
                </div>
              ) : null}

              <div className="mt-2 rounded-[14px] border border-emerald-200 bg-emerald-50 p-3.5">
                <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  <CircleDollarSign size={12} />
                  Total a pagar
                </div>

                <div className="mt-1.5 text-[23px] font-semibold tracking-tight text-emerald-800">
                  {formatUsd(selectedLiquidacion.comision_final_usd)}
                </div>
              </div>

              <div className="mt-2 rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
                <div className="mb-2 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                  Historial
                </div>

                <div className="grid gap-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />

                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-[#172033]">
                        Calculada
                      </div>

                      <div className="text-[9.5px] text-[#64748b]">
                        {formatDateTime(selectedLiquidacion.calculada_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-500" />

                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-[#172033]">
                        Cerrada
                      </div>

                      <div className="text-[9.5px] text-[#64748b]">
                        {formatDateTime(selectedLiquidacion.cerrada_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />

                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-[#172033]">
                        Pagada
                      </div>

                      <div className="text-[9.5px] text-[#64748b]">
                        {formatDateTime(selectedLiquidacion.pagada_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedLiquidacion.observaciones ? (
                <div className="mt-2 rounded-[12px] border border-black/10 bg-white p-2.5">
                  <div className="text-[9.5px] font-medium uppercase tracking-wide text-[#64748b]">
                    Observaciones
                  </div>

                  <div className="mt-1 whitespace-pre-wrap text-[10.5px] leading-relaxed text-[#334155]">
                    {selectedLiquidacion.observaciones}
                  </div>
                </div>
              ) : null}

              {canManage ? (
                <div className="mt-auto grid gap-2 pt-4">
                  {canRecalculate ? (
                    <button
                      type="button"
                      disabled={saving || !vendedorId}
                      onClick={handleCalculate}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[10px] border border-black/10 bg-white px-3 text-[11px] font-medium text-[#334155] hover:bg-[#f8fafc] disabled:opacity-50"
                    >
                      <RotateCcw size={13} />
                      Recalcular
                    </button>
                  ) : null}

                  {selectedLiquidacion.estado === "CALCULADA" ||
                  selectedLiquidacion.estado === "AJUSTADA" ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        setAction({
                          type: "cerrar",
                          liquidacion: selectedLiquidacion
                        })
                      }
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[10px] bg-[#172033] px-3 text-[11px] font-medium text-white hover:bg-[#27344c] disabled:opacity-50"
                    >
                      <LockKeyhole size={13} />
                      Cerrar liquidación
                    </button>
                  ) : null}

                  {selectedLiquidacion.estado === "CERRADA" ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        setAction({
                          type: "pagar",
                          liquidacion: selectedLiquidacion
                        })
                      }
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[10px] bg-emerald-600 px-3 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} />
                      Registrar pago
                    </button>
                  ) : null}

                  {["BORRADOR", "CALCULADA", "AJUSTADA", "CERRADA"].includes(
                    selectedLiquidacion.estado
                  ) ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        setAction({
                          type: "anular",
                          liquidacion: selectedLiquidacion
                        })
                      }
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[10px] border border-red-200 bg-red-50 px-3 text-[11px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      <Ban size={13} />
                      Anular liquidación
                    </button>
                  ) : null}

                  {selectedLiquidacion.estado === "PAGADA" ? (
                    <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 p-2.5 text-center text-[11px] font-medium text-emerald-700">
                      <CircleDollarSign
                        size={14}
                        className="mr-1 inline-block"
                      />
                      Liquidación pagada
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </aside>
      </section>

      <ActionModal
        action={action}
        saving={saving}
        onClose={() => setAction(null)}
        onConfirm={handleConfirm}
      />
    </>
  );
}

export default LiquidacionesComisionesSection;
