// src/components/files/hooks/useFileWizard.ts

import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useFilesStore,
  type Cliente,
  type FileVoucherServicioInput,
  type FileWizardInput,
  type MovimientoTesoreria,
  type PagoComercial
} from "../../../store/filesStore";

import {
  calculateFileUtility,
  clearStoredFileDraft,
  createInitialFileDraft,
  getToday,
  isDateBefore,
  isValidFile,
  joinDestinos,
  loadStoredFileDraft,
  parseMoney,
  saveStoredFileDraft,
  type FileWizardDraft,
  type FileWizardReadiness,
  type FileWizardStep,
  type SelectOption
} from "../filesModel";

type UseFileWizardParams = {
  onClose: () => void;
  onSaved: (
    message: string
  ) => void;
};

function normalizeCurrency(
  value: string | null | undefined
): string {
  return String(value || "ARS")
    .trim()
    .toUpperCase();
}

function getMovimientoImporteEnMonedaVenta(
  movement: MovimientoTesoreria,
  monedaVenta: string
): number {
  const importe = parseMoney(
    movement.importe
  );

  const monedaMovimiento =
    normalizeCurrency(
      movement.moneda
    );

  const monedaOperacion =
    normalizeCurrency(
      monedaVenta
    );

  if (importe <= 0) {
    return 0;
  }

  if (
    monedaMovimiento ===
    monedaOperacion
  ) {
    return importe;
  }

  const tipoCambio =
    parseMoney(
      movement.tipo_cambio
    );

  if (tipoCambio <= 0) {
    return 0;
  }

  if (
    monedaOperacion === "USD" &&
    monedaMovimiento === "ARS"
  ) {
    return importe / tipoCambio;
  }

  if (
    monedaOperacion === "ARS" &&
    monedaMovimiento === "USD"
  ) {
    return importe * tipoCambio;
  }

  return importe;
}

function normalizeMovimientoEquivalente(
  movement: MovimientoTesoreria,
  monedaVenta: string
): MovimientoTesoreria {
  const monedaMovimiento =
    normalizeCurrency(
      movement.moneda
    );

  const monedaOperacion =
    normalizeCurrency(
      monedaVenta
    );

  const monedasDiferentes =
    monedaMovimiento !==
    monedaOperacion;

  const importeEquivalente =
    getMovimientoImporteEnMonedaVenta(
      movement,
      monedaOperacion
    );

  return {
    ...movement,

    moneda:
      monedaMovimiento,

    tipo_cambio:
      monedasDiferentes
        ? parseMoney(
            movement.tipo_cambio
          ) || null
        : null,

    moneda_equivalente:
      monedaOperacion,

    importe_equivalente:
      importeEquivalente > 0
        ? Number(
            importeEquivalente
              .toFixed(4)
          )
        : null
  };
}

function areMovementsEqual(
  current: MovimientoTesoreria[],
  next: MovimientoTesoreria[]
): boolean {
  if (
    current.length !==
    next.length
  ) {
    return false;
  }

  return next.every(
    (
      nextMovement,
      index
    ) => {
      const currentMovement =
        current[index];

      if (!currentMovement) {
        return false;
      }

      return (
        parseMoney(
          currentMovement.importe
        ) ===
          parseMoney(
            nextMovement.importe
          ) &&
        currentMovement.moneda ===
          nextMovement.moneda &&
        currentMovement.forma_pago_id ===
          nextMovement.forma_pago_id &&
        currentMovement.forma_pago ===
          nextMovement.forma_pago &&
        currentMovement.caja_id ===
          nextMovement.caja_id &&
        currentMovement.caja ===
          nextMovement.caja &&
        currentMovement.tipo_cambio ===
          nextMovement.tipo_cambio &&
        currentMovement.moneda_equivalente ===
          nextMovement.moneda_equivalente &&
        currentMovement.importe_equivalente ===
          nextMovement.importe_equivalente
      );
    }
  );
}

export function useFileWizard({
  onClose,
  onSaved
}: UseFileWizardParams) {
  const saving =
    useFilesStore(
      (state) => state.saving
    );

  const clientesSearch =
    useFilesStore(
      (state) =>
        state.clientesSearch
    );

  const catalogos =
    useFilesStore(
      (state) => state.catalogos
    );

  const currentProfile =
    useFilesStore(
      (state) =>
        state.currentProfile
    );

  const canManageFiles =
    useFilesStore(
      (state) =>
        state.canManageFiles
    );

  const searchClientesByPhone =
    useFilesStore(
      (state) =>
        state.searchClientesByPhone
    );

  const createDestinoInline =
    useFilesStore(
      (state) =>
        state.createDestinoInline
    );

  const saveFileWizard =
    useFilesStore(
      (state) =>
        state.saveFileWizard
    );

  const storedDraft =
    useMemo(
      () =>
        loadStoredFileDraft(),
      []
    );

  const [
    step,
    setStep
  ] = useState<FileWizardStep>(
    () =>
      storedDraft?.step || 1
  );

  const [
    wizardError,
    setWizardError
  ] = useState<string | null>(
    null
  );

  const [
    draftSavedAt,
    setDraftSavedAt
  ] = useState<string | null>(
    null
  );

  const [
    autoCompletePagoComercial,
    setAutoCompletePagoComercial
  ] = useState<boolean>(() => {
    const storedPayments =
      storedDraft?.draft
        .pagosComerciales || [];

    return !storedPayments.some(
      (payment) =>
        parseMoney(
          payment.importe
        ) > 0
    );
  });

  const [
    draft,
    setDraft
  ] = useState<FileWizardDraft>(
    () => {
      if (storedDraft?.draft) {
        return storedDraft.draft;
      }

      const initial =
        createInitialFileDraft();

      initial.cliente.vendedor_id =
        currentProfile?.id || "";

      initial.cliente.sucursal_id =
        currentProfile
          ?.sucursal_id || "";

      return initial;
    }
  );

  const venta = parseMoney(
    draft.venta.importe_venta
  );

  const netoOperador =
    parseMoney(
      draft.venta.neto_operador
    );

  const utilidad =
    calculateFileUtility(
      venta,
      netoOperador
    );

  const totalPagosComerciales =
    draft.pagosComerciales.reduce(
      (
        total,
        payment
      ) =>
        total +
        parseMoney(
          payment.importe
        ),
      0
    );

  const totalTesoreria =
    draft.movimientosTesoreria.reduce(
      (
        total,
        movement
      ) =>
        total +
        getMovimientoImporteEnMonedaVenta(
          movement,
          draft.venta.moneda
        ),
      0
    );

  const saldoComercial =
    Math.max(
      0,
      venta -
        totalPagosComerciales
    );

  const saldo =
    Math.max(
      0,
      venta -
        totalTesoreria
    );

  const visibleEnFiles =
    saldo <= 0.009;

  const metodoOptions:
    SelectOption[] =
    catalogos.metodosContacto.map(
      (item) => ({
        value: item.nombre,
        label: item.nombre
      })
    );

  const operadorOptions:
    SelectOption[] =
    catalogos.operadores.map(
      (item) => ({
        value: item.id,
        label: item.nombre
      })
    );

  const servicioOptions:
    SelectOption[] =
    catalogos.servicios.map(
      (item) => ({
        value: item.nombre,
        label: item.nombre
      })
    );

  const destinoOptions:
    SelectOption[] =
    catalogos.destinos.map(
      (item) => ({
        value: item.nombre,
        label: item.pais
          ? `${item.nombre} · ${item.pais}`
          : item.nombre
      })
    );

  const formaPagoOptions:
    SelectOption[] =
    catalogos.formasPago.map(
      (item) => ({
        value: item.id,
        label: item.nombre
      })
    );

  const cajaOptions:
    SelectOption[] =
    catalogos.cajas.map(
      (item) => ({
        value: item.id,
        label: item.moneda
          ? `${item.nombre} · ${item.moneda}`
          : item.nombre
      })
    );

  const vendedorOptions:
    SelectOption[] =
    catalogos.vendedores.map(
      (item) => ({
        value: item.id,
        label: [
          item.nombre,
          item.apellido
        ]
          .filter(Boolean)
          .join(" ")
          .trim()
      })
    );

  const sucursalOptions:
    SelectOption[] =
    catalogos.sucursales.map(
      (item) => ({
        value: item.id,
        label: item.nombre
      })
    );

  /*
   * El pago comercial inicial sigue
   * automáticamente al precio de venta.
   *
   * Cuando el vendedor modifica el importe,
   * agrega otra línea o elimina una línea,
   * el automatismo se desactiva.
   */
  useEffect(() => {
    if (
      !autoCompletePagoComercial
    ) {
      return;
    }

    setDraft((current) => {
      const firstPayment =
        current
          .pagosComerciales[0];

      if (!firstPayment) {
        return {
          ...current,
          pagosComerciales: [
            {
              importe: venta,
              moneda:
                current.venta.moneda,
              forma_pago_id: null,
              forma_pago: ""
            }
          ]
        };
      }

      if (
        parseMoney(
          firstPayment.importe
        ) === venta &&
        firstPayment.moneda ===
          current.venta.moneda
      ) {
        return current;
      }

      return {
        ...current,

        pagosComerciales:
          current
            .pagosComerciales
            .map(
              (
                payment,
                index
              ) =>
                index === 0
                  ? {
                      ...payment,
                      importe: venta,
                      moneda:
                        current
                          .venta
                          .moneda
                    }
                  : payment
            )
      };
    });
  }, [
    autoCompletePagoComercial,
    venta
  ]);

  /*
   * Mientras el pago real no sea diferente,
   * se copia automáticamente cada línea del
   * pago comercial al pago recibido.
   *
   * Las cajas seleccionadas se conservan.
   */
  useEffect(() => {
    if (
      draft
        .pagoDiferenteOficina
    ) {
      return;
    }

    setDraft((current) => {
      const nextMovements =
        current
          .pagosComerciales
          .map(
            (
              payment,
              index
            ) => {
              const previous =
                current
                  .movimientosTesoreria[
                    index
                  ];

              return normalizeMovimientoEquivalente(
                {
                  ...previous,

                  importe:
                    parseMoney(
                      payment.importe
                    ),

                  moneda:
                    payment.moneda ||
                    current
                      .venta.moneda,

                  forma_pago_id:
                    payment
                      .forma_pago_id ||
                    null,

                  forma_pago:
                    payment
                      .forma_pago ||
                    "",

                  caja_id:
                    previous
                      ?.caja_id ||
                    null,

                  caja:
                    previous?.caja ||
                    "",

                  tipo_cambio:
                    previous
                      ?.tipo_cambio ||
                    null
                },
                current.venta.moneda
              );
            }
          );

      if (
        areMovementsEqual(
          current
            .movimientosTesoreria,
          nextMovements
        )
      ) {
        return current;
      }

      return {
        ...current,
        movimientosTesoreria:
          nextMovements
      };
    });
  }, [
    draft
      .pagoDiferenteOficina,
    draft.pagosComerciales,
    draft.venta.moneda
  ]);

  /*
   * Guardado automático del borrador.
   */
  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          saveStoredFileDraft(
            draft,
            step
          );

          setDraftSavedAt(
            new Date()
              .toLocaleTimeString(
                "es-AR",
                {
                  hour: "2-digit",
                  minute: "2-digit"
                }
              )
          );
        },
        700
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    draft,
    step
  ]);

  function clearWizardError() {
    setWizardError(null);
  }

  function setCliente<
    K extends keyof FileWizardDraft["cliente"]
  >(
    key: K,
    value:
      FileWizardDraft["cliente"][K]
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,

      cliente: {
        ...current.cliente,
        [key]: value
      },

      voucher:
        key ===
          "nombre_completo" &&
        !current.voucher
          .a_favor_de
          ? {
              ...current.voucher,
              a_favor_de:
                String(
                  value || ""
                )
            }
          : current.voucher
    }));
  }

  function setVenta<
    K extends keyof FileWizardDraft["venta"]
  >(
    key: K,
    value:
      FileWizardDraft["venta"][K]
  ) {
    setWizardError(null);

    setDraft((current) => {
      const nextVenta = {
        ...current.venta,
        [key]: value
      };

      let nextVoucher =
        current.voucher;

      if (
        key === "fecha_in"
      ) {
        nextVoucher = {
          ...current.voucher,

          servicios:
            current.voucher
              .servicios
              .map((service) => ({
                ...service,

                fecha_inicio:
                  service
                    .fecha_inicio ||
                  String(value),

                fecha_fin:
                  service.fecha_fin ||
                  (
                    current.venta
                      .solo_ida
                      ? String(
                          value
                        )
                      : current
                          .venta
                          .fecha_out ||
                        String(
                          value
                        )
                  )
              }))
        };
      }

      if (
        key === "fecha_out"
      ) {
        nextVoucher = {
          ...current.voucher,

          servicios:
            current.voucher
              .servicios
              .map((service) => ({
                ...service,

                fecha_fin:
                  String(value) ||
                  service.fecha_fin
              }))
        };
      }

      return {
        ...current,
        venta: nextVenta,
        voucher: nextVoucher
      };
    });
  }

  function setPhone(
    prefix: string,
    local: string
  ) {
    setWizardError(null);

    const cleanPrefix =
      prefix.startsWith("+")
        ? prefix
        : `+${prefix}`;

    const cleanLocal =
      local.replace(
        /\D/g,
        ""
      );

    setDraft((current) => ({
      ...current,

      phonePrefix:
        cleanPrefix,

      phoneLocal:
        cleanLocal,

      cliente: {
        ...current.cliente,

        telefono:
          `${cleanPrefix}${cleanLocal}`
      }
    }));

    if (
      cleanLocal.length >= 3
    ) {
      void searchClientesByPhone(
        `${cleanPrefix}${cleanLocal}`
      );
    }
  }

  function selectCliente(
    cliente: Cliente
  ) {
    setWizardError(null);

    const prefix =
      cliente.telefono
        .startsWith("+549")
        ? "+549"
        : draft.phonePrefix;

    const local =
      cliente.telefono
        .replace(prefix, "")
        .replace("+549", "")
        .replace(/\D/g, "");

    setDraft((current) => ({
      ...current,

      phonePrefix: prefix,
      phoneLocal: local,

      cliente: {
        id: cliente.id,

        nombre_completo:
          cliente
            .nombre_completo,

        telefono:
          cliente.telefono,

        email:
          cliente.email || "",

        origen:
          cliente.origen || "",

        vendedor_id:
          cliente
            .vendedor_id ||
          currentProfile?.id ||
          "",

        sucursal_id:
          cliente
            .sucursal_id ||
          currentProfile
            ?.sucursal_id ||
          ""
      },

      voucher: {
        ...current.voucher,

        a_favor_de:
          current.voucher
            .a_favor_de ||
          cliente
            .nombre_completo
      }
    }));
  }

  function selectOperador(
    operadorId: string
  ) {
    setWizardError(null);

    const operador =
      catalogos.operadores.find(
        (item) =>
          item.id === operadorId
      );

    setDraft((current) => ({
      ...current,

      venta: {
        ...current.venta,

        operador_id:
          operador?.id || "",

        operador:
          operador?.nombre || ""
      }
    }));
  }

  function setMoneda(
    value: string
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,

      venta: {
        ...current.venta,
        moneda: value
      },

      pagosComerciales:
        current
          .pagosComerciales
          .map((payment) => ({
            ...payment,
            moneda: value
          })),

      movimientosTesoreria:
        current
          .movimientosTesoreria
          .map((movement) =>
            normalizeMovimientoEquivalente(
              {
                ...movement,
                moneda: value
              },
              value
            )
          )
    }));
  }

  function updatePago(
    index: number,
    patch:
      Partial<PagoComercial>
  ) {
    setWizardError(null);

    if (
      index === 0 &&
      patch.importe !==
        undefined
    ) {
      setAutoCompletePagoComercial(
        false
      );
    }

    setDraft((current) => ({
      ...current,

      pagosComerciales:
        current
          .pagosComerciales
          .map(
            (
              payment,
              itemIndex
            ) =>
              itemIndex === index
                ? {
                    ...payment,
                    ...patch
                  }
                : payment
          )
    }));
  }

  function selectFormaPagoComercial(
    index: number,
    formaPagoId: string
  ) {
    const paymentMethod =
      catalogos.formasPago.find(
        (item) =>
          item.id ===
          formaPagoId
      );

    updatePago(index, {
      forma_pago_id:
        paymentMethod?.id ||
        null,

      forma_pago:
        paymentMethod?.nombre ||
        null
    });
  }

  function addPago() {
    setWizardError(null);

    setAutoCompletePagoComercial(
      false
    );

    setDraft((current) => ({
      ...current,

      pagosComerciales: [
        ...current
          .pagosComerciales,

        {
          importe: 0,

          moneda:
            current
              .venta.moneda,

          forma_pago_id:
            null,

          forma_pago: ""
        }
      ]
    }));
  }

  function removePago(
    index: number
  ) {
    setWizardError(null);

    setAutoCompletePagoComercial(
      false
    );

    setDraft((current) => ({
      ...current,

      pagosComerciales:
        current
          .pagosComerciales
          .length > 1
          ? current
              .pagosComerciales
              .filter(
                (
                  _,
                  itemIndex
                ) =>
                  itemIndex !==
                  index
              )
          : [
              {
                importe: 0,

                moneda:
                  current
                    .venta.moneda,

                forma_pago_id:
                  null,

                forma_pago: ""
              }
            ]
    }));
  }

  function setPagoDiferenteOficina(
    value: boolean
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,
      pagoDiferenteOficina:
        value
    }));
  }

  function updateMovimiento(
    index: number,
    patch:
      Partial<MovimientoTesoreria>
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,

      movimientosTesoreria:
        current
          .movimientosTesoreria
          .map(
            (
              movement,
              itemIndex
            ) =>
              itemIndex === index
                ? normalizeMovimientoEquivalente(
                    {
                      ...movement,
                      ...patch
                    },
                    current.venta.moneda
                  )
                : movement
          )
    }));
  }

  function selectCaja(
    index: number,
    cajaId: string
  ) {
    const caja =
      catalogos.cajas.find(
        (item) =>
          item.id === cajaId
      );

    updateMovimiento(
      index,
      {
        caja_id:
          caja?.id || null,

        caja:
          caja?.nombre || null
      }
    );
  }

  function selectFormaPagoReal(
    index: number,
    formaPagoId: string
  ) {
    const paymentMethod =
      catalogos.formasPago.find(
        (item) =>
          item.id ===
          formaPagoId
      );

    updateMovimiento(
      index,
      {
        forma_pago_id:
          paymentMethod?.id ||
          null,

        forma_pago:
          paymentMethod
            ?.nombre ||
          null
      }
    );
  }

  function addMovimiento() {
    setWizardError(null);

    setDraft((current) => ({
      ...current,

      movimientosTesoreria: [
        ...current
          .movimientosTesoreria,

        normalizeMovimientoEquivalente(
          {
            importe: 0,

            moneda:
              current
                .venta.moneda,

            forma_pago_id:
              null,

            forma_pago: "",

            caja_id: null,

            caja: ""
          },
          current.venta.moneda
        )
      ]
    }));
  }

  function removeMovimiento(
    index: number
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,

      movimientosTesoreria:
        current
          .movimientosTesoreria
          .length > 1
          ? current
              .movimientosTesoreria
              .filter(
                (
                  _,
                  itemIndex
                ) =>
                  itemIndex !==
                  index
              )
          : [
              normalizeMovimientoEquivalente(
                {
                  importe: 0,

                  moneda:
                    current
                      .venta.moneda,

                  forma_pago_id:
                    null,

                  forma_pago: "",

                  caja_id: null,

                  caja: ""
                },
                current.venta.moneda
              )
            ]
    }));
  }

  function setPagoParcial(
    value: boolean
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,

      pagoParcial: value,

      fechaIngresoGastos:
        value
          ? current
              .fechaIngresoGastos ||
            getToday()
          : ""
    }));
  }

  function setFechaIngresoGastos(
    value: string
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,
      fechaIngresoGastos:
        value
    }));
  }

  function setUsaMarkupAdicional(
    value: boolean
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,

      usaMarkupAdicional:
        value,

      markupAdicionalPct:
        value
          ? current
              .markupAdicionalPct
          : ""
    }));
  }

  function setMarkupAdicionalPct(
    value: string
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,
      markupAdicionalPct:
        value
    }));
  }

  function setVoucher<
    K extends keyof FileWizardDraft["voucher"]
  >(
    key: K,
    value:
      FileWizardDraft["voucher"][K]
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,

      voucher: {
        ...current.voucher,
        [key]: value
      }
    }));
  }

  function setRequiereVoucher(
    value: boolean
  ) {
    setWizardError(null);

    setDraft((current) => {
      const fechaInicio =
        current.venta.fecha_in ||
        getToday();

      const fechaFin =
        current.venta.solo_ida
          ? fechaInicio
          : current
              .venta.fecha_out ||
            fechaInicio;

      return {
        ...current,

        voucher: {
          ...current.voucher,

          requiere_voucher:
            value,

          a_favor_de:
            value
              ? current.voucher
                  .a_favor_de ||
                current.cliente
                  .nombre_completo
              : current.voucher
                  .a_favor_de,

          servicios:
            current.voucher
              .servicios.length > 0
              ? current.voucher
                  .servicios
                  .map(
                    (service) => ({
                      ...service,

                      fecha_inicio:
                        service
                          .fecha_inicio ||
                        fechaInicio,

                      fecha_fin:
                        service
                          .fecha_fin ||
                        fechaFin
                    })
                  )
              : [
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
        }
      };
    });
  }

  function updateVoucherServicio(
    index: number,
    patch:
      Partial<FileVoucherServicioInput>
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,

      voucher: {
        ...current.voucher,

        servicios:
          current.voucher
            .servicios
            .map(
              (
                service,
                itemIndex
              ) =>
                itemIndex ===
                index
                  ? {
                      ...service,
                      ...patch
                    }
                  : service
            )
      }
    }));
  }

  function addVoucherServicio() {
    setWizardError(null);

    setDraft((current) => {
      const fechaInicio =
        current.venta.fecha_in ||
        getToday();

      const fechaFin =
        current.venta.solo_ida
          ? fechaInicio
          : current
              .venta.fecha_out ||
            fechaInicio;

      return {
        ...current,

        voucher: {
          ...current.voucher,

          servicios: [
            ...current.voucher
              .servicios,

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
        }
      };
    });
  }

  function removeVoucherServicio(
    index: number
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,

      voucher: {
        ...current.voucher,

        servicios:
          current.voucher
            .servicios.length > 1
            ? current.voucher
                .servicios
                .filter(
                  (
                    _,
                    itemIndex
                  ) =>
                    itemIndex !==
                    index
                )
            : current.voucher
                .servicios
      }
    }));
  }

  function setConfirmado(
    value: boolean
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,
      confirmado: value
    }));
  }

  function getStepIssues(
    currentStep:
      FileWizardStep
  ): string[] {
    const issues: string[] = [];

    if (currentStep === 1) {
      if (
        !draft.cliente
          .telefono.trim() ||
        draft.phoneLocal.length <
          3
      ) {
        issues.push(
          "Ingresá un teléfono válido."
        );
      }

      if (
        !draft.cliente
          .nombre_completo
          .trim()
      ) {
        issues.push(
          "Ingresá el nombre completo del cliente."
        );
      }

      if (
        !draft.cliente
          .origen.trim()
      ) {
        issues.push(
          "Seleccioná el método de contacto."
        );
      }

      if (
        !draft.cliente
          .vendedor_id
      ) {
        issues.push(
          "Seleccioná el vendedor."
        );
      }

      if (
        !draft.cliente
          .sucursal_id
      ) {
        issues.push(
          "Seleccioná la sucursal."
        );
      }
    }

    if (currentStep === 2) {
      if (
        !isValidFile(
          draft.venta.numero_file
        )
      ) {
        issues.push(
          "El número de file debe ser numérico."
        );
      }

      if (
        !draft.venta
          .operador_id
      ) {
        issues.push(
          "Seleccioná el operador."
        );
      }

      if (
        !draft.venta
          .servicio.trim()
      ) {
        issues.push(
          "Seleccioná el tipo de servicio."
        );
      }

      if (
        draft.venta
          .destinos.length === 0
      ) {
        issues.push(
          "Seleccioná al menos un destino."
        );
      }

      if (
        !draft.venta.fecha_in
      ) {
        issues.push(
          "Seleccioná la fecha IN."
        );
      }

      if (
        !draft.venta.solo_ida &&
        !draft.venta.fecha_out
      ) {
        issues.push(
          "Seleccioná la fecha OUT."
        );
      }

      if (
        !draft.venta.solo_ida &&
        isDateBefore(
          draft.venta.fecha_out,
          draft.venta.fecha_in
        )
      ) {
        issues.push(
          "La fecha OUT no puede ser anterior a la fecha IN."
        );
      }

      if (venta <= 0) {
        issues.push(
          "La venta debe ser mayor a cero."
        );
      }

      if (
        netoOperador <= 0
      ) {
        issues.push(
          "El neto del operador debe ser mayor a cero."
        );
      }

      if (utilidad < 0) {
        issues.push(
          "El neto del operador no puede superar la venta."
        );
      }

      if (
        draft.voucher
          .requiere_voucher
      ) {
        if (
          !draft.voucher
            .a_favor_de.trim()
        ) {
          issues.push(
            "Completá el titular del voucher."
          );
        }

        const validServices =
          draft.voucher
            .servicios
            .filter(
              (service) =>
                service
                  .servicio_detalle
                  .trim()
            );

        if (
          validServices.length ===
          0
        ) {
          issues.push(
            "Agregá al menos un servicio al voucher."
          );
        }

        if (
          validServices.some(
            (service) =>
              Number(
                service
                  .cantidad_pasajeros ||
                  0
              ) <= 0
          )
        ) {
          issues.push(
            "La cantidad de pasajeros del voucher debe ser mayor a cero."
          );
        }
      }
    }

    if (currentStep === 3) {
      const commercialPayments =
        draft
          .pagosComerciales
          .filter(
            (payment) =>
              parseMoney(
                payment.importe
              ) > 0
          );

      if (
        commercialPayments
          .length === 0
      ) {
        issues.push(
          "Cargá al menos un pago comercial."
        );
      }

      if (
        commercialPayments.some(
          (payment) =>
            !payment
              .forma_pago_id ||
            !payment.moneda
        )
      ) {
        issues.push(
          "Completá la forma y moneda de todos los pagos comerciales."
        );
      }

      if (
        totalPagosComerciales >
        venta + 0.009
      ) {
        issues.push(
          "Los pagos comerciales no pueden superar la venta."
        );
      }

      if (
        !draft.pagoParcial &&
        Math.abs(
          totalPagosComerciales -
            venta
        ) > 0.009
      ) {
        issues.push(
          "Los pagos comerciales deben igualar la venta. Si queda saldo, marcá pago parcial."
        );
      }

      if (
        draft.pagoParcial &&
        totalPagosComerciales >=
          venta
      ) {
        issues.push(
          "El pago parcial debe dejar saldo pendiente."
        );
      }

      if (
        draft.pagoParcial &&
        !draft
          .fechaIngresoGastos
      ) {
        issues.push(
          "Completá la fecha de ingreso a gastos."
        );
      }

      if (
        draft
          .usaMarkupAdicional
      ) {
        const markup =
          parseMoney(
            draft
              .markupAdicionalPct
          );

        if (
          markup <= 0 ||
          markup > 100
        ) {
          issues.push(
            "Ingresá un porcentaje de markup válido."
          );
        }
      }

      const realPayments =
        draft
          .movimientosTesoreria
          .filter(
            (movement) =>
              parseMoney(
                movement.importe
              ) > 0
          );

      const movementWithoutRate =
        realPayments.find(
          (movement) =>
            normalizeCurrency(
              movement.moneda
            ) !==
              normalizeCurrency(
                draft.venta.moneda
              ) &&
            parseMoney(
              movement.tipo_cambio
            ) <= 0
        );

      if (movementWithoutRate) {
        issues.push(
          `Ingresá el tipo de cambio para convertir ${normalizeCurrency(
            movementWithoutRate.moneda
          )} a ${normalizeCurrency(
            draft.venta.moneda
          )}.`
        );
      }

      if (
        realPayments.length === 0
      ) {
        issues.push(
          "Cargá el pago real recibido."
        );
      }

      if (
        realPayments.some(
          (movement) =>
            !movement.caja_id ||
            !movement
              .forma_pago_id ||
            !movement.moneda
        )
      ) {
        issues.push(
          "Completá caja, forma e importe de todos los pagos reales."
        );
      }

      if (
        totalTesoreria >
        venta + 0.009
      ) {
        issues.push(
          "El pago real no puede superar la venta."
        );
      }

      if (
        !draft.pagoParcial &&
        Math.abs(
          totalTesoreria -
            venta
        ) > 0.009
      ) {
        issues.push(
          "El pago real debe igualar la venta."
        );
      }

      if (
        draft.pagoParcial &&
        totalTesoreria >=
          venta
      ) {
        issues.push(
          "El pago real parcial debe dejar saldo pendiente."
        );
      }
    }

    if (
      currentStep === 4 &&
      !draft.confirmado
    ) {
      issues.push(
        "Confirmá que los datos son correctos."
      );
    }

    return issues;
  }

  const readiness:
    FileWizardReadiness =
    useMemo(() => {
      const issues = [
        ...getStepIssues(1),
        ...getStepIssues(2),
        ...getStepIssues(3)
      ];

      return {
        ready:
          issues.length === 0,
        issues
      };
    }, [
      draft,
      venta,
      netoOperador,
      utilidad,
      totalPagosComerciales,
      totalTesoreria
    ]);

  function saveDraftManually() {
    saveStoredFileDraft(
      draft,
      step
    );

    setDraftSavedAt(
      new Date()
        .toLocaleTimeString(
          "es-AR",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        )
    );
  }

  function discardDraft() {
    clearStoredFileDraft();
    onClose();
  }

  function previousStep() {
    setWizardError(null);

    setStep(
      (current) =>
        Math.max(
          1,
          current - 1
        ) as FileWizardStep
    );
  }

  function nextStep() {
    const issues =
      getStepIssues(step);

    if (
      issues.length > 0
    ) {
      setWizardError(
        issues[0]
      );

      return;
    }

    setWizardError(null);

    setStep(
      (current) =>
        Math.min(
          4,
          current + 1
        ) as FileWizardStep
    );
  }

  async function submit() {
    const previousIssues = [
      ...getStepIssues(1),
      ...getStepIssues(2),
      ...getStepIssues(3)
    ];

    if (
      previousIssues.length > 0
    ) {
      setWizardError(
        previousIssues[0]
      );

      return;
    }

    const confirmationIssues =
      getStepIssues(4);

    if (
      confirmationIssues.length >
      0
    ) {
      setWizardError(
        confirmationIssues[0]
      );

      return;
    }

    setWizardError(null);

    const validMovements =
      draft
        .movimientosTesoreria
        .filter(
          (movement) =>
            parseMoney(
              movement.importe
            ) > 0
        )
        .map((movement) =>
          normalizeMovimientoEquivalente(
            movement,
            draft.venta.moneda
          )
        );

    const payload:
      FileWizardInput = {
      cliente: {
        id:
          draft.cliente.id,

        nombre_completo:
          draft.cliente
            .nombre_completo,

        telefono:
          draft.cliente
            .telefono,

        email:
          draft.cliente.email,

        origen:
          draft.cliente.origen,

        vendedor_id:
          draft.cliente
            .vendedor_id ||
          currentProfile?.id ||
          null,

        sucursal_id:
          draft.cliente
            .sucursal_id ||
          currentProfile
            ?.sucursal_id ||
          null
      },

      file: {
        numero_file:
          draft.venta
            .numero_file,

        fecha_venta:
          draft.venta
            .fecha_venta,

        operador_id:
          draft.venta
            .operador_id ||
          null,

        operador:
          draft.venta
            .operador ||
          null,

        servicio_id:
          draft.venta
            .servicio_id ||
          null,

        servicio:
          draft.venta.servicio,

        metodo_contacto:
          draft.cliente.origen,

        destino:
          joinDestinos(
            draft.venta.destinos
          ),

        fecha_in:
          draft.venta.fecha_in,

        fecha_out:
          draft.venta.solo_ida
            ? null
            : draft.venta
                .fecha_out,

        solo_ida:
          draft.venta.solo_ida,

        importe_bruto:
          venta,

        importe_final:
          venta,

        moneda:
          draft.venta.moneda,

        neto_operador:
          netoOperador,

        pago_parcial:
          draft.pagoParcial,

        total_pagado:
          totalTesoreria,

        saldo_cta_cte:
          saldo,

        visible_en_files:
          visibleEnFiles,

        riesgo: false,

        importe_riesgo: 0,

        riesgo_motivo:
          null,

        confirmado_vendedor:
          draft.confirmado,

        observaciones:
          draft.venta
            .observaciones,

        vendedor_id:
          canManageFiles
            ? draft.cliente
                .vendedor_id ||
              currentProfile?.id ||
              null
            : currentProfile?.id ||
              null,

        sucursal_id:
          draft.cliente
            .sucursal_id ||
          currentProfile
            ?.sucursal_id ||
          null
      },

      pagosComerciales:
        draft
          .pagosComerciales
          .filter(
            (payment) =>
              parseMoney(
                payment.importe
              ) > 0
          ),

      movimientosTesoreria:
        validMovements,

      voucher:
        draft.voucher
          .requiere_voucher
          ? {
              requiere_voucher:
                true,

              reserva_id:
                draft.voucher
                  .reserva_id ||
                null,

              a_favor_de:
                draft.voucher
                  .a_favor_de ||
                draft.cliente
                  .nombre_completo ||
                null,

              servicios:
                draft.voucher
                  .servicios
                  .filter(
                    (service) =>
                      service
                        .servicio_detalle
                        .trim()
                  )
                  .map(
                    (service) => ({
                      servicio_detalle:
                        service
                          .servicio_detalle,

                      cantidad_pasajeros:
                        Math.max(
                          Number(
                            service
                              .cantidad_pasajeros ||
                              1
                          ),
                          1
                        ),

                      fecha_inicio:
                        service
                          .fecha_inicio ||
                        null,

                      fecha_fin:
                        service
                          .fecha_fin ||
                        null
                    })
                  )
            }
          : null
    };

    const ok =
      await saveFileWizard(
        payload
      );

    if (!ok) {
      return;
    }

    clearStoredFileDraft();

    onSaved(
      visibleEnFiles
        ? "File cargado correctamente."
        : "File creado y enviado a Cta Cte."
    );

    onClose();
  }

  return {
    saving,
    clientesSearch,
    catalogos,
    currentProfile,
    canManageFiles,
    createDestinoInline,

    storedDraft,
    step,
    wizardError,
    draftSavedAt,
    draft,
    readiness,

    venta,
    netoOperador,
    utilidad,
    totalPagosComerciales,
    totalTesoreria,
    saldoComercial,
    saldo,
    visibleEnFiles,

    metodoOptions,
    operadorOptions,
    servicioOptions,
    destinoOptions,
    formaPagoOptions,
    cajaOptions,
    vendedorOptions,
    sucursalOptions,

    clearWizardError,

    setCliente,
    setVenta,
    setPhone,
    selectCliente,
    selectOperador,
    setMoneda,

    updatePago,
    selectFormaPagoComercial,
    addPago,
    removePago,

    setPagoDiferenteOficina,

    updateMovimiento,
    selectCaja,
    selectFormaPagoReal,
    addMovimiento,
    removeMovimiento,

    setPagoParcial,
    setFechaIngresoGastos,

    setUsaMarkupAdicional,
    setMarkupAdicionalPct,

    setVoucher,
    setRequiereVoucher,
    updateVoucherServicio,
    addVoucherServicio,
    removeVoucherServicio,

    setConfirmado,

    saveDraftManually,
    discardDraft,
    previousStep,
    nextStep,
    submit
  };
}
