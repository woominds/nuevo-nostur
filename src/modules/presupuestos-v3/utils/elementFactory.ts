import type {
  EditorElement,
  PresupuestoContacto,
  PresupuestoDocument,
  PresupuestoPage,
  PresupuestoTemplate,
} from "../types/editor.types";

import {
  EMPTY_PRESUPUESTO_CONTACTO,
} from "../types/editor.types";

const createId = (
  prefix: string,
): string => {
  return `${prefix}-${crypto.randomUUID()}`;
};

const normalizePresupuestoNamePart = (
  value: string,
): string => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .toUpperCase();

  return normalized || "SIN-NOMBRE";
};

export const createDefaultPresupuestoName = (
  contacto?: Partial<PresupuestoContacto> | null,
): string => {
  return `PPTO-0000-${normalizePresupuestoNamePart(
    contacto?.nombre ?? "",
  )}`;
};

const cloneContacto = (
  contacto?: Partial<PresupuestoContacto> | null,
): PresupuestoContacto => {
  return {
    clienteId:
      contacto?.clienteId ?? null,

    nombre:
      contacto?.nombre ?? "",

    telefono:
      contacto?.telefono ?? "",
  };
};

export const cloneEditorElement = (
  element: EditorElement,
): EditorElement => {
  return {
    ...element,
    id: createId(element.type),
  };
};

export const cloneEditorElementPreservingId = (
  element: EditorElement,
): EditorElement => {
  return {
    ...element,
  };
};

export const clonePresupuestoPage = (
  page: PresupuestoPage,
): PresupuestoPage => {
  return {
    ...page,

    canvas: {
      ...page.canvas,
    },

    elements: page.elements.map(
      cloneEditorElementPreservingId,
    ),
  };
};

export const createPageFromTemplate = (
  template: PresupuestoTemplate,
  order = 1,
): PresupuestoPage => {
  return {
    id: createId("pagina"),
    name: `Página ${order}`,
    order,

    canvas: {
      ...template.canvas,
    },

    elements: template.elements.map(
      cloneEditorElement,
    ),
  };
};

export const createDocumentFromTemplate = (
  template: PresupuestoTemplate,
  name?: string,
  contacto: PresupuestoContacto =
    EMPTY_PRESUPUESTO_CONTACTO,
): PresupuestoDocument => {
  const now = new Date().toISOString();

  const firstPage =
    createPageFromTemplate(
      template,
      1,
    );

  return {
    id: createId("presupuesto"),
    templateId: template.id,

    name:
      name?.trim() ||
      createDefaultPresupuestoName(
        contacto,
      ),

    status: "draft",

    contacto:
      cloneContacto(contacto),

    destino: "",
    observaciones: "",

    pages: [
      firstPage,
    ],

    activePageId: firstPage.id,

    canvas: {
      ...firstPage.canvas,
    },

    elements:
      firstPage.elements.map(
        cloneEditorElementPreservingId,
      ),

    createdAt: now,
    updatedAt: now,
  };
};

export const clonePresupuestoDocument = (
  document: PresupuestoDocument,
): PresupuestoDocument => {
  const pages =
    document.pages.map(
      clonePresupuestoPage,
    );

  const activePage =
    pages.find(
      (page) =>
        page.id ===
        document.activePageId,
    ) ??
    pages[0] ??
    null;

  return {
    ...document,

    contacto:
      cloneContacto(
        document.contacto,
      ),

    pages,

    activePageId:
      activePage?.id ??
      document.activePageId,

    canvas: activePage
      ? {
          ...activePage.canvas,
        }
      : {
          ...document.canvas,
        },

    elements: activePage
      ? activePage.elements.map(
          cloneEditorElementPreservingId,
        )
      : document.elements.map(
          cloneEditorElementPreservingId,
        ),
  };
};
