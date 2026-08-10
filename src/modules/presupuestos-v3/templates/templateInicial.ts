import type {
  PresupuestoTemplate,
} from "../types/editor.types";

export const templateInicial: PresupuestoTemplate = {
  id: "template-general-v1",

  name: "General",

  description: "Template base para presupuestos turísticos.",

  category: "general",

  thumbnail: "/templates/general-v1.png",

  canvas: {
    width: 1080,
    height: 1350,
    backgroundColor: "#ffffff",
  },

  elements: [
    {
      id: "logo",

      type: "image",

      name: "Logo",

      x: 48,
      y: 40,

      width: 170,
      height: 70,

      rotation: 0,
      zIndex: 1,
      opacity: 1,

      visible: true,
      locked: false,

      src: "/templates/assets/logo.png",

      alt: "Logo",

      fit: "contain",

      positionX: 50,
      positionY: 50,

      borderRadius: 0,

      maintainAspectRatio: true,
    },

    {
      id: "hero",

      type: "image",

      name: "Foto principal",

      x: 0,
      y: 150,

      width: 1080,
      height: 620,

      rotation: 0,
      zIndex: 2,
      opacity: 1,

      visible: true,
      locked: false,

      src: "/templates/assets/hero.jpg",

      alt: "",

      fit: "cover",

      positionX: 50,
      positionY: 50,

      borderRadius: 0,

      maintainAspectRatio: true,
    },

    {
      id: "titulo",

      type: "text",

      name: "Título",

      x: 70,
      y: 830,

      width: 940,
      height: 70,

      rotation: 0,
      zIndex: 3,
      opacity: 1,

      visible: true,
      locked: false,

      content: "CARIBE 2027",

      fontFamily: "Open Sans",

      fontSize: 46,

      fontWeight: 700,

      fontStyle: "normal",

      color: "#111827",

      textAlign: "left",

      lineHeight: 1.2,

      letterSpacing: 0,
    },

    {
      id: "descripcion",

      type: "text",

      name: "Descripción",

      x: 70,
      y: 920,

      width: 940,
      height: 180,

      rotation: 0,
      zIndex: 4,
      opacity: 1,

      visible: true,
      locked: false,

      content:
        "Incluye vuelos, alojamiento, traslados y asistencia al viajero.",

      fontFamily: "Open Sans",

      fontSize: 26,

      fontWeight: 400,

      fontStyle: "normal",

      color: "#4b5563",

      textAlign: "left",

      lineHeight: 1.45,

      letterSpacing: 0,
    },

    {
      id: "precio",

      type: "text",

      name: "Precio",

      x: 70,
      y: 1170,

      width: 500,
      height: 80,

      rotation: 0,
      zIndex: 5,
      opacity: 1,

      visible: true,
      locked: false,

      content: "USD 2.490",

      fontFamily: "Open Sans",

      fontSize: 54,

      fontWeight: 800,

      fontStyle: "normal",

      color: "#FF634A",

      textAlign: "left",

      lineHeight: 1,

      letterSpacing: 0,
    },
  ],
};
