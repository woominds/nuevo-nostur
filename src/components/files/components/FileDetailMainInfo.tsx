import type {
  FileItem
} from "../../../store/filesStore";

import {
  formatMoneyAR
} from "../../../lib/formatters";

import {
  BooleanChip,
  FieldLabel,
  NosturSelect,
  TextInput
} from "./FileFormControls";

import {
  NosturDateInput
} from "../../ui/NosturDateInput";

import {
  FILE_MONEDA_OPTIONS,
  formatDateAR,
  parseMoney,
  type SelectOption
} from "../filesModel";

export type FileDetailDraft = {
  operador_id: string;
  operador: string;

  servicio: string;
  destino: string;

  fecha_in: string;
  fecha_out: string;
  solo_ida: boolean;

  importe_bruto: string;
  importe_final: string;
  moneda: string;
  neto_operador: string;

  estado: string;
  observaciones: string;

  riesgo: boolean;
  importe_riesgo: string;
  riesgo_motivo: string;

  fecha_vencimiento_operador:
    string;

  saldo_pendiente_operador:
    string;

  estado_pago_operador:
    string;
};

type FileDetailMainInfoProps = {
  file: FileItem;

  editing: boolean;

  draft: FileDetailDraft;

  operadorOptions:
    SelectOption[];

  servicioOptions:
    SelectOption[];

  estadoOptions:
    SelectOption[];

  estadoPagoOperadorOptions:
    SelectOption[];

  onFieldChange: <
    K extends keyof FileDetailDraft
  >(
    key: K,
    value: FileDetailDraft[K]
  ) => void;
};

export function FileDetailMainInfo({
  file,
  editing,
  draft,
  operadorOptions,
  servicioOptions,
  estadoOptions,
  estadoPagoOperadorOptions,
  onFieldChange
}: FileDetailMainInfoProps) {
  const final = parseMoney(
    draft.importe_final
  );

  return (
    <>
      <div className="grid gap-2.5 md:grid-cols-3">
        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
          <FieldLabel>
            Cliente
          </FieldLabel>

          <div className="text-[13px] font-semibold text-[#172033]">
            {file.clientes
              ?.nombre_completo ||
              "—"}
          </div>

          <div className="text-[12px] font-normal text-[#64748b]">
            {file.clientes
              ?.telefono ||
              "—"}
          </div>
        </div>

        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
          <FieldLabel>
            Viaje
          </FieldLabel>

          {editing ? (
            <TextInput
              value={
                draft.destino
              }
              onChange={(value) =>
                onFieldChange(
                  "destino",
                  value
                )
              }
              placeholder="Destino"
            />
          ) : (
            <>
              <div className="text-[13px] font-semibold text-[#172033]">
                {draft.destino ||
                  "—"}
              </div>

              <div className="text-[12px] font-normal text-[#64748b]">
                {formatDateAR(
                  draft.fecha_in
                )}{" "}
                →{" "}
                {draft.solo_ida
                  ? "Solo ida"
                  : formatDateAR(
                      draft.fecha_out
                    )}
              </div>
            </>
          )}
        </div>

        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
          <FieldLabel>
            Total
          </FieldLabel>

          {editing ? (
            <div className="grid grid-cols-[1fr_92px] gap-2">
              <TextInput
                value={
                  draft.importe_final
                }
                onChange={(value) =>
                  onFieldChange(
                    "importe_final",
                    value
                  )
                }
                placeholder="0,00"
                inputMode="decimal"
              />

              <NosturSelect
                value={
                  draft.moneda
                }
                onChange={(value) =>
                  onFieldChange(
                    "moneda",
                    value
                  )
                }
                options={
                  FILE_MONEDA_OPTIONS
                }
              />
            </div>
          ) : (
            <>
              <div className="text-[13px] font-semibold text-[#172033]">
                {formatMoneyAR(
                  final,
                  draft.moneda
                )}
              </div>

              <div className="text-[12px] font-normal text-[#64748b]">
                {draft.estado}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 md:grid-cols-2">
        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3 text-[12px] font-normal text-[#475569]">
          {editing ? (
            <div className="grid gap-3">
              <div>
                <FieldLabel>
                  Servicio
                </FieldLabel>

                <NosturSelect
                  value={
                    draft.servicio
                  }
                  onChange={(value) =>
                    onFieldChange(
                      "servicio",
                      value
                    )
                  }
                  options={
                    servicioOptions
                  }
                  placeholder="Seleccionar servicio"
                />
              </div>

              <div>
                <FieldLabel>
                  Operador
                </FieldLabel>

                <NosturSelect
                  value={
                    draft.operador_id
                  }
                  onChange={(value) => {
                    const selected =
                      operadorOptions.find(
                        (option) =>
                          option.value ===
                          value
                      );

                    onFieldChange(
                      "operador_id",
                      value
                    );

                    onFieldChange(
                      "operador",
                      selected?.label ||
                        ""
                    );
                  }}
                  options={
                    operadorOptions
                  }
                  placeholder="Seleccionar operador"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>
                    Fecha IN
                  </FieldLabel>

                  <NosturDateInput
                    value={
                      draft.fecha_in
                    }
                    onChange={(value) => {
                      onFieldChange(
                        "fecha_in",
                        value
                      );

                      if (
                        draft.fecha_out &&
                        value &&
                        draft.fecha_out <
                          value
                      ) {
                        onFieldChange(
                          "fecha_out",
                          value
                        );
                      }
                    }}
                  />
                </div>

                <div>
                  <FieldLabel>
                    Fecha OUT
                  </FieldLabel>

                  {draft.solo_ida ? (
                    <div className="flex h-8 items-center rounded-[10px] border border-black/10 bg-white px-3 text-[12px] text-[#94a3b8]">
                      Solo ida
                    </div>
                  ) : (
                    <NosturDateInput
                      value={
                        draft.fecha_out
                      }
                      onChange={(value) =>
                        onFieldChange(
                          "fecha_out",
                          value
                        )
                      }
                      min={
                        draft.fecha_in ||
                        undefined
                      }
                    />
                  )}
                </div>
              </div>

              <BooleanChip
                checked={
                  draft.solo_ida
                }
                onChange={(value) => {
                  onFieldChange(
                    "solo_ida",
                    value
                  );

                  if (value) {
                    onFieldChange(
                      "fecha_out",
                      ""
                    );
                  }
                }}
                label="Solo ida"
              />

              <div>
                <FieldLabel>
                  Estado file
                </FieldLabel>

                <NosturSelect
                  value={
                    draft.estado
                  }
                  onChange={(value) =>
                    onFieldChange(
                      "estado",
                      value
                    )
                  }
                  options={
                    estadoOptions
                  }
                />
              </div>
            </div>
          ) : (
            <>
              <div className="mb-1.5">
                Servicio:{" "}
                <strong className="font-semibold">
                  {file.servicio ||
                    "—"}
                </strong>
              </div>

              <div className="mb-1.5">
                Método contacto:{" "}
                <strong className="font-semibold">
                  {file.metodo_contacto ||
                    "—"}
                </strong>
              </div>

              <div className="mb-1.5">
                Operador:{" "}
                <strong className="font-semibold">
                  {file.operador ||
                    "—"}
                </strong>
              </div>

              <div className="mb-1.5">
                Vendedor:{" "}
                <strong className="font-semibold">
                  {file.vendedor ||
                    "—"}
                </strong>
              </div>

              <div>
                Riesgo:{" "}
                <strong className="font-semibold">
                  {file.riesgo
                    ? "SÍ"
                    : "NO"}
                </strong>
              </div>
            </>
          )}
        </div>

        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3 text-[12px] font-normal text-[#475569]">
          {editing ? (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>
                    Bruto
                  </FieldLabel>

                  <TextInput
                    value={
                      draft.importe_bruto
                    }
                    onChange={(value) =>
                      onFieldChange(
                        "importe_bruto",
                        value
                      )
                    }
                    placeholder="0,00"
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Neto operador
                  </FieldLabel>

                  <TextInput
                    value={
                      draft.neto_operador
                    }
                    onChange={(value) => {
                      onFieldChange(
                        "neto_operador",
                        value
                      );

                      if (
                        !draft
                          .saldo_pendiente_operador ||
                        parseMoney(
                          draft
                            .saldo_pendiente_operador
                        ) === 0
                      ) {
                        onFieldChange(
                          "saldo_pendiente_operador",
                          value
                        );
                      }
                    }}
                    placeholder="0,00"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>
                    Vencimiento operador
                  </FieldLabel>

                  <NosturDateInput
                    value={
                      draft
                        .fecha_vencimiento_operador
                    }
                    onChange={(value) =>
                      onFieldChange(
                        "fecha_vencimiento_operador",
                        value
                      )
                    }
                  />
                </div>

                <div>
                  <FieldLabel>
                    Saldo operador
                  </FieldLabel>

                  <TextInput
                    value={
                      draft
                        .saldo_pendiente_operador
                    }
                    onChange={(value) =>
                      onFieldChange(
                        "saldo_pendiente_operador",
                        value
                      )
                    }
                    placeholder="0,00"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>
                  Estado pago operador
                </FieldLabel>

                <NosturSelect
                  value={
                    draft
                      .estado_pago_operador
                  }
                  onChange={(value) =>
                    onFieldChange(
                      "estado_pago_operador",
                      value
                    )
                  }
                  options={
                    estadoPagoOperadorOptions
                  }
                />
              </div>

              <BooleanChip
                checked={
                  draft.riesgo
                }
                onChange={(value) => {
                  onFieldChange(
                    "riesgo",
                    value
                  );

                  if (!value) {
                    onFieldChange(
                      "importe_riesgo",
                      ""
                    );

                    onFieldChange(
                      "riesgo_motivo",
                      ""
                    );
                  }
                }}
                label="Riesgo operador"
              />

              {draft.riesgo ? (
                <div className="grid grid-cols-[160px_1fr] gap-2">
                  <div>
                    <FieldLabel>
                      Importe riesgo
                    </FieldLabel>

                    <TextInput
                      value={
                        draft
                          .importe_riesgo
                      }
                      onChange={(value) =>
                        onFieldChange(
                          "importe_riesgo",
                          value
                        )
                      }
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Motivo riesgo
                    </FieldLabel>

                    <TextInput
                      value={
                        draft
                          .riesgo_motivo
                      }
                      onChange={(value) =>
                        onFieldChange(
                          "riesgo_motivo",
                          value
                        )
                      }
                      placeholder="Motivo"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <div className="mb-1.5">
                Bruto:{" "}
                <strong className="font-semibold">
                  {formatMoneyAR(
                    file.importe_bruto,
                    file.moneda
                  )}
                </strong>
              </div>

              <div className="mb-1.5">
                Neto operador:{" "}
                <strong className="font-semibold">
                  {formatMoneyAR(
                    file.neto_operador,
                    file.moneda
                  )}
                </strong>
              </div>

              <div className="mb-1.5">
                Pagado:{" "}
                <strong className="font-semibold">
                  {formatMoneyAR(
                    file.total_pagado,
                    file.moneda
                  )}
                </strong>
              </div>

              <div className="mb-1.5">
                Saldo pasajero:{" "}
                <strong className="font-semibold">
                  {formatMoneyAR(
                    file.saldo_cta_cte,
                    file.moneda
                  )}
                </strong>
              </div>

              <div className="mb-1.5">
                Saldo operador:{" "}
                <strong className="font-semibold">
                  {formatMoneyAR(
                    file
                      .saldo_pendiente_operador ||
                      0,
                    file.moneda
                  )}
                </strong>
              </div>

              <div>
                Estado operador:{" "}
                <strong className="font-semibold">
                  {file
                    .estado_pago_operador ||
                    "—"}
                </strong>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
