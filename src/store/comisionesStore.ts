import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { filtrarSucursalesActivas } from "../lib/sucursales";

export type ProfileLite = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  sucursal_id: string | null;
  rol: string;
  color: string;
  activo: boolean;
  is_support_user?: boolean | null;
  is_super_admin?: boolean | null;
};

export type SucursalLite = {
  id: string;
  nombre: string;
  color?: string | null;
  activa?: boolean;
  activo?: boolean;
};

export type NivelComision =
  | "SIN_META"
  | "BAJO_PISO"
  | "PISO"
  | "MEDIO"
  | "LOGRADO"
  | string;

export type LiquidacionComisionEstado =
  | "BORRADOR"
  | "CALCULADA"
  | "CERRADA"
  | "PAGADA"
  | "AJUSTADA"
  | "ANULADA";

export type LiquidacionMovimientoTipo =
  | "ORIGINAL"
  | "AJUSTE_POSITIVO"
  | "AJUSTE_NEGATIVO"
  | "ANULACION";

export type ComisionMensual = {
  vendedor_id: string;
  vendedor: string | null;
  sucursal_id: string | null;
  sucursal: string | null;
  mes: number;
  anio: number;

  meta_id: string | null;
  meta_piso_usd: string | number;
  meta_medio_usd: string | number;
  meta_logrado_usd: string | number;

  facturacion_carritos_usd: string | number;
  facturacion_files_usd: string | number;
  facturacion_total_usd: string | number;

  utilidad_carritos_usd: string | number;
  utilidad_files_usd: string | number;
  utilidad_total_usd: string | number;

  nivel_alcanzado: NivelComision;
  porcentaje_comision: string | number;
  comision_estimada_usd: string | number;
  porcentaje_avance_piso: string | number;
  falta_para_piso_usd: string | number;
};

export type MatrizVendedorAnual = {
  vendedor_id: string;
  vendedor: string | null;
  sucursal_id: string | null;
  sucursal: string | null;
  anio: number;
  meses: Record<
    number,
    {
      utilidad_usd: number;
      facturacion_usd: number;
    }
  >;
  total_utilidad_usd: number;
  total_facturacion_usd: number;
};

export type ComisionSemanal = {
  vendedor_id: string;
  vendedor: string | null;
  sucursal_id: string | null;
  sucursal: string | null;
  meta_id: string;
  fecha_desde: string;
  fecha_hasta: string;
  meta_unica_usd: string | number;
  utilidad_semana_usd: string | number;
  estado_meta: "LOGRADO" | "PENDIENTE" | "SIN_META" | string;
  porcentaje_avance: string | number;
};

export type VentaComision = {
  origen_id: string;
  origen: "CARRITO" | "FILE" | string;
  numero: string;
  fecha: string;
  vendedor_id: string | null;
  vendedor: string | null;
  sucursal_id: string | null;
  sucursal_nombre?: string | null;
  cliente_id: string | null;
  pasajero: string | null;
  moneda: string;
  precio_venta_original: string | number;
  utilidad_original: string | number;
  tc_promedio_usd_ars: string | number;
  facturacion_usd: string | number;
  utilidad_usd: string | number;
};

export type LiquidacionComision = {
  id: string;
  vendedor_id: string;
  sucursal_id: string | null;
  mes: number;
  anio: number;
  periodo_desde: string;
  periodo_hasta: string;
  moneda: "USD";
  estado: LiquidacionComisionEstado;

  meta_id: string | null;
  meta_piso_usd: string | number;
  meta_medio_usd: string | number;
  meta_logrado_usd: string | number;

  nivel_alcanzado: NivelComision;
  porcentaje_comision: string | number;

  cantidad_carritos: number;
  cantidad_files: number;

  utilidad_carritos_usd: string | number;
  utilidad_files_usd: string | number;
  utilidad_total_usd: string | number;

  comision_calculada_usd: string | number;
  ajuste_comision_usd: string | number;
  comision_final_usd: string | number;

  version_calculo: number;

  calculada_at: string | null;
  calculada_by: string | null;

  cerrada_at: string | null;
  cerrada_by: string | null;

  pagada_at: string | null;
  pagada_by: string | null;

  ajustada_at: string | null;
  ajustada_by: string | null;

  anulada_at: string | null;
  anulada_by: string | null;

  motivo_ajuste: string | null;
  motivo_anulacion: string | null;
  observaciones: string | null;

  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;

  vendedor?: ProfileLite | null;
  sucursal?: SucursalLite | null;
};

export type LiquidacionComisionDetalle = {
  id: string;
  liquidacion_id: string;
  liquidacion_origen_id: string | null;
  detalle_origen_id: string | null;

  vendedor_id: string;
  sucursal_id: string | null;

  origen: "CARRITO" | "FILE";
  origen_id: string;
  numero: string;
  fecha_venta: string;

  cliente_id: string | null;
  pasajero: string | null;

  moneda_original: "ARS" | "USD";
  facturacion_original: string | number;
  utilidad_original: string | number;

  tc_promedio_usd_ars: string | number;
  facturacion_usd: string | number;
  utilidad_comisionable_usd: string | number;

  porcentaje_comision: string | number;
  comision_operacion_usd: string | number;

  tipo_movimiento: LiquidacionMovimientoTipo;
  detalle_origen: Record<string, unknown>;

  motivo_ajuste: string | null;
  observaciones: string | null;

  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RegistrarAjusteInput = {
  liquidacionDestinoId: string;
  liquidacionOrigenId: string;
  origen: "CARRITO" | "FILE";
  origenId: string;
  ajusteUtilidadUsd: number;
  motivo: string;
  observaciones?: string;
};

export type ComisionesFilters = {
  mes: string;
  anio: string;
  vendedorId: string;
  sucursalId: string;
  search: string;
};

type ComisionesMetrics = {
  vendedores: number;
  utilidadTotalUsd: number;
  facturacionTotalUsd: number;
  comisionTotalUsd: number;
  logrados: number;
  piso: number;
  medio: number;
  bajoPiso: number;
  sinMeta: number;
};

type ComisionesState = {
  loading: boolean;
  saving: boolean;
  error: string | null;

  currentProfile: ProfileLite | null;
  canManageComisiones: boolean;
  sellerDefaultApplied: boolean;

  mensual: ComisionMensual[];
  semanal: ComisionSemanal[];
  ventas: VentaComision[];
  matrizAnual: MatrizVendedorAnual[];

  liquidaciones: LiquidacionComision[];
  liquidacionDetalle: LiquidacionComisionDetalle[];

  catalogos: {
    vendedores: ProfileLite[];
    sucursales: SucursalLite[];
  };

  filters: ComisionesFilters;
  selectedVendedorId: string | null;
  selectedLiquidacionId: string | null;

  loadComisiones: () => Promise<void>;
  loadLiquidacionDetalle: (liquidacionId: string | null) => Promise<void>;

  calcularLiquidacion: (
    vendedorId: string,
    anio?: number,
    mes?: number
  ) => Promise<string | null>;

  cerrarLiquidacion: (liquidacionId: string) => Promise<boolean>;

  marcarLiquidacionPagada: (
    liquidacionId: string,
    observaciones?: string
  ) => Promise<boolean>;

  registrarAjuste: (input: RegistrarAjusteInput) => Promise<string | null>;

  anularLiquidacion: (
    liquidacionId: string,
    motivo: string,
    observaciones?: string
  ) => Promise<boolean>;

  setFilter: <K extends keyof ComisionesFilters>(
    key: K,
    value: ComisionesFilters[K]
  ) => void;

  resetFilters: () => void;
  selectVendedor: (id: string | null) => void;
  selectLiquidacion: (id: string | null) => Promise<void>;
  clearError: () => void;

  getMensualFiltrado: () => ComisionMensual[];
  getSemanalFiltrado: () => ComisionSemanal[];
  getVentasFiltradas: () => VentaComision[];
  getSelectedMensual: () => ComisionMensual | null;
  getSelectedLiquidacion: () => LiquidacionComision | null;
  getMetrics: () => ComisionesMetrics;
  getMatrizAnual: () => MatrizVendedorAnual[];
};

function getToday(): string {
  const now = new Date();

  const argentinaNow = new Date(
    now.toLocaleString("en-US", {
      timeZone: "America/Argentina/Cordoba"
    })
  );

  const year = argentinaNow.getFullYear();
  const month = String(argentinaNow.getMonth() + 1).padStart(2, "0");
  const day = String(argentinaNow.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDefaultFilters(): ComisionesFilters {
  const today = getToday();

  return {
    mes: today.slice(5, 7),
    anio: today.slice(0, 4),
    vendedorId: "todos",
    sucursalId: "todos",
    search: ""
  };
}

function getNumber(value: string | number | null | undefined): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeText(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeError(error: unknown): string {
  if (!error) return "Ocurrió un error inesperado.";

  if (typeof error === "object" && "message" in error) {
    const source = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
    };

    const message = String(source.message || "Ocurrió un error.");
    const details = String(source.details || "").trim();
    const hint = String(source.hint || "").trim();

    if (message.toLowerCase().includes("row-level security")) {
      return "No tenés permisos para esta acción.";
    }

    if (message.toLowerCase().includes("permission denied")) {
      return "Permiso denegado por Supabase/RLS.";
    }

    return [message, details, hint].filter(Boolean).join("\n");
  }

  return String(error);
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
}

function isSellerProfile(profile?: ProfileLite | null): boolean {
  return String(profile?.rol || "").toLowerCase() === "vendedor";
}

function canProfileManage(profile: ProfileLite | null): boolean {
  const role = String(profile?.rol || "").toLowerCase();

  return Boolean(
    profile?.activo &&
      (profile.is_super_admin ||
        profile.is_support_user ||
        role === "admin_general" ||
        role === "gerencia" ||
        role === "administracion" ||
        role === "soporte")
  );
}

function canProfileUse(profile: ProfileLite | null): boolean {
  const role = String(profile?.rol || "").toLowerCase();

  return Boolean(
    profile?.activo &&
      (profile.is_super_admin ||
        profile.is_support_user ||
        role === "admin_general" ||
        role === "gerencia" ||
        role === "administracion" ||
        role === "soporte" ||
        role === "vendedor")
  );
}

function getDateStartForQuery(anio: string, mes: string): string {
  return `${anio}-${mes.padStart(2, "0")}-01`;
}

function getDateEndForQuery(anio: string, mes: string): string {
  const year = Number(anio);
  const month = Number(mes);
  const last = new Date(year, month, 0).getDate();

  return `${anio}-${mes.padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

function consolidateMensual(rows: ComisionMensual[]): ComisionMensual[] {
  const map = new Map<string, ComisionMensual>();

  rows.forEach((item) => {
    const key = [
      item.vendedor_id,
      item.sucursal_id || "sin-sucursal",
      item.anio,
      item.mes
    ].join("|");

    const existing = map.get(key);

    if (!existing) {
      map.set(key, { ...item });
      return;
    }

    const utilidadCarritos =
      getNumber(existing.utilidad_carritos_usd) +
      getNumber(item.utilidad_carritos_usd);

    const utilidadFiles =
      getNumber(existing.utilidad_files_usd) +
      getNumber(item.utilidad_files_usd);

    const facturacionCarritos =
      getNumber(existing.facturacion_carritos_usd) +
      getNumber(item.facturacion_carritos_usd);

    const facturacionFiles =
      getNumber(existing.facturacion_files_usd) +
      getNumber(item.facturacion_files_usd);

    map.set(key, {
      ...existing,
      vendedor: item.vendedor || existing.vendedor,
      sucursal: item.sucursal || existing.sucursal,
      facturacion_carritos_usd: facturacionCarritos,
      facturacion_files_usd: facturacionFiles,
      facturacion_total_usd: facturacionCarritos + facturacionFiles,
      utilidad_carritos_usd: utilidadCarritos,
      utilidad_files_usd: utilidadFiles,
      utilidad_total_usd: utilidadCarritos + utilidadFiles
    });
  });

  return Array.from(map.values()).sort(
    (a, b) =>
      getNumber(b.utilidad_total_usd) -
      getNumber(a.utilidad_total_usd)
  );
}

function buildMatrizAnual(rows: ComisionMensual[]): MatrizVendedorAnual[] {
  const matrizMap = new Map<string, MatrizVendedorAnual>();

  rows.forEach((item) => {
    const vendedorId = item.vendedor_id || "sin-vendedor";
    const key = `${vendedorId}|${item.sucursal_id || "sin-sucursal"}`;

    if (!matrizMap.has(key)) {
      matrizMap.set(key, {
        vendedor_id: vendedorId,
        vendedor: item.vendedor || "Sin vendedor",
        sucursal_id: item.sucursal_id,
        sucursal: item.sucursal,
        anio: item.anio,
        meses: {},
        total_utilidad_usd: 0,
        total_facturacion_usd: 0
      });
    }

    const current = matrizMap.get(key);

    if (!current) return;

    const month = Number(item.mes);
    const utilidad = getNumber(item.utilidad_total_usd);
    const facturacion = getNumber(item.facturacion_total_usd);

    const previousMonth = current.meses[month] || {
      utilidad_usd: 0,
      facturacion_usd: 0
    };

    current.vendedor = item.vendedor || current.vendedor;
    current.sucursal = item.sucursal || current.sucursal;

    current.meses[month] = {
      utilidad_usd: previousMonth.utilidad_usd + utilidad,
      facturacion_usd: previousMonth.facturacion_usd + facturacion
    };

    current.total_utilidad_usd += utilidad;
    current.total_facturacion_usd += facturacion;
  });

  return Array.from(matrizMap.values()).sort(
    (a, b) => b.total_utilidad_usd - a.total_utilidad_usd
  );
}

export const useComisionesStore = create<ComisionesState>((set, get) => ({
  loading: false,
  saving: false,
  error: null,

  currentProfile: null,
  canManageComisiones: false,
  sellerDefaultApplied: false,

  mensual: [],
  semanal: [],
  ventas: [],
  matrizAnual: [],

  liquidaciones: [],
  liquidacionDetalle: [],

  catalogos: {
    vendedores: [],
    sucursales: []
  },

  filters: getDefaultFilters(),
  selectedVendedorId: null,
  selectedLiquidacionId: null,

  loadComisiones: async () => {
    set({
      loading: true,
      error: null
    });

    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
      set({
        loading: false,
        currentProfile: null,
        canManageComisiones: false,
        mensual: [],
        semanal: [],
        ventas: [],
        matrizAnual: [],
        liquidaciones: [],
        liquidacionDetalle: [],
        error: "No hay usuario autenticado."
      });

      return;
    }

    const profileRes = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUserId)
      .maybeSingle();

    if (profileRes.error) {
      set({
        loading: false,
        error: normalizeError(profileRes.error)
      });

      return;
    }

    const currentProfile = (profileRes.data || null) as ProfileLite | null;
    const canManageComisiones = canProfileManage(currentProfile);

    if (!canProfileUse(currentProfile)) {
      set({
        loading: false,
        currentProfile,
        canManageComisiones,
        mensual: [],
        semanal: [],
        ventas: [],
        matrizAnual: [],
        liquidaciones: [],
        liquidacionDetalle: [],
        error: "Tu usuario no tiene acceso al módulo Comisiones."
      });

      return;
    }

    const currentFilters = get().filters;
    const sellerDefaultApplied = get().sellerDefaultApplied;

    let effectiveFilters = currentFilters;
    let effectiveSelectedVendedorId = get().selectedVendedorId;

    if (!sellerDefaultApplied) {
      const defaultVendedorId =
        isSellerProfile(currentProfile) && currentProfile?.id
          ? currentProfile.id
          : "todos";

      effectiveFilters = {
        ...currentFilters,
        vendedorId: defaultVendedorId
      };

      effectiveSelectedVendedorId =
        isSellerProfile(currentProfile) && currentProfile?.id
          ? currentProfile.id
          : null;

      set({
        filters: effectiveFilters,
        selectedVendedorId: effectiveSelectedVendedorId,
        sellerDefaultApplied: true
      });
    }

    const mesNumber = Number(effectiveFilters.mes);
    const anioNumber = Number(effectiveFilters.anio);

    const desde = getDateStartForQuery(
      effectiveFilters.anio,
      effectiveFilters.mes
    );

    const hasta = getDateEndForQuery(
      effectiveFilters.anio,
      effectiveFilters.mes
    );

    let mensualQuery = supabase
      .from("vw_comisiones_vendedores_mensual")
      .select("*")
      .eq("mes", mesNumber)
      .eq("anio", anioNumber)
      .order("utilidad_total_usd", {
        ascending: false
      });

    let matrizAnualQuery = supabase
      .from("vw_comisiones_vendedores_mensual")
      .select("*")
      .eq("anio", anioNumber)
      .order("mes", {
        ascending: true
      })
      .order("utilidad_total_usd", {
        ascending: false
      });

    let semanalQuery = supabase
      .from("vw_comisiones_vendedores_semanal")
      .select("*")
      .lte("fecha_desde", hasta)
      .gte("fecha_hasta", desde)
      .order("fecha_desde", {
        ascending: false
      })
      .order("utilidad_semana_usd", {
        ascending: false
      });

    let ventasQuery = supabase
      .from("vw_comisiones_ventas_base")
      .select("*")
      .gte("fecha", desde)
      .lte("fecha", hasta)
      .order("fecha", {
        ascending: false
      });

    let liquidacionesQuery = supabase
      .from("liquidaciones_comisiones")
      .select(
        `
          *,
          vendedor:vendedor_id(*),
          sucursal:sucursal_id(*)
        `
      )
      .eq("mes", mesNumber)
      .eq("anio", anioNumber)
      .order("created_at", {
        ascending: false
      });

    if (effectiveFilters.vendedorId !== "todos") {
      mensualQuery = mensualQuery.eq(
        "vendedor_id",
        effectiveFilters.vendedorId
      );

      matrizAnualQuery = matrizAnualQuery.eq(
        "vendedor_id",
        effectiveFilters.vendedorId
      );

      semanalQuery = semanalQuery.eq(
        "vendedor_id",
        effectiveFilters.vendedorId
      );

      ventasQuery = ventasQuery.eq(
        "vendedor_id",
        effectiveFilters.vendedorId
      );

      liquidacionesQuery = liquidacionesQuery.eq(
        "vendedor_id",
        effectiveFilters.vendedorId
      );
    }

    if (effectiveFilters.sucursalId !== "todos") {
      mensualQuery = mensualQuery.eq(
        "sucursal_id",
        effectiveFilters.sucursalId
      );

      matrizAnualQuery = matrizAnualQuery.eq(
        "sucursal_id",
        effectiveFilters.sucursalId
      );

      semanalQuery = semanalQuery.eq(
        "sucursal_id",
        effectiveFilters.sucursalId
      );

      ventasQuery = ventasQuery.eq(
        "sucursal_id",
        effectiveFilters.sucursalId
      );

      liquidacionesQuery = liquidacionesQuery.eq(
        "sucursal_id",
        effectiveFilters.sucursalId
      );
    }

    const [
      mensualRes,
      semanalRes,
      ventasRes,
      matrizAnualRes,
      liquidacionesRes,
      vendedoresRes,
      sucursalesRes
    ] = await Promise.all([
      mensualQuery,
      semanalQuery,
      ventasQuery,
      matrizAnualQuery,
      liquidacionesQuery,
      supabase
        .from("profiles")
        .select("*")
        .in("rol", [
          "vendedor",
          "gerencia",
          "admin_general",
          "administracion"
        ])
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("sucursales")
        .select("*")
        .order("nombre")
    ]);

    const firstError =
      mensualRes.error ||
      semanalRes.error ||
      ventasRes.error ||
      matrizAnualRes.error ||
      liquidacionesRes.error ||
      vendedoresRes.error ||
      sucursalesRes.error;

    if (firstError) {
      set({
        loading: false,
        currentProfile,
        canManageComisiones,
        error: normalizeError(firstError)
      });

      return;
    }

    const mensual = consolidateMensual(
      (mensualRes.data || []) as ComisionMensual[]
    );

    const semanal = (semanalRes.data || []) as ComisionSemanal[];
    const ventas = (ventasRes.data || []) as VentaComision[];

    const matrizRows = consolidateMensual(
      (matrizAnualRes.data || []) as ComisionMensual[]
    );

    const matrizAnual = buildMatrizAnual(matrizRows);

    const liquidaciones = (liquidacionesRes.data || []) as unknown as LiquidacionComision[];

    const selectedLiquidacionId = get().selectedLiquidacionId;
    const selectedStillExists = liquidaciones.some(
      (item) => item.id === selectedLiquidacionId
    );

    set({
      loading: false,
      error: null,
      currentProfile,
      canManageComisiones,
      mensual,
      semanal,
      ventas,
      matrizAnual,
      liquidaciones,
      selectedLiquidacionId: selectedStillExists
        ? selectedLiquidacionId
        : liquidaciones[0]?.id || null,
      catalogos: {
        vendedores: (vendedoresRes.data || []) as ProfileLite[],
        sucursales: filtrarSucursalesActivas(
          (sucursalesRes.data || []) as SucursalLite[]
        )
      }
    });

    const nextLiquidacionId = get().selectedLiquidacionId;

    if (nextLiquidacionId) {
      await get().loadLiquidacionDetalle(nextLiquidacionId);
    } else {
      set({ liquidacionDetalle: [] });
    }
  },

  loadLiquidacionDetalle: async (liquidacionId) => {
    if (!liquidacionId) {
      set({
        liquidacionDetalle: []
      });

      return;
    }

    const { data, error } = await supabase
      .from("liquidaciones_comisiones_detalle")
      .select("*")
      .eq("liquidacion_id", liquidacionId)
      .order("fecha_venta", {
        ascending: true
      })
      .order("created_at", {
        ascending: true
      });

    if (error) {
      set({
        error: normalizeError(error),
        liquidacionDetalle: []
      });

      return;
    }

    set({
      liquidacionDetalle: (data || []) as LiquidacionComisionDetalle[]
    });
  },

  calcularLiquidacion: async (
    vendedorId,
    anio = Number(get().filters.anio),
    mes = Number(get().filters.mes)
  ) => {
    set({
      saving: true,
      error: null
    });

    const { data, error } = await supabase.rpc(
      "calcular_liquidacion_comision_mensual",
      {
        p_vendedor_id: vendedorId,
        p_anio: anio,
        p_mes: mes
      }
    );

    if (error) {
      set({
        saving: false,
        error: normalizeError(error)
      });

      return null;
    }

    const liquidacionId = String(data || "");

    await get().loadComisiones();

    if (liquidacionId) {
      set({
        selectedLiquidacionId: liquidacionId
      });

      await get().loadLiquidacionDetalle(liquidacionId);
    }

    set({
      saving: false
    });

    return liquidacionId || null;
  },

  cerrarLiquidacion: async (liquidacionId) => {
    set({
      saving: true,
      error: null
    });

    const { error } = await supabase.rpc(
      "cerrar_liquidacion_comision",
      {
        p_liquidacion_id: liquidacionId
      }
    );

    if (error) {
      set({
        saving: false,
        error: normalizeError(error)
      });

      return false;
    }

    await get().loadComisiones();

    set({
      saving: false,
      selectedLiquidacionId: liquidacionId
    });

    await get().loadLiquidacionDetalle(liquidacionId);

    return true;
  },

  marcarLiquidacionPagada: async (
    liquidacionId,
    observaciones = ""
  ) => {
    set({
      saving: true,
      error: null
    });

    const { error } = await supabase.rpc(
      "marcar_liquidacion_comision_pagada",
      {
        p_liquidacion_id: liquidacionId,
        p_observaciones: observaciones || null
      }
    );

    if (error) {
      set({
        saving: false,
        error: normalizeError(error)
      });

      return false;
    }

    await get().loadComisiones();

    set({
      saving: false,
      selectedLiquidacionId: liquidacionId
    });

    await get().loadLiquidacionDetalle(liquidacionId);

    return true;
  },

  registrarAjuste: async (input) => {
    set({
      saving: true,
      error: null
    });

    const { data, error } = await supabase.rpc(
      "registrar_ajuste_liquidacion_comision",
      {
        p_liquidacion_destino_id: input.liquidacionDestinoId,
        p_liquidacion_origen_id: input.liquidacionOrigenId,
        p_origen: input.origen,
        p_origen_id: input.origenId,
        p_ajuste_utilidad_usd: input.ajusteUtilidadUsd,
        p_motivo: input.motivo,
        p_observaciones: input.observaciones || null
      }
    );

    if (error) {
      set({
        saving: false,
        error: normalizeError(error)
      });

      return null;
    }

    const detalleAjusteId = String(data || "");

    await get().loadComisiones();

    set({
      saving: false,
      selectedLiquidacionId: input.liquidacionDestinoId
    });

    await get().loadLiquidacionDetalle(
      input.liquidacionDestinoId
    );

    return detalleAjusteId || null;
  },

  anularLiquidacion: async (
    liquidacionId,
    motivo,
    observaciones = ""
  ) => {
    set({
      saving: true,
      error: null
    });

    const { error } = await supabase.rpc(
      "anular_liquidacion_comision",
      {
        p_liquidacion_id: liquidacionId,
        p_motivo: motivo,
        p_observaciones: observaciones || null
      }
    );

    if (error) {
      set({
        saving: false,
        error: normalizeError(error)
      });

      return false;
    }

    await get().loadComisiones();

    set({
      saving: false,
      selectedLiquidacionId: liquidacionId
    });

    await get().loadLiquidacionDetalle(liquidacionId);

    return true;
  },

  setFilter: (key, value) => {
    set((state) => {
      const nextFilters = {
        ...state.filters,
        [key]: value
      };

      let nextSelectedVendedorId = state.selectedVendedorId;

      if (key === "vendedorId") {
        nextSelectedVendedorId =
          value !== "todos"
            ? String(value)
            : null;
      }

      return {
        filters: nextFilters,
        selectedVendedorId: nextSelectedVendedorId,
        selectedLiquidacionId: null,
        liquidacionDetalle: []
      };
    });
  },

  resetFilters: () => {
    set({
      filters: getDefaultFilters(),
      selectedVendedorId: null,
      selectedLiquidacionId: null,
      liquidacionDetalle: [],
      sellerDefaultApplied: false
    });
  },

  selectVendedor: (id) => {
    set({
      selectedVendedorId: id
    });
  },

  selectLiquidacion: async (id) => {
    set({
      selectedLiquidacionId: id,
      liquidacionDetalle: []
    });

    await get().loadLiquidacionDetalle(id);
  },

  clearError: () => {
    set({
      error: null
    });
  },

  getMensualFiltrado: () => {
    const { mensual, filters } = get();
    const search = normalizeText(filters.search);

    if (!search) return mensual;

    return mensual.filter((item) => {
      const haystack = normalizeText(
        [
          item.vendedor,
          item.sucursal,
          item.nivel_alcanzado
        ].join(" ")
      );

      return haystack.includes(search);
    });
  },

  getSemanalFiltrado: () => {
    const { semanal, filters } = get();
    const search = normalizeText(filters.search);

    if (!search) return semanal;

    return semanal.filter((item) => {
      const haystack = normalizeText(
        [
          item.vendedor,
          item.sucursal,
          item.estado_meta
        ].join(" ")
      );

      return haystack.includes(search);
    });
  },

  getVentasFiltradas: () => {
    const {
      ventas,
      filters,
      selectedVendedorId
    } = get();

    const search = normalizeText(filters.search);

    let items = ventas;

    if (selectedVendedorId) {
      items = items.filter(
        (item) => item.vendedor_id === selectedVendedorId
      );
    }

    if (search) {
      items = items.filter((item) => {
        const haystack = normalizeText(
          [
            item.origen,
            item.numero,
            item.vendedor,
            item.pasajero,
            item.moneda
          ].join(" ")
        );

        return haystack.includes(search);
      });
    }

    return items;
  },

  getSelectedMensual: () => {
    const mensual = get().getMensualFiltrado();
    const selectedVendedorId = get().selectedVendedorId;

    if (!selectedVendedorId) {
      return mensual[0] || null;
    }

    return (
      mensual.find(
        (item) => item.vendedor_id === selectedVendedorId
      ) || null
    );
  },

  getSelectedLiquidacion: () => {
    const {
      liquidaciones,
      selectedLiquidacionId
    } = get();

    if (!selectedLiquidacionId) {
      return liquidaciones[0] || null;
    }

    return (
      liquidaciones.find(
        (item) => item.id === selectedLiquidacionId
      ) || null
    );
  },

  getMetrics: () => {
    const mensual = get().getMensualFiltrado();

    const vendedoresUnicos = new Set(
      mensual
        .map((item) => item.vendedor_id)
        .filter(Boolean)
    );

    return {
      vendedores: vendedoresUnicos.size,

      utilidadTotalUsd: mensual.reduce(
        (total, item) =>
          total + getNumber(item.utilidad_total_usd),
        0
      ),

      facturacionTotalUsd: mensual.reduce(
        (total, item) =>
          total + getNumber(item.facturacion_total_usd),
        0
      ),

      comisionTotalUsd: mensual.reduce(
        (total, item) =>
          total + getNumber(item.comision_estimada_usd),
        0
      ),

      logrados: mensual.filter(
        (item) => item.nivel_alcanzado === "LOGRADO"
      ).length,

      piso: mensual.filter(
        (item) => item.nivel_alcanzado === "PISO"
      ).length,

      medio: mensual.filter(
        (item) => item.nivel_alcanzado === "MEDIO"
      ).length,

      bajoPiso: mensual.filter(
        (item) => item.nivel_alcanzado === "BAJO_PISO"
      ).length,

      sinMeta: mensual.filter(
        (item) => item.nivel_alcanzado === "SIN_META"
      ).length
    };
  },

  getMatrizAnual: () => {
    const {
      matrizAnual,
      filters
    } = get();

    const search = normalizeText(filters.search);

    if (!search) return matrizAnual;

    return matrizAnual.filter((item) => {
      const haystack = normalizeText(
        [
          item.vendedor,
          item.sucursal
        ].join(" ")
      );

      return haystack.includes(search);
    });
  }
}));
