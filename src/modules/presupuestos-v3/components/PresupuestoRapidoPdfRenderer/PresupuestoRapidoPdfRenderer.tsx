import type {
  ReactNode,
} from "react";

import type {
  PresupuestoContacto,
  PresupuestoVendedor,
} from "../../types/editor.types";

import type {
  AiFlight,
  AiParsedBudget,
} from "../../services/presupuestoAiService";

import {
  brandAssets,
} from "../../../../lib/brandAssets";

type PresupuestoRapidoPdfRendererProps = {
  parsed: AiParsedBudget;
  contacto: PresupuestoContacto;
  vendedor: PresupuestoVendedor;
};

const PAGE_WIDTH = 1080;
const PAGE_HEIGHT = 1528;

/*
 * Zona útil real del PDF.
 *
 * FOOTER_SAFE_ZONE impide que una tarjeta quede visualmente
 * pegada o cortada por el footer.
 */
const PAGE_FOOTER_HEIGHT = 52;
const FOOTER_SAFE_ZONE = 96;


const TEXT_MAIN = "#3f4752";
const TEXT_SECONDARY = "#687384";
const SURFACE = "#f5f6f8";
const BORDER = "#e1e5ea";
const ORANGE = "#FF634A";

function formatDateLong(
  value?: string,
): string {
  if (!value) return "";

  const raw = value.slice(0, 10);
  const parts = raw.split("-");

  if (parts.length !== 3) {
    return value;
  }

  const date = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2]),
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

function formatCompactDateTime(
  value?: string,
): string {
  if (!value) return "—";

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}))?/,
  );

  if (!match) return value;

  const date =
    `${match[3]}/${match[2]}/${match[1]}`;

  return match[4]
    ? `${date} · ${match[4]}`
    : date;
}

function getDestination(
  parsed: AiParsedBudget,
): string {
  const destinations =
    parsed.hoteles
      .map(
        (hotel) =>
          String(
            hotel.destino || "",
          ).trim(),
      )
      .filter(Boolean);

  const unique =
    Array.from(
      new Set(destinations),
    );

  if (unique.length) {
    return unique.join(" + ");
  }

  const outbound =
    parsed.vuelos.find(
      (flight) =>
        flight.tipo_tramo ===
        "IDA",
    );

  return (
    outbound?.destino_ciudad ||
    outbound?.destino_iata ||
    parsed.resumen_humano?.titulo ||
    "Propuesta de viaje"
  );
}

function getTravelDates(
  parsed: AiParsedBudget,
): string {
  const outbound =
    parsed.vuelos.find(
      (flight) =>
        flight.tipo_tramo ===
        "IDA",
    );

  const inbound =
    parsed.vuelos.find(
      (flight) =>
        flight.tipo_tramo ===
        "VUELTA",
    );

  const start =
    outbound?.fecha_salida ||
    parsed.hoteles[0]?.check_in ||
    "";

  const end =
    inbound?.fecha_llegada ||
    inbound?.fecha_salida ||
    parsed.hoteles.at(-1)?.check_out ||
    "";

  if (start && end) {
    return `${formatDateLong(
      start,
    )} al ${formatDateLong(
      end,
    )}`;
  }

  return formatDateLong(
    start || end,
  );
}

function formatPriceType(
  value?: string,
): string {
  if (value === "POR_PASAJERO") {
    return "por pasajero";
  }

  if (value === "POR_HABITACION") {
    return "por habitación";
  }

  if (value === "TOTAL_PAQUETE") {
    return "total paquete";
  }

  return "";
}

function formatMoney(
  currency?: string,
  value?: number | null,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return `${
    currency || "USD"
  } ${value.toLocaleString(
    "es-AR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  )}`;
}

function PageShell({
  children,
  pageLabel,
}: {
  children: ReactNode;
  pageLabel: string;
}) {
  return (
    <section
      data-presupuesto-rapido-pdf-page
      style={{
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        color: TEXT_MAIN,
      }}
      className="relative overflow-hidden bg-white"
    >
      <div
        className="absolute left-0 top-0 h-[7px] w-full"
        style={{
          backgroundColor: ORANGE,
        }}
      />

      <div className="absolute bottom-0 left-0 right-0 flex h-[52px] items-center justify-between border-t border-slate-200 bg-white px-[58px]">
        <div className="flex items-center gap-[18px]">
          <img
            src={
              brandAssets.logoColorNegro
            }
            alt="NOSTUR"
            className="h-[18px] w-auto object-contain opacity-70"
          />

          <div className="h-[18px] w-px bg-slate-200" />

          <img
            src="/brand/almundo-logo.png"
            alt="Almundo"
            className="h-[24px] w-auto object-contain"
          />
        </div>

        <div
          className="text-[13px] font-semibold"
          style={{
            color: "#9aa3ae",
          }}
        >
          {pageLabel}
        </div>
      </div>

      {children}
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <div
        className="mb-[18px] h-px w-full"
        style={{
          backgroundColor: BORDER,
        }}
      />

      <div
        className="text-[12px] font-extrabold uppercase tracking-[0.16em]"
        style={{
          color: ORANGE,
        }}
      >
        {eyebrow}
      </div>

      <h2
        className="mt-[5px] text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em]"
        style={{
          color: TEXT_MAIN,
        }}
      >
        {title}
      </h2>

      {description ? (
        <p
          className="mt-[7px] text-[15px] font-medium leading-[1.4]"
          style={{
            color: TEXT_SECONDARY,
          }}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

function Chip({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center rounded-[6px] border px-[10px] py-[5px] text-[12px] font-semibold"
      style={{
        borderColor: BORDER,
        backgroundColor: "#ffffff",
        color: TEXT_SECONDARY,
      }}
    >
      {children}
    </span>
  );
}

function FlightBlock({
  flight,
}: {
  flight: AiFlight;
}) {
  const segments =
    flight.metadata?.tramos || [];

  return (
    <div
      className="rounded-[10px] border px-[24px] py-[20px]"
      style={{
        borderColor: BORDER,
      }}
    >
      <div className="flex items-start justify-between gap-[25px]">
        <div className="min-w-0">
          <div
            className="text-[11px] font-extrabold uppercase tracking-[0.15em]"
            style={{
              color: ORANGE,
            }}
          >
            {flight.tipo_tramo ===
            "VUELTA"
              ? "REGRESO"
              : "IDA"}
          </div>

          <div
            className="mt-[4px] text-[21px] font-extrabold leading-tight"
            style={{
              color: TEXT_MAIN,
            }}
          >
            {flight.ruta_resumen ||
              `${flight.origen_iata || ""} → ${flight.destino_iata || ""}`}
          </div>

          <div
            className="mt-[4px] text-[13px] font-semibold"
            style={{
              color: TEXT_SECONDARY,
            }}
          >
            {[
              flight.aerolinea,
              formatDateLong(
                flight.fecha_salida,
              ),
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div
            className="text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{
              color: "#9aa3ae",
            }}
          >
            Duración
          </div>

          <div
            className="mt-[2px] text-[18px] font-extrabold"
            style={{
              color: TEXT_MAIN,
            }}
          >
            {flight.duracion_total ||
              "—"}
          </div>

          <div
            className="mt-[2px] text-[12px] font-semibold"
            style={{
              color: TEXT_SECONDARY,
            }}
          >
            {flight.cantidad_escalas ===
            0
              ? "Directo"
              : `${flight.cantidad_escalas || 0} escala${
                  flight.cantidad_escalas ===
                  1
                    ? ""
                    : "s"
                }`}
          </div>
        </div>
      </div>

      <div className="mt-[15px] space-y-[8px]">
        {segments.map(
          (
            segment,
            index,
          ) => (
            <div
              key={`${segment.numero_vuelo}-${index}`}
            >
              <div
                className="grid grid-cols-[1fr_1.4fr_1fr] items-center rounded-[8px] px-[17px] py-[11px]"
                style={{
                  backgroundColor:
                    SURFACE,
                }}
              >
                <div>
                  <div
                    className="text-[19px] font-extrabold"
                    style={{
                      color:
                        TEXT_MAIN,
                    }}
                  >
                    {segment.hora_salida ||
                      "—"}
                  </div>

                  <div
                    className="text-[14px] font-bold"
                    style={{
                      color:
                        TEXT_MAIN,
                    }}
                  >
                    {segment.origen
                      ?.iata || ""}
                  </div>

                  <div
                    className="text-[11px] font-medium"
                    style={{
                      color:
                        TEXT_SECONDARY,
                    }}
                  >
                    {segment.origen
                      ?.ciudad || ""}
                  </div>
                </div>

                <div className="px-[18px] text-center">
                  <div
                    className="text-[12px] font-extrabold"
                    style={{
                      color: ORANGE,
                    }}
                  >
                    {segment.numero_vuelo ||
                      ""}
                  </div>

                  <div className="my-[4px] flex items-center">
                    <div className="h-px flex-1 bg-slate-300" />

                    <div
                      className="mx-[8px] text-[12px]"
                      style={{
                        color:
                          "#98a2ad",
                      }}
                    >
                      ✈
                    </div>

                    <div className="h-px flex-1 bg-slate-300" />
                  </div>

                  <div
                    className="text-[10px] font-semibold"
                    style={{
                      color:
                        TEXT_SECONDARY,
                    }}
                  >
                    {segment.duracion ||
                      ""}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className="text-[19px] font-extrabold"
                    style={{
                      color:
                        TEXT_MAIN,
                    }}
                  >
                    {segment.hora_llegada ||
                      "—"}
                    {flight.llega_dia_siguiente &&
                    index ===
                      segments.length -
                        1
                      ? " +1"
                      : ""}
                  </div>

                  <div
                    className="text-[14px] font-bold"
                    style={{
                      color:
                        TEXT_MAIN,
                    }}
                  >
                    {segment.destino
                      ?.iata || ""}
                  </div>

                  <div
                    className="text-[11px] font-medium"
                    style={{
                      color:
                        TEXT_SECONDARY,
                    }}
                  >
                    {segment.destino
                      ?.ciudad || ""}
                  </div>
                </div>
              </div>

              {segment.escala_posterior ? (
                <div
                  className="mx-auto mt-[5px] w-[78%] rounded-[6px] border px-[12px] py-[5px] text-center text-[11px] font-bold"
                  style={{
                    borderColor:
                      "#ead8b2",
                    backgroundColor:
                      "#fffaf0",
                    color:
                      "#8c6828",
                  }}
                >
                  Escala en{" "}
                  {segment
                    .escala_posterior
                    .ciudad ||
                    segment
                      .escala_posterior
                      .iata}{" "}
                  ·{" "}
                  {segment
                    .escala_posterior
                    .espera}
                </div>
              ) : null}
            </div>
          ),
        )}
      </div>

      <div className="mt-[12px] grid grid-cols-2 gap-[8px]">
        <div
          className="rounded-[7px] border px-[13px] py-[9px]"
          style={{
            borderColor:
              "#cfe5db",
            backgroundColor:
              "#f4faf7",
          }}
        >
          <div
            className="text-[10px] font-extrabold uppercase tracking-[0.08em]"
            style={{
              color: "#42705d",
            }}
          >
            Incluido
          </div>

          <div className="mt-[4px] space-y-[2px]">
            {(flight.equipaje_incluido ||
              []).map(
              (item) => (
                <div
                  key={item}
                  className="text-[11px] font-semibold"
                  style={{
                    color:
                      "#51635b",
                  }}
                >
                  ✓ {item}
                </div>
              ),
            )}
          </div>
        </div>

        <div
          className="rounded-[7px] border px-[13px] py-[9px]"
          style={{
            borderColor: BORDER,
            backgroundColor:
              "#fafbfc",
          }}
        >
          <div
            className="text-[10px] font-extrabold uppercase tracking-[0.08em]"
            style={{
              color:
                TEXT_SECONDARY,
            }}
          >
            No incluido
          </div>

          <div className="mt-[4px] space-y-[2px]">
            {(flight.equipaje_no_incluido ||
              []).map(
              (item) => (
                <div
                  key={item}
                  className="text-[11px] font-semibold"
                  style={{
                    color:
                      TEXT_SECONDARY,
                  }}
                >
                  • {item}
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


type FlowBlock = {
  id: string;
  estimatedHeight: number;
  keepWithNext?: boolean;
  content: ReactNode;
};

const FLOW_TOP = 52;
const FLOW_GAP = 20;

const FLOW_AVAILABLE_HEIGHT =
  PAGE_HEIGHT -
  FLOW_TOP -
  PAGE_FOOTER_HEIGHT -
  FOOTER_SAFE_ZONE;

function IntroBlock({
  parsed,
  contacto,
  vendedor,
  destination,
  travelDates,
}: {
  parsed: AiParsedBudget;
  contacto: PresupuestoContacto;
  vendedor: PresupuestoVendedor;
  destination: string;
  travelDates: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[22px]">
          <img
            src={
              brandAssets.logoColorNegro
            }
            alt="NOSTUR"
            className="h-[34px] w-auto object-contain opacity-75"
          />

          <div className="h-[28px] w-px bg-slate-200" />

          <img
            src="/brand/almundo-logo.png"
            alt="Almundo"
            className="h-[34px] w-auto object-contain"
          />
        </div>

        <div className="text-right">
          <div
            className="text-[10px] font-bold uppercase tracking-[0.13em]"
            style={{
              color: "#9aa3ae",
            }}
          >
            Presupuesto personalizado
          </div>

          <div
            className="mt-[2px] text-[13px] font-semibold"
            style={{
              color:
                TEXT_SECONDARY,
            }}
          >
            {contacto.nombre}
          </div>
        </div>
      </div>

      <div className="mt-[48px]">
        <div
          className="text-[12px] font-extrabold uppercase tracking-[0.17em]"
          style={{
            color: ORANGE,
          }}
        >
          Propuesta de viaje
        </div>

        <h1
          className="mt-[6px] max-w-[850px] text-[39px] font-extrabold leading-[1.05] tracking-[-0.035em]"
          style={{
            color: TEXT_MAIN,
          }}
        >
          {destination}
        </h1>

        {travelDates ? (
          <div
            className="mt-[9px] text-[16px] font-semibold"
            style={{
              color:
                TEXT_SECONDARY,
            }}
          >
            {travelDates}
          </div>
        ) : null}
      </div>

      <div
        className="mt-[30px] rounded-[9px] border px-[21px] py-[17px]"
        style={{
          borderColor: BORDER,
          backgroundColor:
            SURFACE,
        }}
      >
        <div
          className="text-[10px] font-extrabold uppercase tracking-[0.12em]"
          style={{
            color:
              TEXT_SECONDARY,
          }}
        >
          La propuesta incluye
        </div>

        <div className="mt-[9px] flex flex-wrap gap-[6px]">
          {parsed.vuelos.length ? (
            <Chip>
              ✈ Vuelos
            </Chip>
          ) : null}

          {parsed.hoteles.length ? (
            <Chip>
              Alojamiento
            </Chip>
          ) : null}

          {parsed.servicios.map(
            (
              service,
              index,
            ) => (
              <Chip
                key={`${service.tipo}-${index}`}
              >
                {service.nombre ||
                  service.tipo}
              </Chip>
            ),
          )}
        </div>

        {parsed.resumen_humano
          ?.descripcion ? (
          <p
            className="mt-[11px] max-w-[840px] text-[12px] font-medium leading-[1.45]"
            style={{
              color:
                TEXT_SECONDARY,
            }}
          >
            {
              parsed.resumen_humano
                .descripcion
            }
          </p>
        ) : null}
      </div>

      <div className="mt-[18px] grid grid-cols-2 border-t border-slate-200 pt-[13px]">
        <div>
          <div
            className="text-[9px] font-bold uppercase tracking-[0.1em]"
            style={{
              color: "#9aa3ae",
            }}
          >
            Preparado para
          </div>

          <div
            className="mt-[2px] text-[12px] font-bold"
            style={{
              color: TEXT_MAIN,
            }}
          >
            {contacto.nombre}
          </div>

          <div
            className="text-[10px] font-medium"
            style={{
              color:
                TEXT_SECONDARY,
            }}
          >
            {contacto.telefono}
          </div>
        </div>

        <div className="text-right">
          <div
            className="text-[9px] font-bold uppercase tracking-[0.1em]"
            style={{
              color: "#9aa3ae",
            }}
          >
            Asesor
          </div>

          <div
            className="mt-[2px] text-[12px] font-bold"
            style={{
              color: TEXT_MAIN,
            }}
          >
            {vendedor.nombre}
          </div>
        </div>
      </div>
    </div>
  );
}

function HotelBlock({
  hotel,
}: {
  hotel:
    AiParsedBudget["hoteles"][number];
}) {
  return (
    <div
      className="rounded-[9px] border px-[20px] py-[15px]"
      style={{
        borderColor: BORDER,
      }}
    >
      <div className="flex items-start justify-between gap-[18px]">
        <div>
          <div
            className="text-[18px] font-extrabold"
            style={{
              color:
                TEXT_MAIN,
            }}
          >
            {hotel.nombre ||
              hotel.titulo ||
              "Hotel"}
          </div>

          <div
            className="mt-[2px] text-[11px] font-semibold"
            style={{
              color:
                TEXT_SECONDARY,
            }}
          >
            {[
              hotel.destino,
              hotel.zona,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>

        {hotel.regimen ? (
          <span
            className="shrink-0 rounded-[5px] px-[8px] py-[4px] text-[9px] font-extrabold uppercase"
            style={{
              color: ORANGE,
              backgroundColor:
                "#fff3f0",
            }}
          >
            {hotel.regimen}
          </span>
        ) : null}
      </div>

      <div className="mt-[10px] grid grid-cols-2 gap-[7px]">
        <div
          className="rounded-[6px] px-[11px] py-[7px]"
          style={{
            backgroundColor:
              SURFACE,
          }}
        >
          <div
            className="text-[8px] font-extrabold uppercase tracking-[0.08em]"
            style={{
              color:
                "#9aa3ae",
            }}
          >
            Check-in
          </div>

          <div
            className="mt-[1px] text-[11px] font-bold"
            style={{
              color:
                TEXT_MAIN,
            }}
          >
            {formatCompactDateTime(
              hotel.check_in,
            )}
          </div>
        </div>

        <div
          className="rounded-[6px] px-[11px] py-[7px]"
          style={{
            backgroundColor:
              SURFACE,
          }}
        >
          <div
            className="text-[8px] font-extrabold uppercase tracking-[0.08em]"
            style={{
              color:
                "#9aa3ae",
            }}
          >
            Check-out
          </div>

          <div
            className="mt-[1px] text-[11px] font-bold"
            style={{
              color:
                TEXT_MAIN,
            }}
          >
            {formatCompactDateTime(
              hotel.check_out,
            )}
          </div>
        </div>
      </div>

      <div className="mt-[7px] flex flex-wrap gap-[5px]">
        {hotel.habitacion ? (
          <Chip>
            Habitación:{" "}
            {hotel.habitacion}
          </Chip>
        ) : null}

        {hotel.ocupacion ? (
          <Chip>
            {hotel.ocupacion}
          </Chip>
        ) : null}

        {hotel.categoria ? (
          <Chip>
            {hotel.categoria}
          </Chip>
        ) : null}
      </div>
    </div>
  );
}

function ServiceBlock({
  service,
}: {
  service:
    AiParsedBudget["servicios"][number];
}) {
  const details =
    service.metadata?.detalle ||
    [];

  return (
    <div
      className="rounded-[8px] border px-[16px] py-[11px]"
      style={{
        borderColor: BORDER,
      }}
    >
      <div
        className="text-[14px] font-extrabold"
        style={{
          color: TEXT_MAIN,
        }}
      >
        {service.nombre ||
          service.tipo ||
          "Servicio"}
      </div>

      {service.descripcion ? (
        <div
          className="mt-[1px] text-[10px] font-medium"
          style={{
            color:
              TEXT_SECONDARY,
          }}
        >
          {service.descripcion}
        </div>
      ) : null}

      {details.length ? (
        <div className="mt-[6px] space-y-[3px]">
          {details.map(
            (
              detail,
              detailIndex,
            ) => (
              <div
                key={`${detail.fecha}-${detailIndex}`}
                className="grid grid-cols-[160px_1fr] gap-[8px] rounded-[5px] px-[9px] py-[5px]"
                style={{
                  backgroundColor:
                    SURFACE,
                }}
              >
                <div
                  className="text-[9px] font-bold"
                  style={{
                    color:
                      ORANGE,
                  }}
                >
                  {detail.fecha ||
                    ""}
                </div>

                <div
                  className="text-[9px] font-semibold"
                  style={{
                    color:
                      TEXT_SECONDARY,
                  }}
                >
                  {detail.desde &&
                  detail.hacia
                    ? `${detail.desde} → ${detail.hacia}`
                    : ""}
                </div>
              </div>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function GeneralInfoBlock({
  parsed,
}: {
  parsed: AiParsedBudget;
}) {
  if (
    !parsed.incluye_general &&
    !parsed.no_incluye_general
  ) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-[8px]">
      {parsed.incluye_general ? (
        <div
          className="rounded-[7px] border px-[14px] py-[10px]"
          style={{
            borderColor:
              "#cfe5db",
            backgroundColor:
              "#f4faf7",
          }}
        >
          <div
            className="text-[9px] font-extrabold uppercase tracking-[0.08em]"
            style={{
              color:
                "#42705d",
            }}
          >
            Incluye
          </div>

          <div
            className="mt-[4px] whitespace-pre-line text-[10px] font-medium leading-[1.4]"
            style={{
              color:
                "#51635b",
            }}
          >
            {
              parsed.incluye_general
            }
          </div>
        </div>
      ) : null}

      {parsed.no_incluye_general ? (
        <div
          className="rounded-[7px] border px-[14px] py-[10px]"
          style={{
            borderColor:
              BORDER,
            backgroundColor:
              "#fafbfc",
          }}
        >
          <div
            className="text-[9px] font-extrabold uppercase tracking-[0.08em]"
            style={{
              color:
                TEXT_SECONDARY,
            }}
          >
            No incluye
          </div>

          <div
            className="mt-[4px] whitespace-pre-line text-[10px] font-medium leading-[1.4]"
            style={{
              color:
                TEXT_SECONDARY,
            }}
          >
            {
              parsed.no_incluye_general
            }
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ConditionsBlock({
  text,
}: {
  text: string;
}) {
  return (
    <div
      className="rounded-[7px] border px-[14px] py-[10px]"
      style={{
        borderColor:
          BORDER,
      }}
    >
      <div
        className="text-[9px] font-extrabold uppercase tracking-[0.08em]"
        style={{
          color:
            TEXT_SECONDARY,
        }}
      >
        Condiciones generales
      </div>

      <div
        className="mt-[4px] whitespace-pre-line text-[9px] font-medium leading-[1.4]"
        style={{
          color:
            TEXT_SECONDARY,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function PriceBlock({
  parsed,
}: {
  parsed: AiParsedBudget;
}) {
  if (
    parsed.opciones_comerciales.length ===
    0
  ) {
    return null;
  }

  return (
    <div
      className="border-t pt-[13px]"
      style={{
        borderColor: BORDER,
      }}
    >
      <div
        className="text-[10px] font-extrabold uppercase tracking-[0.13em]"
        style={{
          color: ORANGE,
        }}
      >
        Valor de la propuesta
      </div>

      <div className="mt-[7px] grid grid-cols-2 gap-[8px]">
        {parsed.opciones_comerciales.map(
          (
            option,
            index,
          ) => (
            <div
              key={`${option.nombre}-${index}`}
              className="rounded-[8px] border px-[16px] py-[11px]"
              style={{
                borderColor:
                  option.destacada
                    ? "#efcfc8"
                    : BORDER,

                backgroundColor:
                  option.destacada
                    ? "#fff8f6"
                    : "#ffffff",
              }}
            >
              <div
                className="text-[10px] font-bold"
                style={{
                  color:
                    TEXT_SECONDARY,
                }}
              >
                {option.nombre ||
                  "Opción"}
              </div>

              <div
                className="mt-[3px] text-[20px] font-extrabold"
                style={{
                  color:
                    TEXT_MAIN,
                }}
              >
                {formatMoney(
                  option.moneda,
                  option.precio_total,
                )}
              </div>

              <div
                className="text-[9px] font-semibold"
                style={{
                  color:
                    TEXT_SECONDARY,
                }}
              >
                {formatPriceType(
                  option.tipo_precio,
                )}
              </div>

              {option.forma_pago_resumen ? (
                <div
                  className="mt-[4px] text-[10px] font-bold"
                  style={{
                    color:
                      TEXT_MAIN,
                  }}
                >
                  {
                    option.forma_pago_resumen
                  }
                </div>
              ) : null}

              {option.condiciones_pago ? (
                <div
                  className="mt-[3px] text-[9px] font-medium"
                  style={{
                    color:
                      TEXT_SECONDARY,
                  }}
                >
                  {
                    option.condiciones_pago
                  }
                </div>
              ) : null}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function estimateFlightHeight(
  flight: AiFlight,
): number {
  const segments =
    flight.metadata?.tramos
      ?.length || 1;

  const stops =
    flight.metadata?.tramos
      ?.filter(
        (segment) =>
          Boolean(
            segment.escala_posterior,
          ),
      ).length || 0;

  return (
    132 +
    segments * 92 +
    stops * 33 +
    80
  );
}

function estimateHotelHeight(): number {
  return 142;
}

function estimateServiceHeight(
  service:
    AiParsedBudget["servicios"][number],
): number {
  const details =
    service.metadata?.detalle
      ?.length || 0;

  return (
    62 +
    details * 27
  );
}

function paginateFlowBlocks(
  blocks: FlowBlock[],
): FlowBlock[][] {
  const pages: FlowBlock[][] =
    [];

  let currentPage:
    FlowBlock[] = [];

  let usedHeight = 0;

  const pushCurrentPage =
    () => {
      if (
        currentPage.length ===
        0
      ) {
        return;
      }

      pages.push(
        currentPage,
      );

      currentPage = [];
      usedHeight = 0;
    };

  for (
    let index = 0;
    index < blocks.length;
    index += 1
  ) {
    const block =
      blocks[index];

    const nextBlock =
      blocks[index + 1];

    const gap =
      currentPage.length > 0
        ? FLOW_GAP
        : 0;

    let requiredHeight =
      gap +
      block.estimatedHeight;

    /*
     * Los encabezados de sección nunca quedan
     * solos al final de una hoja.
     */
    if (
      block.keepWithNext &&
      nextBlock
    ) {
      requiredHeight +=
        FLOW_GAP +
        nextBlock.estimatedHeight;
    }

    if (
      currentPage.length > 0 &&
      usedHeight +
        requiredHeight >
        FLOW_AVAILABLE_HEIGHT
    ) {
      pushCurrentPage();
    }

    const actualGap =
      currentPage.length > 0
        ? FLOW_GAP
        : 0;

    currentPage.push(
      block,
    );

    usedHeight +=
      actualGap +
      block.estimatedHeight;
  }

  pushCurrentPage();

  return pages;
}

export function PresupuestoRapidoPdfRenderer({
  parsed,
  contacto,
  vendedor,
}: PresupuestoRapidoPdfRendererProps) {
  const destination =
    getDestination(parsed);

  const travelDates =
    getTravelDates(parsed);

  const blocks: FlowBlock[] =
    [];

  /*
   * El encabezado inicial ya no ocupa una página.
   * Es simplemente el primer bloque del documento.
   */
  blocks.push({
    id: "intro",
    estimatedHeight: 375,
    content: (
      <IntroBlock
        parsed={parsed}
        contacto={contacto}
        vendedor={vendedor}
        destination={
          destination
        }
        travelDates={
          travelDates
        }
      />
    ),
  });

  if (
    parsed.vuelos.length > 0
  ) {
    blocks.push({
      id: "vuelos-header",
      estimatedHeight: 74,
      keepWithNext: true,
      content: (
        <SectionHeader
          eyebrow="Vuelos"
          title="Itinerario aéreo"
          description="Detalle de vuelos, conexiones y equipaje."
        />
      ),
    });

    parsed.vuelos.forEach(
      (
        flight,
        index,
      ) => {
        blocks.push({
          id: `vuelo-${index}`,
          estimatedHeight:
            estimateFlightHeight(
              flight,
            ),
          content: (
            <FlightBlock
              flight={flight}
            />
          ),
        });
      },
    );
  }

  if (
    parsed.hoteles.length > 0
  ) {
    blocks.push({
      id: "hoteles-header",
      estimatedHeight: 74,
      keepWithNext: true,
      content: (
        <SectionHeader
          eyebrow="Alojamiento"
          title="Hoteles incluidos"
          description="Detalle de estadías, habitaciones y régimen."
        />
      ),
    });

    parsed.hoteles.forEach(
      (
        hotel,
        index,
      ) => {
        blocks.push({
          id: `hotel-${index}`,
          estimatedHeight:
            estimateHotelHeight(),
          content: (
            <HotelBlock
              hotel={hotel}
            />
          ),
        });
      },
    );
  }

  const hasDetailSection =
    parsed.servicios.length >
      0 ||
    Boolean(
      parsed.incluye_general,
    ) ||
    Boolean(
      parsed.no_incluye_general,
    ) ||
    Boolean(
      parsed.condiciones_generales,
    );

  if (hasDetailSection) {
    blocks.push({
      id: "detalle-header",
      estimatedHeight: 74,
      keepWithNext: true,
      content: (
        <SectionHeader
          eyebrow="Detalle"
          title="Servicios incluidos"
          description="Servicios adicionales y condiciones de la propuesta."
        />
      ),
    });
  }

  parsed.servicios.forEach(
    (
      service,
      index,
    ) => {
      blocks.push({
        id: `servicio-${index}`,
        estimatedHeight:
          estimateServiceHeight(
            service,
          ),
        content: (
          <ServiceBlock
            service={service}
          />
        ),
      });
    },
  );

  if (
    parsed.incluye_general ||
    parsed.no_incluye_general
  ) {
    blocks.push({
      id: "incluye-general",
      estimatedHeight: 105,
      content: (
        <GeneralInfoBlock
          parsed={parsed}
        />
      ),
    });
  }

  if (
    parsed.condiciones_generales
  ) {
    const lineCount =
      Math.max(
        1,
        parsed.condiciones_generales
          .split("\n")
          .length,
      );

    blocks.push({
      id: "condiciones",
      estimatedHeight:
        55 +
        lineCount * 18,
      content: (
        <ConditionsBlock
          text={
            parsed.condiciones_generales
          }
        />
      ),
    });
  }

  /*
   * PRECIO:
   * siempre es el último bloque normal.
   * No se fija al footer.
   */
  if (
    parsed.opciones_comerciales
      .length > 0
  ) {
    const priceRows =
      Math.ceil(
        parsed.opciones_comerciales
          .length / 2,
      );

    blocks.push({
      id: "precio",
      estimatedHeight:
        48 +
        priceRows * 94,
      content: (
        <PriceBlock
          parsed={parsed}
        />
      ),
    });
  }

  const pages =
    paginateFlowBlocks(
      blocks,
    );

  return (
    <div className="flex flex-col bg-white">
      {pages.map(
        (
          pageBlocks,
          pageIndex,
        ) => (
          <PageShell
            key={`page-${pageIndex}`}
            pageLabel={
              pageIndex === 0
                ? "Propuesta de viaje"
                : "Detalle del viaje"
            }
          >
            <div
              className="absolute left-[58px] right-[58px]"
              style={{
                top: FLOW_TOP,
              }}
            >
              <div className="flex flex-col gap-[14px]">
                {pageBlocks.map(
                  (block) => (
                    <div
                      key={
                        block.id
                      }
                    >
                      {
                        block.content
                      }
                    </div>
                  ),
                )}
              </div>
            </div>
          </PageShell>
        ),
      )}
    </div>
  );
}
