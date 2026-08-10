// src/components/carritos/wizard/WizardPagosComerciales.tsx

import { NosturDateInput } from "../../ui/NosturDateInput";
import { formatMoneyAR } from "../../../lib/formatters";

import type {
  MovimientoTesoreria,
  PagoComercial
} from "../../../store/carritosStore";

import {
  BooleanChip,
  FieldLabel,
  LineButton,
  NosturSelect,
  TextInput
} from "../components";

import {
  MONEDA_OPTIONS,
  type SelectOption,
  type WizardDraft
} from "../carritosModel";

type WizardPagosComercialesProps = {
  draft: WizardDraft;

  totalFinal: number;
  totalPagosComerciales: number;
  totalTesoreria: number;
  importeRiesgo: number;
  totalComercial: number;
  saldoComercial: number;
  saldo: number;

  formaPagoOptions: SelectOption[];
  cajaOptions: SelectOption[];

  onPagoChange: (
    index: number,
    patch: Partial<PagoComercial>
  ) => void;

  onAddPago: () => void;
  onRemovePago: (index: number) => void;

  onMovimientoChange: (
    index: number,
    patch: Partial<MovimientoTesoreria>
  ) => void;

  onCajaChange: (
    index: number,
    cajaId: string
  ) => void;

  onFormaPagoRealChange: (
    index: number,
    formaPagoId: string
  ) => void;

  onAddMovimiento: () => void;
  onRemoveMovimiento: (index: number) => void;

  onPagoParcialChange: (
    value: boolean
  ) => void;

  onFechaIngresoGastosChange: (
    value: string
  ) => void;

  onPagoDiferenteOficinaChange: (
    value: boolean
  ) => void;

  onUsaMarkupAdicionalChange: (
    value: boolean
  ) => void;

  onMarkupAdicionalPctChange: (
    value: string
  ) => void;

  onRiesgoChange: (
    value: boolean
  ) => void;

  onImporteRiesgoChange: (
    value: string
  ) => void;

  onRiesgoMotivoChange: (
    value: string
  ) => void;
};

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
    normalizeCurrency(monedaMovimiento);

  const saleCurrency =
    normalizeCurrency(monedaVenta);

  if (importe <= 0) {
    return 0;
  }

  if (movementCurrency === saleCurrency) {
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

function formatConversionDetail(
  importe: number,
  monedaMovimiento: string,
  monedaVenta: string,
  tipoCambio: number
): string | null {
  const movementCurrency =
    normalizeCurrency(monedaMovimiento);

  const saleCurrency =
    normalizeCurrency(monedaVenta);

  if (
    importe <= 0 ||
    movementCurrency === saleCurrency
  ) {
    return null;
  }

  if (tipoCambio <= 0) {
    return `Ingresá el tipo de cambio para convertir ${movementCurrency} a ${saleCurrency}.`;
  }

  const equivalente = calculateEquivalent(
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

  return `${formatMoneyAR(
    importe,
    movementCurrency
  )} ${operator} TC ${formatMoneyAR(
    tipoCambio
  )} = ${formatMoneyAR(
    equivalente,
    saleCurrency
  )} aplicados a la venta`;
}

function parseInputMoney(
  value: string
): number {
  const normalized = value
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(normalized);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

export function WizardPagosComerciales({
  draft,

  totalFinal,
  totalPagosComerciales,
  totalTesoreria,
  importeRiesgo,
  totalComercial,
  saldoComercial,
  saldo,

  formaPagoOptions,
  cajaOptions,

  onPagoChange,
  onAddPago,
  onRemovePago,

  onMovimientoChange,
  onCajaChange,
  onFormaPagoRealChange,
  onAddMovimiento,
  onRemoveMovimiento,

  onPagoParcialChange,
  onFechaIngresoGastosChange,
  onPagoDiferenteOficinaChange,

  onUsaMarkupAdicionalChange,
  onMarkupAdicionalPctChange,

  onRiesgoChange,
  onImporteRiesgoChange,
  onRiesgoMotivoChange
}: WizardPagosComercialesProps) {
  const diferenciaTesoreria =
    totalTesoreria - totalFinal;

  return (
    <section>
      <div className="mb-3">
        <h3 className="text-[14px] font-semibold text-[#172033]">
          Paso 3 · Pagos
        </h3>

        <p className="mt-0.5 text-[11px] font-normal text-[#64748b]">
          Registrá lo informado en ALMUNDO y el pago efectivamente recibido por la oficina.
        </p>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3 rounded-[12px] border border-black/10 bg-[#f8fafc] px-3 py-2">
        <span className="text-[11px] font-medium text-[#64748b]">
          Total del cliente
        </span>

        <strong className="text-[13px] font-semibold text-[#172033]">
          {formatMoneyAR(
            totalFinal,
            draft.venta.moneda
          )}
        </strong>
      </div>

      <div className="grid gap-3">
        <section className="rounded-[12px] border border-black/10 bg-white p-3">
          <div className="mb-3">
            <h4 className="text-[12px] font-semibold text-[#172033]">
              Pago informado en ALMUNDO
            </h4>

            <p className="mt-0.5 text-[10.5px] text-[#7b8495]">
              Cargá exactamente las formas e importes declarados en Ábaco.
            </p>
          </div>

          <div className="grid gap-2">
            {draft.pagosComerciales.map(
              (pago, index) => (
                <div
                  key={`pago-comercial-${index}`}
                  className="grid gap-2 rounded-[10px] border border-black/10 bg-[#f8fafc] p-2.5 md:grid-cols-[1fr_95px_1.25fr_auto]"
                >
                  <div>
                    <FieldLabel>
                      Importe
                    </FieldLabel>

                    <TextInput
                      value={
                        pago.importe
                          ? String(
                              pago.importe
                            ).replace(".", ",")
                          : ""
                      }
                      onChange={(value) =>
                        onPagoChange(index, {
                          importe:
                            parseInputMoney(
                              value
                            )
                        })
                      }
                      placeholder="0,00"
                      inputMode="decimal"
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
                      onChange={(value) =>
                        onPagoChange(index, {
                          moneda: value
                        })
                      }
                      options={
                        MONEDA_OPTIONS
                      }
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Forma en ALMUNDO
                    </FieldLabel>

                    <NosturSelect
                      value={
                        pago.forma_pago_id ||
                        ""
                      }
                      onChange={(value) => {
                        const forma =
                          formaPagoOptions.find(
                            (item) =>
                              item.value ===
                              value
                          );

                        onPagoChange(index, {
                          forma_pago_id:
                            forma?.value ||
                            null,
                          forma_pago:
                            forma?.label ||
                            null
                        });
                      }}
                      options={
                        formaPagoOptions
                      }
                      placeholder="Buscar forma"
                    />
                  </div>

                  <div className="flex items-end">
                    <LineButton
                      onClick={() =>
                        onRemovePago(index)
                      }
                    >
                      Eliminar
                    </LineButton>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="mt-2">
            <LineButton
              onClick={onAddPago}
            >
              + Agregar forma de pago
            </LineButton>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-black/10 pt-2 text-[11px]">
            <span className="text-[#64748b]">
              Total informado en ALMUNDO
            </span>

            <strong className="font-semibold text-[#172033]">
              {formatMoneyAR(
                totalPagosComerciales,
                draft.venta.moneda
              )}
            </strong>
          </div>
        </section>

        <section className="rounded-[12px] border border-black/10 bg-white p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="text-[12px] font-semibold text-[#172033]">
                Pago real recibido en oficina
              </h4>

              <p className="mt-0.5 text-[10.5px] text-[#7b8495]">
                Indicá las cajas, medios, monedas e importes que ingresaron realmente.
              </p>
            </div>

            <BooleanChip
              checked={
                draft.pagoDiferenteOficina
              }
              onChange={
                onPagoDiferenteOficinaChange
              }
              label="Pago diferente en oficina"
            />
          </div>

          {draft.pagoDiferenteOficina ? (
            <div className="mt-3 rounded-[10px] border border-[#4f7c90]/20 bg-[#f4f8fa] px-3 py-2.5">
              <p className="text-[10.5px] leading-relaxed text-[#526274]">
                El pago real puede distribuirse entre varios medios, cajas y monedas,
                aunque no coincida con lo informado en ALMUNDO.
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <p className="text-[10.5px] leading-relaxed text-emerald-700">
                El pago real coincide con lo informado en ALMUNDO. Completá igualmente
                la caja donde ingresó cada importe.
              </p>
            </div>
          )}

          <div className="mt-3 grid gap-2">
            {draft.movimientosTesoreria.map(
              (movimiento, index) => (
                <div
                  key={`movimiento-real-${index}`}
                  className="grid gap-2 rounded-[10px] border border-black/10 bg-[#f8fafc] p-2.5 md:grid-cols-2"
                >
                  <div>
                    <FieldLabel>
                      Caja *
                    </FieldLabel>

                    <NosturSelect
                      value={
                        movimiento.caja_id ||
                        ""
                      }
                      onChange={(value) =>
                        onCajaChange(
                          index,
                          value
                        )
                      }
                      options={
                        cajaOptions
                      }
                      placeholder="Buscar caja"
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Forma real *
                    </FieldLabel>

                    <NosturSelect
                      value={
                        movimiento.forma_pago_id ||
                        ""
                      }
                      onChange={(value) =>
                        onFormaPagoRealChange(
                          index,
                          value
                        )
                      }
                      options={
                        formaPagoOptions
                      }
                      placeholder="Buscar forma real"
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Moneda *
                    </FieldLabel>

                    <NosturSelect
                      value={
                        movimiento.moneda ||
                        draft.venta.moneda
                      }
                      onChange={(value) =>
                        onMovimientoChange(
                          index,
                          {
                            moneda: value
                          }
                        )
                      }
                      options={
                        MONEDA_OPTIONS
                      }
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Importe *
                    </FieldLabel>

                    <TextInput
                      value={
                        movimiento.importe
                          ? String(
                              movimiento.importe
                            ).replace(".", ",")
                          : ""
                      }
                      onChange={(value) =>
                        onMovimientoChange(
                          index,
                          {
                            importe:
                              parseInputMoney(
                                value
                              )
                          }
                        )
                      }
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Tipo de cambio
                    </FieldLabel>

                    <TextInput
                      value={
                        movimiento.tipo_cambio
                          ? String(
                              movimiento.tipo_cambio
                            ).replace(".", ",")
                          : ""
                      }
                      onChange={(value) =>
                        onMovimientoChange(
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
                      inputMode="decimal"
                    />

                    {(() => {
                      const detail =
                        formatConversionDetail(
                          parseInputMoney(
                            String(
                              movimiento.importe ||
                                ""
                            )
                          ),
                          movimiento.moneda,
                          draft.venta.moneda,
                          parseInputMoney(
                            String(
                              movimiento.tipo_cambio ||
                                ""
                            )
                          )
                        );

                      if (!detail) {
                        return null;
                      }

                      const missingRate =
                        parseInputMoney(
                          String(
                            movimiento.tipo_cambio ||
                              ""
                          )
                        ) <= 0;

                      return (
                        <div
                          className={[
                            "mt-1.5 rounded-[8px] border px-2.5 py-2 text-[10px] font-medium leading-relaxed",
                            missingRate
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          ].join(" ")}
                        >
                          {detail}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-end justify-end">
                    <LineButton
                      onClick={() =>
                        onRemoveMovimiento(
                          index
                        )
                      }
                    >
                      Eliminar
                    </LineButton>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="mt-2">
            <LineButton
              onClick={
                onAddMovimiento
              }
            >
              + Agregar pago real
            </LineButton>
          </div>

          <div className="mt-3 grid gap-1 border-t border-black/10 pt-2 text-[11px]">
            <div className="flex justify-between gap-3">
              <span className="text-[#64748b]">
                Total recibido
              </span>

              <strong className="font-semibold text-[#172033]">
                {formatMoneyAR(
                  totalTesoreria,
                  draft.venta.moneda
                )}
              </strong>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-[#64748b]">
                Diferencia contra total
              </span>

              <strong
                className={
                  Math.abs(
                    diferenciaTesoreria
                  ) > 0.009
                    ? "font-semibold text-red-600"
                    : "font-semibold text-emerald-700"
                }
              >
                {formatMoneyAR(
                  diferenciaTesoreria,
                  draft.venta.moneda
                )}
              </strong>
            </div>
          </div>
        </section>

        <section className="rounded-[12px] border border-black/10 bg-white p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="text-[12px] font-semibold text-[#172033]">
                Markup adicional
              </h4>

              <p className="mt-0.5 text-[10.5px] text-[#7b8495]">
                Se guarda como dato comercial para su utilización posterior.
              </p>
            </div>

            <BooleanChip
              checked={
                draft.usaMarkupAdicional
              }
              onChange={
                onUsaMarkupAdicionalChange
              }
              label="Se utilizó markup adicional"
            />
          </div>

          {draft.usaMarkupAdicional ? (
            <div className="mt-3 max-w-[240px] rounded-[10px] border border-amber-200 bg-amber-50 p-3">
              <FieldLabel>
                Porcentaje de markup *
              </FieldLabel>

              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <TextInput
                    value={
                      draft.markupAdicionalPct
                    }
                    onChange={
                      onMarkupAdicionalPctChange
                    }
                    placeholder="0,00"
                    inputMode="decimal"
                  />
                </div>

                <span className="text-[13px] font-semibold text-amber-800">
                  %
                </span>
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-[12px] border border-black/10 bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <BooleanChip
              checked={
                draft.pagoParcial
              }
              onChange={
                onPagoParcialChange
              }
              label="Pago parcial / Cta Cte"
            />

            <BooleanChip
              checked={
                draft.riesgo
              }
              onChange={
                onRiesgoChange
              }
              label="Imputar a riesgo ALMUNDO"
            />
          </div>

          {draft.pagoParcial ? (
            <div className="mt-3 max-w-[320px] rounded-[10px] border border-amber-200 bg-amber-50 p-3">
              <FieldLabel>
                Fecha de ingreso a gastos *
              </FieldLabel>

              <NosturDateInput
                value={
                  draft.fechaIngresoGastos
                }
                onChange={
                  onFechaIngresoGastosChange
                }
              />
            </div>
          ) : null}

          {draft.riesgo ? (
            <div className="mt-3 grid gap-3 rounded-[10px] border border-red-200 bg-red-50 p-3 md:grid-cols-[210px_minmax(0,1fr)]">
              <div>
                <FieldLabel>
                  Importe de riesgo
                </FieldLabel>

                <TextInput
                  value={
                    draft.importe_riesgo
                  }
                  onChange={
                    onImporteRiesgoChange
                  }
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>

              <div>
                <FieldLabel>
                  Motivo / observación
                </FieldLabel>

                <TextInput
                  value={
                    draft.riesgo_motivo
                  }
                  onChange={
                    onRiesgoMotivoChange
                  }
                  placeholder="Motivo del riesgo ALMUNDO"
                />
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-[12px] border border-black/10 bg-[#f8fafc] p-3 text-[11px]">
          <div className="flex justify-between gap-3">
            <span className="text-[#64748b]">
              Imputación comercial
            </span>

            <strong className="font-semibold text-[#172033]">
              {formatMoneyAR(
                totalComercial,
                draft.venta.moneda
              )}
            </strong>
          </div>

          {draft.riesgo ? (
            <div className="mt-1 flex justify-between gap-3">
              <span className="text-[#64748b]">
                Riesgo ALMUNDO
              </span>

              <strong className="font-semibold text-red-700">
                {formatMoneyAR(
                  importeRiesgo,
                  draft.venta.moneda
                )}
              </strong>
            </div>
          ) : null}

          <div className="mt-1 flex justify-between gap-3">
            <span className="text-[#64748b]">
              Saldo comercial
            </span>

            <strong
              className={
                saldoComercial > 0
                  ? "font-semibold text-red-600"
                  : "font-semibold text-emerald-700"
              }
            >
              {formatMoneyAR(
                saldoComercial,
                draft.venta.moneda
              )}
            </strong>
          </div>

          <div className="mt-2 flex justify-between gap-3 border-t border-black/10 pt-2">
            <span className="text-[#64748b]">
              Saldo real del pasajero
            </span>

            <strong
              className={
                saldo > 0
                  ? "font-semibold text-red-600"
                  : "font-semibold text-emerald-700"
              }
            >
              {formatMoneyAR(
                saldo,
                draft.venta.moneda
              )}
            </strong>
          </div>
        </section>
      </div>
    </section>
  );
}
