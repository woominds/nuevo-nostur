import type {
  FileItem
} from "../../../store/filesStore";

import {
  formatMoneyAR
} from "../../../lib/formatters";

import {
  FieldLabel,
  TextArea
} from "./FileFormControls";

import {
  parseMoney
} from "../filesModel";

import type {
  FileDetailDraft
} from "./FileDetailMainInfo";

type FileDetailFinancialSummaryProps = {
  file: FileItem;
  editing: boolean;
  draft: FileDetailDraft;

  onFieldChange: <
    K extends keyof FileDetailDraft
  >(
    key: K,
    value: FileDetailDraft[K]
  ) => void;
};

export function FileDetailFinancialSummary({
  file,
  editing,
  draft,
  onFieldChange
}: FileDetailFinancialSummaryProps) {
  const final = parseMoney(
    draft.importe_final
  );

  const neto = parseMoney(
    draft.neto_operador
  );

  const margen =
    final - neto;

  return (
    <>
      <div className="mt-3 rounded-[14px] border border-black/10 bg-white p-3 text-[12px]">
        <div className="flex justify-between gap-3">
          <span className="text-[#64748b]">
            Importe final
          </span>

          <strong className="font-semibold">
            {formatMoneyAR(
              final,
              draft.moneda
            )}
          </strong>
        </div>

        <div className="flex justify-between gap-3">
          <span className="text-[#64748b]">
            Neto operador
          </span>

          <strong className="font-semibold">
            {formatMoneyAR(
              neto,
              draft.moneda
            )}
          </strong>
        </div>

        <div className="mt-2 flex justify-between gap-3 border-t border-black/10 pt-2">
          <span className="font-semibold text-[#172033]">
            Margen estimado
          </span>

          <strong
            className={
              margen >= 0
                ? "font-semibold text-emerald-700"
                : "font-semibold text-red-700"
            }
          >
            {formatMoneyAR(
              margen,
              draft.moneda
            )}
          </strong>
        </div>
      </div>

      {editing ? (
        <div className="mt-3">
          <FieldLabel>
            Observaciones
          </FieldLabel>

          <TextArea
            value={
              draft.observaciones
            }
            onChange={(value) =>
              onFieldChange(
                "observaciones",
                value
              )
            }
            placeholder="Notas internas del file..."
          />
        </div>
      ) : file.observaciones ? (
        <div className="mt-3 rounded-[14px] border border-black/10 bg-[#f8fafc] p-3 text-[12px] font-normal text-[#475569]">
          <strong className="font-semibold">
            Observaciones:
          </strong>{" "}
          {file.observaciones}
        </div>
      ) : null}

      {file.riesgo &&
      !editing ? (
        <div className="mt-3 rounded-[14px] border border-red-200 bg-red-50 p-3 text-[12px] font-medium text-red-700">
          <strong>
            Motivo riesgo:
          </strong>{" "}
          {file.riesgo_motivo ||
            "Sin motivo cargado"}
        </div>
      ) : null}
    </>
  );
}
