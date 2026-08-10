import { formatMoneyAR } from "../../../lib/formatters";
import {
  BooleanChip,
  FieldLabel
} from "../components";
import {
  formatDateAR,
  type WizardDraft
} from "../carritosModel";

type WizardConfirmacionProps = {
  draft: WizardDraft;
  bruto: number;
  promocode: number;
  totalFinal: number;
  totalComercial: number;
  totalTesoreria: number;
  saldo: number;
  importeRiesgo: number;
  visibleEnCarritos: boolean;
  onConfirmadoChange: (
    value: boolean
  ) => void;
};

export function WizardConfirmacion({
  draft,
  bruto,
  promocode,
  totalFinal,
  totalComercial,
  totalTesoreria,
  saldo,
  importeRiesgo,
  visibleEnCarritos,
  onConfirmadoChange
}: WizardConfirmacionProps) {
  return (
    <section>
      <h3 className="mb-3 text-[14px] font-semibold text-[#172033]">
        Paso 5 · Confirmación final
      </h3>

      <div className="grid gap-3 text-[12px] md:grid-cols-2">
        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
          <FieldLabel>Cliente</FieldLabel>

          <div className="font-semibold text-[#172033]">
            {draft.cliente.nombre_completo}
          </div>

          <div className="font-normal text-[#64748b]">
            {draft.cliente.telefono}
          </div>

          <div className="font-normal text-[#64748b]">
            {draft.cliente.email || "Sin email"}
          </div>
        </div>

        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
          <FieldLabel>Venta Ábaco</FieldLabel>

          <div className="font-semibold text-[#172033]">
            {draft.venta.numero_carrito}
          </div>

          <div className="font-normal text-[#64748b]">
            {draft.venta.servicio} ·{" "}
            {draft.venta.destinos.join(", ")}
          </div>

          <div className="font-normal text-[#64748b]">
            {formatDateAR(
              draft.venta.fecha_in
            )}{" "}
            →{" "}
            {draft.venta.solo_ida
              ? "Solo ida"
              : formatDateAR(
                  draft.venta.fecha_out
                )}
          </div>
        </div>

        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
          <FieldLabel>Importes</FieldLabel>

          <div className="flex justify-between">
            <span>Bruto</span>

            <strong className="font-semibold">
              {formatMoneyAR(
                bruto,
                draft.venta.moneda
              )}
            </strong>
          </div>

          <div className="flex justify-between">
            <span>Promo</span>

            <strong className="font-semibold">
              {formatMoneyAR(
                promocode,
                draft.venta.moneda
              )}
            </strong>
          </div>

          <div className="flex justify-between">
            <span>Final</span>

            <strong className="font-semibold">
              {formatMoneyAR(
                totalFinal,
                draft.venta.moneda
              )}
            </strong>
          </div>
        </div>

        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
          <FieldLabel>Resultado</FieldLabel>

          <div className="flex justify-between">
            <span>Comercial</span>

            <strong className="font-semibold">
              {formatMoneyAR(
                totalComercial,
                draft.venta.moneda
              )}
            </strong>
          </div>

          <div className="flex justify-between">
            <span>Tesorería</span>

            <strong className="font-semibold">
              {formatMoneyAR(
                totalTesoreria,
                draft.venta.moneda
              )}
            </strong>
          </div>

          <div className="flex justify-between">
            <span>Saldo Cta Cte</span>

            <strong className="font-semibold">
              {formatMoneyAR(
                saldo,
                draft.venta.moneda
              )}
            </strong>
          </div>

          <div className="mt-2 font-semibold text-[#172033]">
            Queda en Carritos:{" "}
            {visibleEnCarritos
              ? "SÍ"
              : "NO · Va a Cta Cte"}
          </div>

          {draft.pagoParcial ? (
            <div className="font-semibold text-amber-700">
              Ingreso a gastos:{" "}
              {formatDateAR(
                draft.fechaIngresoGastos
              )}
            </div>
          ) : null}

          <div className="font-semibold text-[#172033]">
            Riesgo Almundo:{" "}
            {draft.riesgo ? "SÍ" : "NO"}
          </div>

          {draft.riesgo ? (
            <div className="font-semibold text-red-700">
              Importe riesgo:{" "}
              {formatMoneyAR(
                importeRiesgo,
                draft.venta.moneda
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <BooleanChip
          checked={draft.confirmado}
          onChange={onConfirmadoChange}
          label="Confirmo que los datos son correctos"
        />
      </div>
    </section>
  );
}
