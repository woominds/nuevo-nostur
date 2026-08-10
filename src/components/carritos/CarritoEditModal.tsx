import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type {
  Carrito
} from "../../store/carritosStore";
import {
  BooleanChip,
  FieldLabel,
  LineButton,
  NosturSelect,
  TextArea,
  TextInput
} from "./components";
import {
  ESTADO_OPTIONS,
  MONEDA_OPTIONS,
  maskCarrito,
  parseMoney
} from "./carritosModel";
import {
  useCarritoEditor,
  type CarritoEditCatalogos
} from "./hooks/useCarritoEditor";
import { formatMoneyAR } from "../../lib/formatters";
import { NosturDateInput } from "../ui/NosturDateInput";

type CarritoEditModalProps = {
  carrito: Carrito;
  catalogos: CarritoEditCatalogos;
  canManageCarritos: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
};

export function CarritoEditModal({
  carrito,
  catalogos,
  canManageCarritos,
  onClose,
  onSaved
}: CarritoEditModalProps) {
  const {
    saving,
    loadingData,
    editError,
    draft,

    totalFinal,
    totalTesoreria,
    saldo,

    metodoOptions,
    servicioOptions,
    formaPagoOptions,
    cajaOptions,
    vendedorOptions,
    sucursalOptions,

    setCliente,
    setCarrito,
    setMoneda,
    setMetodoContacto,

    updatePago,
    selectPagoForma,
    addPago,
    removePago,

    updateMovimiento,
    selectMovimientoCaja,
    selectMovimientoForma,
    addMovimiento,
    removeMovimiento,

    handleSave
  } = useCarritoEditor({
    carrito,
    catalogos,
    onClose,
    onSaved
  });

  return createPortal(
    <div className="fixed inset-0 z-[230] flex items-start justify-center bg-black/35 px-2 pt-3 backdrop-blur-sm sm:px-4 sm:pt-8">
      <div className="max-h-[calc(100vh-24px)] w-full max-w-5xl overflow-hidden rounded-[18px] border border-black/10 bg-[#edf3f7] text-[#172033] shadow-2xl sm:max-h-[calc(100vh-64px)]">
        <div className="flex items-start justify-between gap-3 border-b border-black/10 bg-white/85 px-4 py-3 backdrop-blur-xl">
          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-semibold text-[#172033]">
              Editar carrito{" "}
              {carrito.numero_carrito}
            </h2>

            <p className="mt-0.5 text-[12px] font-normal text-[#64748b]">
              Se puede editar aunque esté en
              control, controlado, facturado o
              cobrado.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#172033]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[calc(100vh-178px)] overflow-auto p-3 pb-6 sm:p-4 sm:pb-6">
          {editError ? (
            <div className="mb-3 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
              {editError}
            </div>
          ) : null}

          {loadingData ? (
            <div className="rounded-[16px] border border-black/10 bg-white p-5 text-center text-[12px] text-[#64748b]">
              Cargando datos del carrito...
            </div>
          ) : (
            <div className="grid gap-3">
              <section className="rounded-[16px] border border-black/10 bg-white p-3">
                <h3 className="mb-3 text-[14px] font-semibold text-[#172033]">
                  Cliente
                </h3>

                <div className="grid gap-3 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <FieldLabel>
                      Nombre completo
                    </FieldLabel>

                    <TextInput
                      value={
                        draft.cliente
                          .nombre_completo
                      }
                      onChange={(value) =>
                        setCliente(
                          "nombre_completo",
                          value
                        )
                      }
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Teléfono
                    </FieldLabel>

                    <TextInput
                      value={
                        draft.cliente.telefono
                      }
                      onChange={(value) =>
                        setCliente(
                          "telefono",
                          value
                        )
                      }
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Email
                    </FieldLabel>

                    <TextInput
                      value={
                        draft.cliente.email
                      }
                      onChange={(value) =>
                        setCliente(
                          "email",
                          value
                        )
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[16px] border border-black/10 bg-white p-3">
                <h3 className="mb-3 text-[14px] font-semibold text-[#172033]">
                  Venta
                </h3>

                <div className="grid gap-3 md:grid-cols-4">
                  <div>
                    <FieldLabel>
                      Número carrito
                    </FieldLabel>

                    <TextInput
                      value={
                        draft.carrito
                          .numero_carrito
                      }
                      onChange={(value) =>
                        setCarrito(
                          "numero_carrito",
                          maskCarrito(value)
                        )
                      }
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Fecha venta
                    </FieldLabel>

                    <NosturDateInput
                      value={
                        draft.carrito
                          .fecha_venta
                      }
                      onChange={(value) =>
                        setCarrito(
                          "fecha_venta",
                          value
                        )
                      }
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Estado
                    </FieldLabel>

                    <NosturSelect
                      value={
                        draft.carrito.estado
                      }
                      onChange={(value) =>
                        setCarrito(
                          "estado",
                          value
                        )
                      }
                      options={ESTADO_OPTIONS.filter(
                        (item) =>
                          item.value !==
                          "todos"
                      )}
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Moneda
                    </FieldLabel>

                    <NosturSelect
                      value={
                        draft.carrito.moneda
                      }
                      onChange={setMoneda}
                      options={MONEDA_OPTIONS}
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Fecha IN
                    </FieldLabel>

                    <NosturDateInput
                      value={
                        draft.carrito.fecha_in
                      }
                      onChange={(value) =>
                        setCarrito(
                          "fecha_in",
                          value
                        )
                      }
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Fecha OUT
                    </FieldLabel>

                    <NosturDateInput
                      value={
                        draft.carrito.fecha_out
                      }
                      onChange={(value) =>
                        setCarrito(
                          "fecha_out",
                          value
                        )
                      }
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Servicio
                    </FieldLabel>

                    <NosturSelect
                      value={
                        draft.carrito.servicio
                      }
                      onChange={(value) =>
                        setCarrito(
                          "servicio",
                          value
                        )
                      }
                      options={servicioOptions}
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Método contacto
                    </FieldLabel>

                    <NosturSelect
                      value={
                        draft.carrito
                          .metodo_contacto
                      }
                      onChange={
                        setMetodoContacto
                      }
                      options={metodoOptions}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FieldLabel>
                      Destino
                    </FieldLabel>

                    <TextInput
                      value={
                        draft.carrito.destino
                      }
                      onChange={(value) =>
                        setCarrito(
                          "destino",
                          value
                        )
                      }
                    />
                  </div>

                  <div>
                    <BooleanChip
                      checked={
                        draft.carrito.solo_ida
                      }
                      onChange={(value) =>
                        setCarrito(
                          "solo_ida",
                          value
                        )
                      }
                      label="Solo ida"
                    />
                  </div>

                  <div>
                    <BooleanChip
                      checked={
                        draft.carrito.activo
                      }
                      onChange={(value) =>
                        setCarrito(
                          "activo",
                          value
                        )
                      }
                      label={
                        draft.carrito.activo
                          ? "Activo"
                          : "Inactivo"
                      }
                    />
                  </div>

                  {canManageCarritos ? (
                    <>
                      <div>
                        <FieldLabel>
                          Vendedor
                        </FieldLabel>

                        <NosturSelect
                          value={
                            draft.carrito
                              .vendedor_id
                          }
                          onChange={(value) =>
                            setCarrito(
                              "vendedor_id",
                              value
                            )
                          }
                          options={
                            vendedorOptions
                          }
                        />
                      </div>

                      <div>
                        <FieldLabel>
                          Sucursal
                        </FieldLabel>

                        <NosturSelect
                          value={
                            draft.carrito
                              .sucursal_id
                          }
                          onChange={(value) =>
                            setCarrito(
                              "sucursal_id",
                              value
                            )
                          }
                          options={
                            sucursalOptions
                          }
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </section>

              <section className="rounded-[16px] border border-black/10 bg-white p-3">
                <h3 className="mb-3 text-[14px] font-semibold text-[#172033]">
                  Importes
                </h3>

                <div className="grid gap-3 md:grid-cols-4">
                  <div>
                    <FieldLabel>
                      Importe bruto
                    </FieldLabel>

                    <TextInput
                      value={
                        draft.carrito
                          .importe_bruto
                      }
                      onChange={(value) =>
                        setCarrito(
                          "importe_bruto",
                          value
                        )
                      }
                      inputMode="decimal"
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Promocode
                    </FieldLabel>

                    <BooleanChip
                      checked={
                        draft.carrito
                          .promocode_aplicado
                      }
                      onChange={(value) =>
                        setCarrito(
                          "promocode_aplicado",
                          value
                        )
                      }
                      label="Tiene promocode"
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Importe promocode
                    </FieldLabel>

                    <TextInput
                      value={
                        draft.carrito
                          .promocode_importe
                      }
                      onChange={(value) =>
                        setCarrito(
                          "promocode_importe",
                          value
                        )
                      }
                      inputMode="decimal"
                    />
                  </div>

                  <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3 text-[12px]">
                    <div className="flex justify-between">
                      <span>Total final</span>

                      <strong>
                        {formatMoneyAR(
                          totalFinal,
                          draft.carrito.moneda
                        )}
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span>Tesorería</span>

                      <strong>
                        {formatMoneyAR(
                          totalTesoreria,
                          draft.carrito.moneda
                        )}
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span>Saldo</span>

                      <strong
                        className={
                          saldo > 0
                            ? "text-amber-700"
                            : "text-emerald-700"
                        }
                      >
                        {formatMoneyAR(
                          saldo,
                          draft.carrito.moneda
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[16px] border border-black/10 bg-white p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-[14px] font-semibold text-[#172033]">
                    Pagos comerciales
                  </h3>

                  <LineButton
                    onClick={addPago}
                  >
                    + Agregar
                  </LineButton>
                </div>

                <div className="grid gap-2">
                  {draft.pagosComerciales.map(
                    (pago, index) => (
                      <div
                        key={`edit-pago-${index}`}
                        className="grid gap-2 rounded-[14px] border border-black/10 bg-[#f8fafc] p-3 md:grid-cols-[1fr_110px_1fr_auto]"
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
                                  ).replace(
                                    ".",
                                    ","
                                  )
                                : ""
                            }
                            onChange={(
                              value
                            ) =>
                              updatePago(
                                index,
                                {
                                  importe:
                                    parseMoney(
                                      value
                                    )
                                }
                              )
                            }
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
                              draft.carrito
                                .moneda
                            }
                            onChange={(
                              value
                            ) =>
                              updatePago(
                                index,
                                {
                                  moneda:
                                    value
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
                            Forma pago
                          </FieldLabel>

                          <NosturSelect
                            value={
                              pago.forma_pago_id ||
                              ""
                            }
                            onChange={(
                              value
                            ) =>
                              selectPagoForma(
                                index,
                                value
                              )
                            }
                            options={
                              formaPagoOptions
                            }
                          />
                        </div>

                        <div className="flex items-end">
                          <LineButton
                            onClick={() =>
                              removePago(
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
              </section>

              <section className="rounded-[16px] border border-black/10 bg-white p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-[14px] font-semibold text-[#172033]">
                    Tesorería
                  </h3>

                  <LineButton
                    onClick={addMovimiento}
                  >
                    + Agregar
                  </LineButton>
                </div>

                <div className="grid gap-2">
                  {draft.movimientosTesoreria.map(
                    (
                      movimiento,
                      index
                    ) => (
                      <div
                        key={`edit-movimiento-${index}`}
                        className="grid gap-2 rounded-[14px] border border-black/10 bg-[#f8fafc] p-3 md:grid-cols-3"
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
                            onChange={(
                              value
                            ) =>
                              selectMovimientoCaja(
                                index,
                                value
                              )
                            }
                            options={
                              cajaOptions
                            }
                          />
                        </div>

                        <div>
                          <FieldLabel>
                            Forma real
                          </FieldLabel>

                          <NosturSelect
                            value={
                              movimiento.forma_pago_id ||
                              ""
                            }
                            onChange={(
                              value
                            ) =>
                              selectMovimientoForma(
                                index,
                                value
                              )
                            }
                            options={
                              formaPagoOptions
                            }
                          />
                        </div>

                        <div>
                          <FieldLabel>
                            Importe
                          </FieldLabel>

                          <TextInput
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
                            onChange={(
                              value
                            ) =>
                              updateMovimiento(
                                index,
                                {
                                  importe:
                                    parseMoney(
                                      value
                                    )
                                }
                              )
                            }
                            inputMode="decimal"
                          />
                        </div>

                        <div>
                          <FieldLabel>
                            Moneda
                          </FieldLabel>

                          <NosturSelect
                            value={
                              movimiento.moneda ||
                              draft.carrito
                                .moneda
                            }
                            onChange={(
                              value
                            ) =>
                              updateMovimiento(
                                index,
                                {
                                  moneda:
                                    value
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
                            TC
                          </FieldLabel>

                          <TextInput
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
                            onChange={(
                              value
                            ) =>
                              updateMovimiento(
                                index,
                                {
                                  tipo_cambio:
                                    parseMoney(
                                      value
                                    )
                                }
                              )
                            }
                            inputMode="decimal"
                          />
                        </div>

                        <div className="flex items-end">
                          <LineButton
                            onClick={() =>
                              removeMovimiento(
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
              </section>

              <section className="rounded-[16px] border border-black/10 bg-white p-3">
                <h3 className="mb-3 text-[14px] font-semibold text-[#172033]">
                  Riesgo y notas
                </h3>

                <div className="grid gap-3 md:grid-cols-[180px_180px_1fr]">
                  <div>
                    <FieldLabel>
                      Riesgo
                    </FieldLabel>

                    <BooleanChip
                      checked={
                        draft.carrito.riesgo
                      }
                      onChange={(value) =>
                        setCarrito(
                          "riesgo",
                          value
                        )
                      }
                      label="Riesgo Almundo"
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Importe riesgo
                    </FieldLabel>

                    <TextInput
                      value={
                        draft.carrito
                          .importe_riesgo
                      }
                      onChange={(value) =>
                        setCarrito(
                          "importe_riesgo",
                          value
                        )
                      }
                      inputMode="decimal"
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Motivo riesgo
                    </FieldLabel>

                    <TextInput
                      value={
                        draft.carrito
                          .riesgo_motivo
                      }
                      onChange={(value) =>
                        setCarrito(
                          "riesgo_motivo",
                          value
                        )
                      }
                    />
                  </div>

                  <div className="md:col-span-3">
                    <FieldLabel>
                      Observaciones
                    </FieldLabel>

                    <TextArea
                      value={
                        draft.carrito
                          .observaciones
                      }
                      onChange={(value) =>
                        setCarrito(
                          "observaciones",
                          value
                        )
                      }
                    />
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 z-20 flex justify-end gap-2 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 rounded-[10px] border border-black/10 bg-white px-4 text-[12px] font-medium text-[#334155] hover:bg-[#f8fafc] disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={
              saving || loadingData
            }
            className="h-9 rounded-[10px] bg-[#4f7c90] px-5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#406b7d] disabled:opacity-50"
          >
            {saving
              ? "Guardando..."
              : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default CarritoEditModal;
