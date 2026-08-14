// src/store/carritos/carritosApi.ts

import { supabase } from "../../lib/supabase";
import type {
  Cliente,
  MovimientoTesoreria,
  PagoComercial
} from "./carritosTypes";

export async function searchClientesByPhoneApi(
  telefono: string
): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .ilike("telefono", `%${telefono}%`)
    .limit(10);

  if (error) {
    throw error;
  }

  return (data || []) as Cliente[];
}

export async function loadCarritoPagosApi(
  carritoId: string
): Promise<PagoComercial[]> {
  const { data, error } = await supabase
    .from("carrito_pagos_comerciales")
    .select("*")
    .eq("carrito_id", carritoId)
    .order("created_at", {
      ascending: true
    });

  if (error) {
    throw error;
  }

  return (data || []) as PagoComercial[];
}

export async function loadCarritoMovimientosApi(
  carritoId: string
): Promise<MovimientoTesoreria[]> {
  const { data, error } = await supabase
    .from("carrito_movimientos_tesoreria")
    .select("*")
    .eq("carrito_id", carritoId)
    .order("created_at", {
      ascending: true
    });

  if (error) {
    throw error;
  }

  return (data || []) as MovimientoTesoreria[];
}

export async function createDestinoInlineApi(
  nombre: string,
  pais: string
): Promise<import("./carritosTypes").CatalogItem> {
  const { data, error } = await supabase
    .from("destinos")
    .insert({
      nombre,
      pais,
      activo: true,
      veces_usado_total: 0
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as import("./carritosTypes").CatalogItem;
}

export async function toggleCarritoActivoApi(
  carritoId: string,
  activo: boolean
): Promise<void> {
  const { error } = await supabase
    .from("carritos")
    .update({
      activo
    })
    .eq("id", carritoId);

  if (error) {
    throw error;
  }
}

export async function sendCarritoToControlApi(
  params: {
    carritoId: string;
    confirmadoAt: string;
    fechaVisibleCarritos: string;
    now: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from("carritos")
    .update({
      estado: "EN_CONTROL",
      derivado_control: true,
      controlado: false,
      enviado_control_at: params.now,
      visible_en_carritos: true,
      confirmado_vendedor: true,
      confirmado_at: params.confirmadoAt,
      fecha_visible_carritos:
        params.fechaVisibleCarritos,
      updated_at: params.now
    })
    .eq("id", params.carritoId)
    .not(
      "estado",
      "in",
      '("EN_CONTROL","CONTROLADO","FACTURADO","COBRADO")'
    );

  if (error) {
    throw error;
  }
}

import { filtrarSucursalesActivas } from "../../lib/sucursales";
import type {
  Caja,
  Carrito,
  CarritosCatalogos,
  CarritosFilters,
  CatalogItem,
  ProfileLite
} from "./carritosTypes";
import {
  fetchByCarritoIdsInBatches,
  getMonthRange
} from "./carritosUtils";

export type LoadCarritosDataResult = {
  currentProfile: ProfileLite | null;
  carritos: Carrito[];
  pagosComerciales: PagoComercial[];
  movimientosTesoreria: MovimientoTesoreria[];
  catalogos: CarritosCatalogos;
};

export async function loadCurrentProfileApi(
  currentUserId: string
): Promise<ProfileLite | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", currentUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data || null) as ProfileLite | null;
}

export async function loadCarritosDataApi(
  filters: CarritosFilters
): Promise<{
  carritos: Carrito[];
  pagosComerciales: PagoComercial[];
  movimientosTesoreria: MovimientoTesoreria[];
  catalogos: CarritosCatalogos;
}> {
  const periodRange =
    filters.periodMode === "mes"
      ? getMonthRange(filters.month)
      : {
          desde: filters.desde,
          hasta: filters.hasta
        };

  let carritosQuery = supabase
    .from("carritos")
    .select("*, clientes(*)")
    .gte("fecha_venta", periodRange.desde)
    .lte("fecha_venta", periodRange.hasta)
    .order("fecha_venta", {
      ascending: false
    })
    .order("created_at", {
      ascending: false
    });

  if (filters.estado !== "todos") {
    carritosQuery = carritosQuery.eq(
      "estado",
      filters.estado
    );
  }

  if (filters.vendedorId !== "todos") {
    carritosQuery = carritosQuery.eq(
      "vendedor_id",
      filters.vendedorId
    );
  }

  if (filters.sucursalId !== "todos") {
    carritosQuery = carritosQuery.eq(
      "sucursal_id",
      filters.sucursalId
    );
  }

  if (filters.riesgo === "riesgo") {
    carritosQuery = carritosQuery.eq(
      "riesgo",
      true
    );
  }

  if (filters.riesgo === "normal") {
    carritosQuery = carritosQuery.eq(
      "riesgo",
      false
    );
  }

  if (filters.activo === "activos") {
    carritosQuery = carritosQuery.eq(
      "activo",
      true
    );
  }

  if (filters.activo === "inactivos") {
    carritosQuery = carritosQuery.eq(
      "activo",
      false
    );
  }

  const [
    carritosRes,
    metodosRes,
    destinosRes,
    serviciosRes,
    formasPagoRes,
    cajasRes,
    sucursalesRes,
    vendedoresRes
  ] = await Promise.all([
    carritosQuery,

    supabase
      .from("metodos_contacto")
      .select("*")
      .eq("activo", true)
      .order("nombre"),

    supabase
      .from("destinos")
      .select("*")
      .eq("activo", true)
      .order("nombre"),

    supabase
      .from("servicios")
      .select("*")
      .eq("activo", true)
      .order("nombre"),

    supabase
      .from("formas_pago")
      .select("*")
      .eq("activo", true)
      .order("nombre"),

    supabase
      .from("cajas")
      .select("*")
      .or("activo.eq.true,activa.eq.true")
      .order("orden"),

    supabase
      .from("sucursales")
      .select("*")
      .order("nombre"),

    supabase
      .from("profiles")
      .select("*")
      .in(
        "rol",
        [
          "vendedor",
          "administracion",
          "gerencia",
          "admin_general"
        ]
      )
      .eq("activo", true)
      .order("nombre")
  ]);

  const firstError =
    carritosRes.error ||
    metodosRes.error ||
    destinosRes.error ||
    serviciosRes.error ||
    formasPagoRes.error ||
    cajasRes.error ||
    sucursalesRes.error ||
    vendedoresRes.error;

  if (firstError) {
    throw firstError;
  }

  const carritos =
    (carritosRes.data || []) as Carrito[];

  const carritoIds = carritos.map(
    (carrito) => carrito.id
  );

  const pagosRes =
    await fetchByCarritoIdsInBatches<PagoComercial>(
      "carrito_pagos_comerciales",
      carritoIds
    );

  if (pagosRes.error) {
    throw pagosRes.error;
  }

  const movimientosRes =
    await fetchByCarritoIdsInBatches<MovimientoTesoreria>(
      "carrito_movimientos_tesoreria",
      carritoIds
    );

  if (movimientosRes.error) {
    throw movimientosRes.error;
  }

  return {
    carritos,
    pagosComerciales: pagosRes.data,
    movimientosTesoreria:
      movimientosRes.data,
    catalogos: {
      metodosContacto:
        (metodosRes.data ||
          []) as CatalogItem[],
      destinos:
        (destinosRes.data ||
          []) as CatalogItem[],
      servicios:
        (serviciosRes.data ||
          []) as CatalogItem[],
      formasPago:
        (formasPagoRes.data ||
          []) as CatalogItem[],
      cajas:
        (cajasRes.data || []) as Caja[],
      sucursales:
        filtrarSucursalesActivas(
          (sucursalesRes.data ||
            []) as CatalogItem[]
        ),
      vendedores:
        (vendedoresRes.data ||
          []) as ProfileLite[]
    }
  };
}

import type {
  CarritoWizardInput
} from "./carritosTypes";
import {
  cleanText,
  getNumber,
  getProfileName,
  getToday,
  nullableText
} from "./carritosUtils";

export type SaveCarritoWizardApiParams = {
  input: CarritoWizardInput;
  currentUserId: string;
  currentProfile: ProfileLite;
  canManageCarritos: boolean;
  vendedores: ProfileLite[];
};

type SyncCajaMovimientosCarritoParams = {
  carritoId: string;
  clienteId: string | null;
  numeroCarrito: string;
  fecha: string;
  sucursalId: string | null;
  monedaCarrito: string;
  movimientos: MovimientoTesoreria[];
  currentUserId: string;
  anularPrevios?: boolean;
};

async function syncCajaMovimientosCarrito({
  carritoId,
  clienteId,
  numeroCarrito,
  fecha,
  sucursalId,
  monedaCarrito,
  movimientos,
  currentUserId,
  anularPrevios = false
}: SyncCajaMovimientosCarritoParams): Promise<void> {
  const movimientosValidos = movimientos.filter(
    (movimiento) =>
      getNumber(movimiento.importe) > 0
  );

  const formaPagoIds = Array.from(
    new Set(
      movimientosValidos
        .map(
          (movimiento) =>
            movimiento.forma_pago_id
        )
        .filter(Boolean) as string[]
    )
  );

  let formasPago: {
    id: string;
    nombre: string;
    impacta_tesoreria: boolean;
    activo: boolean;
  }[] = [];

  if (formaPagoIds.length > 0) {
    const { data, error } = await supabase
      .from("formas_pago")
      .select(
        "id,nombre,impacta_tesoreria,activo"
      )
      .in("id", formaPagoIds);

    if (error) {
      throw error;
    }

    formasPago = (
      data || []
    ) as typeof formasPago;
  }

  const cajaMovimientosPayload =
    movimientosValidos.flatMap(
      (movimiento) => {
        const formaPago =
          formasPago.find(
            (item) =>
              item.id ===
              movimiento.forma_pago_id
          ) || null;

        if (
          !formaPago ||
          !formaPago.activo ||
          !formaPago.impacta_tesoreria
        ) {
          return [];
        }

        if (!movimiento.caja_id) {
          throw new Error(
            `La forma de pago "${formaPago.nombre}" impacta tesorería y requiere una caja seleccionada.`
          );
        }

        const moneda =
          movimiento.moneda ||
          monedaCarrito ||
          "ARS";

        return [
          {
            caja_id:
              movimiento.caja_id,

            fecha:
              fecha || getToday(),

            tipo:
              "INGRESO",

            categoria:
              "Cobro cliente",

            descripcion:
              `Cobro carrito ${numeroCarrito}`,

            cliente_id:
              clienteId,

            sucursal_id:
              sucursalId,

            moneda,

            importe:
              getNumber(
                movimiento.importe
              ),

            forma_pago:
              formaPago.nombre,

            origen:
              "CARRITO",

            referencia_tipo:
              "CARRITO",

            referencia_id:
              carritoId,

            referencia_texto:
              numeroCarrito,

            observaciones:
              null,

            registrado_por:
              currentUserId,

            created_by:
              currentUserId,

            updated_by:
              currentUserId,

            anulado:
              false
          }
        ];
      }
    );

  if (anularPrevios) {
    const now =
      new Date().toISOString();

    const { error } = await supabase
      .from("caja_movimientos")
      .update({
        anulado: true,
        anulado_at: now,
        anulado_by:
          currentUserId,
        motivo_anulacion:
          "Movimiento reemplazado por edición del carrito.",
        updated_by:
          currentUserId,
        updated_at:
          now
      })
      .eq(
        "origen",
        "CARRITO"
      )
      .eq(
        "referencia_tipo",
        "CARRITO"
      )
      .eq(
        "referencia_id",
        carritoId
      )
      .eq(
        "anulado",
        false
      );

    if (error) {
      throw error;
    }
  }

  if (
    cajaMovimientosPayload.length ===
    0
  ) {
    return;
  }

  const { error } = await supabase
    .from("caja_movimientos")
    .insert(
      cajaMovimientosPayload
    );

  if (error) {
    throw error;
  }
}

export async function saveCarritoWizardApi({
  input,
  currentUserId,
  currentProfile,
  canManageCarritos,
  vendedores
}: SaveCarritoWizardApiParams): Promise<string> {
  const vaACuentaCorriente =
    Boolean(input.carrito.pago_parcial) &&
    getNumber(input.carrito.saldo_cta_cte) >
      0.009;

  const vendedorId = canManageCarritos
    ? input.carrito.vendedor_id ||
      input.cliente.vendedor_id ||
      currentUserId
    : currentUserId;

  const vendedorProfile = vendedores.find(
    (vendedor) =>
      vendedor.id === vendedorId
  );

  const vendedorNombre = vendedorProfile
    ? getProfileName(vendedorProfile)
    : getProfileName(currentProfile);

  const sucursalId =
    input.carrito.sucursal_id ||
    input.cliente.sucursal_id ||
    currentProfile.sucursal_id ||
    null;

  let clienteId =
    input.cliente.id || null;

  if (!clienteId) {
    const clientePayload = {
      nombre_completo: cleanText(
        input.cliente.nombre_completo
      ),
      telefono: cleanText(
        input.cliente.telefono
      ),
      email: nullableText(
        input.cliente.email
      ),
      origen: nullableText(
        input.cliente.origen
      ),
      vendedor: vendedorNombre,
      vendedor_id: vendedorId,
      sucursal_id: sucursalId,
      activo: true
    };

    const { data, error } = await supabase
      .from("clientes")
      .insert(clientePayload)
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    clienteId = data.id;
  }

  const now = new Date().toISOString();
  const importeRiesgo = getNumber(
    input.carrito.importe_riesgo
  );

  const carritoPayload = {
    cliente_id: clienteId,
    contacto_id:
      input.carrito.contacto_id || null,
    numero_carrito: cleanText(
      input.carrito.numero_carrito
    ),
    fecha_venta:
      input.carrito.fecha_venta ||
      getToday(),

    servicio_id:
      input.carrito.servicio_id || null,
    servicio: nullableText(
      input.carrito.servicio
    ),
    metodo_contacto: nullableText(
      input.carrito.metodo_contacto
    ),
    destino: nullableText(
      input.carrito.destino
    ),

    fecha_in:
      input.carrito.fecha_in || null,
    fecha_out: input.carrito.solo_ida
      ? null
      : input.carrito.fecha_out || null,
    solo_ida: Boolean(
      input.carrito.solo_ida
    ),

    importe:
      input.carrito.importe_final,
    moneda:
      input.carrito.moneda || "ARS",

    importe_bruto:
      input.carrito.importe_bruto,
    promocode_aplicado: Boolean(
      input.carrito.promocode_aplicado
    ),
    promocode_importe:
      input.carrito.promocode_importe ||
      0,
    importe_final:
      input.carrito.importe_final,

    pago_parcial: vaACuentaCorriente,
    fecha_ingreso_gastos:
      vaACuentaCorriente
        ? input.carrito
            .fecha_ingreso_gastos ||
          null
        : null,
    total_pagado:
      input.carrito.total_pagado,
    saldo_cta_cte:
      input.carrito.saldo_cta_cte,

    visible_en_carritos: Boolean(
      input.carrito.visible_en_carritos
    ),
    fecha_visible_carritos:
      input.carrito.visible_en_carritos
        ? getToday()
        : null,

    riesgo: Boolean(
      input.carrito.riesgo
    ),
    importe_riesgo:
      input.carrito.riesgo
        ? importeRiesgo
        : 0,
    riesgo_motivo: nullableText(
      input.carrito.riesgo_motivo
    ),
    riesgo_resuelto: false,
    riesgo_observaciones: null,

    confirmado_vendedor: true,
    confirmado_at: now,
    derivado_control:
      input.carrito.visible_en_carritos,
    enviado_control_at:
      input.carrito.visible_en_carritos
        ? now
        : null,

    estado:
      input.carrito.visible_en_carritos
        ? "EN_CONTROL"
        : "CTA_CTE",

    observaciones: nullableText(
      input.carrito.observaciones
    ),
    vendedor: vendedorNombre,
    vendedor_id: vendedorId,
    sucursal_id: sucursalId,
    activo: true
  };

  /*
   * Estos campos pertenecen al flujo interno del wizard,
   * pero NO son columnas físicas de public.carritos.
   *
   * La información real de pagos se persiste en
   * carrito_pagos_comerciales / carrito_movimientos_tesoreria.
   */
  const carritoPersistPayload = Object.fromEntries(
    Object.entries(carritoPayload).filter(
      ([key]) =>
        ![
          "pago_diferente_oficina",
          "forma_pago_oficina_id",
          "forma_pago_oficina",
          "observacion_pago_diferente",
          "usa_markup_adicional",
          "markup_adicional_pct"
        ].includes(key)
    )
  );

  const {
    data: carritoData,
    error: carritoError
  } = await supabase
    .from("carritos")
    .insert(carritoPersistPayload)
    .select("id")
    .single();

  if (carritoError) {
    throw carritoError;
  }

  const carritoId = carritoData.id;

  const pagosPayload =
    input.pagosComerciales
      .filter(
        (pago) =>
          getNumber(pago.importe) > 0
      )
      .map((pago) => ({
        carrito_id: carritoId,
        forma_pago_id:
          pago.forma_pago_id || null,
        forma_pago: nullableText(
          pago.forma_pago
        ),
        importe: pago.importe || 0,
        moneda:
          pago.moneda ||
          input.carrito.moneda ||
          "ARS"
      }));

  if (pagosPayload.length > 0) {
    const { error } = await supabase
      .from(
        "carrito_pagos_comerciales"
      )
      .insert(pagosPayload);

    if (error) {
      throw error;
    }
  }

  const movimientosPayload =
    input.movimientosTesoreria
      .filter(
        (movimiento) =>
          getNumber(
            movimiento.importe
          ) > 0
      )
      .map((movimiento) => ({
        carrito_id: carritoId,
        caja_id:
          movimiento.caja_id || null,
        caja: nullableText(
          movimiento.caja
        ),
        forma_pago_id:
          movimiento.forma_pago_id ||
          null,
        forma_pago: nullableText(
          movimiento.forma_pago
        ),
        importe:
          movimiento.importe || 0,
        moneda:
          movimiento.moneda ||
          input.carrito.moneda ||
          "ARS",
        tipo_cambio:
          movimiento.tipo_cambio ||
          null,
        moneda_equivalente:
          movimiento
            .moneda_equivalente ||
          null,
        importe_equivalente:
          movimiento
            .importe_equivalente ||
          null
      }));

  if (movimientosPayload.length > 0) {
    const { error } = await supabase
      .from(
        "carrito_movimientos_tesoreria"
      )
      .insert(movimientosPayload);

    if (error) {
      throw error;
    }
  }

  if (input.carrito.riesgo) {
    const { error } = await supabase
      .from("carrito_riesgos")
      .insert({
        carrito_id: carritoId,
        importe_riesgo:
          importeRiesgo,
        moneda:
          input.carrito.moneda ||
          "ARS",
        motivo: nullableText(
          input.carrito.riesgo_motivo
        ),
        estado: "PENDIENTE",
        created_by: currentUserId
      });

    if (error) {
      throw error;
    }
  }

  await syncCajaMovimientosCarrito({
    carritoId,
    clienteId,
    numeroCarrito:
      cleanText(
        input.carrito.numero_carrito
      ),
    fecha:
      input.carrito.fecha_venta ||
      getToday(),
    sucursalId,
    monedaCarrito:
      input.carrito.moneda ||
      "ARS",
    movimientos:
      input.movimientosTesoreria,
    currentUserId,
    anularPrevios:
      false
  });

  return carritoId;
}

export type UpdateCarritoMobileTotals = {
  importeBruto: number;
  promocodeAplicado: boolean;
  promocodeImporte: number;
  importeFinal: number;
  totalTesoreria: number;
  saldoCtaCte: number;
  pagoParcial: boolean;
  visibleEnCarritos: boolean;
};

export type UpdateCarritoMobileApiParams = {
  input: import("./carritosTypes").CarritoMobileUpdateInput;
  carritoActual: import("./carritosTypes").Carrito;
  totals: UpdateCarritoMobileTotals;
  currentUserId: string;
  currentProfile: ProfileLite;
  canManageCarritos: boolean;
  vendedores: ProfileLite[];
};

export async function updateCarritoMobileApi({
  input,
  carritoActual,
  totals,
  currentUserId,
  currentProfile,
  canManageCarritos,
  vendedores
}: UpdateCarritoMobileApiParams): Promise<void> {
  const vendedorId = canManageCarritos
    ? input.carrito.vendedor_id ||
      carritoActual.vendedor_id ||
      currentUserId
    : carritoActual.vendedor_id ||
      currentUserId;

  const vendedorProfile = vendedores.find(
    (profile) =>
      profile.id === vendedorId
  );

  const vendedorNombre = vendedorProfile
    ? getProfileName(vendedorProfile)
    : carritoActual.vendedor ||
      getProfileName(currentProfile);

  const sucursalId =
    input.carrito.sucursal_id !== undefined
      ? input.carrito.sucursal_id
      : carritoActual.sucursal_id ||
        currentProfile.sucursal_id ||
        null;

  if (
    input.cliente?.id ||
    carritoActual.cliente_id
  ) {
    const clienteId =
      input.cliente?.id ||
      carritoActual.cliente_id;

    const clientePayload: Record<
      string,
      unknown
    > = {};

    if (
      input.cliente
        ?.nombre_completo !== undefined
    ) {
      clientePayload.nombre_completo =
        cleanText(
          input.cliente.nombre_completo
        );
    }

    if (
      input.cliente?.telefono !== undefined
    ) {
      clientePayload.telefono =
        cleanText(
          input.cliente.telefono
        );
    }

    if (
      input.cliente?.email !== undefined
    ) {
      clientePayload.email =
        nullableText(
          input.cliente.email
        );
    }

    if (
      input.cliente?.origen !== undefined
    ) {
      clientePayload.origen =
        nullableText(
          input.cliente.origen
        );
    }

    if (
      Object.keys(clientePayload).length >
      0
    ) {
      const { error } = await supabase
        .from("clientes")
        .update(clientePayload)
        .eq("id", clienteId);

      if (error) {
        throw error;
      }
    }
  }

  const now = new Date().toISOString();

  const riesgo =
    input.carrito.riesgo !== undefined
      ? Boolean(input.carrito.riesgo)
      : Boolean(carritoActual.riesgo);

  const carritoPayload = {
    numero_carrito: cleanText(
      input.carrito.numero_carrito ||
        carritoActual.numero_carrito
    ),

    fecha_venta:
      input.carrito.fecha_venta ||
      carritoActual.fecha_venta ||
      getToday(),

    servicio_id:
      input.carrito.servicio_id !==
      undefined
        ? input.carrito.servicio_id
        : carritoActual.servicio_id,

    servicio: nullableText(
      input.carrito.servicio !== undefined
        ? input.carrito.servicio
        : carritoActual.servicio
    ),

    metodo_contacto: nullableText(
      input.carrito.metodo_contacto !==
      undefined
        ? input.carrito.metodo_contacto
        : carritoActual.metodo_contacto
    ),

    destino: nullableText(
      input.carrito.destino !== undefined
        ? input.carrito.destino
        : carritoActual.destino
    ),

    fecha_in:
      input.carrito.fecha_in !== undefined
        ? input.carrito.fecha_in
        : carritoActual.fecha_in,

    fecha_out: input.carrito.solo_ida
      ? null
      : input.carrito.fecha_out !==
          undefined
        ? input.carrito.fecha_out
        : carritoActual.fecha_out,

    solo_ida:
      input.carrito.solo_ida !== undefined
        ? Boolean(input.carrito.solo_ida)
        : carritoActual.solo_ida,

    importe: totals.importeFinal,

    moneda:
      input.carrito.moneda ||
      carritoActual.moneda ||
      "ARS",

    importe_bruto: totals.importeBruto,

    promocode_aplicado:
      totals.promocodeAplicado,

    promocode_importe:
      totals.promocodeImporte,

    importe_final: totals.importeFinal,

    pago_parcial: totals.pagoParcial,

    fecha_ingreso_gastos:
      totals.pagoParcial &&
      totals.saldoCtaCte > 0.009
        ? input.carrito
            .fecha_ingreso_gastos ||
          carritoActual
            .fecha_ingreso_gastos ||
          null
        : null,

    total_pagado:
      totals.totalTesoreria,

    saldo_cta_cte:
      totals.saldoCtaCte,

    visible_en_carritos:
      totals.visibleEnCarritos,

    fecha_visible_carritos:
      totals.visibleEnCarritos
        ? carritoActual
            .fecha_visible_carritos ||
          getToday()
        : null,

    riesgo,

    importe_riesgo: riesgo
      ? getNumber(
          input.carrito.importe_riesgo !==
            undefined
            ? input.carrito.importe_riesgo
            : carritoActual.importe_riesgo
        )
      : 0,

    riesgo_motivo: riesgo
      ? nullableText(
          input.carrito.riesgo_motivo !==
            undefined
            ? input.carrito.riesgo_motivo
            : carritoActual.riesgo_motivo
        )
      : null,

    estado:
      input.carrito.estado ||
      carritoActual.estado ||
      "CARGADO",

    derivado_control:
      input.carrito.estado === "EN_CONTROL"
        ? true
        : Boolean(
            carritoActual.derivado_control
          ),

    controlado:
      input.carrito.estado === "CONTROLADO"
        ? true
        : Boolean(
            carritoActual.controlado
          ),

    enviado_control_at:
      input.carrito.estado === "EN_CONTROL"
        ? carritoActual
            .enviado_control_at || now
        : carritoActual
            .enviado_control_at || null,

    confirmado_vendedor:
      carritoActual
        .confirmado_vendedor !== undefined
        ? Boolean(
            carritoActual
              .confirmado_vendedor
          )
        : true,

    confirmado_at:
      carritoActual.confirmado_at || now,

    observaciones: nullableText(
      input.carrito.observaciones !==
      undefined
        ? input.carrito.observaciones
        : carritoActual.observaciones
    ),

    vendedor: vendedorNombre,
    vendedor_id: vendedorId,
    sucursal_id: sucursalId,

    activo:
      input.carrito.activo !== undefined
        ? Boolean(input.carrito.activo)
        : carritoActual.activo,

    updated_at: now
  };

  const { error: carritoError } =
    await supabase
      .from("carritos")
      .update(carritoPayload)
      .eq("id", input.carritoId);

  if (carritoError) {
    throw carritoError;
  }

  const { error: deletePagosError } =
    await supabase
      .from(
        "carrito_pagos_comerciales"
      )
      .delete()
      .eq(
        "carrito_id",
        input.carritoId
      );

  if (deletePagosError) {
    throw deletePagosError;
  }

  const pagosPayload =
    input.pagosComerciales
      .filter(
        (pago) =>
          getNumber(pago.importe) > 0
      )
      .map((pago) => ({
        carrito_id: input.carritoId,
        forma_pago_id:
          pago.forma_pago_id || null,
        forma_pago: nullableText(
          pago.forma_pago
        ),
        importe: getNumber(
          pago.importe
        ),
        moneda:
          pago.moneda ||
          input.carrito.moneda ||
          carritoActual.moneda ||
          "ARS"
      }));

  if (pagosPayload.length > 0) {
    const { error } = await supabase
      .from(
        "carrito_pagos_comerciales"
      )
      .insert(pagosPayload);

    if (error) {
      throw error;
    }
  }

  const {
    error: deleteMovimientosError
  } = await supabase
    .from(
      "carrito_movimientos_tesoreria"
    )
    .delete()
    .eq(
      "carrito_id",
      input.carritoId
    );

  if (deleteMovimientosError) {
    throw deleteMovimientosError;
  }

  const movimientosPayload =
    input.movimientosTesoreria
      .filter(
        (movimiento) =>
          getNumber(
            movimiento.importe
          ) > 0
      )
      .map((movimiento) => ({
        carrito_id: input.carritoId,

        caja_id:
          movimiento.caja_id || null,

        caja: nullableText(
          movimiento.caja
        ),

        forma_pago_id:
          movimiento.forma_pago_id ||
          null,

        forma_pago: nullableText(
          movimiento.forma_pago
        ),

        importe: getNumber(
          movimiento.importe
        ),

        moneda:
          movimiento.moneda ||
          input.carrito.moneda ||
          carritoActual.moneda ||
          "ARS",

        tipo_cambio:
          movimiento.tipo_cambio ||
          null,

        moneda_equivalente:
          movimiento
            .moneda_equivalente ||
          null,

        importe_equivalente:
          movimiento
            .importe_equivalente ||
          null
      }));

  if (
    movimientosPayload.length > 0
  ) {
    const { error } = await supabase
      .from(
        "carrito_movimientos_tesoreria"
      )
      .insert(movimientosPayload);

    if (error) {
      throw error;
    }
  }

  await syncCajaMovimientosCarrito({
    carritoId:
      input.carritoId,

    clienteId:
      input.cliente?.id ||
      carritoActual.cliente_id ||
      null,

    numeroCarrito:
      cleanText(
        input.carrito.numero_carrito ||
        carritoActual.numero_carrito
      ),

    fecha:
      input.carrito.fecha_venta ||
      carritoActual.fecha_venta ||
      getToday(),

    sucursalId,

    monedaCarrito:
      input.carrito.moneda ||
      carritoActual.moneda ||
      "ARS",

    movimientos:
      input.movimientosTesoreria,

    currentUserId,

    anularPrevios:
      true
  });
}
