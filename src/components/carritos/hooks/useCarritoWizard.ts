import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  useCarritosStore,
  type CarritoWizardInput,
  type Cliente,
  type MovimientoTesoreria,
  type PagoComercial
} from "../../../store/carritosStore";
import {
  clearStoredWizardDraft,
  createInitialDraft,
  getToday,
  isDateBefore,
  isValidCarrito,
  loadStoredWizardDraft,
  parseMoney,
  saveStoredWizardDraft,
  type SelectOption,
  type WizardDraft,
  type WizardStep
} from "../carritosModel";

type UseCarritoWizardParams = {
  onClose: () => void;
  onSaved: (message: string) => void;
};

function normalizeCurrency(value: string | null | undefined): string {
  return String(value || "ARS").trim().toUpperCase();
}

function getMovimientoImporteEnMonedaVenta(
  movimiento: MovimientoTesoreria,
  monedaVenta: string
): number {
  const importe = parseMoney(movimiento.importe);
  const monedaMovimiento = normalizeCurrency(movimiento.moneda);
  const monedaOperacion = normalizeCurrency(monedaVenta);

  if (importe <= 0) return 0;

  if (monedaMovimiento === monedaOperacion) {
    return importe;
  }

  const tipoCambio = parseMoney(
    movimiento.tipo_cambio
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
  movimiento: MovimientoTesoreria,
  monedaVenta: string
): MovimientoTesoreria {
  const monedaMovimiento = normalizeCurrency(
    movimiento.moneda
  );

  const monedaOperacion = normalizeCurrency(
    monedaVenta
  );

  const monedasDiferentes =
    monedaMovimiento !== monedaOperacion;

  const importeEquivalente =
    getMovimientoImporteEnMonedaVenta(
      movimiento,
      monedaOperacion
    );

  return {
    ...movimiento,
    moneda: monedaMovimiento,
    tipo_cambio: monedasDiferentes
      ? parseMoney(movimiento.tipo_cambio) || null
      : null,
    moneda_equivalente: monedaOperacion,
    importe_equivalente:
      importeEquivalente > 0
        ? Number(importeEquivalente.toFixed(4))
        : null
  };
}

export function useCarritoWizard({
  onClose,
  onSaved
}: UseCarritoWizardParams) {
  const saving = useCarritosStore(
    (state) => state.saving
  );

  const clientesSearch = useCarritosStore(
    (state) => state.clientesSearch
  );

  const catalogos = useCarritosStore(
    (state) => state.catalogos
  );

  const currentProfile = useCarritosStore(
    (state) => state.currentProfile
  );

  const canManageCarritos = useCarritosStore(
    (state) => state.canManageCarritos
  );

  const searchClientesByPhone = useCarritosStore(
    (state) => state.searchClientesByPhone
  );

  const createDestinoInline = useCarritosStore(
    (state) => state.createDestinoInline
  );

  const saveCarritoWizard = useCarritosStore(
    (state) => state.saveCarritoWizard
  );

  const storedDraft = useMemo(
    () => loadStoredWizardDraft(),
    []
  );

  const [step, setStep] = useState<WizardStep>(
    () => storedDraft?.step || 1
  );

  const [wizardError, setWizardError] =
    useState<string | null>(null);

  const [draftSavedAt, setDraftSavedAt] =
    useState<string | null>(null);

  const [
    autoCompletePagoComercial,
    setAutoCompletePagoComercial
  ] = useState<boolean>(() => {
    const storedPayments =
      storedDraft?.draft
        ?.pagosComerciales || [];

    return !storedPayments.some(
      (pago) =>
        parseMoney(
          pago.importe
        ) > 0
    );
  });

  const [draft, setDraft] =
    useState<WizardDraft>(() => {
      if (storedDraft?.draft) {
        return {
          ...storedDraft.draft,
          pagoDiferenteOficina:
            storedDraft.draft.pagoDiferenteOficina ??
            false,
          formaPagoOficinaId:
            storedDraft.draft.formaPagoOficinaId ??
            "",
          formaPagoOficina:
            storedDraft.draft.formaPagoOficina ??
            "",
          observacionPagoDiferente:
            storedDraft.draft.observacionPagoDiferente ??
            "",
          usaMarkupAdicional:
            storedDraft.draft.usaMarkupAdicional ??
            false,
          markupAdicionalPct:
            storedDraft.draft.markupAdicionalPct ??
            ""
        };
      }

      const initial = createInitialDraft();

      initial.cliente.vendedor_id =
        currentProfile?.id || "";

      initial.cliente.sucursal_id =
        currentProfile?.sucursal_id || "";

      initial.venta.moneda = "ARS";

      initial.pagosComerciales[0].moneda =
        "ARS";

      initial.movimientosTesoreria[0].moneda =
        "ARS";

      initial.movimientosTesoreria[0].fecha_movimiento =
        initial.venta.fecha_venta;

      return initial;
    });

  const bruto = parseMoney(
    draft.venta.importe_bruto
  );

  const promocode =
    draft.venta.promocode_aplicado
      ? parseMoney(
          draft.venta.promocode_importe
        )
      : 0;

  const totalFinal = Math.max(
    0,
    bruto - promocode
  );

  const totalPagosComerciales =
    draft.pagosComerciales.reduce(
      (total, pago) =>
        total + parseMoney(pago.importe),
      0
    );

  const importeRiesgo = draft.riesgo
    ? parseMoney(draft.importe_riesgo)
    : 0;

  const totalComercial =
    totalPagosComerciales + importeRiesgo;

  const totalTesoreria =
    draft.movimientosTesoreria.reduce(
      (total, movimiento) =>
        total +
        getMovimientoImporteEnMonedaVenta(
          movimiento,
          draft.venta.moneda
        ),
      0
    );

  const saldo = Math.max(
    0,
    totalFinal - totalTesoreria
  );

  const saldoComercial = Math.max(
    0,
    totalFinal - totalComercial
  );

  const visibleEnCarritos =
    saldo <= 0.009;

  useEffect(() => {
    if (!autoCompletePagoComercial) {
      return;
    }

    setDraft((current) => {
      const firstPayment =
        current.pagosComerciales[0];

      if (!firstPayment) {
        return {
          ...current,
          pagosComerciales: [
            {
              importe: totalFinal,
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
        ) === totalFinal
      ) {
        return current;
      }

      return {
        ...current,
        pagosComerciales:
          current.pagosComerciales.map(
            (pago, index) =>
              index === 0
                ? {
                    ...pago,
                    importe:
                      totalFinal,
                    moneda:
                      pago.moneda ||
                      current.venta.moneda
                  }
                : pago
          )
      };
    });
  }, [
    autoCompletePagoComercial,
    totalFinal
  ]);

  const metodoOptions: SelectOption[] =
    catalogos.metodosContacto.map(
      (item) => ({
        value: item.nombre,
        label: item.nombre
      })
    );

  const servicioOptions: SelectOption[] =
    catalogos.servicios.map(
      (item) => ({
        value: item.nombre,
        label: item.nombre
      })
    );

  const destinoOptions: SelectOption[] =
    catalogos.destinos.map(
      (item) => ({
        value: item.nombre,
        label: item.pais
          ? `${item.nombre} · ${item.pais}`
          : item.nombre
      })
    );

  const formaPagoOptions: SelectOption[] =
    catalogos.formasPago.map(
      (item) => ({
        value: item.id,
        label: item.nombre
      })
    );

  const cajaOptions: SelectOption[] =
    catalogos.cajas.map(
      (item) => ({
        value: item.id,
        label: item.moneda
          ? `${item.nombre} · ${item.moneda}`
          : item.nombre
      })
    );

  const vendedorOptions: SelectOption[] =
    catalogos.vendedores.map(
      (item) => ({
        value: item.id,
        label: `${item.nombre} ${item.apellido}`.trim()
      })
    );

  const sucursalOptions: SelectOption[] =
    catalogos.sucursales.map(
      (item) => ({
        value: item.id,
        label: item.nombre
      })
    );

  /*
   * Cuando el pago real coincide con ALMUNDO, mantenemos
   * las líneas reales sincronizadas automáticamente.
   *
   * Se conservan la caja y los datos contables que el
   * vendedor ya hubiera seleccionado en cada línea.
   *
   * Al activar "Pago diferente en oficina", este efecto
   * deja de intervenir y las líneas quedan completamente
   * editables.
   */
  useEffect(() => {
    if (draft.pagoDiferenteOficina) {
      return;
    }

    setDraft((current) => {
      const nextMovimientos =
        current.pagosComerciales.map(
          (pago, index) => {
            const previous =
              current.movimientosTesoreria[
                index
              ];

            return normalizeMovimientoEquivalente(
              {
                ...previous,

                importe:
                  parseMoney(
                    pago.importe
                  ),

                moneda:
                  pago.moneda ||
                  current.venta.moneda,

                forma_pago_id:
                  pago.forma_pago_id ||
                  null,

                forma_pago:
                  pago.forma_pago ||
                  "",

                caja_id:
                  previous?.caja_id ||
                  null,

                caja:
                  previous?.caja ||
                  "",

                tipo_cambio:
                  previous?.tipo_cambio ||
                  null,

                fecha_movimiento:
                  previous?.fecha_movimiento ||
                  current.venta
                    .fecha_venta ||
                  getToday()
              },
              current.venta.moneda
            );
          }
        );

      const movimientosActuales =
        current.movimientosTesoreria;

      const areEqual =
        movimientosActuales.length ===
          nextMovimientos.length &&
        nextMovimientos.every(
          (next, index) => {
            const previous =
              movimientosActuales[index];

            if (!previous) {
              return false;
            }

            return (
              parseMoney(
                previous.importe
              ) ===
                parseMoney(
                  next.importe
                ) &&
              previous.moneda ===
                next.moneda &&
              previous.forma_pago_id ===
                next.forma_pago_id &&
              previous.forma_pago ===
                next.forma_pago &&
              previous.caja_id ===
                next.caja_id &&
              previous.caja ===
                next.caja &&
              previous.tipo_cambio ===
                next.tipo_cambio &&
              previous.moneda_equivalente ===
                next.moneda_equivalente &&
              previous.importe_equivalente ===
                next.importe_equivalente &&
              previous.fecha_movimiento ===
                next.fecha_movimiento
            );
          }
        );

      if (areEqual) {
        return current;
      }

      return {
        ...current,
        movimientosTesoreria:
          nextMovimientos
      };
    });
  }, [
    draft.pagoDiferenteOficina,
    draft.pagosComerciales,
    draft.venta.fecha_venta,
    draft.venta.moneda
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveStoredWizardDraft(draft, step);

      setDraftSavedAt(
        new Date().toLocaleTimeString(
          "es-AR",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        )
      );
    }, 700);

    return () =>
      window.clearTimeout(timer);
  }, [draft, step]);

  function clearWizardError() {
    setWizardError(null);
  }

  function setCliente<
    K extends keyof WizardDraft["cliente"]
  >(
    key: K,
    value: WizardDraft["cliente"][K]
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,
      cliente: {
        ...current.cliente,
        [key]: value
      }
    }));
  }

  function setVenta<
    K extends keyof WizardDraft["venta"]
  >(
    key: K,
    value: WizardDraft["venta"][K]
  ) {
    setWizardError(null);

    setDraft((current) => {
      const nextVenta = {
        ...current.venta,
        [key]: value
      };

      return {
        ...current,
        venta: nextVenta,
        movimientosTesoreria:
          key === "fecha_venta"
            ? current.movimientosTesoreria.map(
                (movimiento) => ({
                  ...movimiento,
                  fecha_movimiento: String(
                    value ||
                      nextVenta.fecha_venta ||
                      getToday()
                  )
                })
              )
            : current.movimientosTesoreria
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
      local.replace(/\D/g, "");

    setDraft((current) => ({
      ...current,
      phonePrefix: cleanPrefix,
      phoneLocal: cleanLocal,
      cliente: {
        ...current.cliente,
        telefono: `${cleanPrefix}${cleanLocal}`
      }
    }));

    if (cleanLocal.length >= 3) {
      searchClientesByPhone(
        `${cleanPrefix}${cleanLocal}`
      );
    }
  }

  function selectCliente(
    cliente: Cliente
  ) {
    setWizardError(null);

    const prefix =
      cliente.telefono.startsWith("+549")
        ? "+549"
        : draft.phonePrefix;

    const local = cliente.telefono
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
          cliente.nombre_completo,
        telefono: cliente.telefono,
        email: cliente.email || "",
        origen: cliente.origen || "",
        vendedor_id:
          cliente.vendedor_id ||
          currentProfile?.id ||
          "",
        sucursal_id:
          cliente.sucursal_id ||
          currentProfile?.sucursal_id ||
          ""
      }
    }));
  }

  function updatePago(
    index: number,
    patch: Partial<PagoComercial>
  ) {
    setWizardError(null);

    if (
      index === 0 &&
      patch.importe !== undefined
    ) {
      setAutoCompletePagoComercial(
        false
      );
    }

    setDraft((current) => ({
      ...current,
      pagosComerciales:
        current.pagosComerciales.map(
          (pago, itemIndex) =>
            itemIndex === index
              ? {
                  ...pago,
                  ...patch
                }
              : pago
        )
    }));
  }

  function addPago() {
    setWizardError(null);

    setAutoCompletePagoComercial(
      false
    );

    setDraft((current) => ({
      ...current,
      pagosComerciales: [
        ...current.pagosComerciales,
        {
          importe: 0,
          moneda: current.venta.moneda,
          forma_pago_id: null,
          forma_pago: ""
        }
      ]
    }));
  }

  function removePago(index: number) {
    setWizardError(null);

    setAutoCompletePagoComercial(
      false
    );

    setDraft((current) => ({
      ...current,
      pagosComerciales:
        current.pagosComerciales.length > 1
          ? current.pagosComerciales.filter(
              (_, itemIndex) =>
                itemIndex !== index
            )
          : [
              {
                importe: 0,
                moneda:
                  current.venta.moneda,
                forma_pago_id: null,
                forma_pago: ""
              }
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
      fechaIngresoGastos: value
        ? current.fechaIngresoGastos ||
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
      fechaIngresoGastos: value
    }));
  }

  function setPagoDiferenteOficina(
    value: boolean
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,
      pagoDiferenteOficina: value,
      formaPagoOficinaId: value
        ? current.formaPagoOficinaId
        : "",
      formaPagoOficina: value
        ? current.formaPagoOficina
        : "",
      observacionPagoDiferente: value
        ? current.observacionPagoDiferente
        : ""
    }));
  }

  function setFormaPagoOficina(
    formaPagoId: string
  ) {
    setWizardError(null);

    const forma =
      formaPagoOptions.find(
        (item) =>
          item.value === formaPagoId
      );

    setDraft((current) => ({
      ...current,
      formaPagoOficinaId:
        forma?.value || "",
      formaPagoOficina:
        forma?.label || ""
    }));
  }

  function setObservacionPagoDiferente(
    value: string
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,
      observacionPagoDiferente:
        value
    }));
  }

  function setUsaMarkupAdicional(
    value: boolean
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,
      usaMarkupAdicional: value,
      markupAdicionalPct: value
        ? current.markupAdicionalPct
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

  function setRiesgo(value: boolean) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,
      riesgo: value,
      importe_riesgo: value
        ? current.importe_riesgo ||
          String(
            Math.max(
              totalFinal -
                totalPagosComerciales,
              0
            )
          ).replace(".", ",")
        : "",
      riesgo_motivo: value
        ? current.riesgo_motivo
        : ""
    }));
  }

  function setImporteRiesgo(
    value: string
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,
      importe_riesgo: value
    }));
  }

  function setRiesgoMotivo(
    value: string
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,
      riesgo_motivo: value
    }));
  }

  function updateMovimiento(
    index: number,
    patch: Partial<MovimientoTesoreria>
  ) {
    setWizardError(null);

    setDraft((current) => ({
      ...current,
      movimientosTesoreria:
        current.movimientosTesoreria.map(
          (movimiento, itemIndex) =>
            itemIndex === index
              ? normalizeMovimientoEquivalente(
                  {
                    ...movimiento,
                    ...patch
                  },
                  current.venta.moneda
                )
              : movimiento
        )
    }));
  }

  function selectCaja(
    index: number,
    cajaId: string
  ) {
    const caja = catalogos.cajas.find(
      (item) => item.id === cajaId
    );

    updateMovimiento(index, {
      caja_id: caja?.id || null,
      caja: caja?.nombre || null
    });
  }

  function selectFormaPagoTesoreria(
    index: number,
    formaPagoId: string
  ) {
    const forma =
      catalogos.formasPago.find(
        (item) =>
          item.id === formaPagoId
      );

    updateMovimiento(index, {
      forma_pago_id: forma?.id || null,
      forma_pago: forma?.nombre || null
    });
  }

  function addMovimiento() {
    setWizardError(null);

    setDraft((current) => ({
      ...current,
      movimientosTesoreria: [
        ...current.movimientosTesoreria,
        normalizeMovimientoEquivalente(
          {
            importe: 0,
            moneda: current.venta.moneda,
            forma_pago_id: null,
            forma_pago: "",
            caja_id: null,
            caja: "",
            fecha_movimiento:
              current.venta.fecha_venta ||
              getToday()
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
        current.movimientosTesoreria.length >
        1
          ? current.movimientosTesoreria.filter(
              (_, itemIndex) =>
                itemIndex !== index
            )
          : [
              normalizeMovimientoEquivalente(
                {
                  importe: 0,
                  moneda:
                    current.venta.moneda,
                  forma_pago_id: null,
                  forma_pago: "",
                  caja_id: null,
                  caja: "",
                  fecha_movimiento:
                    current.venta.fecha_venta ||
                    getToday()
                },
                current.venta.moneda
              )
            ]
    }));
  }

  function setMoneda(value: string) {
    setVenta("moneda", value);

    setDraft((current) => ({
      ...current,
      pagosComerciales:
        current.pagosComerciales.map(
          (pago) => ({
            ...pago,
            moneda: value
          })
        ),
      movimientosTesoreria:
        current.movimientosTesoreria.map(
          (movimiento) =>
            normalizeMovimientoEquivalente(
              {
                ...movimiento,
                moneda: value
              },
              value
            )
        )
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

  function saveDraftManually() {
    saveStoredWizardDraft(draft, step);

    setDraftSavedAt(
      new Date().toLocaleTimeString(
        "es-AR",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      )
    );
  }

  function discardDraft() {
    clearStoredWizardDraft();
    onClose();
  }

  function previousStep() {
    setWizardError(null);

    setStep(
      (current) =>
        Math.max(
          1,
          current - 1
        ) as WizardStep
    );
  }

  function validateStep(
    currentStep: WizardStep
  ): string | null {
    if (currentStep === 1) {
      if (
        !draft.cliente.telefono.trim() ||
        draft.phoneLocal.length < 3
      ) {
        return "Ingresá un teléfono válido.";
      }

      if (
        !draft.cliente.id &&
        !draft.cliente.nombre_completo.trim()
      ) {
        return "Ingresá el nombre completo del cliente.";
      }
    }

    if (currentStep === 2) {
      if (
        !isValidCarrito(
          draft.venta.numero_carrito
        )
      ) {
        return "El número de carrito debe tener formato 000-000-000.";
      }

      if (!draft.venta.fecha_in) {
        return "Seleccioná fecha IN.";
      }

      if (
        !draft.venta.solo_ida &&
        !draft.venta.fecha_out
      ) {
        return "Seleccioná fecha OUT.";
      }

      if (
        !draft.venta.solo_ida &&
        isDateBefore(
          draft.venta.fecha_out,
          draft.venta.fecha_in
        )
      ) {
        return "La fecha OUT no puede ser anterior a la fecha IN.";
      }

      if (!draft.venta.servicio.trim()) {
        return "Seleccioná o cargá el servicio.";
      }

      if (
        draft.venta.destinos.length === 0
      ) {
        return "Seleccioná o cargá al menos un destino.";
      }

      if (totalFinal <= 0) {
        return "El importe final debe ser mayor a cero.";
      }
    }

    if (currentStep === 3) {
      const pagosConImporte =
        draft.pagosComerciales.filter(
          (pago) =>
            parseMoney(pago.importe) > 0
        );

      if (
        pagosConImporte.some(
          (pago) => !pago.forma_pago_id
        )
      ) {
        return "Completá la forma de pago comercial en todas las líneas con importe.";
      }


      if (
        draft.usaMarkupAdicional
      ) {
        const markup =
          parseMoney(
            draft.markupAdicionalPct
          );

        if (
          markup <= 0 ||
          markup > 100
        ) {
          return "Ingresá un porcentaje de markup adicional mayor a 0 y menor o igual a 100.";
        }
      }

      if (draft.riesgo) {
        if (importeRiesgo <= 0) {
          return "Indicá el importe imputado a riesgo Almundo.";
        }

        if (
          !draft.riesgo_motivo.trim()
        ) {
          return "Indicá el motivo u observación del riesgo Almundo.";
        }
      }

      if (totalComercial <= 0) {
        return "Completá al menos un pago comercial o un importe imputado a riesgo Almundo.";
      }

      if (
        totalComercial >
        totalFinal + 0.009
      ) {
        return "La imputación comercial no puede superar el total del cliente.";
      }

      if (
        !draft.pagoParcial &&
        Math.abs(
          totalComercial - totalFinal
        ) > 0.009
      ) {
        return "La imputación comercial debe igualar el total del cliente. Si queda saldo del pasajero, marcá pago parcial.";
      }

      if (
        draft.pagoParcial &&
        totalComercial >= totalFinal
      ) {
        return "Si marcás pago parcial, la imputación comercial debe ser menor al total cliente.";
      }

      if (
        draft.pagoParcial &&
        !draft.fechaIngresoGastos
      ) {
        return "Completá la fecha de ingreso a gastos para enviar el saldo a cuenta corriente.";
      }
    }

    if (currentStep === 4) {
      const movimientoSinTipoCambio =
        draft.movimientosTesoreria.find(
          (movimiento) =>
            parseMoney(movimiento.importe) > 0 &&
            normalizeCurrency(movimiento.moneda) !==
              normalizeCurrency(draft.venta.moneda) &&
            parseMoney(movimiento.tipo_cambio) <= 0
        );

      if (movimientoSinTipoCambio) {
        return `Ingresá el tipo de cambio para convertir ${normalizeCurrency(
          movimientoSinTipoCambio.moneda
        )} a ${normalizeCurrency(
          draft.venta.moneda
        )}.`;
      }

      if (
        draft.movimientosTesoreria.some(
          (movimiento) =>
            parseMoney(
              movimiento.importe
            ) <= 0 ||
            !movimiento.caja_id ||
            !movimiento.forma_pago_id
        )
      ) {
        return "Completá caja, forma real de pago e importe en todas las líneas de tesorería.";
      }

      if (totalTesoreria <= 0) {
        return "Cargá el ingreso real del cliente en Tesorería.";
      }

      if (
        totalTesoreria >
        totalFinal + 0.009
      ) {
        return "Tesorería no puede superar el total cliente.";
      }

      if (
        !draft.pagoParcial &&
        Math.abs(
          totalTesoreria - totalFinal
        ) > 0.009
      ) {
        return "Si no es pago parcial, Tesorería debe igualar el total cliente.";
      }

      if (
        draft.pagoParcial &&
        totalTesoreria >= totalFinal
      ) {
        return "Si marcás pago parcial, Tesorería debe ser menor al total cliente.";
      }
    }

    if (
      currentStep === 4 &&
      !draft.confirmado
    ) {
      return "Confirmá que los datos son correctos.";
    }

    return null;
  }

  async function nextStep() {
    const error = validateStep(step);

    if (error) {
      setWizardError(error);
      return;
    }

    setWizardError(null);

    setStep(
      (current) =>
        Math.min(
          5,
          current + 1
        ) as WizardStep
    );
  }

  async function submit() {
    const error = validateStep(4);

    if (error) {
      setWizardError(error);
      return;
    }

    setWizardError(null);

    const destinoTexto =
      draft.venta.destinos.join(", ");

    const movimientosTesoreria =
      draft.movimientosTesoreria
        .filter(
          (movimiento) =>
            parseMoney(
              movimiento.importe
            ) > 0
        )
        .map((movimiento) =>
          normalizeMovimientoEquivalente(
            {
              ...movimiento,
              fecha_movimiento:
                movimiento.fecha_movimiento ||
                draft.venta.fecha_venta ||
                getToday()
            },
            draft.venta.moneda
          )
        );

    const payload: CarritoWizardInput = {
      cliente: {
        id: draft.cliente.id,
        nombre_completo:
          draft.cliente.nombre_completo,
        telefono:
          draft.cliente.telefono,
        email: draft.cliente.email,
        origen: draft.cliente.origen,
        vendedor_id:
          draft.cliente.vendedor_id ||
          currentProfile?.id ||
          null,
        sucursal_id:
          draft.cliente.sucursal_id ||
          currentProfile?.sucursal_id ||
          null
      },
      carrito: {
        numero_carrito:
          draft.venta.numero_carrito,
        fecha_venta:
          draft.venta.fecha_venta,
        servicio_id:
          draft.venta.servicio_id ||
          null,
        servicio:
          draft.venta.servicio,
        metodo_contacto:
          draft.cliente.origen,
        destino: destinoTexto,
        fecha_in:
          draft.venta.fecha_in,
        fecha_out:
          draft.venta.solo_ida
            ? null
            : draft.venta.fecha_out,
        solo_ida:
          draft.venta.solo_ida,
        importe_bruto: bruto,
        moneda:
          draft.venta.moneda,
        promocode_aplicado:
          draft.venta
            .promocode_aplicado,
        promocode_importe:
          promocode,
pago_diferente_oficina:
          draft.pagoDiferenteOficina,
        forma_pago_oficina_id:
          draft.pagoDiferenteOficina
            ? draft.formaPagoOficinaId ||
              null
            : null,
        forma_pago_oficina:
          draft.pagoDiferenteOficina
            ? draft.formaPagoOficina ||
              null
            : null,
        observacion_pago_diferente:
          draft.pagoDiferenteOficina
            ? draft.observacionPagoDiferente ||
              null
            : null,

        usa_markup_adicional:
          draft.usaMarkupAdicional,
        markup_adicional_pct:
          draft.usaMarkupAdicional
            ? parseMoney(
                draft.markupAdicionalPct
              )
            : null,

        importe_final:
          totalFinal,
        pago_parcial:
          draft.pagoParcial,
        fecha_ingreso_gastos:
          draft.pagoParcial
            ? draft.fechaIngresoGastos
            : null,
        total_pagado:
          totalTesoreria,
        saldo_cta_cte: saldo,
        visible_en_carritos:
          visibleEnCarritos,
        riesgo: draft.riesgo,
        importe_riesgo:
          importeRiesgo,
        riesgo_motivo:
          draft.riesgo_motivo,
        confirmado_vendedor:
          draft.confirmado,
        observaciones:
          draft.venta.observaciones,
        vendedor_id:
          draft.cliente.vendedor_id ||
          currentProfile?.id ||
          null,
        sucursal_id:
          draft.cliente.sucursal_id ||
          currentProfile?.sucursal_id ||
          null
      },
      pagosComerciales:
        draft.pagosComerciales.filter(
          (pago) =>
            parseMoney(pago.importe) > 0
        ),
      movimientosTesoreria
    };

    const ok =
      await saveCarritoWizard(payload);

    if (!ok) return;

    clearStoredWizardDraft();

    onSaved(
      visibleEnCarritos
        ? "Carrito cargado correctamente."
        : "Venta creada y enviada a Cta Cte."
    );

    onClose();
  }

  return {
    saving,
    clientesSearch,
    catalogos,
    canManageCarritos,
    createDestinoInline,

    storedDraft,
    step,
    wizardError,
    draftSavedAt,
    draft,

    bruto,
    promocode,
    totalFinal,
    totalPagosComerciales,
    importeRiesgo,
    totalComercial,
    totalTesoreria,
    saldo,
    saldoComercial,
    visibleEnCarritos,

    metodoOptions,
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
    updatePago,
    addPago,
    removePago,
    setPagoParcial,
    setFechaIngresoGastos,
    setPagoDiferenteOficina,
    setFormaPagoOficina,
    setObservacionPagoDiferente,
    setUsaMarkupAdicional,
    setMarkupAdicionalPct,
    setRiesgo,
    setImporteRiesgo,
    setRiesgoMotivo,
    updateMovimiento,
    selectCaja,
    selectFormaPagoTesoreria,
    addMovimiento,
    removeMovimiento,
    setMoneda,
    setConfirmado,
    saveDraftManually,
    discardDraft,
    previousStep,
    nextStep,
    submit
  };
}
