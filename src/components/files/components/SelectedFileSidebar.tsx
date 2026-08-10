import {
  UserRound
} from "lucide-react";

import type {
  FileItem
} from "../../../store/filesStore";

import {
  formatMoneyAR
} from "../../../lib/formatters";

import {
  formatDateAR,
  parseMoney
} from "../filesModel";

type SelectedFileSidebarProps = {
  file: FileItem | null;
  saving: boolean;
  hasVoucher: boolean;

  onView: (
    file: FileItem
  ) => void;

  onPrintVoucher: () => void;

  onToggle: (
    file: FileItem
  ) => void;
};

function getInitials(
  name: string
): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part
        .slice(0, 1)
        .toUpperCase()
    )
    .join("");
}

export function SelectedFileSidebar({
  file,
  saving,
  hasVoucher,
  onView,
  onPrintVoucher,
  onToggle
}: SelectedFileSidebarProps) {
  return (
    <aside className="min-w-0 rounded-[16px] border border-black/10 bg-white/68 p-3 shadow-sm backdrop-blur-xl">
      {file ? (
        <>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#4f7c90] text-[12px] font-semibold text-white">
                {getInitials(
                  file.clientes
                    ?.nombre_completo ||
                    "C"
                )}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-[13.5px] font-semibold text-[#172033]">
                  {file.numero_file}
                </h2>

                <p className="truncate text-[11.5px] font-normal text-[#64748b]">
                  {file.clientes
                    ?.nombre_completo ||
                    "Sin cliente"}
                </p>
              </div>
            </div>

            {file.riesgo ? (
              <span className="rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                Riesgo
              </span>
            ) : null}
          </div>

          <div className="grid gap-2.5 text-[12px]">
            <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <UserRound
                  size={14}
                  className="text-[#4f7c90]"
                />

                <span className="truncate font-semibold text-[#172033]">
                  {file.clientes
                    ?.nombre_completo ||
                    "Sin cliente"}
                </span>
              </div>

              <div className="font-normal text-[#64748b]">
                {file.clientes
                  ?.telefono ||
                  "—"}
              </div>

              <div className="font-normal text-[#64748b]">
                {file.clientes
                  ?.email ||
                  "Sin email"}
              </div>
            </div>

            <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
              <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#64748b]">
                Viaje
              </div>

              <div className="font-semibold text-[#172033]">
                {file.destino ||
                  "Sin destino"}
              </div>

              <div className="font-normal text-[#64748b]">
                {formatDateAR(
                  file.fecha_in
                )}{" "}
                →{" "}
                {file.solo_ida
                  ? "Solo ida"
                  : formatDateAR(
                      file.fecha_out
                    )}
              </div>
            </div>

            <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
              <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#64748b]">
                Operador
              </div>

              <div className="font-semibold text-[#172033]">
                {file.operador ||
                  "Sin operador"}
              </div>

              <div className="font-normal text-[#64748b]">
                {file.servicio ||
                  "Sin servicio"}
              </div>
            </div>

            <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
              <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#64748b]">
                Importes
              </div>

              <div className="flex justify-between">
                <span>
                  Bruto
                </span>

                <strong className="font-semibold">
                  {formatMoneyAR(
                    file.importe_bruto,
                    file.moneda
                  )}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>
                  Neto operador
                </span>

                <strong className="font-semibold">
                  {formatMoneyAR(
                    file.neto_operador,
                    file.moneda
                  )}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>
                  Final
                </span>

                <strong className="font-semibold">
                  {formatMoneyAR(
                    file.importe_final,
                    file.moneda
                  )}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>
                  Margen
                </span>

                <strong className="font-semibold">
                  {formatMoneyAR(
                    parseMoney(
                      file.importe_final
                    ) -
                      parseMoney(
                        file.neto_operador
                      ),
                    file.moneda
                  )}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  onView(file)
                }
                className="h-8 rounded-[10px] border border-black/10 bg-white text-[12px] font-medium text-[#334155] hover:bg-[#f8fafc]"
              >
                Ver / editar
              </button>

              <button
                type="button"
                onClick={() =>
                  onView(file)
                }
                className="h-8 rounded-[10px] border border-black/10 bg-white text-[12px] font-medium text-[#334155] hover:bg-[#f8fafc]"
              >
                Operador
              </button>

              {hasVoucher ? (
                <button
                  type="button"
                  onClick={
                    onPrintVoucher
                  }
                  className="col-span-2 h-8 rounded-[10px] bg-[#4f7c90] text-[12px] font-medium text-white shadow-sm hover:bg-[#406b7d]"
                >
                  Generar voucher PDF
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onView(file)
                  }
                  className="col-span-2 h-8 rounded-[10px] border border-[#4f7c90]/30 bg-[#eef6f7] text-[12px] font-medium text-[#172033] hover:bg-white"
                >
                  Ver / generar voucher
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  onToggle(file)
                }
                disabled={saving}
                className="col-span-2 h-8 rounded-[10px] border border-red-200 bg-red-50 text-[12px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                {file.activo
                  ? "Desactivar"
                  : "Activar"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-5 text-center text-[12px] font-normal text-[#64748b]">
          Seleccioná un file para ver el detalle.
        </div>
      )}
    </aside>
  );
}
