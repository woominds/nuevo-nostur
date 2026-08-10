import {
  formatMoneyAR
} from "../../../lib/formatters";

import {
  BooleanChip,
  FieldLabel
} from "./FileFormControls";

import {
  formatDateAR,
  type FileWizardDraft
} from "../filesModel";

type FileWizardConfirmacionProps = {
  draft: FileWizardDraft;
  venta: number;
  netoOperador: number;
  utilidad: number;
  totalPagosComerciales: number;
  totalTesoreria: number;
  saldo: number;
  visibleEnFiles: boolean;

  onConfirmado: (
    value: boolean
  ) => void;
};

export function FileWizardConfirmacion({
  draft,
  venta,
  netoOperador,
  utilidad,
  totalPagosComerciales,
  totalTesoreria,
  saldo,
  visibleEnFiles,
  onConfirmado
}: FileWizardConfirmacionProps) {
  return (
    <section>
      <h3 className="mb-4 text-[14px] font-semibold text-[#172033]">
        Paso 4 · Confirmación
      </h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
          <FieldLabel>
            Cliente
          </FieldLabel>

          <div className="font-semibold text-[#172033]">
            {draft.cliente.nombre_completo ||
              "Sin cliente"}
          </div>

          <div className="text-slate-500">
            {draft.cliente.telefono ||
              "Sin teléfono"}
          </div>

          <div className="text-slate-500">
            {draft.cliente.email ||
              "Sin email"}
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
          <FieldLabel>
            File
          </FieldLabel>

          <div className="font-semibold text-[#172033]">
            {draft.venta.numero_file ||
              "Sin número"}
          </div>

          <div className="text-slate-500">
            {draft.venta.operador ||
              "Sin operador"}
          </div>

          <div className="text-slate-500">
            {draft.venta.servicio ||
              "Sin servicio"}
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
          <FieldLabel>
            Viaje
          </FieldLabel>

          <div className="font-semibold text-[#172033]">
            {draft.venta.destinos.length >
            0
              ? draft.venta.destinos.join(
                  ", "
                )
              : "Sin destinos"}
          </div>

          <div className="mt-1 text-slate-500">
            IN{" "}
            {formatDateAR(
              draft.venta.fecha_in
            )}
          </div>

          <div className="text-slate-500">
            OUT{" "}
            {draft.venta.solo_ida
              ? "Solo ida"
              : formatDateAR(
                  draft.venta.fecha_out
                )}
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
          <FieldLabel>
            Operador
          </FieldLabel>

          <div className="flex justify-between gap-3">
            <span>
              Venta
            </span>

            <strong>
              {formatMoneyAR(
                venta,
                draft.venta.moneda
              )}
            </strong>
          </div>

          <div className="flex justify-between gap-3">
            <span>
              Neto
            </span>

            <strong>
              {formatMoneyAR(
                netoOperador,
                draft.venta.moneda
              )}
            </strong>
          </div>

          <div className="mt-2 flex justify-between gap-3 border-t border-black/10 pt-2">
            <span>
              Utilidad
            </span>

            <strong
              className={
                utilidad >= 0
                  ? "text-emerald-700"
                  : "text-red-600"
              }
            >
              {formatMoneyAR(
                utilidad,
                draft.venta.moneda
              )}
            </strong>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
          <FieldLabel>
            Cobranza
          </FieldLabel>

          <div className="flex justify-between gap-3">
            <span>
              Comercial
            </span>

            <strong>
              {formatMoneyAR(
                totalPagosComerciales,
                draft.venta.moneda
              )}
            </strong>
          </div>

          <div className="flex justify-between gap-3">
            <span>
              Recibido
            </span>

            <strong>
              {formatMoneyAR(
                totalTesoreria,
                draft.venta.moneda
              )}
            </strong>
          </div>

          <div className="mt-2 flex justify-between gap-3 border-t border-black/10 pt-2">
            <span>
              Saldo
            </span>

            <strong
              className={
                saldo > 0
                  ? "text-red-600"
                  : "text-emerald-700"
              }
            >
              {formatMoneyAR(
                saldo,
                draft.venta.moneda
              )}
            </strong>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
          <FieldLabel>
            Resultado
          </FieldLabel>

          <div>
            Queda en Files:{" "}
            <strong>
              {visibleEnFiles
                ? "SÍ"
                : "NO · Va a Cta Cte"}
            </strong>
          </div>

          {draft.pagoParcial ? (
            <div className="mt-2">
              Ingreso a gastos:{" "}
              <strong>
                {formatDateAR(
                  draft.fechaIngresoGastos
                )}
              </strong>
            </div>
          ) : null}

          {draft.usaMarkupAdicional ? (
            <div className="mt-2">
              Markup adicional:{" "}
              <strong>
                {draft.markupAdicionalPct ||
                  "0"}
                %
              </strong>
            </div>
          ) : null}

          <div className="mt-2">
            Voucher:{" "}
            <strong>
              {draft.voucher
                .requiere_voucher
                ? "SÍ"
                : "NO"}
            </strong>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <BooleanChip
          checked={draft.confirmado}
          onChange={onConfirmado}
          label="Confirmo que todos los datos son correctos"
        />
      </div>
    </section>
  );
}
