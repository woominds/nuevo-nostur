// src/store/facturasPagarStore.ts

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
  color: string | null;
  activo: boolean;
};

export type ProveedorLite = {
  id: string;
  nombre: string | null;
  nombre_comercial?: string | null;
  razon_social: string | null;
  cuit: string | null;
  email?: string | null;
  telefono?: string | null;
  observaciones?: string | null;
  activo: boolean;
};

export type SucursalLite = {
  id: string;
  nombre: string;
  color?: string | null;
  activa?: boolean;
  activo?: boolean;
};

export type CajaLite = {
  id: string;
  nombre: string;
  moneda?: string | null;
  tipo?: string | null;
  activa?: boolean;
  activo?: boolean;
};

export type FormaPagoLite = {
  id: string;
  nombre: string;
  impacta_tesoreria: boolean;
  activo: boolean;
};

export type FacturaPagar = {
  id: string;
  proveedor_id: string | null;
  proveedor_nombre: string | null;
  descripcion: string;
  numero_factura: string | null;
  fecha_emision: string | null;
  fecha_vencimiento: string;
  moneda: string;
  sucursal_id: string | null;
  sucursal_nombre?: string | null;

  neto_gravado: string | number;
  iva_porcentaje: string | number;
  iva_importe: string | number;
  no_gravado: string | number;
  exento: string | number;
  total: string | number;
  saldo_pendiente: string | number;
  total_pagado: string | number;

  estado: string;
  estado_visual?: string | null;
  origen: string;
  recurrente_id: string | null;
  periodo: string | null;
  plan_pago: boolean;
  no_impacta_caja: boolean;

  archivo_url: string | null;
  archivo_nombre: string | null;
  observaciones: string | null;

  activo: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;

  cantidad_cuotas?: number;
  cantidad_pagos?: number;
};

export type FacturaPagarCuota = {
  id: string;
  factura_id: string;
  numero_cuota: number;
  descripcion: string | null;
  fecha_vencimiento: string;
  moneda: string;
  importe: string | number;
  saldo_pendiente: string | number;
  total_pagado: string | number;
  estado: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type FacturaPagarPago = {
  id: string;
  factura_id: string;
  cuota_id: string | null;
  fecha_pago: string;
  caja_id: string | null;
  caja_nombre: string | null;
  forma_pago_id: string | null;
  forma_pago: string | null;
  moneda: string;
  importe: string | number;
  no_impacta_caja: boolean;
  movimiento_caja_id: string | null;
  observaciones: string | null;
  anulado: boolean;
  motivo_anulacion: string | null;
  anulado_at: string | null;
  anulado_by: string | null;
  created_by: string | null;
  created_at: string;
};

export type GastoRecurrente = {
  id: string;
  proveedor_id: string | null;
  proveedor_nombre: string | null;
  descripcion: string;
  sucursal_id: string | null;
  moneda: string;
  importe_estimado: string | number;
  frecuencia: "MENSUAL" | "SEMANAL" | "ANUAL";
  dia_vencimiento: number;
  mes_vencimiento: number | null;
  categoria: string | null;
  no_impacta_caja: boolean;
  generar_automatico: boolean;
  fecha_inicio: string;
  fecha_fin: string | null;
  observaciones: string | null;
  activo: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type FacturaCuotaDraft = {
  id: string | null;
  numero_cuota: number;
  descripcion: string;
  fecha_vencimiento: string;
  importe: string;
};

export type FacturaPagarDraft = {
  id: string | null;
  proveedor_id: string | null;
  proveedor_nombre: string;
  descripcion: string;
  numero_factura: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  moneda: string;
  sucursal_id: string | null;

  neto_gravado: string;
  iva_porcentaje: string;
  iva_importe: string;
  iva_manual: boolean;
  no_gravado: string;
  exento: string;
  total: string;

  origen: "MANUAL" | "RECURRENTE";
  recurrente_id: string | null;
  periodo: string | null;
  plan_pago: boolean;
  no_impacta_caja: boolean;
  confirmar_proyectada: boolean;

  archivo_url: string;
  archivo_nombre: string;
  observaciones: string;

  cuotas: FacturaCuotaDraft[];
};

export type FacturaPagarPagoDraft = {
  factura_id: string;
  cuota_id: string | null;
  fecha_pago: string;
  caja_id: string | null;
  caja_nombre: string;
  forma_pago_id: string | null;
  forma_pago: string;
  moneda: string;
  importe: string;
  no_impacta_caja: boolean;
  observaciones: string;
};

export type GastoRecurrenteDraft = {
  id: string | null;
  proveedor_id: string | null;
  proveedor_nombre: string;
  descripcion: string;
  sucursal_id: string | null;
  moneda: string;
  importe_estimado: string;
  frecuencia: "MENSUAL" | "SEMANAL" | "ANUAL";
  dia_vencimiento: string;
  mes_vencimiento: string;
  categoria: string;
  no_impacta_caja: boolean;
  generar_automatico: boolean;
  fecha_inicio: string;
  fecha_fin: string;
  observaciones: string;
};

export type FacturasPagarFilters = {
  desde: string;
  hasta: string;
  estado:
    | "pendientes"
    | "vencidas"
    | "por_vencer"
    | "proyectadas"
    | "pagadas"
    | "todas";
  moneda: "todas" | "ARS" | "USD";
  proveedorId: string;
  sucursalId: string;
  search: string;
};

type FacturasPagarMetrics = {
  pendienteArs: number;
  pendienteUsd: number;
  vencidas: number;
  porVencer: number;
  pagadasMes: number;
  recurrentes: number;
};

type FacturasPagarState = {
  loading: boolean;
  saving: boolean;
  error: string | null;

  currentProfile: ProfileLite | null;
  canManageFacturas: boolean;

  facturas: FacturaPagar[];
  cuotas: FacturaPagarCuota[];
  pagos: FacturaPagarPago[];
  recurrentes: GastoRecurrente[];

  catalogos: {
    proveedores: ProveedorLite[];
    sucursales: SucursalLite[];
    cajas: CajaLite[];
    formasPago: FormaPagoLite[];
  };

  filters: FacturasPagarFilters;
  selectedFacturaId: string | null;

  loadFacturas: () => Promise<void>;
  saveFactura: (draft: FacturaPagarDraft) => Promise<boolean>;
  deleteFactura: (facturaId: string) => Promise<boolean>;
  registrarPago: (draft: FacturaPagarPagoDraft) => Promise<boolean>;
  anularPago: (pago: FacturaPagarPago, motivo: string) => Promise<boolean>;
  saveRecurrente: (draft: GastoRecurrenteDraft) => Promise<boolean>;
  createProveedorInline: (nombre: string) => Promise<ProveedorLite | null>;
  generarRecurrentesMes: () => Promise<number>;

  setFilter: <K extends keyof FacturasPagarFilters>(
    key: K,
    value: FacturasPagarFilters[K]
  ) => void;
  resetFilters: () => void;
  selectFactura: (id: string | null) => void;
  clearError: () => void;

  getFilteredFacturas: () => FacturaPagar[];
  getSelectedFactura: () => FacturaPagar | null;
  getCuotasBySelected: () => FacturaPagarCuota[];
  getPagosBySelected: () => FacturaPagarPago[];
  getMetrics: () => FacturasPagarMetrics;
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

function getMonthStart(): string {
  const today = getToday();
  return `${today.slice(0, 7)}-01`;
}

function getDefaultFilters(): FacturasPagarFilters {
  return {
    desde: getMonthStart(),
    hasta: getToday(),
    estado: "pendientes",
    moneda: "todas",
    proveedorId: "todos",
    sucursalId: "todas",
    search: ""
  };
}

function normalizeText(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function cleanText(value: unknown): string {
  return String(value || "").trim();
}

function nullableText(value: unknown): string | null {
  const cleaned = cleanText(value);
  return cleaned ? cleaned : null;
}

function parseMoney(
  value: string | number | null | undefined
): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value || "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeError(error: unknown): string {
  if (!error) {
    return "Ocurrió un error inesperado.";
  }

  if (typeof error === "object" && "message" in error) {
    const message = String(
      (error as { message?: unknown }).message ||
        "Ocurrió un error."
    );

    const normalized = message.toLowerCase();

    if (normalized.includes("row-level security")) {
      return "No tenés permisos para esta acción.";
    }

    if (normalized.includes("permission denied")) {
      return "Permiso denegado por Supabase/RLS.";
    }

    if (normalized.includes("duplicate key")) {
      return "Ya existe un registro igual.";
    }

    return message;
  }

  return String(error);
}

function addDays(dateString: string, days: number): string {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function sortFacturas(
  facturas: FacturaPagar[]
): FacturaPagar[] {
  return [...facturas].sort((a, b) => {
    const fechaComparison = String(
      a.fecha_vencimiento || ""
    ).localeCompare(
      String(b.fecha_vencimiento || "")
    );

    if (fechaComparison !== 0) {
      return fechaComparison;
    }

    return String(a.descripcion || "").localeCompare(
      String(b.descripcion || "")
    );
  });
}

function sortCuotas(
  cuotas: FacturaPagarCuota[]
): FacturaPagarCuota[] {
  return [...cuotas].sort(
    (a, b) => a.numero_cuota - b.numero_cuota
  );
}

function sortPagos(
  pagos: FacturaPagarPago[]
): FacturaPagarPago[] {
  return [...pagos].sort((a, b) => {
    const fechaComparison = String(
      b.fecha_pago || ""
    ).localeCompare(
      String(a.fecha_pago || "")
    );

    if (fechaComparison !== 0) {
      return fechaComparison;
    }

    return String(b.created_at || "").localeCompare(
      String(a.created_at || "")
    );
  });
}

function sortProveedores(
  proveedores: ProveedorLite[]
): ProveedorLite[] {
  return [...proveedores].sort((a, b) => {
    const nombreA =
      a.nombre_comercial ||
      a.nombre ||
      a.razon_social ||
      "";

    const nombreB =
      b.nombre_comercial ||
      b.nombre ||
      b.razon_social ||
      "";

    return nombreA.localeCompare(nombreB);
  });
}

function sortCajas(cajas: CajaLite[]): CajaLite[] {
  return [...cajas].sort((a, b) =>
    String(a.nombre || "").localeCompare(
      String(b.nombre || "")
    )
  );
}

function sortFormasPago(
  formasPago: FormaPagoLite[]
): FormaPagoLite[] {
  return [...formasPago].sort((a, b) =>
    String(a.nombre || "").localeCompare(
      String(b.nombre || "")
    )
  );
}

function getFacturaById(
  facturas: FacturaPagar[],
  facturaId: string
): FacturaPagar | null {
  return (
    facturas.find(
      (factura) => factura.id === facturaId
    ) || null
  );
}

function getFormaPagoById(
  formasPago: FormaPagoLite[],
  formaPagoId: string | null
): FormaPagoLite | null {
  if (!formaPagoId) {
    return null;
  }

  return (
    formasPago.find(
      (formaPago) => formaPago.id === formaPagoId
    ) || null
  );
}

function getCajaById(
  cajas: CajaLite[],
  cajaId: string | null
): CajaLite | null {
  if (!cajaId) {
    return null;
  }

  return cajas.find((caja) => caja.id === cajaId) || null;
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
}

function canProfileManage(
  profile: ProfileLite | null
): boolean {
  return Boolean(
    profile?.activo &&
      [
        "administracion",
        "gerencia",
        "admin_general"
      ].includes(profile.rol)
  );
}

function canProfileUse(
  profile: ProfileLite | null
): boolean {
  return Boolean(
    profile?.activo &&
      [
        "administracion",
        "gerencia",
        "admin_general",
        "vendedor"
      ].includes(profile.rol)
  );
}

function formaPagoImpactaTesoreria(
  formaPago: FormaPagoLite | null
): boolean {
  return Boolean(
    formaPago?.activo &&
      formaPago.impacta_tesoreria
  );
}

function isFacturaAbierta(
  factura: FacturaPagar
): boolean {
  const estado =
    factura.estado_visual || factura.estado;

  return [
    "PENDIENTE",
    "PROYECTADA",
    "POR_VENCER",
    "VENCIDA"
  ].includes(estado);
}

export function getFacturaEstadoLabel(
  estado: string
): string {
  const labels: Record<string, string> = {
    PROYECTADA: "Proyectada",
    PENDIENTE: "Pendiente",
    PAGADA: "Pagada",
    CANCELADA: "Cancelada",
    VENCIDA: "Vencida",
    POR_VENCER: "Por vencer"
  };

  return labels[estado] || estado;
}

export function getFacturaEstadoTone(
  estado: string
):
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral" {
  if (estado === "PAGADA") return "success";
  if (estado === "VENCIDA") return "danger";
  if (estado === "POR_VENCER") return "warning";
  if (estado === "PROYECTADA") return "info";
  if (estado === "CANCELADA") return "neutral";

  return "warning";
}

export function createInitialFacturaDraft(
  factura?: FacturaPagar | null
): FacturaPagarDraft {
  if (factura) {
    return {
      id: factura.id,
      proveedor_id: factura.proveedor_id,
      proveedor_nombre:
        factura.proveedor_nombre || "",
      descripcion: factura.descripcion || "",
      numero_factura:
        factura.numero_factura || "",
      fecha_emision:
        factura.fecha_emision || getToday(),
      fecha_vencimiento:
        factura.fecha_vencimiento || getToday(),
      moneda: factura.moneda || "ARS",
      sucursal_id: factura.sucursal_id || null,

      neto_gravado: String(
        factura.neto_gravado || "0"
      ).replace(".", ","),
      iva_porcentaje: String(
        factura.iva_porcentaje || "21"
      ).replace(".", ","),
      iva_importe: String(
        factura.iva_importe || "0"
      ).replace(".", ","),
      iva_manual: true,
      no_gravado: String(
        factura.no_gravado || "0"
      ).replace(".", ","),
      exento: String(
        factura.exento || "0"
      ).replace(".", ","),
      total: String(
        factura.total || "0"
      ).replace(".", ","),

      origen:
        factura.origen === "RECURRENTE"
          ? "RECURRENTE"
          : "MANUAL",
      recurrente_id:
        factura.recurrente_id || null,
      periodo: factura.periodo || null,
      plan_pago: Boolean(factura.plan_pago),
      no_impacta_caja: Boolean(
        factura.no_impacta_caja
      ),
      confirmar_proyectada:
        factura.estado !== "PROYECTADA",

      archivo_url: factura.archivo_url || "",
      archivo_nombre:
        factura.archivo_nombre || "",
      observaciones:
        factura.observaciones || "",

      cuotas: []
    };
  }

  return {
    id: null,
    proveedor_id: null,
    proveedor_nombre: "",
    descripcion: "",
    numero_factura: "",
    fecha_emision: getToday(),
    fecha_vencimiento: getToday(),
    moneda: "ARS",
    sucursal_id: null,

    neto_gravado: "",
    iva_porcentaje: "21",
    iva_importe: "0",
    iva_manual: false,
    no_gravado: "0",
    exento: "0",
    total: "0",

    origen: "MANUAL",
    recurrente_id: null,
    periodo: null,
    plan_pago: false,
    no_impacta_caja: false,
    confirmar_proyectada: true,

    archivo_url: "",
    archivo_nombre: "",
    observaciones: "",

    cuotas: []
  };
}

export function createInitialPagoDraft(
  factura?: FacturaPagar | null
): FacturaPagarPagoDraft {
  return {
    factura_id: factura?.id || "",
    cuota_id: null,
    fecha_pago: getToday(),
    caja_id: null,
    caja_nombre: "",
    forma_pago_id: null,
    forma_pago: "",
    moneda: factura?.moneda || "ARS",
    importe: factura
      ? String(
          factura.saldo_pendiente || "0"
        ).replace(".", ",")
      : "",
    no_impacta_caja: false,
    observaciones: ""
  };
}

export function createInitialRecurrenteDraft(
  recurrente?: GastoRecurrente | null
): GastoRecurrenteDraft {
  if (recurrente) {
    return {
      id: recurrente.id,
      proveedor_id: recurrente.proveedor_id,
      proveedor_nombre:
        recurrente.proveedor_nombre || "",
      descripcion: recurrente.descripcion || "",
      sucursal_id:
        recurrente.sucursal_id || null,
      moneda: recurrente.moneda || "ARS",
      importe_estimado: String(
        recurrente.importe_estimado || "0"
      ).replace(".", ","),
      frecuencia:
        recurrente.frecuencia || "MENSUAL",
      dia_vencimiento: String(
        recurrente.dia_vencimiento || 1
      ),
      mes_vencimiento:
        recurrente.mes_vencimiento !== null
          ? String(recurrente.mes_vencimiento)
          : "",
      categoria: recurrente.categoria || "",
      no_impacta_caja: Boolean(
        recurrente.no_impacta_caja
      ),
      generar_automatico: Boolean(
        recurrente.generar_automatico
      ),
      fecha_inicio:
        recurrente.fecha_inicio || getToday(),
      fecha_fin: recurrente.fecha_fin || "",
      observaciones:
        recurrente.observaciones || ""
    };
  }

  return {
    id: null,
    proveedor_id: null,
    proveedor_nombre: "",
    descripcion: "",
    sucursal_id: null,
    moneda: "ARS",
    importe_estimado: "",
    frecuencia: "MENSUAL",
    dia_vencimiento: "10",
    mes_vencimiento: "",
    categoria: "",
    no_impacta_caja: false,
    generar_automatico: true,
    fecha_inicio: getToday(),
    fecha_fin: "",
    observaciones: ""
  };
}

function buildEstadoFactura(
  draft: FacturaPagarDraft
): "PENDIENTE" | "PROYECTADA" {
  return draft.confirmar_proyectada ||
    draft.origen === "MANUAL"
    ? "PENDIENTE"
    : "PROYECTADA";
}

function validarPermisosGuardarFactura(
  currentUserId: string | null,
  currentProfile: ProfileLite | null,
  canManageFacturas: boolean
): string | null {
  if (!currentUserId || !currentProfile) {
    return "No hay usuario autenticado.";
  }

  if (!canManageFacturas) {
    return "No tenés permisos para guardar facturas.";
  }

  return null;
}

function validarFacturaDraft(
  draft: FacturaPagarDraft
): string | null {
  const total = parseMoney(draft.total);

  if (!draft.proveedor_id) {
    return "Seleccioná o creá un proveedor.";
  }

  if (!cleanText(draft.descripcion)) {
    return "Ingresá una descripción.";
  }

  if (!draft.fecha_vencimiento) {
    return "Ingresá una fecha de vencimiento.";
  }

  if (total <= 0) {
    return "El total debe ser mayor a cero.";
  }

  if (draft.plan_pago) {
    if (draft.cuotas.length === 0) {
      return "Agregá al menos una cuota.";
    }

    const cuotaInvalida = draft.cuotas.some(
      (cuota) =>
        !cuota.fecha_vencimiento ||
        parseMoney(cuota.importe) <= 0
    );

    if (cuotaInvalida) {
      return "Completá vencimiento e importe en todas las cuotas.";
    }

    const totalCuotas = draft.cuotas.reduce(
      (acumulado, cuota) =>
        acumulado + parseMoney(cuota.importe),
      0
    );

    if (Math.abs(totalCuotas - total) > 0.009) {
      return "El total de cuotas debe coincidir con el total de la factura.";
    }
  }

  return null;
}

function validarPagoDraft(
  draft: FacturaPagarPagoDraft,
  factura: FacturaPagar | null,
  formaPago: FormaPagoLite | null,
  caja: CajaLite | null
): string | null {
  const importe = parseMoney(draft.importe);
  const impactaTesoreria =
    formaPagoImpactaTesoreria(formaPago);

  if (!draft.factura_id) {
    return "No hay factura seleccionada.";
  }

  if (!factura) {
    return "No se encontró la factura.";
  }

  if (!draft.fecha_pago) {
    return "Seleccioná la fecha de pago.";
  }

  if (!formaPago) {
    return "Seleccioná una forma de pago válida.";
  }

  if (importe <= 0) {
    return "El importe del pago debe ser mayor a cero.";
  }

  if (
    importe >
    parseMoney(factura.saldo_pendiente) + 0.009
  ) {
    return "El importe supera el saldo pendiente.";
  }

  if (draft.cuota_id) {
    const cuotaExiste = Boolean(draft.cuota_id);

    if (!cuotaExiste) {
      return "La cuota seleccionada no es válida.";
    }
  }

  if (impactaTesoreria && !draft.caja_id) {
    return "Esta forma de pago impacta tesorería. Seleccioná una caja.";
  }

  if (impactaTesoreria && !caja) {
    return "La caja seleccionada no existe o está inactiva.";
  }

  if (
    impactaTesoreria &&
    caja?.moneda &&
    String(caja.moneda).toUpperCase() !==
      String(factura.moneda).toUpperCase()
  ) {
    return "La moneda de la caja no coincide con la moneda de la factura.";
  }

  return null;
}

function buildFacturaPayload(
  draft: FacturaPagarDraft,
  estado: "PENDIENTE" | "PROYECTADA",
  total: number,
  currentUserId: string
) {
  return {
    proveedor_id: draft.proveedor_id || null,
    proveedor_nombre:
      nullableText(draft.proveedor_nombre),
    descripcion: cleanText(draft.descripcion),
    numero_factura:
      nullableText(draft.numero_factura),
    fecha_emision: draft.fecha_emision || null,
    fecha_vencimiento: draft.fecha_vencimiento,
    moneda: draft.moneda || "ARS",
    sucursal_id: draft.sucursal_id || null,

    neto_gravado: parseMoney(
      draft.neto_gravado
    ),
    iva_porcentaje: parseMoney(
      draft.iva_porcentaje
    ),
    iva_importe: parseMoney(
      draft.iva_importe
    ),
    no_gravado: parseMoney(
      draft.no_gravado
    ),
    exento: parseMoney(draft.exento),
    total,

    estado,
    origen: draft.origen || "MANUAL",
    recurrente_id:
      draft.recurrente_id || null,
    periodo: draft.periodo || null,
    plan_pago: Boolean(draft.plan_pago),
    no_impacta_caja: Boolean(
      draft.no_impacta_caja
    ),

    archivo_url:
      nullableText(draft.archivo_url),
    archivo_nombre:
      nullableText(draft.archivo_nombre),
    observaciones:
      nullableText(draft.observaciones),

    activo: true,
    updated_by: currentUserId
  };
}

async function upsertFactura(
  draft: FacturaPagarDraft,
  currentUserId: string
): Promise<{
  facturaId: string | null;
  estado: "PENDIENTE" | "PROYECTADA";
  total: number;
  error: unknown;
}> {
  const total = parseMoney(draft.total);
  const estado = buildEstadoFactura(draft);

  const payload = buildFacturaPayload(
    draft,
    estado,
    total,
    currentUserId
  );

  if (draft.id) {
    const { error } = await supabase
      .from("facturas_pagar")
      .update(payload)
      .eq("id", draft.id);

    return {
      facturaId: draft.id,
      estado,
      total,
      error
    };
  }

  const { data, error } = await supabase
    .from("facturas_pagar")
    .insert({
      ...payload,
      saldo_pendiente: total,
      total_pagado: 0,
      created_by: currentUserId
    })
    .select("id")
    .single();

  return {
    facturaId: data?.id || null,
    estado,
    total,
    error
  };
}

async function guardarCuotasFactura(
  facturaId: string,
  draft: FacturaPagarDraft,
  estado: "PENDIENTE" | "PROYECTADA",
  total: number
): Promise<{ error: unknown }> {
  const pagosRes = await supabase
    .from("facturas_pagar_pagos")
    .select("id")
    .eq("factura_id", facturaId)
    .eq("anulado", false)
    .limit(1);

  if (pagosRes.error) {
    return { error: pagosRes.error };
  }

  if (
    draft.id &&
    (pagosRes.data || []).length > 0
  ) {
    return {
      error: new Error(
        "No se puede modificar el plan de cuotas porque la factura ya tiene pagos registrados."
      )
    };
  }

  const deleteRes = await supabase
    .from("facturas_pagar_cuotas")
    .delete()
    .eq("factura_id", facturaId);

  if (deleteRes.error) {
    return { error: deleteRes.error };
  }

  if (
    draft.plan_pago &&
    draft.cuotas.length > 0
  ) {
    const cuotasPayload = draft.cuotas.map(
      (cuota, index) => {
        const importe = parseMoney(
          cuota.importe
        );

        return {
          factura_id: facturaId,
          numero_cuota:
            cuota.numero_cuota || index + 1,
          descripcion:
            nullableText(cuota.descripcion) ||
            `Cuota ${index + 1}`,
          fecha_vencimiento:
            cuota.fecha_vencimiento ||
            draft.fecha_vencimiento,
          moneda: draft.moneda || "ARS",
          importe,
          saldo_pendiente: importe,
          total_pagado: 0,
          estado,
          activo: true
        };
      }
    );

    const { error } = await supabase
      .from("facturas_pagar_cuotas")
      .insert(cuotasPayload);

    return { error };
  }

  const { error } = await supabase
    .from("facturas_pagar_cuotas")
    .insert({
      factura_id: facturaId,
      numero_cuota: 1,
      descripcion:
        cleanText(draft.descripcion),
      fecha_vencimiento:
        draft.fecha_vencimiento,
      moneda: draft.moneda || "ARS",
      importe: total,
      saldo_pendiente: total,
      total_pagado: 0,
      estado,
      activo: true
    });

  return { error };
}

async function guardarFacturaCompleta(
  draft: FacturaPagarDraft,
  currentUserId: string
): Promise<{
  facturaId: string | null;
  error: unknown;
}> {
  const facturaResult = await upsertFactura(
    draft,
    currentUserId
  );

  if (
    facturaResult.error ||
    !facturaResult.facturaId
  ) {
    return {
      facturaId: null,
      error:
        facturaResult.error ||
        new Error(
          "No se pudo obtener el ID de la factura."
        )
    };
  }

  const cuotasResult =
    await guardarCuotasFactura(
      facturaResult.facturaId,
      draft,
      facturaResult.estado,
      facturaResult.total
    );

  if (cuotasResult.error) {
    return {
      facturaId: null,
      error: cuotasResult.error
    };
  }

  const recalculoRes = await supabase.rpc(
    "recalcular_factura_pagar",
    {
      p_factura_id:
        facturaResult.facturaId
    }
  );

  if (recalculoRes.error) {
    return {
      facturaId: null,
      error: recalculoRes.error
    };
  }

  return {
    facturaId: facturaResult.facturaId,
    error: null
  };
}

function buildRecurrentePayload(
  draft: GastoRecurrenteDraft,
  currentUserId: string
) {
  return {
    proveedor_id: draft.proveedor_id || null,
    proveedor_nombre:
      nullableText(draft.proveedor_nombre),
    descripcion: cleanText(
      draft.descripcion
    ),
    sucursal_id: draft.sucursal_id || null,
    moneda: draft.moneda || "ARS",
    importe_estimado: parseMoney(
      draft.importe_estimado
    ),
    frecuencia:
      draft.frecuencia || "MENSUAL",
    dia_vencimiento: Math.min(
      Math.max(
        Number(draft.dia_vencimiento) || 1,
        1
      ),
      31
    ),
    mes_vencimiento:
      draft.mes_vencimiento
        ? Number(draft.mes_vencimiento)
        : null,
    categoria:
      nullableText(draft.categoria),
    no_impacta_caja: Boolean(
      draft.no_impacta_caja
    ),
    generar_automatico: Boolean(
      draft.generar_automatico
    ),
    fecha_inicio:
      draft.fecha_inicio || getToday(),
    fecha_fin: draft.fecha_fin || null,
    observaciones:
      nullableText(draft.observaciones),
    activo: true,
    updated_by: currentUserId
  };
}

function validarRecurrenteDraft(
  draft: GastoRecurrenteDraft
): string | null {
  if (!draft.proveedor_id) {
    return "Seleccioná o creá un proveedor.";
  }

  if (!cleanText(draft.descripcion)) {
    return "Ingresá una descripción.";
  }

  if (
    parseMoney(draft.importe_estimado) <= 0
  ) {
    return "El importe estimado debe ser mayor a cero.";
  }

  const diaVencimiento = Number(
    draft.dia_vencimiento
  );

  if (
    !Number.isFinite(diaVencimiento) ||
    diaVencimiento < 1 ||
    diaVencimiento > 31
  ) {
    return "El día de vencimiento debe estar entre 1 y 31.";
  }

  return null;
}

export const useFacturasPagarStore =
  create<FacturasPagarState>((set, get) => ({
    loading: false,
    saving: false,
    error: null,

    currentProfile: null,
    canManageFacturas: false,

    facturas: [],
    cuotas: [],
    pagos: [],
    recurrentes: [],

    catalogos: {
      proveedores: [],
      sucursales: [],
      cajas: [],
      formasPago: []
    },

    filters: getDefaultFilters(),
    selectedFacturaId: null,

    loadFacturas: async () => {
      set({
        loading: true,
        error: null
      });

      const currentUserId =
        await getCurrentUserId();

      if (!currentUserId) {
        set({
          loading: false,
          currentProfile: null,
          canManageFacturas: false,
          facturas: [],
          cuotas: [],
          pagos: [],
          recurrentes: [],
          catalogos: {
            proveedores: [],
            sucursales: [],
            cajas: [],
            formasPago: []
          },
          selectedFacturaId: null,
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
          error: normalizeError(
            profileRes.error
          )
        });

        return;
      }

      const currentProfile =
        (profileRes.data ||
          null) as ProfileLite | null;

      const canManageFacturas =
        canProfileManage(currentProfile);

      if (!canProfileUse(currentProfile)) {
        set({
          loading: false,
          currentProfile,
          canManageFacturas,
          facturas: [],
          cuotas: [],
          pagos: [],
          recurrentes: [],
          selectedFacturaId: null,
          error:
            "Tu usuario no tiene acceso al módulo Facturas a Pagar."
        });

        return;
      }

      const filters = get().filters;

      let facturasQuery = supabase
        .from("v_facturas_pagar_resumen")
        .select("*")
        .gte(
          "fecha_vencimiento",
          filters.desde
        )
        .lte(
          "fecha_vencimiento",
          filters.hasta
        )
        .order(
          "fecha_vencimiento",
          {
            ascending: true
          }
        );

      if (filters.moneda !== "todas") {
        facturasQuery =
          facturasQuery.eq(
            "moneda",
            filters.moneda
          );
      }

      if (
        filters.proveedorId !== "todos"
      ) {
        facturasQuery =
          facturasQuery.eq(
            "proveedor_id",
            filters.proveedorId
          );
      }

      if (
        filters.sucursalId !== "todas"
      ) {
        facturasQuery =
          facturasQuery.eq(
            "sucursal_id",
            filters.sucursalId
          );
      }

      if (filters.estado === "vencidas") {
        facturasQuery =
          facturasQuery.eq(
            "estado_visual",
            "VENCIDA"
          );
      }

      if (
        filters.estado === "por_vencer"
      ) {
        facturasQuery =
          facturasQuery.eq(
            "estado_visual",
            "POR_VENCER"
          );
      }

      if (
        filters.estado === "proyectadas"
      ) {
        facturasQuery =
          facturasQuery.eq(
            "estado",
            "PROYECTADA"
          );
      }

      if (filters.estado === "pagadas") {
        facturasQuery =
          facturasQuery.eq(
            "estado",
            "PAGADA"
          );
      }

      if (
        filters.estado === "pendientes"
      ) {
        facturasQuery =
          facturasQuery.in(
            "estado",
            [
              "PENDIENTE",
              "PROYECTADA"
            ]
          );
      }

      const [
        facturasRes,
        proveedoresRes,
        sucursalesRes,
        cajasRes,
        formasPagoRes,
        recurrentesRes
      ] = await Promise.all([
        facturasQuery,

        supabase
          .from("proveedores")
          .select("*")
          .eq("activo", true)
          .order("nombre"),

        supabase
          .from("sucursales")
          .select("*")
          .order("nombre"),

        supabase
          .from("cajas")
          .select("*")
          .eq("activo", true)
          .eq("activa", true)
          .order(
            "orden",
            {
              ascending: true
            }
          ),

        supabase
          .from("formas_pago")
          .select(
            "id,nombre,impacta_tesoreria,activo"
          )
          .eq("activo", true)
          .order("nombre"),

        supabase
          .from(
            "facturas_pagar_recurrentes"
          )
          .select("*")
          .eq("activo", true)
          .order(
            "created_at",
            {
              ascending: false
            }
          )
      ]);

      const firstError = [
        facturasRes.error,
        proveedoresRes.error,
        sucursalesRes.error,
        cajasRes.error,
        formasPagoRes.error,
        recurrentesRes.error
      ].find(Boolean);

      if (firstError) {
        set({
          loading: false,
          currentProfile,
          canManageFacturas,
          error:
            normalizeError(firstError)
        });

        return;
      }

      const facturas = sortFacturas(
        (facturasRes.data ||
          []) as FacturaPagar[]
      );

      const facturaIds = facturas.map(
        (factura) => factura.id
      );

      let cuotas: FacturaPagarCuota[] =
        [];

      let pagos: FacturaPagarPago[] = [];

      if (facturaIds.length > 0) {
        const [
          cuotasRes,
          pagosRes
        ] = await Promise.all([
          supabase
            .from(
              "facturas_pagar_cuotas"
            )
            .select("*")
            .in(
              "factura_id",
              facturaIds
            )
            .order(
              "numero_cuota",
              {
                ascending: true
              }
            ),

          supabase
            .from(
              "facturas_pagar_pagos"
            )
            .select("*")
            .in(
              "factura_id",
              facturaIds
            )
            .order(
              "fecha_pago",
              {
                ascending: false
              }
            )
            .order(
              "created_at",
              {
                ascending: false
              }
            )
        ]);

        const childError = [
          cuotasRes.error,
          pagosRes.error
        ].find(Boolean);

        if (childError) {
          set({
            loading: false,
            currentProfile,
            canManageFacturas,
            error:
              normalizeError(childError)
          });

          return;
        }

        cuotas = sortCuotas(
          (cuotasRes.data ||
            []) as FacturaPagarCuota[]
        );

        pagos = sortPagos(
          (pagosRes.data ||
            []) as FacturaPagarPago[]
        );
      }

      const selectedFacturaIdActual =
        get().selectedFacturaId;

      const selectedFacturaId =
        selectedFacturaIdActual &&
        facturas.some(
          (factura) =>
            factura.id ===
            selectedFacturaIdActual
        )
          ? selectedFacturaIdActual
          : facturas[0]?.id || null;

      set({
        loading: false,
        error: null,
        currentProfile,
        canManageFacturas,
        facturas,
        cuotas,
        pagos,

        recurrentes:
          (recurrentesRes.data ||
            []) as GastoRecurrente[],

        catalogos: {
          proveedores: sortProveedores(
            (proveedoresRes.data ||
              []) as ProveedorLite[]
          ),

          sucursales:
            filtrarSucursalesActivas(
              (sucursalesRes.data ||
                []) as SucursalLite[]
            ).sort((a, b) =>
              String(
                a.nombre || ""
              ).localeCompare(
                String(
                  b.nombre || ""
                )
              )
            ),

          cajas: sortCajas(
            (
              (cajasRes.data ||
                []) as CajaLite[]
            ).filter(
              (caja) =>
                caja.activa !== false &&
                caja.activo !== false &&
                String(
                  caja.tipo || ""
                ).toUpperCase() !==
                  "ALMUNDO"
            )
          ),

          formasPago: sortFormasPago(
            (formasPagoRes.data ||
              []) as FormaPagoLite[]
          )
        },

        selectedFacturaId
      });
    },

    saveFactura: async (draft) => {
      set({
        saving: true,
        error: null
      });

      const currentUserId =
        await getCurrentUserId();

      const {
        currentProfile,
        canManageFacturas
      } = get();

      const permisoError =
        validarPermisosGuardarFactura(
          currentUserId,
          currentProfile,
          canManageFacturas
        );

      if (permisoError) {
        set({
          saving: false,
          error: permisoError
        });

        return false;
      }

      const validationError =
        validarFacturaDraft(draft);

      if (validationError) {
        set({
          saving: false,
          error: validationError
        });

        return false;
      }

      const result =
        await guardarFacturaCompleta(
          draft,
          currentUserId as string
        );

      if (
        result.error ||
        !result.facturaId
      ) {
        set({
          saving: false,
          error: normalizeError(
            result.error ||
              "No se pudo guardar la factura."
          )
        });

        return false;
      }

      await get().loadFacturas();

      set({
        saving: false,
        selectedFacturaId:
          result.facturaId
      });

      return true;
    },

    deleteFactura: async (
      facturaId
    ) => {
      set({
        saving: true,
        error: null
      });

      const currentUserId =
        await getCurrentUserId();

      if (!currentUserId) {
        set({
          saving: false,
          error:
            "No hay usuario autenticado."
        });

        return false;
      }

      if (!get().canManageFacturas) {
        set({
          saving: false,
          error:
            "No tenés permisos para cancelar facturas."
        });

        return false;
      }

      const pagosActivos = get().pagos.filter(
        (pago) =>
          pago.factura_id === facturaId &&
          !pago.anulado
      );

      if (pagosActivos.length > 0) {
        set({
          saving: false,
          error:
            "No se puede cancelar una factura con pagos activos."
        });

        return false;
      }

      const { error } = await supabase
        .from("facturas_pagar")
        .update({
          estado: "CANCELADA",
          activo: false,
          updated_by: currentUserId,
          updated_at:
            new Date().toISOString()
        })
        .eq("id", facturaId);

      if (error) {
        set({
          saving: false,
          error: normalizeError(error)
        });

        return false;
      }

      await get().loadFacturas();

      set({
        saving: false
      });

      return true;
    },

    registrarPago: async (draft) => {
      set({
        saving: true,
        error: null
      });

      const currentUserId =
        await getCurrentUserId();

      if (!currentUserId) {
        set({
          saving: false,
          error:
            "No hay usuario autenticado."
        });

        return false;
      }

      if (!get().canManageFacturas) {
        set({
          saving: false,
          error:
            "No tenés permisos para registrar pagos."
        });

        return false;
      }

      const factura = getFacturaById(
        get().facturas,
        draft.factura_id
      );

      const formaPago =
        getFormaPagoById(
          get().catalogos.formasPago,
          draft.forma_pago_id
        );

      const impactaTesoreria =
        formaPagoImpactaTesoreria(
          formaPago
        );

      const caja = getCajaById(
        get().catalogos.cajas,
        draft.caja_id
      );

      const validationError =
        validarPagoDraft(
          draft,
          factura,
          formaPago,
          caja
        );

      if (validationError) {
        set({
          saving: false,
          error: validationError
        });

        return false;
      }

      if (!factura || !formaPago) {
        set({
          saving: false,
          error:
            "No se pudo validar la factura o la forma de pago."
        });

        return false;
      }

      const importe =
        parseMoney(
          draft.importe
        );

      const {
        error
      } = await supabase.rpc(
        "registrar_pago_factura_pagar",
        {
          p_factura_id:
            factura.id,

          p_cuota_id:
            draft.cuota_id ||
            null,

          p_fecha_pago:
            draft.fecha_pago ||
            getToday(),

          p_forma_pago_id:
            formaPago.id,

          p_caja_id:
            impactaTesoreria
              ? caja?.id ||
                null
              : null,

          p_importe:
            Number(
              importe.toFixed(2)
            ),

          p_observaciones:
            nullableText(
              draft.observaciones
            )
        }
      );

      if (error) {
        set({
          saving: false,
          error:
            normalizeError(
              error
            )
        });

        return false;
      }

      await get().loadFacturas();

      set({
        saving: false,
        selectedFacturaId:
          factura.id
      });

      return true;
    },

    anularPago: async (
      pago,
      motivo
    ) => {
      set({
        saving: true,
        error: null
      });

      const currentUserId =
        await getCurrentUserId();

      if (!currentUserId) {
        set({
          saving: false,
          error:
            "No hay usuario autenticado."
        });

        return false;
      }

      if (!get().canManageFacturas) {
        set({
          saving: false,
          error:
            "No tenés permisos para anular pagos."
        });

        return false;
      }

      const motivoLimpio =
        cleanText(motivo);

      if (!motivoLimpio) {
        set({
          saving: false,
          error:
            "Indicá el motivo de anulación."
        });

        return false;
      }

      if (pago.anulado) {
        set({
          saving: false,
          error:
            "El pago ya está anulado."
        });

        return false;
      }

      const {
        error
      } = await supabase.rpc(
        "anular_pago_factura_pagar",
        {
          p_pago_id:
            pago.id,

          p_motivo:
            motivoLimpio
        }
      );

      if (error) {
        set({
          saving: false,
          error:
            normalizeError(
              error
            )
        });

        return false;
      }

      await get().loadFacturas();

      set({
        saving: false,
        selectedFacturaId:
          pago.factura_id
      });

      return true;
    },

    saveRecurrente: async (draft) => {
      set({
        saving: true,
        error: null
      });

      const currentUserId =
        await getCurrentUserId();

      if (!currentUserId) {
        set({
          saving: false,
          error:
            "No hay usuario autenticado."
        });

        return false;
      }

      if (!get().canManageFacturas) {
        set({
          saving: false,
          error:
            "No tenés permisos para guardar gastos recurrentes."
        });

        return false;
      }

      const validationError =
        validarRecurrenteDraft(draft);

      if (validationError) {
        set({
          saving: false,
          error: validationError
        });

        return false;
      }

      const payload =
        buildRecurrentePayload(
          draft,
          currentUserId
        );

      if (draft.id) {
        const { error } = await supabase
          .from(
            "facturas_pagar_recurrentes"
          )
          .update(payload)
          .eq("id", draft.id);

        if (error) {
          set({
            saving: false,
            error: normalizeError(error)
          });

          return false;
        }
      } else {
        const { error } = await supabase
          .from(
            "facturas_pagar_recurrentes"
          )
          .insert({
            ...payload,
            created_by: currentUserId
          });

        if (error) {
          set({
            saving: false,
            error: normalizeError(error)
          });

          return false;
        }
      }

      await get().loadFacturas();

      set({
        saving: false
      });

      return true;
    },

    createProveedorInline: async (
      nombre
    ) => {
      const nombreLimpio =
        cleanText(nombre);

      if (!nombreLimpio) {
        set({
          error:
            "Ingresá un proveedor válido."
        });

        return null;
      }

      const proveedorExistente =
        get().catalogos.proveedores.find(
          (proveedor) =>
            [
              proveedor.nombre,
              proveedor.nombre_comercial,
              proveedor.razon_social
            ]
              .filter(Boolean)
              .some(
                (valor) =>
                  normalizeText(valor) ===
                  normalizeText(
                    nombreLimpio
                  )
              )
        );

      if (proveedorExistente) {
        return proveedorExistente;
      }

      const currentUserId =
        await getCurrentUserId();

      if (!currentUserId) {
        set({
          error:
            "No hay usuario autenticado."
        });

        return null;
      }

      const { data, error } =
        await supabase
          .from("proveedores")
          .insert({
            nombre: nombreLimpio,
            nombre_comercial:
              nombreLimpio,
            razon_social:
              nombreLimpio,
            activo: true
          })
          .select("*")
          .single();

      if (error) {
        set({
          error: normalizeError(error)
        });

        return null;
      }

      const proveedor =
        data as ProveedorLite;

      set((state) => ({
        catalogos: {
          ...state.catalogos,
          proveedores: sortProveedores([
            ...state.catalogos.proveedores,
            proveedor
          ])
        }
      }));

      return proveedor;
    },

    generarRecurrentesMes:
      async () => {
        set({
          saving: true,
          error: null
        });

        if (!get().canManageFacturas) {
          set({
            saving: false,
            error:
              "No tenés permisos para generar recurrentes."
          });

          return -1;
        }

        const { data, error } =
          await supabase.rpc(
            "generar_facturas_recurrentes",
            {
              p_mes: getToday()
            }
          );

        if (error) {
          set({
            saving: false,
            error: normalizeError(error)
          });

          return -1;
        }

        await get().loadFacturas();

        set({
          saving: false
        });

        return Number(data || 0);
      },

    setFilter: (key, value) => {
      if (
        get().filters[key] === value
      ) {
        return;
      }

      set((state) => ({
        filters: {
          ...state.filters,
          [key]: value
        },
        selectedFacturaId: null
      }));
    },

    resetFilters: () => {
      set({
        filters: getDefaultFilters(),
        selectedFacturaId: null
      });
    },

    selectFactura: (id) => {
      if (
        get().selectedFacturaId === id
      ) {
        return;
      }

      set({
        selectedFacturaId: id
      });
    },

    clearError: () => {
      if (get().error === null) {
        return;
      }

      set({
        error: null
      });
    },

    getFilteredFacturas: () => {
      const {
        facturas,
        filters
      } = get();

      const search =
        normalizeText(filters.search);

      const lista =
        sortFacturas(facturas);

      if (!search) {
        return lista;
      }

      return lista.filter(
        (factura) => {
          const haystack =
            normalizeText(
              [
                factura.proveedor_nombre,
                factura.descripcion,
                factura.numero_factura,
                factura.periodo,
                factura.estado,
                factura.estado_visual,
                factura.origen,
                factura.sucursal_nombre
              ].join(" ")
            );

          return haystack.includes(search);
        }
      );
    },

    getSelectedFactura: () => {
      const {
        selectedFacturaId
      } = get();

      const facturas =
        get().getFilteredFacturas();

      if (facturas.length === 0) {
        return null;
      }

      if (!selectedFacturaId) {
        return facturas[0];
      }

      return (
        facturas.find(
          (factura) =>
            factura.id ===
            selectedFacturaId
        ) ||
        facturas[0] ||
        null
      );
    },

    getCuotasBySelected: () => {
      const factura =
        get().getSelectedFactura();

      if (!factura) {
        return [];
      }

      return sortCuotas(
        get().cuotas.filter(
          (cuota) =>
            cuota.factura_id ===
              factura.id &&
            cuota.activo
        )
      );
    },

    getPagosBySelected: () => {
      const factura =
        get().getSelectedFactura();

      if (!factura) {
        return [];
      }

      return sortPagos(
        get().pagos.filter(
          (pago) =>
            pago.factura_id ===
            factura.id
        )
      );
    },

    getMetrics: () => {
      const facturas =
        get().getFilteredFacturas();

      const today = getToday();
      const nextSeven =
        addDays(today, 7);

      const abiertas =
        facturas.filter(
          isFacturaAbierta
        );

      return {
        pendienteArs:
          abiertas.reduce(
            (
              total,
              factura
            ) =>
              total +
              (String(
                factura.moneda
              ).toUpperCase() ===
              "ARS"
                ? parseMoney(
                    factura.saldo_pendiente
                  )
                : 0),
            0
          ),

        pendienteUsd:
          abiertas.reduce(
            (
              total,
              factura
            ) =>
              total +
              (String(
                factura.moneda
              ).toUpperCase() ===
              "USD"
                ? parseMoney(
                    factura.saldo_pendiente
                  )
                : 0),
            0
          ),

        vencidas:
          abiertas.filter(
            (factura) =>
              factura.fecha_vencimiento <
              today
          ).length,

        porVencer:
          abiertas.filter(
            (factura) =>
              factura.fecha_vencimiento >=
                today &&
              factura.fecha_vencimiento <=
                nextSeven
          ).length,

        pagadasMes:
          facturas.filter(
            (factura) =>
              (
                factura.estado_visual ||
                factura.estado
              ) === "PAGADA"
          ).length,

        recurrentes:
          get().recurrentes.filter(
            (recurrente) =>
              recurrente.activo
          ).length
      };
    }
  }));

export default useFacturasPagarStore;