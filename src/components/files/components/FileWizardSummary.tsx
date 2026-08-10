import { formatMoneyAR } from "../../../lib/formatters";

import type {
  FileWizardDraft,
} from "../filesModel";

type FileWizardSummaryProps = {
  draft: FileWizardDraft;
  venta: number;
  netoOperador: number;
  utilidad: number;
  totalComercial: number;
  totalTesoreria: number;
  saldo: number;
};

export function FileWizardSummary({
  draft,
  venta,
  netoOperador,
  utilidad,
  totalComercial,
  totalTesoreria,
  saldo,
}: FileWizardSummaryProps) {
  return (
    <aside className="rounded-[18px] border border-black/10 bg-[#f8fafc] p-4">
      <h3 className="mb-4 text-[14px] font-semibold text-[#172033]">
        Resumen del File
      </h3>

      <div className="space-y-4 text-[12px]">

        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
            Cliente
          </div>

          <div className="truncate font-semibold text-[#172033]">
            {draft.cliente.nombre_completo || "Sin cliente"}
          </div>

          <div className="truncate text-slate-500">
            {draft.cliente.telefono || "—"}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
            File
          </div>

          <div className="font-semibold text-[#172033]">
            {draft.venta.numero_file || "—"}
          </div>

          <div className="truncate text-slate-500">
            {draft.venta.operador || "Sin operador"}
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-3">

          <div className="flex items-center justify-between">
            <span className="text-slate-500">
              Venta
            </span>

            <strong>
              {formatMoneyAR(
                venta,
                draft.venta.moneda
              )}
            </strong>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-slate-500">
              Neto operador
            </span>

            <strong>
              {formatMoneyAR(
                netoOperador,
                draft.venta.moneda
              )}
            </strong>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-2">
            <span className="font-medium">
              Utilidad
            </span>

            <strong className="text-emerald-700">
              {formatMoneyAR(
                utilidad,
                draft.venta.moneda
              )}
            </strong>
          </div>

        </div>

        <div className="rounded-xl border border-black/10 bg-white p-3">

          <div className="flex items-center justify-between">
            <span className="text-slate-500">
              Comercial
            </span>

            <strong>
              {formatMoneyAR(
                totalComercial,
                draft.venta.moneda
              )}
            </strong>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-slate-500">
              Tesorería
            </span>

            <strong>
              {formatMoneyAR(
                totalTesoreria,
                draft.venta.moneda
              )}
            </strong>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-2">
            <span>
              Saldo pasajero
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

        <div
          className={[
            "rounded-xl border p-3 text-center text-[11px] font-semibold",

            saldo > 0
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          ].join(" ")}
        >
          {saldo > 0
            ? "Se enviará a Cuenta Corriente"
            : "Quedará visible en Files"}
        </div>

        {draft.voucher.requiere_voucher ? (
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-center text-[11px] font-semibold text-sky-700">
            Voucher requerido
          </div>
        ) : null}

      </div>
    </aside>
  );
}
