import type {
  EditorTextElement,
  PresupuestoContacto,
  PresupuestoDocument,
  PresupuestoPage,
  PresupuestoTemplate,
  PresupuestoVendedor,
} from "../types/editor.types";

import type {
  AiFlight,
  AiParsedBudget,
} from "../services/presupuestoAiService";

import {
  createDocumentFromTemplate,
} from "./elementFactory";

const createId = (
  prefix: string,
) =>
  `${prefix}-${crypto.randomUUID()}`;

const textElement = (
  name: string,
  content: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize = 24,
  fontWeight = 400,
  color = "#172033",
): EditorTextElement => ({
  id: createId("text"),
  type: "text",
  name,

  x,
  y,
  width,
  height,

  rotation: 0,
  zIndex: 10,
  opacity: 1,

  visible: true,
  locked: false,

  content,
  fontFamily: "Open Sans",
  fontSize,
  fontWeight,
  fontStyle: "normal",
  color,
  textAlign: "left",
  lineHeight: 1.35,
  letterSpacing: 0,
});

const formatDate = (
  value?: string,
) => {
  if (!value) {
    return "";
  }

  const raw =
    value.slice(0, 10);

  const match =
    raw.match(
      /^(\d{4})-(\d{2})-(\d{2})$/,
    );

  if (!match) {
    return value;
  }

  return `${match[3]}/${match[2]}/${match[1]}`;
};

const getFlightTitle = (
  flight: AiFlight,
) => {
  const type =
    flight.tipo_tramo ===
    "VUELTA"
      ? "VUELTA"
      : "IDA";

  return `${type} · ${
    flight.origen_iata ||
    flight.origen_ciudad ||
    ""
  } → ${
    flight.destino_iata ||
    flight.destino_ciudad ||
    ""
  }`;
};

const getFlightText = (
  flight: AiFlight,
) => {
  const lines: string[] = [];

  const aerolinea =
    flight.aerolinea || "";

  if (aerolinea) {
    lines.push(aerolinea);
  }

  const date =
    formatDate(
      flight.fecha_salida,
    );

  lines.push(
    [
      date,
      flight.hora_salida,
      flight.origen_iata,
      "→",
      flight.hora_llegada,
      flight.destino_iata,
      flight.llega_dia_siguiente
        ? "(+1)"
        : "",
    ]
      .filter(Boolean)
      .join(" "),
  );

  if (flight.duracion_total) {
    lines.push(
      `Duración total: ${flight.duracion_total}`,
    );
  }

  const segments =
    flight.metadata?.tramos ||
    [];

  segments.forEach(
    (segment, index) => {
      lines.push("");

      lines.push(
        `Tramo ${index + 1} · ${
          segment.numero_vuelo ||
          ""
        }${
          segment.aerolinea
            ? ` · ${segment.aerolinea}`
            : ""
        }`,
      );

      lines.push(
        [
          segment.hora_salida,
          segment.origen?.iata,
          "→",
          segment.hora_llegada,
          segment.destino?.iata,
          segment.duracion
            ? `· ${segment.duracion}`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
      );

      if (
        segment.escala_posterior
      ) {
        lines.push(
          `Escala en ${
            segment
              .escala_posterior
              .ciudad ||
            segment
              .escala_posterior
              .iata ||
            ""
          }: ${
            segment
              .escala_posterior
              .espera || ""
          }`,
        );
      }
    },
  );

  if (
    flight.equipaje_incluido
      ?.length
  ) {
    lines.push("");
    lines.push(
      `Incluye: ${flight.equipaje_incluido.join(
        " · ",
      )}`,
    );
  }

  if (
    flight.equipaje_no_incluido
      ?.length
  ) {
    lines.push(
      `No incluye: ${flight.equipaje_no_incluido.join(
        " · ",
      )}`,
    );
  }

  return lines.join("\n");
};

const createContentPage = (
  template: PresupuestoTemplate,
  order: number,
  title: string,
  blocks: Array<{
    title: string;
    content: string;
  }>,
): PresupuestoPage => {
  const elements: EditorTextElement[] =
    [];

  elements.push(
    textElement(
      `Título ${title}`,
      title,
      70,
      65,
      940,
      70,
      38,
      800,
      "#172033",
    ),
  );

  let y = 160;

  blocks.forEach(
    (block) => {
      const contentLines =
        block.content
          .split("\n")
          .length;

      const blockHeight =
        Math.max(
          110,
          contentLines * 30 +
            35,
        );

      elements.push(
        textElement(
          block.title,
          block.title,
          70,
          y,
          940,
          38,
          22,
          800,
          "#FF634A",
        ),
      );

      y += 46;

      elements.push(
        textElement(
          `${block.title} detalle`,
          block.content,
          70,
          y,
          940,
          blockHeight,
          20,
          400,
          "#334155",
        ),
      );

      y +=
        blockHeight + 35;
    },
  );

  return {
    id: createId("pagina"),
    name: `Página ${order}`,
    order,

    canvas: {
      ...template.canvas,
    },

    elements,
  };
};

const formatPrice = (
  parsed: AiParsedBudget,
) => {
  const option =
    parsed.opciones_comerciales?.[0];

  if (
    !option ||
    option.precio_total == null
  ) {
    return "";
  }

  const suffix =
    option.tipo_precio ===
    "POR_PASAJERO"
      ? " por pasajero"
      : option.tipo_precio ===
          "POR_HABITACION"
        ? " por habitación"
        : "";

  return `${
    option.moneda || "USD"
  } ${option.precio_total.toLocaleString(
    "es-AR",
    {
      maximumFractionDigits: 2,
    },
  )}${suffix}`;
};

const getDestination = (
  parsed: AiParsedBudget,
) => {
  const hotels =
    parsed.hoteles
      .map(
        (hotel) =>
          hotel.destino,
      )
      .filter(Boolean);

  const unique =
    Array.from(
      new Set(hotels),
    );

  if (unique.length) {
    return unique.join(" & ");
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
    ""
  );
};

export function createDocumentFromAiParsed(
  template: PresupuestoTemplate,
  contacto: PresupuestoContacto,
  vendedor: PresupuestoVendedor | null,
  parsed: AiParsedBudget,
): PresupuestoDocument {
  const document =
    createDocumentFromTemplate(
      template,
      undefined,
      contacto,
    );

  const destination =
    getDestination(parsed);

  const price =
    formatPrice(parsed);

  /*
   * PORTADA
   * Conservamos todos los elementos
   * gráficos del template y reemplazamos
   * los campos reconocibles.
   */
  const coverPage =
    document.pages[0];

  coverPage.elements =
    coverPage.elements.map(
      (element) => {
        if (
          element.type !==
          "text"
        ) {
          return element;
        }

        const name =
          element.name
            .toLowerCase();

        if (
          name.includes(
            "titulo",
          )
        ) {
          return {
            ...element,
            content:
              destination ||
              parsed
                .resumen_humano
                ?.titulo ||
              "Tu próximo viaje",
          };
        }

        if (
          name.includes(
            "descripcion",
          )
        ) {
          return {
            ...element,
            content:
              parsed
                .resumen_humano
                ?.descripcion ||
              [
                parsed.vuelos.length
                  ? "Vuelos"
                  : "",
                parsed.hoteles.length
                  ? "alojamiento"
                  : "",
                parsed.servicios.length
                  ? "servicios"
                  : "",
              ]
                .filter(Boolean)
                .join(" · "),
          };
        }

        if (
          name.includes(
            "precio",
          ) &&
          price
        ) {
          return {
            ...element,
            content: price,
          };
        }

        return element;
      },
    );

  const pages: PresupuestoPage[] =
    [coverPage];

  if (parsed.vuelos.length) {
    pages.push(
      createContentPage(
        template,
        pages.length + 1,
        "Vuelos",
        parsed.vuelos.map(
          (flight) => ({
            title:
              getFlightTitle(
                flight,
              ),
            content:
              getFlightText(
                flight,
              ),
          }),
        ),
      ),
    );
  }

  if (parsed.hoteles.length) {
    pages.push(
      createContentPage(
        template,
        pages.length + 1,
        "Alojamiento",
        parsed.hoteles.map(
          (hotel) => ({
            title:
              hotel.nombre ||
              hotel.titulo ||
              "Hotel",

            content: [
              hotel.destino,
              hotel.zona,
              hotel.check_in
                ? `Check-in: ${hotel.check_in}`
                : "",
              hotel.check_out
                ? `Check-out: ${hotel.check_out}`
                : "",
              hotel.habitacion
                ? `Habitación: ${hotel.habitacion}`
                : "",
              hotel.ocupacion,
              hotel.regimen
                ? `Régimen: ${hotel.regimen}`
                : "",
            ]
              .filter(Boolean)
              .join("\n"),
          }),
        ),
      ),
    );
  }

  if (
    parsed.servicios.length ||
    parsed.opciones_comerciales
      .length
  ) {
    const blocks: Array<{
      title: string;
      content: string;
    }> = [];

    parsed.servicios.forEach(
      (service) => {
        const details =
          service.metadata?.detalle ||
          [];

        blocks.push({
          title:
            service.nombre ||
            service.tipo ||
            "Servicio",

          content: [
            service.descripcion,
            ...details.map(
              (detail) =>
                [
                  detail.fecha,
                  detail.desde &&
                  detail.hacia
                    ? `${detail.desde} → ${detail.hacia}`
                    : "",
                ]
                  .filter(Boolean)
                  .join("\n"),
            ),
          ]
            .filter(Boolean)
            .join("\n\n"),
        });
      },
    );

    parsed.opciones_comerciales.forEach(
      (option) => {
        if (
          option.precio_total ==
          null
        ) {
          return;
        }

        const suffix =
          option.tipo_precio ===
          "POR_PASAJERO"
            ? "por pasajero"
            : option.tipo_precio ===
                "POR_HABITACION"
              ? "por habitación"
              : "";

        blocks.push({
          title:
            option.nombre ||
            "Precio",

          content: [
            `${
              option.moneda ||
              "USD"
            } ${option.precio_total.toLocaleString(
              "es-AR",
              {
                maximumFractionDigits: 2,
              },
            )} ${suffix}`.trim(),

            option.forma_pago_resumen,
            option.condiciones_pago,
            option.incluye_resumen
              ? `Incluye: ${option.incluye_resumen}`
              : "",
            option.no_incluye_resumen
              ? `No incluye: ${option.no_incluye_resumen}`
              : "",
          ]
            .filter(Boolean)
            .join("\n"),
        });
      },
    );

    pages.push(
      createContentPage(
        template,
        pages.length + 1,
        "Servicios y valores",
        blocks,
      ),
    );
  }

  pages.forEach(
    (page, index) => {
      page.order =
        index + 1;

      page.name =
        `Página ${index + 1}`;
    },
  );

  const firstPage =
    pages[0];

  return {
    ...document,

    vendedor,

    destino:
      destination,

    observaciones:
      parsed.observaciones?.join(
        "\n",
      ) || "",

    pages,

    activePageId:
      firstPage.id,

    canvas: {
      ...firstPage.canvas,
    },

    elements:
      firstPage.elements.map(
        (element) => ({
          ...element,
        }),
      ),

    updatedAt:
      new Date().toISOString(),
  };
}
