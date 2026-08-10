import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  usePresupuestoEditorStore,
} from "../store/presupuestoEditorStore";

import type {
  EditorCanvas,
  EditorElement,
  PresupuestoDocument,
  PresupuestoPage,
} from "../types/editor.types";

import {
  EMPTY_PRESUPUESTO_CONTACTO,
} from "../types/editor.types";

const STORAGE_KEY =
  "nostur-travel-presupuestos-v3-draft";

const SAVE_DELAY = 500;

type LegacyPresupuestoDocument =
  Partial<PresupuestoDocument> & {
    canvas?: EditorCanvas;
    elements?: EditorElement[];
    pages?: PresupuestoPage[];
  };

const createRuntimeId = (
  prefix: string,
): string => {
  return `${prefix}-${crypto.randomUUID()}`;
};

const migrateStoredDocument = (
  storedDocument: LegacyPresupuestoDocument,
): PresupuestoDocument | null => {
  if (
    !storedDocument.id ||
    !storedDocument.templateId
  ) {
    return null;
  }

  const storedPages =
    Array.isArray(storedDocument.pages)
      ? storedDocument.pages.filter(
          (page) =>
            Boolean(
              page?.id &&
                page?.canvas &&
                Array.isArray(
                  page?.elements,
                ),
            ),
        )
      : [];

  const legacyCanvas =
    storedDocument.canvas;

  const legacyElements =
    Array.isArray(
      storedDocument.elements,
    )
      ? storedDocument.elements
      : [];

  const pages =
    storedPages.length > 0
      ? storedPages.map(
          (page, index) => ({
            ...page,
            name:
              page.name ||
              `Página ${index + 1}`,
            order: index + 1,
            canvas: {
              ...page.canvas,
            },
            elements:
              page.elements.map(
                (element) => ({
                  ...element,
                }),
              ),
          }),
        )
      : legacyCanvas
        ? [
            {
              id: createRuntimeId(
                "pagina",
              ),
              name: "Página 1",
              order: 1,
              canvas: {
                ...legacyCanvas,
              },
              elements:
                legacyElements.map(
                  (element) => ({
                    ...element,
                  }),
                ),
            },
          ]
        : [];

  const firstPage = pages[0];

  if (!firstPage) {
    return null;
  }

  const activePage =
    pages.find(
      (page) =>
        page.id ===
        storedDocument.activePageId,
    ) ?? firstPage;

  const now =
    new Date().toISOString();

  return {
    id: storedDocument.id,
    templateId:
      storedDocument.templateId,

    name:
      storedDocument.name ||
      "Nuevo presupuesto",

    status:
      storedDocument.status ||
      "draft",

    contacto: {
      clienteId:
        storedDocument.contacto
          ?.clienteId ?? null,

      nombre:
        storedDocument.contacto
          ?.nombre ??
        EMPTY_PRESUPUESTO_CONTACTO.nombre,

      telefono:
        storedDocument.contacto
          ?.telefono ??
        EMPTY_PRESUPUESTO_CONTACTO.telefono,
    },

    pages,

    activePageId:
      activePage.id,

    canvas: {
      ...activePage.canvas,
    },

    elements:
      activePage.elements.map(
        (element) => ({
          ...element,
        }),
      ),

    createdAt:
      storedDocument.createdAt ||
      now,

    updatedAt:
      storedDocument.updatedAt ||
      now,
  };
};

const loadStoredDocument =
  (): PresupuestoDocument | null => {
    try {
      const storedValue =
        window.localStorage.getItem(
          STORAGE_KEY,
        );

      if (!storedValue) {
        return null;
      }

      const parsedValue =
        JSON.parse(
          storedValue,
        ) as LegacyPresupuestoDocument;

      return migrateStoredDocument(
        parsedValue,
      );
    } catch {
      return null;
    }
  };

export const clearStoredEditorDraft =
  (): void => {
    try {
      window.localStorage.removeItem(
        STORAGE_KEY,
      );
    } catch {
      return;
    }
  };

export function useEditorLocalDraft() {
  const document =
    usePresupuestoEditorStore(
      (state) => state.document,
    );

  const loadDocument =
    usePresupuestoEditorStore(
      (state) => state.loadDocument,
    );

  const restoredRef =
    useRef(false);

  const [
    draftReady,
    setDraftReady,
  ] = useState(false);

  useEffect(() => {
    if (restoredRef.current) {
      return;
    }

    restoredRef.current = true;

    const storedDocument =
      loadStoredDocument();

    if (storedDocument) {
      loadDocument(
        storedDocument,
      );
    }

    setDraftReady(true);
  }, [loadDocument]);

  useEffect(() => {
    if (
      !draftReady ||
      !document
    ) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        try {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
              document,
            ),
          );
        } catch {
          return;
        }
      }, SAVE_DELAY);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    document,
    draftReady,
  ]);

  return {
    draftReady,
  };
}
