import {
  useState
} from "react";

import {
  useFilesStore,
  type FileItem,
  type FileVoucherServicioInput
} from "../../../store/filesStore";

import {
  printFileVoucherPdf
} from "../../../lib/fileVoucherPdf";

import {
  FieldLabel,
  LineButton,
  TextArea,
  TextInput
} from "./FileFormControls";

import {
  NosturDateInput
} from "../../ui/NosturDateInput";

import {
  formatDateAR,
  getToday
} from "../filesModel";

type FileVoucherSectionProps = {
  file: FileItem;
  onSaved: (
    message: string
  ) => void;
  onError: (
    message: string | null
  ) => void;
};

type VoucherDraft = {
  reserva_id: string;
  a_favor_de: string;
  servicios:
    FileVoucherServicioInput[];
};

export function FileVoucherSection({
  file,
  onSaved,
  onError
}: FileVoucherSectionProps) {
  const saving =
    useFilesStore(
      (state) => state.saving
    );

  const createVoucherForFile =
    useFilesStore(
      (state) =>
        state.createVoucherForFile
    );

  const vouchers =
    useFilesStore(
      (state) => state.vouchers
    );

  const voucherServicios =
    useFilesStore(
      (state) =>
        state.voucherServicios
    );

  const voucher =
    vouchers.find(
      (item) =>
        item.file_id === file.id
    ) || null;

  const serviciosVoucher =
    voucher
      ? voucherServicios.filter(
          (servicio) =>
            servicio.voucher_id ===
            voucher.id
        )
      : [];

  const [
    voucherDraft,
    setVoucherDraft
  ] = useState<VoucherDraft>(
    () => {
      const fechaInicio =
        file.fecha_in ||
        getToday();

      const fechaFin =
        file.solo_ida
          ? fechaInicio
          : file.fecha_out ||
            fechaInicio;

      return {
        reserva_id: "",

        a_favor_de:
          file.clientes
            ?.nombre_completo ||
          "",

        servicios: [
          {
            servicio_detalle:
              file.servicio || "",

            cantidad_pasajeros:
              1,

            fecha_inicio:
              fechaInicio,

            fecha_fin:
              fechaFin
          }
        ]
      };
    }
  );

  function setVoucherField<
    K extends keyof VoucherDraft
  >(
    key: K,
    value: VoucherDraft[K]
  ) {
    onError(null);

    setVoucherDraft(
      (current) => ({
        ...current,
        [key]: value
      })
    );
  }

  function updateServicio(
    index: number,
    patch:
      Partial<FileVoucherServicioInput>
  ) {
    onError(null);

    setVoucherDraft(
      (current) => ({
        ...current,

        servicios:
          current.servicios.map(
            (
              servicio,
              itemIndex
            ) =>
              itemIndex === index
                ? {
                    ...servicio,
                    ...patch
                  }
                : servicio
          )
      })
    );
  }

  function addServicio() {
    onError(null);

    const fechaInicio =
      file.fecha_in ||
      getToday();

    const fechaFin =
      file.solo_ida
        ? fechaInicio
        : file.fecha_out ||
          fechaInicio;

    setVoucherDraft(
      (current) => ({
        ...current,

        servicios: [
          ...current.servicios,

          {
            servicio_detalle:
              "",

            cantidad_pasajeros:
              1,

            fecha_inicio:
              fechaInicio,

            fecha_fin:
              fechaFin
          }
        ]
      })
    );
  }

  function removeServicio(
    index: number
  ) {
    onError(null);

    setVoucherDraft(
      (current) => ({
        ...current,

        servicios:
          current.servicios
            .length <= 1
            ? current.servicios
            : current.servicios.filter(
                (
                  _,
                  itemIndex
                ) =>
                  itemIndex !==
                  index
              )
      })
    );
  }

  async function createVoucher() {
    const serviciosValidos =
      voucherDraft.servicios.filter(
        (servicio) =>
          servicio
            .servicio_detalle
            .trim()
      );

    if (
      !voucherDraft
        .a_favor_de
        .trim()
    ) {
      onError(
        "Completá el campo A favor de."
      );

      return;
    }

    if (
      serviciosValidos.length === 0
    ) {
      onError(
        "Agregá al menos un servicio para el voucher."
      );

      return;
    }

    const ok =
      await createVoucherForFile(
        file.id,
        {
          requiere_voucher:
            true,

          reserva_id:
            voucherDraft
              .reserva_id ||
            null,

          a_favor_de:
            voucherDraft
              .a_favor_de ||
            file.clientes
              ?.nombre_completo ||
            null,

          servicios:
            serviciosValidos.map(
              (servicio) => ({
                servicio_detalle:
                  servicio
                    .servicio_detalle,

                cantidad_pasajeros:
                  Math.max(
                    Number(
                      servicio
                        .cantidad_pasajeros ||
                        1
                    ),
                    1
                  ),

                fecha_inicio:
                  servicio
                    .fecha_inicio ||
                  null,

                fecha_fin:
                  servicio
                    .fecha_fin ||
                  null
              })
            )
        }
      );

    if (!ok) {
      return;
    }

    onError(null);

    onSaved(
      "Voucher creado correctamente."
    );
  }

  function printVoucher() {
    if (!voucher) {
      onError(
        "Este file no tiene voucher cargado."
      );

      return;
    }

    try {
      printFileVoucherPdf({
        file,
        voucher,
        servicios:
          serviciosVoucher
      });
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "No se pudo generar el voucher."
      );
    }
  }

  return (
    <div className="mt-3 rounded-[14px] border border-black/10 bg-[#f8fafc] p-3 text-[12px]">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <FieldLabel>
            Voucher
          </FieldLabel>

          {voucher ? (
            <>
              <div className="font-semibold text-[#172033]">
                Voucher N°{" "}
                {voucher.numero_voucher ||
                  "—"}
              </div>

              <div className="font-normal text-[#64748b]">
                Reserva:{" "}
                {voucher.reserva_id ||
                  "—"}{" "}
                · A favor de:{" "}
                {voucher.a_favor_de ||
                  file.clientes
                    ?.nombre_completo ||
                  "—"}
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold text-[#172033]">
                Este file no tiene
                voucher cargado
              </div>

              <div className="font-normal text-[#64748b]">
                Podés cargarlo ahora y
                generar el PDF para el
                cliente.
              </div>
            </>
          )}
        </div>

        {voucher ? (
          <button
            type="button"
            onClick={printVoucher}
            className="h-8 shrink-0 rounded-[10px] bg-[#4f7c90] px-3 text-[12px] font-medium text-white shadow-sm hover:bg-[#406b7d]"
          >
            Generar voucher PDF
          </button>
        ) : null}
      </div>

      {voucher ? (
        <div className="grid gap-1.5">
          {serviciosVoucher.length >
          0 ? (
            serviciosVoucher.map(
              (servicio) => (
                <div
                  key={servicio.id}
                  className="rounded-[10px] border border-black/10 bg-white px-3 py-2"
                >
                  <div className="font-medium text-[#172033]">
                    {
                      servicio.servicio_detalle
                    }
                  </div>

                  <div className="mt-0.5 text-[11px] font-normal text-[#64748b]">
                    {
                      servicio.cantidad_pasajeros
                    }{" "}
                    pasajero/s ·{" "}
                    {formatDateAR(
                      servicio.fecha_inicio
                    )}{" "}
                    →{" "}
                    {formatDateAR(
                      servicio.fecha_fin
                    )}
                  </div>
                </div>
              )
            )
          ) : (
            <div className="rounded-[10px] border border-black/10 bg-white px-3 py-2 text-[#64748b]">
              Sin servicios cargados.
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <FieldLabel>
                ID de reserva
              </FieldLabel>

              <TextInput
                value={
                  voucherDraft
                    .reserva_id
                }
                onChange={(value) =>
                  setVoucherField(
                    "reserva_id",
                    value
                  )
                }
                placeholder="ID reserva / localizador"
              />
            </div>

            <div>
              <FieldLabel>
                A favor de
              </FieldLabel>

              <TextInput
                value={
                  voucherDraft
                    .a_favor_de
                }
                onChange={(value) =>
                  setVoucherField(
                    "a_favor_de",
                    value
                  )
                }
                placeholder="Cliente / pasajero"
              />
            </div>
          </div>

          <div className="grid gap-2">
            {voucherDraft.servicios.map(
              (
                servicio,
                index
              ) => (
                <div
                  key={`voucher-draft-${index}`}
                  className="rounded-[12px] border border-black/10 bg-white p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="font-semibold text-[#172033]">
                      Servicio{" "}
                      {index + 1}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeServicio(
                          index
                        )
                      }
                      disabled={
                        voucherDraft
                          .servicios
                          .length <= 1
                      }
                      className="h-7 rounded-[9px] border border-black/10 bg-white px-2 text-[11px] font-medium text-[#64748b] hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <FieldLabel>
                        Servicio / detalle
                        libre
                      </FieldLabel>

                      <TextArea
                        value={
                          servicio
                            .servicio_detalle
                        }
                        onChange={(
                          value
                        ) =>
                          updateServicio(
                            index,
                            {
                              servicio_detalle:
                                value
                            }
                          )
                        }
                        placeholder="Detalle del servicio para el voucher..."
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-[130px_1fr_1fr]">
                      <div>
                        <FieldLabel>
                          Pasajeros
                        </FieldLabel>

                        <TextInput
                          value={String(
                            servicio
                              .cantidad_pasajeros ||
                              1
                          )}
                          onChange={(
                            value
                          ) =>
                            updateServicio(
                              index,
                              {
                                cantidad_pasajeros:
                                  Math.max(
                                    parseInt(
                                      value.replace(
                                        /\D/g,
                                        ""
                                      ),
                                      10
                                    ) || 1,
                                    1
                                  )
                              }
                            )
                          }
                          inputMode="numeric"
                          placeholder="1"
                        />
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
                          onChange={(
                            value
                          ) =>
                            updateServicio(
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
                          onChange={(
                            value
                          ) =>
                            updateServicio(
                              index,
                              {
                                fecha_fin:
                                  value
                              }
                            )
                          }
                          min={
                            servicio
                              .fecha_inicio ||
                            undefined
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <LineButton
              onClick={addServicio}
            >
              + Agregar servicio
            </LineButton>

            <button
              type="button"
              onClick={createVoucher}
              disabled={saving}
              className="h-8 rounded-[10px] bg-[#4f7c90] px-4 text-[12px] font-medium text-white shadow-sm hover:bg-[#406b7d] disabled:opacity-50"
            >
              {saving
                ? "Creando..."
                : "Crear voucher"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
