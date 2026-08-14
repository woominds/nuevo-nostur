import {
  supabase,
} from "../../../lib/supabase";

export type AiPriceType =
  | "POR_PASAJERO"
  | "TOTAL_PAQUETE"
  | "POR_HABITACION"
  | "NO_DETERMINADO";

export type AiFlightSegment = {
  direccion?: string;
  indice?: number;
  aerolinea?: string;
  codigo_aerolinea?: string;
  numero_vuelo?: string;
  clase?: string;
  fecha_salida?: string;
  hora_salida?: string;

  origen?: {
    iata?: string;
    ciudad?: string;
    aeropuerto?: string;
    terminal?: string;
  };

  fecha_llegada?: string;
  hora_llegada?: string;

  destino?: {
    iata?: string;
    ciudad?: string;
    aeropuerto?: string;
    terminal?: string;
  };

  duracion?: string;
  equipaje?: string;

  escala_posterior?: {
    ciudad?: string;
    iata?: string;
    espera?: string;
  } | null;
};

export type AiFlight = {
  titulo?: string;
  tipo_tramo?:
    | "IDA"
    | "VUELTA"
    | string;

  aerolinea?: string;
  ruta_resumen?: string;

  fecha_salida?: string;
  hora_salida?: string;

  origen_iata?: string;
  origen_ciudad?: string;

  fecha_llegada?: string;
  hora_llegada?: string;

  destino_iata?: string;
  destino_ciudad?: string;

  duracion_total?: string;
  cantidad_escalas?: number;
  llega_dia_siguiente?: boolean;

  equipaje_incluido?: string[];
  equipaje_no_incluido?: string[];

  metadata?: {
    tramos?: AiFlightSegment[];

    escalas?: Array<{
      ciudad?: string;
      iata?: string;
      duracion?: string;
      observacion?: string;
    }>;
  };
};

export type AiHotel = {
  titulo?: string;
  nombre?: string;

  destino?: string;
  zona?: string;
  categoria?: string;

  regimen?: string;
  habitacion?: string;
  ocupacion?: string;

  check_in?: string;
  check_out?: string;

  descripcion?: string;
  beneficios?: string;
  condiciones?: string;
  politica_cancelacion?: string;
};

export type AiServiceDetail = {
  fecha?: string;
  desde?: string;
  hacia?: string;
};

export type AiService = {
  tipo?: string;
  nombre?: string;
  descripcion?: string;

  incluido?: boolean;
  opcional?: boolean;

  metadata?: {
    detalle?: AiServiceDetail[];
  };
};

export type AiCommercialOption = {
  nombre?: string;
  subtitulo?: string;
  descripcion?: string;

  precio_total?: number | null;
  moneda?: string;

  tipo_precio?: AiPriceType;

  forma_pago_resumen?: string;
  condiciones_pago?: string;

  incluye_resumen?: string;
  no_incluye_resumen?: string;

  notas?: string;

  visible_en_pdf?: boolean;
  destacada?: boolean;
};

export type AiBudgetSummary = {
  titulo?: string;
  descripcion?: string;

  vuelos_detectados?: number;
  hoteles_detectados?: number;
  servicios_detectados?: number;
  opciones_detectadas?: number;

  precio_final_detectado?: string;

  advertencias?: string[];
};

export type AiParsedBudget = {
  tipo?: string;
  confianza?: number;

  resumen_humano?: AiBudgetSummary;

  caratula_no_modificar?: boolean;

  vuelos: AiFlight[];
  hoteles: AiHotel[];
  servicios: AiService[];
  opciones_comerciales: AiCommercialOption[];

  incluye_general?: string;
  no_incluye_general?: string;
  condiciones_generales?: string;

  observaciones?: string[];
};

type AiParserResponse = {
  ok?: boolean;
  mode?: string;
  adjunto_id?: string | null;
  parsed?: AiParsedBudget;
  error?: string;
  detail?: unknown;
};

const normalizeParsedBudget = (
  value: AiParsedBudget,
): AiParsedBudget => {
  return {
    ...value,

    vuelos:
      Array.isArray(
        value.vuelos,
      )
        ? value.vuelos
        : [],

    hoteles:
      Array.isArray(
        value.hoteles,
      )
        ? value.hoteles
        : [],

    servicios:
      Array.isArray(
        value.servicios,
      )
        ? value.servicios
        : [],

    opciones_comerciales:
      Array.isArray(
        value.opciones_comerciales,
      )
        ? value.opciones_comerciales
        : [],

    observaciones:
      Array.isArray(
        value.observaciones,
      )
        ? value.observaciones
        : [],

    resumen_humano: {
      ...value.resumen_humano,

      advertencias:
        Array.isArray(
          value.resumen_humano
            ?.advertencias,
        )
          ? value.resumen_humano
              ?.advertencias
          : [],
    },
  };
};

export async function parsePresupuestoConIa(
  text: string,
): Promise<AiParsedBudget> {
  const cleanText =
    text.trim();

  if (!cleanText) {
    throw new Error(
      "Pegá la información del presupuesto.",
    );
  }

  const {
    data,
    error,
  } = await supabase.functions.invoke(
    "presupuestos-ai-parser",
    {
      body: {
        mode: "TEXT",
        entidad_tipo:
          "PRESUPUESTO",
        text: cleanText,
      },
    },
  );

  if (error) {
    throw new Error(
      error.message ||
        "No se pudo analizar el presupuesto.",
    );
  }

  const response =
    data as AiParserResponse | null;

  if (response?.error) {
    throw new Error(
      response.error,
    );
  }

  if (!response?.parsed) {
    throw new Error(
      "La IA no devolvió un presupuesto interpretable.",
    );
  }

  return normalizeParsedBudget(
    response.parsed,
  );
}
