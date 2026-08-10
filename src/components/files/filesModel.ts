// src/components/files/filesModel.ts

import type {
  FileItem,
  FileVoucherServicioInput,
  MovimientoTesoreria,
  PagoComercial
} from "../../store/filesStore";

export type SelectOption = {
  value: string;
  label: string;
};

export type FileWizardStep =
  | 1
  | 2
  | 3
  | 4;

export type FilesToastState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

export type FileWizardDraft = {
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
    numero_file: string;

    operador_id: string;
    operador: string;

    fecha_venta: string;
    fecha_in: string;
    fecha_out: string;
    solo_ida: boolean;

    servicio_id: string;
    servicio: string;
    destinos: string[];

    importe_venta: string;
    neto_operador: string;
    moneda: string;

    observaciones: string;
  };

  pagosComerciales: PagoComercial[];

  pagoDiferenteOficina: boolean;

  movimientosTesoreria:
    MovimientoTesoreria[];

  pagoParcial: boolean;
  fechaIngresoGastos: string;

  usaMarkupAdicional: boolean;
  markupAdicionalPct: string;

  confirmado: boolean;

  voucher: {
    requiere_voucher: boolean;
    reserva_id: string;
    a_favor_de: string;
    servicios:
      FileVoucherServicioInput[];
  };
};

export type FileWizardReadiness = {
  ready: boolean;
  issues: string[];
};

export const FILE_ESTADO_OPTIONS:
  SelectOption[] = [
    {
      value: "todos",
      label: "Todos"
    },
    {
      value: "CARGADO",
      label: "Cargado"
    },
    {
      value: "PENDIENTE_OPERADOR",
      label: "Pendiente operador"
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

export const FILE_MONEDA_OPTIONS:
  SelectOption[] = [
    {
      value: "ARS",
      label: "ARS"
    },
    {
      value: "USD",
      label: "USD"
    }
  ];

const FILE_WIZARD_DRAFT_KEY =
  "nostur:files:wizard-draft:v2";

export function getToday(): string {
  const now = new Date();

  const argentinaNow = new Date(
    now.toLocaleString(
      "en-US",
      {
        timeZone:
          "America/Argentina/Cordoba"
      }
    )
  );

  const year =
    argentinaNow.getFullYear();

  const month = String(
    argentinaNow.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    argentinaNow.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseMoney(
  value:
    | string
    | number
    | null
    | undefined
): number {
  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  const normalized = String(
    value || ""
  )
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const parsed = Number(normalized);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

export function normalizeText(
  value: unknown
): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim();
}

export function maskFile(
  value: string
): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 12);
}

export function isValidFile(
  value: string
): boolean {
  return /^\d+$/.test(
    value.trim()
  );
}

export function isDateBefore(
  first:
    | string
    | null
    | undefined,
  second:
    | string
    | null
    | undefined
): boolean {
  if (
    !first ||
    !second
  ) {
    return false;
  }

  return first < second;
}

export function toDisplayDate(
  value?:
    | string
    | null
): string {
  if (!value) {
    return "";
  }

  const clean =
    value.slice(0, 10);

  const [
    year,
    month,
    day
  ] = clean.split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return "";
  }

  return `${day}/${month}/${year}`;
}

export function formatDateAR(
  value?:
    | string
    | null
): string {
  return (
    toDisplayDate(value) ||
    "—"
  );
}

export function joinDestinos(
  destinos: string[]
): string {
  return destinos
    .map((destino) =>
      destino.trim()
    )
    .filter(Boolean)
    .filter(
      (
        destino,
        index,
        array
      ) =>
        array.findIndex(
          (item) =>
            normalizeText(item) ===
            normalizeText(destino)
        ) === index
    )
    .join(", ");
}

export function calculateFileUtility(
  venta:
    | string
    | number
    | null
    | undefined,
  netoOperador:
    | string
    | number
    | null
    | undefined
): number {
  return (
    parseMoney(venta) -
    parseMoney(netoOperador)
  );
}

export function createInitialFileDraft():
  FileWizardDraft {
  const today = getToday();

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
      numero_file: "",

      operador_id: "",
      operador: "",

      fecha_venta: today,
      fecha_in: today,
      fecha_out: today,
      solo_ida: false,

      servicio_id: "",
      servicio: "",
      destinos: [],

      importe_venta: "",
      neto_operador: "",
      moneda: "ARS",

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

    pagoDiferenteOficina: false,

    movimientosTesoreria: [
      {
        importe: 0,
        moneda: "ARS",
        forma_pago_id: null,
        forma_pago: "",
        caja_id: null,
        caja: ""
      }
    ],

    pagoParcial: false,
    fechaIngresoGastos: "",

    usaMarkupAdicional: false,
    markupAdicionalPct: "",

    confirmado: false,

    voucher: {
      requiere_voucher: false,
      reserva_id: "",
      a_favor_de: "",
      servicios: [
        {
          servicio_detalle: "",
          cantidad_pasajeros: 1,
          fecha_inicio: today,
          fecha_fin: today
        }
      ]
    }
  };
}

export function loadStoredFileDraft(): {
  draft: FileWizardDraft;
  step: FileWizardStep;
} | null {
  try {
    const raw =
      window.localStorage.getItem(
        FILE_WIZARD_DRAFT_KEY
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw) as {
        draft?:
          Partial<FileWizardDraft>;
        step?: FileWizardStep;
      };

    if (!parsed.draft) {
      return null;
    }

    const initial =
      createInitialFileDraft();

    return {
      draft: {
        ...initial,
        ...parsed.draft,

        cliente: {
          ...initial.cliente,
          ...parsed.draft.cliente
        },

        venta: {
          ...initial.venta,
          ...parsed.draft.venta
        },

        pagosComerciales:
          parsed.draft
            .pagosComerciales?.length
            ? parsed.draft
                .pagosComerciales
            : initial.pagosComerciales,

        movimientosTesoreria:
          parsed.draft
            .movimientosTesoreria
            ?.length
            ? parsed.draft
                .movimientosTesoreria
            : initial
                .movimientosTesoreria,

        voucher: {
          ...initial.voucher,
          ...parsed.draft.voucher,

          servicios:
            parsed.draft.voucher
              ?.servicios?.length
              ? parsed.draft
                  .voucher.servicios
              : initial.voucher
                  .servicios
        }
      },

      step:
        parsed.step &&
        parsed.step >= 1 &&
        parsed.step <= 4
          ? parsed.step
          : 1
    };
  } catch {
    return null;
  }
}

export function saveStoredFileDraft(
  draft: FileWizardDraft,
  step: FileWizardStep
): void {
  try {
    window.localStorage.setItem(
      FILE_WIZARD_DRAFT_KEY,
      JSON.stringify({
        draft,
        step,
        savedAt:
          new Date().toISOString()
      })
    );
  } catch {
    // localStorage puede estar lleno
    // o bloqueado por el navegador.
  }
}

export function clearStoredFileDraft():
  void {
  try {
    window.localStorage.removeItem(
      FILE_WIZARD_DRAFT_KEY
    );
  } catch {
    // No requiere una acción adicional.
  }
}

export type FileEditDraft = {
  operador_id: string;
  operador: string;

  servicio: string;
  destino: string;

  fecha_in: string;
  fecha_out: string;
  solo_ida: boolean;

  importe_venta: string;
  neto_operador: string;
  moneda: string;

  estado: string;
  observaciones: string;

  fecha_vencimiento_operador:
    string;

  saldo_pendiente_operador:
    string;

  estado_pago_operador:
    string;
};

export function createFileEditDraft(
  file: FileItem
): FileEditDraft {
  return {
    operador_id:
      file.operador_id || "",

    operador:
      file.operador || "",

    servicio:
      file.servicio || "",

    destino:
      file.destino || "",

    fecha_in:
      file.fecha_in || "",

    fecha_out:
      file.fecha_out || "",

    solo_ida:
      Boolean(file.solo_ida),

    importe_venta: String(
      file.importe_final ??
        file.importe_bruto ??
        ""
    ).replace(".", ","),

    neto_operador: String(
      file.neto_operador ?? ""
    ).replace(".", ","),

    moneda:
      file.moneda || "ARS",

    estado:
      file.estado || "CARGADO",

    observaciones:
      file.observaciones || "",

    fecha_vencimiento_operador:
      file.fecha_vencimiento_operador ||
      "",

    saldo_pendiente_operador:
      String(
        file.saldo_pendiente_operador ??
          ""
      ).replace(".", ","),

    estado_pago_operador:
      file.estado_pago_operador || ""
  };
}
