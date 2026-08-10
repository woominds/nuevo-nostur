import {
  Trash2
} from "lucide-react";

import {
  BooleanChip,
  FieldLabel,
  LineButton,
  MoneyInput,
  NosturSelect,
  TextInput
} from "./FileFormControls";

import {
  formatMoneyAR
} from "../../../lib/formatters";

import type {
  MovimientoTesoreria,
  PagoComercial
} from "../../../store/filesStore";

import type {
  FileWizardDraft,
  SelectOption
} from "../filesModel";

function parseInputMoney(
  value:
    | string
    | number
    | null
    | undefined
): number {
  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  const normalized = String(
    value || ""
  )
    .trim()
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const parsed = Number(
    normalized
  );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function normalizeCurrency(
  value: string | null | undefined
): string {
  return String(value || "ARS")
    .trim()
    .toUpperCase();
}

function calculateEquivalent(
  importe: number,
  monedaMovimiento: string,
  monedaVenta: string,
  tipoCambio: number
): number {
  const movementCurrency =
    normalizeCurrency(
      monedaMovimiento
    );

  const saleCurrency =
    normalizeCurrency(
      monedaVenta
    );

  if (importe <= 0) {
    return 0;
  }

  if (
    movementCurrency ===
    saleCurrency
  ) {
    return importe;
  }

  if (tipoCambio <= 0) {
    return 0;
  }

  if (
    saleCurrency === "USD" &&
    movementCurrency === "ARS"
  ) {
    return importe / tipoCambio;
  }

  if (
    saleCurrency === "ARS" &&
    movementCurrency === "USD"
  ) {
    return importe * tipoCambio;
  }

  return importe;
}

function getConversionDetail(
  movement: MovimientoTesoreria,
  monedaVenta: string
): {
  message: string;
  missingRate: boolean;
} | null {
  const importe = parseInputMoney(
    movement.importe
  );

  const tipoCambio =
    parseInputMoney(
      movement.tipo_cambio
    );

  const movementCurrency =
    normalizeCurrency(
      movement.moneda
    );

  const saleCurrency =
    normalizeCurrency(
      monedaVenta
    );

  if (
    importe <= 0 ||
    movementCurrency ===
      saleCurrency
  ) {
    return null;
  }

  if (tipoCambio <= 0) {
    return {
      message:
        `Ingresá el tipo de cambio para convertir ${movementCurrency} a ${saleCurrency}.`,
      missingRate: true
    };
  }

  const equivalente =
    calculateEquivalent(
      importe,
      movementCurrency,
      saleCurrency,
      tipoCambio
    );

  const operator =
    saleCurrency === "USD" &&
    movementCurrency === "ARS"
      ? "÷"
      : "×";

  return {
    message:
      `${formatMoneyAR(
        importe,
        movementCurrency
      )} ${operator} TC ${formatMoneyAR(
        tipoCambio
      )} = ${formatMoneyAR(
        equivalente,
        saleCurrency
      )} aplicados a la venta`,
    missingRate: false
  };
}

type FileWizardPagosProps = {
  draft: FileWizardDraft;
  venta: number;
  totalPagosComerciales: number;
  totalTesoreria: number;
  saldo: number;
  formaPagoOptions: SelectOption[];
  cajaOptions: SelectOption[];

  onUpdatePago: (
    index: number,
    patch: Partial<PagoComercial>
  ) => void;

  onSelectFormaPagoComercial: (
    index: number,
    formaPagoId: string
  ) => void;

  onAddPago: () => void;

  onRemovePago: (
    index: number
  ) => void;

  onSetPagoDiferenteOficina: (
    value: boolean
  ) => void;

  onUpdateMovimiento: (
    index: number,
    patch: Partial<MovimientoTesoreria>
  ) => void;

  onSelectCaja: (
    index: number,
    cajaId: string
  ) => void;

  onSelectFormaPagoReal: (
    index: number,
    formaPagoId: string
  ) => void;

  onAddMovimiento: () => void;

  onRemoveMovimiento: (
    index: number
  ) => void;

  onPagoParcial: (
    value: boolean
  ) => void;

  onFechaIngresoGastos: (
    value: string
  ) => void;

  onMarkup: (
    value: boolean
  ) => void;

  onMarkupPct: (
    value: string
  ) => void;
};

export function FileWizardPagos({
  draft,
  venta,
  totalPagosComerciales,
  totalTesoreria,
  saldo,
  formaPagoOptions,
  cajaOptions,
  onUpdatePago,
  onSelectFormaPagoComercial,
  onAddPago,
  onRemovePago,
  onSetPagoDiferenteOficina,
  onUpdateMovimiento,
  onSelectCaja,
  onSelectFormaPagoReal,
  onAddMovimiento,
  onRemoveMovimiento,
  onPagoParcial,
  onFechaIngresoGastos,
  onMarkup,
  onMarkupPct
}: FileWizardPagosProps) {
  return (
    <section>
      <h3 className="mb-3 text-[14px] font-semibold text-[#172033]">
        Paso 3 · Pagos
      </h3>

      <div className="rounded-xl border border-black/10 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-[12px] font-semibold text-[#172033]">
              Pagos comerciales
            </h4>

            <p className="mt-0.5 text-[10.5px] text-[#64748b]">
              Formas de pago informadas comercialmente.
            </p>
          </div>

          <LineButton
            onClick={onAddPago}
          >
            Agregar pago
          </LineButton>
        </div>

        <div className="space-y-3">
          {draft.pagosComerciales.map(
            (
              pago,
              index
            ) => (
              <div
                key={`pago-comercial-${index}`}
                className="grid gap-3 rounded-xl border border-black/10 bg-[#f8fafc] p-3 md:grid-cols-[1.2fr_1fr_100px_auto]"
              >
                <div>
                  <FieldLabel>
                    Forma de pago
                  </FieldLabel>

                  <NosturSelect
                    value={
                      pago.forma_pago_id ||
                      ""
                    }
                    options={
                      formaPagoOptions
                    }
                    onChange={(value) =>
                      onSelectFormaPagoComercial(
                        index,
                        value
                      )
                    }
                    placeholder="Seleccionar forma"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Importe
                  </FieldLabel>

                  <MoneyInput
                    value={
                      pago.importe
                        ? String(
                            pago.importe
                          ).replace(
                            ".",
                            ","
                          )
                        : ""
                    }
                    onChange={(value) =>
                      onUpdatePago(
                        index,
                        {
                          importe:
                            Number(
                              value
                                .replace(
                                  /\./g,
                                  ""
                                )
                                .replace(
                                  ",",
                                  "."
                                )
                            ) || 0
                        }
                      )
                    }
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Moneda
                  </FieldLabel>

                  <NosturSelect
                    value={
                      pago.moneda ||
                      draft.venta.moneda
                    }
                    options={[
                      {
                        value: "ARS",
                        label: "ARS"
                      },
                      {
                        value: "USD",
                        label: "USD"
                      }
                    ]}
                    onChange={(value) =>
                      onUpdatePago(
                        index,
                        {
                          moneda: value
                        }
                      )
                    }
                  />
                </div>

                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      onRemovePago(
                        index
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    aria-label="Eliminar pago comercial"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-black/10 p-4">
        <BooleanChip
          checked={
            draft.pagoDiferenteOficina
          }
          onChange={
            onSetPagoDiferenteOficina
          }
          label="El pago recibido fue diferente al informado comercialmente"
        />

        <div className="mb-3 mt-4 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-[12px] font-semibold text-[#172033]">
              Pagos recibidos
            </h4>

            <p className="mt-0.5 text-[10.5px] text-[#64748b]">
              Caja y forma de pago real recibida por NOSSIX.
            </p>
          </div>

          <LineButton
            onClick={
              onAddMovimiento
            }
          >
            Agregar ingreso
          </LineButton>
        </div>

        <div className="space-y-3">
          {draft.movimientosTesoreria.map(
            (
              movimiento,
              index
            ) => (
              <div
                key={`movimiento-${index}`}
                className="grid gap-3 rounded-xl border border-black/10 bg-[#f8fafc] p-3 md:grid-cols-2"
              >
                <div>
                  <FieldLabel>
                    Caja
                  </FieldLabel>

                  <NosturSelect
                    value={
                      movimiento.caja_id ||
                      ""
                    }
                    options={
                      cajaOptions
                    }
                    onChange={(value) =>
                      onSelectCaja(
                        index,
                        value
                      )
                    }
                    placeholder="Seleccionar caja"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Forma real
                  </FieldLabel>

                  <NosturSelect
                    value={
                      movimiento
                        .forma_pago_id ||
                      ""
                    }
                    options={
                      formaPagoOptions
                    }
                    onChange={(value) =>
                      onSelectFormaPagoReal(
                        index,
                        value
                      )
                    }
                    placeholder="Seleccionar forma"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Importe
                  </FieldLabel>

                  <MoneyInput
                    value={
                      movimiento.importe
                        ? String(
                            movimiento.importe
                          ).replace(
                            ".",
                            ","
                          )
                        : ""
                    }
                    onChange={(value) =>
                      onUpdateMovimiento(
                        index,
                        {
                          importe:
                            Number(
                              value
                                .replace(
                                  /\./g,
                                  ""
                                )
                                .replace(
                                  ",",
                                  "."
                                )
                            ) || 0
                        }
                      )
                    }
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Moneda
                  </FieldLabel>

                  <NosturSelect
                    value={
                      movimiento.moneda ||
                      draft.venta.moneda
                    }
                    options={[
                      {
                        value: "ARS",
                        label: "ARS"
                      },
                      {
                        value: "USD",
                        label: "USD"
                      }
                    ]}
                    onChange={(value) =>
                      onUpdateMovimiento(
                        index,
                        {
                          moneda: value
                        }
                      )
                    }
                  />
                </div>

                <div>
                  <FieldLabel>
                    Tipo de cambio
                  </FieldLabel>

                  <MoneyInput
                    value={
                      movimiento.tipo_cambio
                        ? String(
                            movimiento.tipo_cambio
                          ).replace(
                            ".",
                            ","
                          )
                        : ""
                    }
                    onChange={(value) =>
                      onUpdateMovimiento(
                        index,
                        {
                          tipo_cambio:
                            parseInputMoney(
                              value
                            ) || null
                        }
                      )
                    }
                    placeholder={
                      normalizeCurrency(
                        movimiento.moneda
                      ) ===
                      normalizeCurrency(
                        draft.venta.moneda
                      )
                        ? "No requerido"
                        : "Obligatorio"
                    }
                  />

                  {(() => {
                    const detail =
                      getConversionDetail(
                        movimiento,
                        draft.venta.moneda
                      );

                    if (!detail) {
                      return null;
                    }

                    return (
                      <div
                        className={[
                          "mt-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-medium leading-relaxed",
                          detail.missingRate
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        ].join(" ")}
                      >
                        {detail.message}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      onRemoveMovimiento(
                        index
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    aria-label="Eliminar pago recibido"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <BooleanChip
          checked={
            draft.pagoParcial
          }
          onChange={
            onPagoParcial
          }
          label="Pago parcial"
        />

        <BooleanChip
          checked={
            draft.usaMarkupAdicional
          }
          onChange={onMarkup}
          label="Aplicar markup adicional"
        />
      </div>

      {draft.pagoParcial ? (
        <div className="mt-3 max-w-xs rounded-xl border border-amber-200 bg-amber-50 p-3">
          <FieldLabel>
            Fecha de ingreso a gastos
          </FieldLabel>

          <TextInput
            type="date"
            value={
              draft.fechaIngresoGastos
            }
            onChange={
              onFechaIngresoGastos
            }
          />
        </div>
      ) : null}

      {draft.usaMarkupAdicional ? (
        <div className="mt-3 max-w-xs rounded-xl border border-amber-200 bg-amber-50 p-3">
          <FieldLabel>
            Porcentaje de markup
          </FieldLabel>

          <MoneyInput
            value={
              draft.markupAdicionalPct
            }
            onChange={
              onMarkupPct
            }
            placeholder="0,00"
          />
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <div className="text-xs text-slate-500">
              Venta
            </div>

            <div className="font-bold text-[#172033]">
              {formatMoneyAR(
                venta,
                draft.venta.moneda
              )}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">
              Comercial
            </div>

            <div className="font-bold text-[#172033]">
              {formatMoneyAR(
                totalPagosComerciales,
                draft.venta.moneda
              )}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">
              Recibido
            </div>

            <div className="font-bold text-[#172033]">
              {formatMoneyAR(
                totalTesoreria,
                draft.venta.moneda
              )}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">
              Saldo
            </div>

            <div
              className={
                saldo > 0
                  ? "font-bold text-red-600"
                  : "font-bold text-emerald-700"
              }
            >
              {formatMoneyAR(
                saldo,
                draft.venta.moneda
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
