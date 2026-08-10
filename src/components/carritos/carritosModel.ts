import type {
  Carrito,
  MovimientoTesoreria,
  PagoComercial
} from "../../store/carritosStore";

export type SelectOption = {
  value: string;
  label: string;
};

export type WizardStep = 1 | 2 | 3 | 4;

export type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

export type WizardDraft = {
  phonePrefix: string;
  phoneLocal: string;

  cliente: {
    id?: string;
    nombre_completo: string;
    telefono: string;
    email: string;
    origen: string;
    vendedor_id: string;
    sucursal_id: string;
  };

  venta: {
    numero_carrito: string;
    fecha_venta: string;
    fecha_in: string;
    fecha_out: string;
    solo_ida: boolean;
    servicio_id: string;
    servicio: string;
    destinos: string[];
    importe_bruto: string;
    moneda: string;
    promocode_aplicado: boolean;
    promocode_importe: string;
    observaciones: string;
  };

  pagosComerciales: PagoComercial[];
  pagoParcial: boolean;
  fechaIngresoGastos: string;

  pagoDiferenteOficina: boolean;
  formaPagoOficinaId: string;
  formaPagoOficina: string;
  observacionPagoDiferente: string;

  usaMarkupAdicional: boolean;
  markupAdicionalPct: string;

  movimientosTesoreria: MovimientoTesoreria[];
  riesgo: boolean;
  importe_riesgo: string;
  riesgo_motivo: string;
  confirmado: boolean;
};

export const ESTADO_OPTIONS: SelectOption[] = [
  {
    value: "todos",
    label: "Todos"
  },
  {
    value: "CARGADO",
    label: "Cargado"
  },
  {
    value: "EN_CONTROL",
    label: "En control"
  },
  {
    value: "CONTROLADO",
    label: "Controlado"
  },
  {
    value: "FACTURADO",
    label: "Facturado"
  },
  {
    value: "COBRADO",
    label: "Cobrado"
  },
  {
    value: "CANCELADO",
    label: "Cancelado"
  },
  {
    value: "CTA_CTE",
    label: "Cta Cte"
  }
];

export const MONEDA_OPTIONS: SelectOption[] = [
  {
    value: "ARS",
    label: "ARS"
  },
  {
    value: "USD",
    label: "USD"
  }
];

const CARRITO_WIZARD_DRAFT_KEY =
  "nostur:carritos:wizard-draft:v1";

export function getToday(): string {
  const now = new Date();

  const argentinaNow = new Date(
    now.toLocaleString("en-US", {
      timeZone: "America/Argentina/Cordoba"
    })
  );

  const year = argentinaNow.getFullYear();

  const month = String(
    argentinaNow.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    argentinaNow.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toDisplayDate(
  value?: string | null
): string {
  if (!value) return "";

  const clean = value.slice(0, 10);
  const [year, month, day] = clean.split("-");

  if (!year || !month || !day) return "";

  return `${day}/${month}/${year}`;
}

export function formatDateAR(
  value?: string | null
): string {
  if (!value) return "—";

  return toDisplayDate(value) || "—";
}

export function formatMonthLabel(
  month: string
): string {
  const [year, monthNumber] = month.split("-");

  const labels: Record<string, string> = {
    "01": "Enero",
    "02": "Febrero",
    "03": "Marzo",
    "04": "Abril",
    "05": "Mayo",
    "06": "Junio",
    "07": "Julio",
    "08": "Agosto",
    "09": "Septiembre",
    "10": "Octubre",
    "11": "Noviembre",
    "12": "Diciembre"
  };

  return `${
    labels[monthNumber] || monthNumber
  } ${year}`;
}

export function isDateBefore(
  a?: string | null,
  b?: string | null
): boolean {
  if (!a || !b) return false;

  return a < b;
}

export function parseMoney(
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

export function normalizeText(
  value: unknown
): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getEstadoVisualCarrito(
  carrito: Carrito
): string {
  const estadoBase = String(
    carrito.estado || "CARGADO"
  ).toUpperCase();

  if (
    estadoBase === "CANCELADO" ||
    estadoBase === "ANULADO"
  ) {
    return "CANCELADO";
  }

  if (carrito.cobrado) return "COBRADO";
  if (carrito.facturado) return "FACTURADO";
  if (carrito.controlado) return "CONTROLADO";

  return estadoBase;
}

export function getInitials(
  name: string
): string {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.slice(0, 1).toUpperCase()
    )
    .join("");

  return initials || "C";
}

export function maskCarrito(
  value: string
): string {
  const digits = value
    .replace(/\D/g, "")
    .slice(0, 9);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(
      0,
      3
    )}-${digits.slice(3)}`;
  }

  return `${digits.slice(
    0,
    3
  )}-${digits.slice(
    3,
    6
  )}-${digits.slice(6)}`;
}

export function isValidCarrito(
  value: string
): boolean {
  return /^\d{3}-\d{3}-\d{3}$/.test(value);
}

export function createInitialDraft(): WizardDraft {
  return {
    phonePrefix: "+549",
    phoneLocal: "",

    cliente: {
      nombre_completo: "",
      telefono: "+549",
      email: "",
      origen: "",
      vendedor_id: "",
      sucursal_id: ""
    },

    venta: {
      numero_carrito: "",
      fecha_venta: getToday(),
      fecha_in: getToday(),
      fecha_out: getToday(),
      solo_ida: false,
      servicio_id: "",
      servicio: "",
      destinos: [],
      importe_bruto: "",
      moneda: "ARS",
      promocode_aplicado: false,
      promocode_importe: "",
      observaciones: ""
    },

    pagosComerciales: [
      {
        importe: 0,
        moneda: "ARS",
        forma_pago_id: null,
        forma_pago: ""
      }
    ],

    pagoParcial: false,
    fechaIngresoGastos: "",

    pagoDiferenteOficina: false,
    formaPagoOficinaId: "",
    formaPagoOficina: "",
    observacionPagoDiferente: "",

    usaMarkupAdicional: false,
    markupAdicionalPct: "",

    movimientosTesoreria: [
      {
        importe: 0,
        moneda: "ARS",
        forma_pago_id: null,
        forma_pago: "",
        caja_id: null,
        caja: "",
        fecha_movimiento: getToday()
      }
    ],

    riesgo: false,
    importe_riesgo: "",
    riesgo_motivo: "",
    confirmado: false
  };
}

export function loadStoredWizardDraft(): {
  draft: WizardDraft;
  step: WizardStep;
} | null {
  try {
    const raw = window.localStorage.getItem(
      CARRITO_WIZARD_DRAFT_KEY
    );

    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      draft?: WizardDraft;
      step?: WizardStep;
    };

    if (!parsed.draft) return null;

    return {
      draft: parsed.draft,
      step: parsed.step || 1
    };
  } catch {
    return null;
  }
}

export function saveStoredWizardDraft(
  draft: WizardDraft,
  step: WizardStep
): void {
  try {
    window.localStorage.setItem(
      CARRITO_WIZARD_DRAFT_KEY,
      JSON.stringify({
        draft,
        step,
        savedAt: new Date().toISOString()
      })
    );
  } catch {
    // localStorage puede estar lleno o bloqueado.
  }
}

export function clearStoredWizardDraft(): void {
  try {
    window.localStorage.removeItem(
      CARRITO_WIZARD_DRAFT_KEY
    );
  } catch {
    // No requiere ninguna acción adicional.
  }
}

export type CarritoEditDraft = {
  cliente: {
    id: string;
    nombre_completo: string;
    telefono: string;
    email: string;
    origen: string;
  };
  carrito: {
    numero_carrito: string;
    fecha_venta: string;
    fecha_in: string;
    fecha_out: string;
    solo_ida: boolean;
    servicio: string;
    metodo_contacto: string;
    destino: string;
    importe_bruto: string;
    moneda: string;
    promocode_aplicado: boolean;
    promocode_importe: string;
    observaciones: string;
    riesgo: boolean;
    importe_riesgo: string;
    riesgo_motivo: string;
    estado: string;
    vendedor_id: string;
    sucursal_id: string;
    activo: boolean;
  };
  pagosComerciales: PagoComercial[];
  movimientosTesoreria: MovimientoTesoreria[];
};

export function createEditDraft(carrito: Carrito): CarritoEditDraft {
  return {
    cliente: {
      id: carrito.cliente_id,
      nombre_completo: carrito.clientes?.nombre_completo || "",
      telefono: carrito.clientes?.telefono || "",
      email: carrito.clientes?.email || "",
      origen: carrito.clientes?.origen || carrito.metodo_contacto || ""
    },
    carrito: {
      numero_carrito: carrito.numero_carrito || "",
      fecha_venta: carrito.fecha_venta || getToday(),
      fecha_in: carrito.fecha_in || getToday(),
      fecha_out: carrito.fecha_out || getToday(),
      solo_ida: Boolean(carrito.solo_ida),
      servicio: carrito.servicio || "",
      metodo_contacto: carrito.metodo_contacto || "",
      destino: carrito.destino || "",
      importe_bruto: String(carrito.importe_bruto ?? carrito.importe ?? "").replace(".", ","),
      moneda: carrito.moneda || "ARS",
      promocode_aplicado: Boolean(carrito.promocode_aplicado),
      promocode_importe: String(carrito.promocode_importe ?? 0).replace(".", ","),
      observaciones: carrito.observaciones || "",
      riesgo: Boolean(carrito.riesgo),
      importe_riesgo: String(carrito.importe_riesgo ?? 0).replace(".", ","),
      riesgo_motivo: carrito.riesgo_motivo || "",
      estado: carrito.estado || "CARGADO",
      vendedor_id: carrito.vendedor_id || "",
      sucursal_id: carrito.sucursal_id || "",
      activo: carrito.activo !== false
    },
    pagosComerciales: [],
    movimientosTesoreria: []
  };
}
