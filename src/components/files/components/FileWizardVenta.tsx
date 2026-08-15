import {
  Plus,
  Trash2
} from "lucide-react";

import {
  BooleanChip,
  FieldLabel,
  LineButton,
  MoneyInput,
  NosturSelect,
  TextArea,
  TextInput
} from "./FileFormControls";

import {
  NosturDateInput
} from "../../ui/NosturDateInput";

import {
  formatMoneyAR
} from "../../../lib/formatters";

import type {
  FileVoucherServicioInput
} from "../../../store/filesStore";

import type {
  FileWizardDraft,
  SelectOption
} from "../filesModel";

type FileWizardVentaProps = {
  draft: FileWizardDraft;

  operadorOptions: SelectOption[];
  servicioOptions: SelectOption[];
  destinoOptions: SelectOption[];

  venta: number;
  netoOperador: number;
  utilidad: number;

  onVentaChange: <
    K extends keyof FileWizardDraft["venta"]
  >(
    key: K,
    value: FileWizardDraft["venta"][K]
  ) => void;

  onSelectOperador: (
    operadorId: string
  ) => void;

  onSetMoneda: (
    moneda: string
  ) => void;

  onCreateDestino: (
    nombre: string
  ) => Promise<void>;

  onVoucherChange: <
    K extends keyof FileWizardDraft["voucher"]
  >(
    key: K,
    value: FileWizardDraft["voucher"][K]
  ) => void;

  onRequiereVoucher: (
    value: boolean
  ) => void;

  onUpdateVoucherServicio: (
    index: number,
    patch: Partial<FileVoucherServicioInput>
  ) => void;

  onAddVoucherServicio: () => void;

  onRemoveVoucherServicio: (
    index: number
  ) => void;
};

export function FileWizardVenta({
  draft,
  operadorOptions,
  servicioOptions,
  destinoOptions,
  utilidad,
  onVentaChange,
  onSelectOperador,
  onSetMoneda,
  onCreateDestino,
  onVoucherChange,
  onRequiereVoucher,
  onUpdateVoucherServicio,
  onAddVoucherServicio,
  onRemoveVoucherServicio
}: FileWizardVentaProps) {
  return (
    <section>
      <h3 className="mb-3 text-[14px] font-semibold text-[#172033]">
        Paso 2 · Datos del File
      </h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <FieldLabel>
            Número File *
          </FieldLabel>

          <TextInput
            value={
              draft.venta.numero_file
            }
            onChange={(value) =>
              onVentaChange(
                "numero_file",
                value.replace(
                  /\D/g,
                  ""
                )
              )
            }
            placeholder="Número de file"
            inputMode="numeric"
          />
        </div>

        <div>
          <FieldLabel>
            Operador *
          </FieldLabel>

          <NosturSelect
            value={
              draft.venta.operador_id
            }
            options={
              operadorOptions
            }
            onChange={
              onSelectOperador
            }
            placeholder="Seleccionar operador"
          />
        </div>

        <div>
          <FieldLabel>
            Tipo de servicio *
          </FieldLabel>

          <NosturSelect
            value={
              draft.venta.servicio
            }
            options={
              servicioOptions
            }
            onChange={(value) =>
              onVentaChange(
                "servicio",
                value
              )
            }
            placeholder="Seleccionar servicio"
          />
        </div>

        <div>
          <FieldLabel>
            Destino / destinos *
          </FieldLabel>

          <NosturSelect
            multiple
            creatable
            value={
              draft.venta.destinos
            }
            options={
              destinoOptions
            }
            onCreateOption={
              onCreateDestino
            }
            onChange={(value) =>
              onVentaChange(
                "destinos",
                value
              )
            }
            placeholder="Buscar o crear destinos"
          />
        </div>

        <div>
          <FieldLabel>
            Fecha de venta
          </FieldLabel>

          <div className="flex h-8 items-center rounded-[10px] border border-black/10 bg-[#f8fafc] px-3 text-[12px] font-medium text-[#334155]">
            {draft.venta.fecha_venta}
          </div>

          <div className="mt-1 text-[10px] font-normal text-[#94a3b8]">
            Se registra automáticamente al crear el File.
          </div>
        </div>

        <div>
          <FieldLabel>
            Fecha IN
          </FieldLabel>

          <NosturDateInput
            
            value={
              draft.venta.fecha_in
            }
            onChange={(value) =>
              onVentaChange(
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

          {draft.venta.solo_ida ? (
            <div className="flex h-8 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-400">
              Solo ida
            </div>
          ) : (
            <NosturDateInput
              
              value={
                draft.venta.fecha_out
              }
              onChange={(value) =>
                onVentaChange(
                  "fecha_out",
                  value
                )
              }
            />
          )}
        </div>

        <div className="flex items-end">
          <BooleanChip
            checked={
              draft.venta.solo_ida
            }
            onChange={(value) => {
              onVentaChange(
                "solo_ida",
                value
              );

              if (value) {
                onVentaChange(
                  "fecha_out",
                  ""
                );
              }
            }}
            label="Solo ida"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div>
          <FieldLabel>
            Moneda
          </FieldLabel>

          <NosturSelect
            value={
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
            onChange={
              onSetMoneda
            }
          />
        </div>

        <div>
          <FieldLabel>
            Venta
          </FieldLabel>

          <MoneyInput
            value={
              draft.venta.importe_venta
            }
            onChange={(value) =>
              onVentaChange(
                "importe_venta",
                value
              )
            }
            placeholder="0,00"
          />
        </div>

        <div>
          <FieldLabel>
            Neto operador
          </FieldLabel>

          <MoneyInput
            value={
              draft.venta.neto_operador
            }
            onChange={(value) =>
              onVentaChange(
                "neto_operador",
                value
              )
            }
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">
          Utilidad
        </div>

        <div className="mt-1 text-2xl font-bold text-emerald-800">
          {formatMoneyAR(
            utilidad,
            draft.venta.moneda
          )}
        </div>
      </div>

      <div className="mt-5">
        <FieldLabel>
          Observaciones
        </FieldLabel>

        <TextArea
          rows={4}
          value={
            draft.venta.observaciones
          }
          onChange={(value) =>
            onVentaChange(
              "observaciones",
              value
            )
          }
          placeholder="Observaciones internas..."
        />
      </div>

      <div className="mt-6 rounded-xl border border-black/10 p-4">
        <BooleanChip
          checked={
            draft.voucher
              .requiere_voucher
          }
          onChange={
            onRequiereVoucher
          }
          label="Requiere voucher"
        />

        {draft.voucher
          .requiere_voucher ? (
          <>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <FieldLabel>
                  A favor de
                </FieldLabel>

                <TextInput
                  value={
                    draft.voucher
                      .a_favor_de
                  }
                  onChange={(value) =>
                    onVoucherChange(
                      "a_favor_de",
                      value
                    )
                  }
                  placeholder="Cliente, pasajero o grupo"
                />
              </div>

              <div>
                <FieldLabel>
                  Reserva
                </FieldLabel>

                <TextInput
                  value={
                    draft.voucher
                      .reserva_id
                  }
                  onChange={(value) =>
                    onVoucherChange(
                      "reserva_id",
                      value
                    )
                  }
                  placeholder="ID o localizador"
                />
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-[#172033]">
                  Servicios del voucher
                </h4>

                <LineButton
                  onClick={
                    onAddVoucherServicio
                  }
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Plus size={14} />
                    Agregar servicio
                  </span>
                </LineButton>
              </div>

              <div className="space-y-3">
                {draft.voucher.servicios.map(
                  (
                    servicio,
                    index
                  ) => (
                    <div
                      key={`voucher-servicio-${index}`}
                      className="rounded-xl border border-black/10 p-3"
                    >
                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="md:col-span-2">
                          <FieldLabel>
                            Servicio
                          </FieldLabel>

                          <TextInput
                            value={
                              servicio
                                .servicio_detalle
                            }
                            onChange={(value) =>
                              onUpdateVoucherServicio(
                                index,
                                {
                                  servicio_detalle:
                                    value
                                }
                              )
                            }
                            placeholder="Detalle del servicio"
                          />
                        </div>

                        <div>
                          <FieldLabel>
                            Pasajeros
                          </FieldLabel>

                          <TextInput
                            type="number"
                            value={String(
                              servicio
                                .cantidad_pasajeros ||
                                1
                            )}
                            onChange={(value) =>
                              onUpdateVoucherServicio(
                                index,
                                {
                                  cantidad_pasajeros:
                                    Math.max(
                                      Number(
                                        value
                                      ) || 1,
                                      1
                                    )
                                }
                              )
                            }
                            inputMode="numeric"
                          />
                        </div>

                        <div className="flex items-end justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              onRemoveVoucherServicio(
                                index
                              )
                            }
                            disabled={
                              draft.voucher
                                .servicios
                                .length <= 1
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Eliminar servicio"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>
                        </div>

                        <div>
                          <FieldLabel>
                            Fecha inicio
                          </FieldLabel>

                          <NosturDateInput
                            
                            value={
                              servicio
                                .fecha_inicio ||
                              ""
                            }
                            onChange={(value) =>
                              onUpdateVoucherServicio(
                                index,
                                {
                                  fecha_inicio:
                                    value
                                }
                              )
                            }
                          />
                        </div>

                        <div>
                          <FieldLabel>
                            Fecha fin
                          </FieldLabel>

                          <NosturDateInput
                            
                            value={
                              servicio
                                .fecha_fin ||
                              ""
                            }
                            onChange={(value) =>
                              onUpdateVoucherServicio(
                                index,
                                {
                                  fecha_fin:
                                    value
                                }
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
