export type EditorElementType =
  | "text"
  | "image"
  | "shape";

export type EditorTextAlign =
  | "left"
  | "center"
  | "right"
  | "justify";

export type EditorShapeType =
  | "rectangle"
  | "rounded-rectangle"
  | "circle"
  | "pill"
  | "triangle"
  | "diamond"
  | "star"
  | "line";

export type EditorImageFit =
  | "cover"
  | "contain";

export type EditorPanel =
  | "properties"
  | "layers"
  | null;

export type PresupuestoEstado =
  | "draft"
  | "editing"
  | "completed";

export type EditorCanvas = {
  width: number;
  height: number;
  backgroundColor: string;
};

export type EditorElementBase = {
  id: string;
  type: EditorElementType;
  name: string;

  x: number;
  y: number;
  width: number;
  height: number;

  rotation: number;
  zIndex: number;
  opacity: number;

  visible: boolean;
  locked: boolean;
};

export type EditorTextElement =
  EditorElementBase & {
    type: "text";

    content: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    fontStyle:
      | "normal"
      | "italic";
    color: string;
    textAlign: EditorTextAlign;
    lineHeight: number;
    letterSpacing: number;
  };

export type EditorImageElement =
  EditorElementBase & {
    type: "image";

    src: string;
    alt: string;
    fit: EditorImageFit;
    positionX: number;
    positionY: number;
    cropZoom?: number;
    borderRadius: number;
    maintainAspectRatio: boolean;
  };

export type EditorShapeElement =
  EditorElementBase & {
    type: "shape";

    shape: EditorShapeType;
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
  };

export type EditorElement =
  | EditorTextElement
  | EditorImageElement
  | EditorShapeElement;

export type PresupuestoContacto = {
  clienteId: string | null;
  nombre: string;
  telefono: string;
};

export type PresupuestoPage = {
  id: string;
  name: string;
  order: number;

  canvas: EditorCanvas;
  elements: EditorElement[];
};

export type PresupuestoDocument = {
  id: string;
  templateId: string;

  name: string;
  status: PresupuestoEstado;

  contacto: PresupuestoContacto;

  destino?: string;
  observaciones?: string;

  pages: PresupuestoPage[];
  activePageId: string;

  /*
   * Compatibilidad temporal durante la migración.
   * El editor trabaja con pages[], pero estas propiedades
   * continúan sincronizadas con la hoja activa.
   */
  canvas: EditorCanvas;
  elements: EditorElement[];

  createdAt: string;
  updatedAt: string;
};

export type PresupuestoTemplateCategory =
  | "general"
  | "caribe"
  | "europa"
  | "cruceros"
  | "disney"
  | "nacional"
  | "aereos"
  | "escapadas"
  | "hoteles";

export type PresupuestoTemplate = {
  id: string;
  name: string;
  description: string;
  category: PresupuestoTemplateCategory;
  thumbnail: string;

  canvas: EditorCanvas;
  elements: EditorElement[];
};

export type PresupuestoComponenteCategoria =
  | "encabezados"
  | "pies"
  | "incluye"
  | "no-incluye"
  | "hoteles"
  | "vuelos"
  | "cruceros"
  | "precios"
  | "contacto"
  | "sellos"
  | "llamadas"
  | "otros";

export type PresupuestoComponenteVisibilidad =
  | "personal"
  | "empresa";

export type PresupuestoComponenteBounds = {
  width: number;
  height: number;
};

export type PresupuestoComponente = {
  id: string;

  name: string;
  description: string;

  category: PresupuestoComponenteCategoria;
  tags: string[];

  visibility: PresupuestoComponenteVisibilidad;

  thumbnail: string;

  bounds: PresupuestoComponenteBounds;
  elements: EditorElement[];

  ownerId: string;
  usageCount: number;

  createdAt: string;
  updatedAt: string;

  canManage: boolean;
};

export type EditorHistoryState = {
  past: PresupuestoDocument[];
  present: PresupuestoDocument | null;
  future: PresupuestoDocument[];
};

export type EditorSelectionState = {
  selectedElementId: string | null;
};

export type EditorViewportState = {
  zoom: number;
  activePanel: EditorPanel;
};

export type ElementPositionUpdate = {
  x: number;
  y: number;
};

export type ElementSizeUpdate = {
  width: number;
  height: number;
};

export type ElementTransformUpdate =
  ElementPositionUpdate &
    ElementSizeUpdate & {
      rotation: number;
    };

export type EditorElementUpdate =
  | Partial<EditorTextElement>
  | Partial<EditorImageElement>
  | Partial<EditorShapeElement>;

export const EMPTY_PRESUPUESTO_CONTACTO: PresupuestoContacto = {
  clienteId: null,
  nombre: "",
  telefono: "",
};

export const EDITOR_HISTORY_LIMIT = 50;

export const EDITOR_MIN_ZOOM = 0.25;

export const EDITOR_MAX_ZOOM = 2;

export const EDITOR_DEFAULT_ZOOM = 1;
