import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  useCarritosStore,
  type Caja,
  type Carrito,
  type CarritoMobileUpdateInput,
  type CatalogItem,
  type MovimientoTesoreria,
  type PagoComercial,
  type ProfileLite
} from "../../../store/carritosStore";
import {
  createEditDraft,
  getToday,
  isValidCarrito,
  parseMoney,
  type CarritoEditDraft,
  type SelectOption
} from "../carritosModel";

export type CarritoEditCatalogos = {
  metodosContacto: CatalogItem[];
  servicios: CatalogItem[];
  formasPago: CatalogItem[];
  cajas: Caja[];
  vendedores: ProfileLite[];
  sucursales: CatalogItem[];
};

type UseCarritoEditorParams = {
  carrito: Carrito;
  catalogos: CarritoEditCatalogos;
  onClose: () => void;
  onSaved: (message: string) => void;
};

export function useCarritoEditor({
  carrito,
  catalogos,
  onClose,
  onSaved
}: UseCarritoEditorParams) {
  const saving = useCarritosStore(
    (state) => state.saving
  );

  const loadCarritoPagos = useCarritosStore(
    (state) => state.loadCarritoPagos
  );

  const loadCarritoMovimientos =
    useCarritosStore(
      (state) =>
        state.loadCarritoMovimientos
    );

  const updateCarritoMobile =
    useCarritosStore(
      (state) =>
        state.updateCarritoMobile
    );

  const [loadingData, setLoadingData] =
    useState(true);

  const [editError, setEditError] =
    useState<string | null>(null);

  const [draft, setDraft] =
    useState<CarritoEditDraft>(() =>
      createEditDraft(carrito)
    );

  useEffect(() => {
    let alive = true;

    async function loadData() {
      setLoadingData(true);

      const [pagos, movimientos] =
        await Promise.all([
          loadCarritoPagos(carrito.id),
          loadCarritoMovimientos(
            carrito.id
          )
        ]);

      if (!alive) return;

      setDraft((current) => ({
        ...current,

        pagosComerciales:
          pagos.length > 0
            ? pagos
            : [
                {
                  importe: 0,
                  moneda:
                    current.carrito.moneda,
                  forma_pago_id: null,
                  forma_pago: ""
                }
              ],

        movimientosTesoreria:
          movimientos.length > 0
            ? movimientos
            : [
                {
                  importe: 0,
                  moneda:
                    current.carrito.moneda,
                  forma_pago_id: null,
                  forma_pago: "",
                  caja_id: null,
                  caja: "",
                  fecha_movimiento:
                    current.carrito
                      .fecha_venta ||
                    getToday()
                }
              ]
      }));

      setLoadingData(false);
    }

    void loadData();

    return () => {
      alive = false;
    };
  }, [
    carrito.id,
    loadCarritoPagos,
    loadCarritoMovimientos
  ]);

  const bruto = parseMoney(
    draft.carrito.importe_bruto
  );

  const promocode =
    draft.carrito.promocode_aplicado
      ? parseMoney(
          draft.carrito
            .promocode_importe
        )
      : 0;

  const totalFinal = Math.max(
    0,
    bruto - promocode
  );

  const totalTesoreria =
    draft.movimientosTesoreria.reduce(
      (total, movimiento) =>
        total +
        parseMoney(movimiento.importe),
      0
    );

  const saldo = Math.max(
    0,
    totalFinal - totalTesoreria
  );

  const pagoParcial = saldo > 0.009;

  const metodoOptions =
    useMemo<SelectOption[]>(
      () =>
        catalogos.metodosContacto.map(
          (item) => ({
            value: item.nombre,
            label: item.nombre
          })
        ),
      [catalogos.metodosContacto]
    );

  const servicioOptions =
    useMemo<SelectOption[]>(
      () =>
        catalogos.servicios.map(
          (item) => ({
            value: item.nombre,
            label: item.nombre
          })
        ),
      [catalogos.servicios]
    );

  const formaPagoOptions =
    useMemo<SelectOption[]>(
      () =>
        catalogos.formasPago.map(
          (item) => ({
            value: item.id,
            label: item.nombre
          })
        ),
      [catalogos.formasPago]
    );

  const cajaOptions =
    useMemo<SelectOption[]>(
      () =>
        catalogos.cajas.map(
          (item) => ({
            value: item.id,
            label: item.moneda
              ? `${item.nombre} · ${item.moneda}`
              : item.nombre
          })
        ),
      [catalogos.cajas]
    );

  const vendedorOptions =
    useMemo<SelectOption[]>(
      () =>
        catalogos.vendedores.map(
          (item) => ({
            value: item.id,
            label:
              `${item.nombre} ${item.apellido}`.trim()
          })
        ),
      [catalogos.vendedores]
    );

  const sucursalOptions =
    useMemo<SelectOption[]>(
      () =>
        catalogos.sucursales.map(
          (item) => ({
            value: item.id,
            label: item.nombre
          })
        ),
      [catalogos.sucursales]
    );

  function clearEditError() {
    setEditError(null);
  }

  function setCliente<
    K extends keyof CarritoEditDraft["cliente"]
  >(
    key: K,
    value: CarritoEditDraft["cliente"][K]
  ) {
    setEditError(null);

    setDraft((current) => ({
      ...current,
      cliente: {
        ...current.cliente,
        [key]: value
      }
    }));
  }

  function setCarrito<
    K extends keyof CarritoEditDraft["carrito"]
  >(
    key: K,
    value: CarritoEditDraft["carrito"][K]
  ) {
    setEditError(null);

    setDraft((current) => ({
      ...current,
      carrito: {
        ...current.carrito,
        [key]: value
      }
    }));
  }

  function setMoneda(value: string) {
    setEditError(null);

    setDraft((current) => ({
      ...current,

      carrito: {
        ...current.carrito,
        moneda: value
      },

      pagosComerciales:
        current.pagosComerciales.map(
          (pago) => ({
            ...pago,
            moneda: value
          })
        ),

      movimientosTesoreria:
        current.movimientosTesoreria.map(
          (movimiento) => ({
            ...movimiento,
            moneda: value
          })
        )
    }));
  }

  function setMetodoContacto(
    value: string
  ) {
    setEditError(null);

    setDraft((current) => ({
      ...current,

      cliente: {
        ...current.cliente,
        origen: value
      },

      carrito: {
        ...current.carrito,
        metodo_contacto: value
      }
    }));
  }

  function updatePago(
    index: number,
    patch: Partial<PagoComercial>
  ) {
    setEditError(null);

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

  function selectPagoForma(
    index: number,
    formaPagoId: string
  ) {
    const forma =
      catalogos.formasPago.find(
        (item) =>
          item.id === formaPagoId
      );

    updatePago(index, {
      forma_pago_id: forma?.id || null,
      forma_pago:
        forma?.nombre || null
    });
  }

  function addPago() {
    setEditError(null);

    setDraft((current) => ({
      ...current,

      pagosComerciales: [
        ...current.pagosComerciales,
        {
          importe: 0,
          moneda:
            current.carrito.moneda,
          forma_pago_id: null,
          forma_pago: ""
        }
      ]
    }));
  }

  function removePago(index: number) {
    setEditError(null);

    setDraft((current) => ({
      ...current,

      pagosComerciales:
        current.pagosComerciales.length >
        1
          ? current.pagosComerciales.filter(
              (_, itemIndex) =>
                itemIndex !== index
            )
          : [
              {
                importe: 0,
                moneda:
                  current.carrito.moneda,
                forma_pago_id: null,
                forma_pago: ""
              }
            ]
    }));
  }

  function updateMovimiento(
    index: number,
    patch: Partial<MovimientoTesoreria>
  ) {
    setEditError(null);

    setDraft((current) => ({
      ...current,

      movimientosTesoreria:
        current.movimientosTesoreria.map(
          (movimiento, itemIndex) =>
            itemIndex === index
              ? {
                  ...movimiento,
                  ...patch
                }
              : movimiento
        )
    }));
  }

  function selectMovimientoCaja(
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

  function selectMovimientoForma(
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
      forma_pago:
        forma?.nombre || null
    });
  }

  function addMovimiento() {
    setEditError(null);

    setDraft((current) => ({
      ...current,

      movimientosTesoreria: [
        ...current.movimientosTesoreria,
        {
          importe: 0,
          moneda:
            current.carrito.moneda,
          forma_pago_id: null,
          forma_pago: "",
          caja_id: null,
          caja: "",
          fecha_movimiento:
            current.carrito.fecha_venta ||
            getToday()
        }
      ]
    }));
  }

  function removeMovimiento(
    index: number
  ) {
    setEditError(null);

    setDraft((current) => ({
      ...current,

      movimientosTesoreria:
        current.movimientosTesoreria
          .length > 1
          ? current.movimientosTesoreria.filter(
              (_, itemIndex) =>
                itemIndex !== index
            )
          : [
              {
                importe: 0,
                moneda:
                  current.carrito.moneda,
                forma_pago_id: null,
                forma_pago: "",
                caja_id: null,
                caja: "",
                fecha_movimiento:
                  current.carrito
                    .fecha_venta ||
                  getToday()
              }
            ]
    }));
  }

  async function handleSave() {
    setEditError(null);

    if (
      !isValidCarrito(
        draft.carrito.numero_carrito
      )
    ) {
      setEditError(
        "El número de carrito debe tener formato 000-000-000."
      );
      return;
    }

    if (
      !draft.cliente.nombre_completo.trim()
    ) {
      setEditError(
        "El cliente no puede quedar vacío."
      );
      return;
    }

    if (totalFinal <= 0) {
      setEditError(
        "El importe final debe ser mayor a cero."
      );
      return;
    }

    if (
      draft.carrito.riesgo &&
      parseMoney(
        draft.carrito.importe_riesgo
      ) <= 0
    ) {
      setEditError(
        "Indicá el importe de riesgo."
      );
      return;
    }

    const payload: CarritoMobileUpdateInput =
      {
        carritoId: carrito.id,

        cliente: {
          id: draft.cliente.id,
          nombre_completo:
            draft.cliente
              .nombre_completo,
          telefono:
            draft.cliente.telefono,
          email:
            draft.cliente.email ||
            null,
          origen:
            draft.cliente.origen ||
            null
        },

        carrito: {
          numero_carrito:
            draft.carrito
              .numero_carrito,

          fecha_venta:
            draft.carrito.fecha_venta,

          servicio:
            draft.carrito.servicio ||
            null,

          metodo_contacto:
            draft.carrito
              .metodo_contacto ||
            null,

          destino:
            draft.carrito.destino ||
            null,

          fecha_in:
            draft.carrito.fecha_in ||
            null,

          fecha_out:
            draft.carrito.solo_ida
              ? null
              : draft.carrito
                    .fecha_out ||
                null,

          solo_ida:
            draft.carrito.solo_ida,

          importe_bruto: bruto,

          moneda:
            draft.carrito.moneda,

          promocode_aplicado:
            draft.carrito
              .promocode_aplicado,

          promocode_importe:
            promocode,

          importe_final:
            totalFinal,

          pago_parcial:
            pagoParcial,

          fecha_ingreso_gastos:
            pagoParcial
              ? carrito.fecha_ingreso_gastos ||
                getToday()
              : null,

          total_pagado:
            totalTesoreria,

          saldo_cta_cte: saldo,

          visible_en_carritos:
            draft.carrito.estado !==
            "CTA_CTE",

          riesgo:
            draft.carrito.riesgo,

          importe_riesgo:
            draft.carrito.riesgo
              ? parseMoney(
                  draft.carrito
                    .importe_riesgo
                )
              : 0,

          riesgo_motivo:
            draft.carrito.riesgo
              ? draft.carrito
                  .riesgo_motivo ||
                null
              : null,

          estado:
            draft.carrito.estado,

          observaciones:
            draft.carrito
              .observaciones ||
            null,

          vendedor_id:
            draft.carrito
              .vendedor_id ||
            null,

          sucursal_id:
            draft.carrito
              .sucursal_id ||
            null,

          activo:
            draft.carrito.activo
        },

        pagosComerciales:
          draft.pagosComerciales.filter(
            (pago) =>
              parseMoney(pago.importe) >
              0
          ),

        movimientosTesoreria:
          draft.movimientosTesoreria.filter(
            (movimiento) =>
              parseMoney(
                movimiento.importe
              ) > 0
          )
      };

    const ok =
      await updateCarritoMobile(
        payload
      );

    if (!ok) return;

    onSaved(
      "Carrito actualizado correctamente."
    );

    onClose();
  }

  return {
    saving,
    loadingData,
    editError,
    draft,

    bruto,
    promocode,
    totalFinal,
    totalTesoreria,
    saldo,
    pagoParcial,

    metodoOptions,
    servicioOptions,
    formaPagoOptions,
    cajaOptions,
    vendedorOptions,
    sucursalOptions,

    clearEditError,
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
  };
}
