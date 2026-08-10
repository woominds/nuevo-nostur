import {
  create,
} from "zustand";

import {
  cloneEditorElementPreservingId,
  clonePresupuestoDocument,
  clonePresupuestoPage,
  createDocumentFromTemplate,
} from "../utils/elementFactory";

import type {
  EditorElement,
  EditorElementUpdate,
  EditorImageElement,
  EditorPanel,
  EditorShapeElement,
  EditorTextElement,
  PresupuestoComponente,
  PresupuestoContacto,
  PresupuestoDocument,
  PresupuestoEstado,
  PresupuestoPage,
  PresupuestoTemplate,
} from "../types/editor.types";

import {
  EDITOR_DEFAULT_ZOOM,
  EDITOR_HISTORY_LIMIT,
  EDITOR_MAX_ZOOM,
  EDITOR_MIN_ZOOM,
} from "../types/editor.types";

type PresupuestoEditorState = {
  document: PresupuestoDocument | null;

  selectedElementId: string | null;

  selectedElementIds: string[];

  activePanel: EditorPanel;

  zoom: number;

  past: PresupuestoDocument[];

  future: PresupuestoDocument[];

  isDirty: boolean;

  loadTemplate: (
    template: PresupuestoTemplate,
    name?: string,
  ) => void;

  loadDocument: (
    document: PresupuestoDocument,
  ) => void;

  clearEditor: () => void;

  updateDocumentName: (
    name: string,
  ) => void;

  updateDocumentDetails: (
    update: {
      name?: string;
      contacto?: Partial<PresupuestoContacto>;
      destino?: string;
      status?: PresupuestoEstado;
      observaciones?: string;
    },
  ) => void;

  setActivePage: (
    pageId: string,
  ) => void;

  addPage: (
    afterPageId?: string,
  ) => void;

  duplicatePage: (
    pageId?: string,
  ) => void;

  deletePage: (
    pageId?: string,
  ) => void;

  selectElement: (
    elementId: string | null,
    additive?: boolean,
  ) => void;

  setSelectedElements: (
    elementIds: string[],
    primaryElementId?: string | null,
  ) => void;

  clearElementSelection: () => void;

  getSelectedElements: () => EditorElement[];

  insertComponent: (
    component: PresupuestoComponente,
  ) => void;

  setActivePanel: (
    panel: EditorPanel,
  ) => void;

  setZoom: (
    zoom: number,
  ) => void;

  updateElement: (
    elementId: string,
    update: EditorElementUpdate,
  ) => void;

  updateElements: (
    updates: Array<{
      elementId: string;
      update: EditorElementUpdate;
    }>,
  ) => void;

  previewElementPositions: (
    positions: Array<{
      elementId: string;
      x: number;
      y: number;
    }>,
  ) => void;

  addTextElement: () => void;

  addImageElement: () => void;

  addShapeElement: () => void;

  duplicateElement: (
    elementId: string,
  ) => void;

  deleteElement: (
    elementId: string,
  ) => void;

  toggleElementVisibility: (
    elementId: string,
  ) => void;

  toggleElementLock: (
    elementId: string,
  ) => void;

  reorderElement: (
    elementId: string,
    targetElementId: string,
  ) => void;

  bringForward: (
    elementId: string,
  ) => void;

  sendBackward: (
    elementId: string,
  ) => void;

  bringToFront: (
    elementId: string,
  ) => void;

  sendToBack: (
    elementId: string,
  ) => void;

  undo: () => void;

  redo: () => void;
};

const createId = (
  prefix: string,
): string => {
  return `${prefix}-${crypto.randomUUID()}`;
};

const cloneElements = (
  elements: EditorElement[],
): EditorElement[] => {
  return elements.map(
    cloneEditorElementPreservingId,
  );
};

const normalizeZIndexes = (
  elements: EditorElement[],
): EditorElement[] => {
  return [...elements]
    .sort(
      (firstElement, secondElement) =>
        firstElement.zIndex -
        secondElement.zIndex,
    )
    .map(
      (element, index) => ({
        ...element,
        zIndex: index + 1,
      }),
    );
};

const normalizePages = (
  pages: PresupuestoPage[],
): PresupuestoPage[] => {
  return pages.map(
    (page, index) => ({
      ...page,
      order: index + 1,
      name: `Página ${index + 1}`,
    }),
  );
};

const getActivePage = (
  document: PresupuestoDocument,
): PresupuestoPage | null => {
  return (
    document.pages.find(
      (page) =>
        page.id ===
        document.activePageId,
    ) ??
    document.pages[0] ??
    null
  );
};

const synchronizeDocument = (
  document: PresupuestoDocument,
): PresupuestoDocument => {
  const pages =
    document.pages.length > 0
      ? normalizePages(
          document.pages.map(
            clonePresupuestoPage,
          ),
        )
      : [
          {
            id: createId("pagina"),
            name: "Página 1",
            order: 1,
            canvas: {
              ...document.canvas,
            },
            elements: cloneElements(
              document.elements,
            ),
          },
        ];

  const activePage =
    pages.find(
      (page) =>
        page.id ===
        document.activePageId,
    ) ??
    pages[0];

  return {
    ...document,

    contacto: {
      clienteId:
        document.contacto?.clienteId ??
        null,

      nombre:
        document.contacto?.nombre ??
        "",

      telefono:
        document.contacto?.telefono ??
        "",
    },

    destino:
      document.destino ?? "",

    observaciones:
      document.observaciones ?? "",

    pages,
    activePageId: activePage.id,
    canvas: {
      ...activePage.canvas,
    },
    elements: cloneElements(
      activePage.elements,
    ),
  };
};

const updateActivePage = (
  document: PresupuestoDocument,
  updater: (
    page: PresupuestoPage,
  ) => PresupuestoPage,
): PresupuestoDocument => {
  const activePage =
    getActivePage(document);

  if (!activePage) {
    return document;
  }

  const nextPage =
    updater(
      clonePresupuestoPage(
        activePage,
      ),
    );

  const nextPages =
    document.pages.map(
      (page) =>
        page.id === activePage.id
          ? nextPage
          : page,
    );

  return {
    ...document,
    pages: nextPages,
    canvas: {
      ...nextPage.canvas,
    },
    elements: cloneElements(
      nextPage.elements,
    ),
  };
};

const getNextZIndex = (
  document: PresupuestoDocument,
): number => {
  const activePage =
    getActivePage(document);

  if (!activePage) {
    return 1;
  }

  return (
    Math.max(
      0,
      ...activePage.elements.map(
        (element) => element.zIndex,
      ),
    ) + 1
  );
};

const getCenteredPosition = (
  document: PresupuestoDocument,
  width: number,
  height: number,
) => {
  const activePage =
    getActivePage(document);

  const canvas =
    activePage?.canvas ??
    document.canvas;

  return {
    x: Math.max(
      0,
      (canvas.width - width) / 2,
    ),
    y: Math.max(
      0,
      (canvas.height - height) / 2,
    ),
  };
};

const commitDocument = (
  state: PresupuestoEditorState,
  nextDocument: PresupuestoDocument,
) => {
  if (!state.document) {
    return {
      document:
        synchronizeDocument(
          nextDocument,
        ),
      isDirty: true,
    };
  }

  const nextPast = [
    ...state.past,
    clonePresupuestoDocument(
      state.document,
    ),
  ].slice(-EDITOR_HISTORY_LIMIT);

  return {
    document: {
      ...synchronizeDocument(
        nextDocument,
      ),
      updatedAt: new Date().toISOString(),
    },
    past: nextPast,
    future: [],
    isDirty: true,
  };
};

export const usePresupuestoEditorStore =
  create<PresupuestoEditorState>(
    (set, get) => ({
      document: null,

      selectedElementId: null,

      selectedElementIds: [],

      activePanel: null,

      zoom: EDITOR_DEFAULT_ZOOM,

      past: [],

      future: [],

      isDirty: false,

      loadTemplate: (
        template,
        name,
      ) => {
        set({
          document:
            createDocumentFromTemplate(
              template,
              name,
            ),
          selectedElementId: null,
          selectedElementIds: [],
          activePanel: null,
          zoom: EDITOR_DEFAULT_ZOOM,
          past: [],
          future: [],
          isDirty: false,
        });
      },

      loadDocument: (
        document,
      ) => {
        set({
          document:
            synchronizeDocument(
              document,
            ),
          selectedElementId: null,
          selectedElementIds: [],
          activePanel: null,
          zoom: EDITOR_DEFAULT_ZOOM,
          past: [],
          future: [],
          isDirty: false,
        });
      },

      clearEditor: () => {
        set({
          document: null,
          selectedElementId: null,
          selectedElementIds: [],
          activePanel: null,
          zoom: EDITOR_DEFAULT_ZOOM,
          past: [],
          future: [],
          isDirty: false,
        });
      },

      updateDocumentName: (
        name,
      ) => {
        set(
          (state) => {
            if (!state.document) {
              return state;
            }

            return commitDocument(
              state,
              {
                ...state.document,
                name:
                  name.trim() ||
                  "Nuevo presupuesto",
              },
            );
          },
        );
      },

      updateDocumentDetails: (
        update,
      ) => {
        set(
          (state) => {
            if (!state.document) {
              return state;
            }

            const currentContacto =
              state.document.contacto;

            const nextContacto =
              update.contacto
                ? {
                    clienteId:
                      update.contacto
                        .clienteId ??
                      currentContacto
                        .clienteId,

                    nombre:
                      update.contacto
                        .nombre ??
                      currentContacto
                        .nombre,

                    telefono:
                      update.contacto
                        .telefono ??
                      currentContacto
                        .telefono,
                  }
                : currentContacto;

            return commitDocument(
              state,
              {
                ...state.document,

                name:
                  update.name !==
                  undefined
                    ? update.name.trim() ||
                      state.document.name
                    : state.document.name,

                contacto:
                  nextContacto,

                destino:
                  update.destino !==
                  undefined
                    ? update.destino.trim()
                    : state.document
                        .destino ?? "",

                status:
                  update.status ??
                  state.document.status,

                observaciones:
                  update.observaciones !==
                  undefined
                    ? update.observaciones
                    : state.document
                        .observaciones ??
                      "",
              },
            );
          },
        );
      },

      setActivePage: (
        pageId,
      ) => {
        set(
          (state) => {
            if (!state.document) {
              return state;
            }

            const selectedPage =
              state.document.pages.find(
                (page) =>
                  page.id === pageId,
              );

            if (!selectedPage) {
              return state;
            }

            return {
              document: {
                ...state.document,
                activePageId:
                  selectedPage.id,
                canvas: {
                  ...selectedPage.canvas,
                },
                elements: cloneElements(
                  selectedPage.elements,
                ),
              },
              selectedElementId: null,
              selectedElementIds: [],
            };
          },
        );
      },

      addPage: (
        afterPageId,
      ) => {
        set(
          (state) => {
            if (!state.document) {
              return state;
            }

            const currentDocument =
              state.document;

            const referencePage =
              currentDocument.pages.find(
                (page) =>
                  page.id ===
                  (afterPageId ??
                    currentDocument.activePageId),
              ) ??
              getActivePage(
                currentDocument,
              );

            if (!referencePage) {
              return state;
            }

            const newPage: PresupuestoPage = {
              id: createId("pagina"),
              name: `Página ${
                state.document.pages.length +
                1
              }`,
              order:
                state.document.pages.length +
                1,
              canvas: {
                ...referencePage.canvas,
              },
              elements: [],
            };

            const referenceIndex =
              state.document.pages.findIndex(
                (page) =>
                  page.id ===
                  referencePage.id,
              );

            const nextPages = [
              ...state.document.pages,
            ];

            nextPages.splice(
              referenceIndex + 1,
              0,
              newPage,
            );

            const normalizedPages =
              normalizePages(
                nextPages,
              );

            const insertedPage =
              normalizedPages.find(
                (page) =>
                  page.id ===
                  newPage.id,
              ) ??
              newPage;

            const nextDocument = {
              ...state.document,
              pages: normalizedPages,
              activePageId:
                insertedPage.id,
              canvas: {
                ...insertedPage.canvas,
              },
              elements: [],
            };

            return {
              ...commitDocument(
                state,
                nextDocument,
              ),
              selectedElementId: null,
              selectedElementIds: [],
              activePanel: null,
            };
          },
        );
      },

      duplicatePage: (
        pageId,
      ) => {
        set(
          (state) => {
            if (!state.document) {
              return state;
            }

            const sourcePage =
              state.document.pages.find(
                (page) =>
                  page.id ===
                  (pageId ??
                    state.document
                      ?.activePageId),
              );

            if (!sourcePage) {
              return state;
            }

            const duplicatedPage: PresupuestoPage = {
              ...clonePresupuestoPage(
                sourcePage,
              ),
              id: createId("pagina"),
              elements:
                sourcePage.elements.map(
                  (element) => ({
                    ...element,
                    id: createId(
                      element.type,
                    ),
                  }),
                ),
            };

            const sourceIndex =
              state.document.pages.findIndex(
                (page) =>
                  page.id ===
                  sourcePage.id,
              );

            const nextPages = [
              ...state.document.pages,
            ];

            nextPages.splice(
              sourceIndex + 1,
              0,
              duplicatedPage,
            );

            const normalizedPages =
              normalizePages(
                nextPages,
              );

            const activePage =
              normalizedPages.find(
                (page) =>
                  page.id ===
                  duplicatedPage.id,
              ) ??
              duplicatedPage;

            const nextDocument = {
              ...state.document,
              pages: normalizedPages,
              activePageId:
                activePage.id,
              canvas: {
                ...activePage.canvas,
              },
              elements: cloneElements(
                activePage.elements,
              ),
            };

            return {
              ...commitDocument(
                state,
                nextDocument,
              ),
              selectedElementId: null,
              selectedElementIds: [],
              activePanel: null,
            };
          },
        );
      },

      deletePage: (
        pageId,
      ) => {
        set(
          (state) => {
            if (
              !state.document ||
              state.document.pages.length <=
                1
            ) {
              return state;
            }

            const targetPageId =
              pageId ??
              state.document.activePageId;

            const targetIndex =
              state.document.pages.findIndex(
                (page) =>
                  page.id ===
                  targetPageId,
              );

            if (targetIndex < 0) {
              return state;
            }

            const remainingPages =
              normalizePages(
                state.document.pages.filter(
                  (page) =>
                    page.id !==
                    targetPageId,
                ),
              );

            const nextActivePage =
              remainingPages[
                Math.min(
                  targetIndex,
                  remainingPages.length -
                    1,
                )
              ];

            const nextDocument = {
              ...state.document,
              pages: remainingPages,
              activePageId:
                nextActivePage.id,
              canvas: {
                ...nextActivePage.canvas,
              },
              elements: cloneElements(
                nextActivePage.elements,
              ),
            };

            return {
              ...commitDocument(
                state,
                nextDocument,
              ),
              selectedElementId: null,
              selectedElementIds: [],
              activePanel: null,
            };
          },
        );
      },

      selectElement: (
        elementId,
        additive = false,
      ) => {
        set(
          (state) => {
            if (!elementId) {
              return {
                selectedElementId: null,
                selectedElementIds: [],
              };
            }

            const alreadySelected =
              state.selectedElementIds.includes(
                elementId,
              );

            if (!additive) {
              /*
                Si el elemento ya pertenece a una selección múltiple,
                lo convertimos en elemento principal pero conservamos
                todo el grupo. Esto evita que el mousedown previo al
                arrastre reduzca la selección a un único elemento.
              */
              if (
                alreadySelected &&
                state.selectedElementIds.length > 1
              ) {
                return {
                  selectedElementId:
                    elementId,

                  selectedElementIds:
                    state.selectedElementIds,
                };
              }

              return {
                selectedElementId:
                  elementId,

                selectedElementIds: [
                  elementId,
                ],
              };
            }

            if (alreadySelected) {
              const nextSelectedIds =
                state.selectedElementIds.filter(
                  (selectedId) =>
                    selectedId !==
                    elementId,
                );

              const nextPrimaryId =
                state.selectedElementId ===
                elementId
                  ? nextSelectedIds.at(-1) ??
                    null
                  : state.selectedElementId;

              return {
                selectedElementId:
                  nextPrimaryId,

                selectedElementIds:
                  nextSelectedIds,
              };
            }

            return {
              selectedElementId:
                elementId,

              selectedElementIds: [
                ...state.selectedElementIds,
                elementId,
              ],
            };
          },
        );
      },

      setSelectedElements: (
        elementIds,
        primaryElementId,
      ) => {
        const uniqueElementIds =
          Array.from(
            new Set(
              elementIds.filter(
                Boolean,
              ),
            ),
          );

        const normalizedPrimaryId =
          primaryElementId &&
          uniqueElementIds.includes(
            primaryElementId,
          )
            ? primaryElementId
            : uniqueElementIds.at(-1) ??
              null;

        set({
          selectedElementId:
            normalizedPrimaryId,

          selectedElementIds:
            uniqueElementIds,
        });
      },

      clearElementSelection: () => {
        set({
          selectedElementId: null,
          selectedElementIds: [],
        });
      },

      getSelectedElements: (): EditorElement[] => {
        const state =
          get();

        const currentDocument =
          state.document;

        if (!currentDocument) {
          return [];
        }

        const activePage =
          getActivePage(
            currentDocument,
          );

        if (!activePage) {
          return [];
        }

        return activePage.elements
          .filter(
            (element) =>
              state.selectedElementIds.includes(
                element.id,
              ),
          )
          .map(
            cloneEditorElementPreservingId,
          );
      },

      insertComponent: (
        component,
      ) => {
        set(
          (state) => {
            if (
              !state.document ||
              component.elements.length ===
                0
            ) {
              return state;
            }

            const activePage =
              getActivePage(
                state.document,
              );

            if (!activePage) {
              return state;
            }

            const componentWidth =
              Math.max(
                1,
                component.bounds.width,
              );

            const componentHeight =
              Math.max(
                1,
                component.bounds.height,
              );

            const maxWidth =
              activePage.canvas.width *
              0.8;

            const maxHeight =
              activePage.canvas.height *
              0.8;

            const scale =
              Math.min(
                1,
                maxWidth /
                  componentWidth,
                maxHeight /
                  componentHeight,
              );

            const targetWidth =
              componentWidth *
              scale;

            const targetHeight =
              componentHeight *
              scale;

            const originX =
              Math.max(
                0,
                (
                  activePage.canvas.width -
                  targetWidth
                ) / 2,
              );

            const originY =
              Math.max(
                0,
                (
                  activePage.canvas.height -
                  targetHeight
                ) / 2,
              );

            const startingZIndex =
              getNextZIndex(
                state.document,
              );

            const orderedElements =
              [...component.elements]
                .sort(
                  (
                    firstElement,
                    secondElement,
                  ) =>
                    firstElement.zIndex -
                    secondElement.zIndex,
                );

            const insertedElements =
              orderedElements.map(
                (
                  element,
                  index,
                ): EditorElement => ({
                  ...element,

                  id:
                    createId(
                      element.type,
                    ),

                  x:
                    originX +
                    element.x *
                      scale,

                  y:
                    originY +
                    element.y *
                      scale,

                  width:
                    Math.max(
                      10,
                      element.width *
                        scale,
                    ),

                  height:
                    Math.max(
                      10,
                      element.height *
                        scale,
                    ),

                  zIndex:
                    startingZIndex +
                    index,

                  locked: false,
                }),
              );

            const nextDocument =
              updateActivePage(
                state.document,
                (page) => ({
                  ...page,

                  elements:
                    normalizeZIndexes([
                      ...page.elements,
                      ...insertedElements,
                    ]),
                }),
              );

            const insertedIds =
              insertedElements.map(
                (element) =>
                  element.id,
              );

            return {
              ...commitDocument(
                state,
                nextDocument,
              ),

              selectedElementId:
                insertedIds.at(-1) ??
                null,

              selectedElementIds:
                insertedIds,

              activePanel: null,
            };
          },
        );
      },

      setActivePanel: (
        panel,
      ) => {
        set({
          activePanel: panel,
        });
      },

      setZoom: (
        zoom,
      ) => {
        set({
          zoom: Math.min(
            EDITOR_MAX_ZOOM,
            Math.max(
              EDITOR_MIN_ZOOM,
              zoom,
            ),
          ),
        });
      },

      updateElement: (
        elementId,
        update,
      ) => {
        set(
          (state) => {
            if (!state.document) {
              return state;
            }

            const nextDocument =
              updateActivePage(
                state.document,
                (page) => ({
                  ...page,
                  elements:
                    page.elements.map(
                      (element) =>
                        element.id ===
                        elementId
                          ? ({
                              ...element,
                              ...update,
                            } as EditorElement)
                          : element,
                    ),
                }),
              );

            return commitDocument(
              state,
              nextDocument,
            );
          },
        );
      },

      updateElements: (
        updates,
      ) => {
        set(
          (state) => {
            if (
              !state.document ||
              updates.length === 0
            ) {
              return state;
            }

            const updatesById =
              new Map(
                updates.map(
                  ({
                    elementId,
                    update,
                  }) => [
                    elementId,
                    update,
                  ],
                ),
              );

            const nextDocument =
              updateActivePage(
                state.document,
                (page) => ({
                  ...page,

                  elements:
                    page.elements.map(
                      (element) => {
                        const update =
                          updatesById.get(
                            element.id,
                          );

                        if (!update) {
                          return element;
                        }

                        return {
                          ...element,
                          ...update,
                        } as EditorElement;
                      },
                    ),
                }),
              );

            return commitDocument(
              state,
              nextDocument,
            );
          },
        );
      },

      previewElementPositions: (
        positions,
      ) => {
        set(
          (state) => {
            if (
              !state.document ||
              positions.length === 0
            ) {
              return state;
            }

            const positionsById =
              new Map(
                positions.map(
                  (position) => [
                    position.elementId,
                    position,
                  ],
                ),
              );

            const nextDocument =
              updateActivePage(
                state.document,
                (page) => ({
                  ...page,

                  elements:
                    page.elements.map(
                      (element) => {
                        const position =
                          positionsById.get(
                            element.id,
                          );

                        if (!position) {
                          return element;
                        }

                        return {
                          ...element,
                          x: position.x,
                          y: position.y,
                        };
                      },
                    ),
                }),
              );

            return {
              document:
                synchronizeDocument(
                  nextDocument,
                ),
            };
          },
        );
      },

      addTextElement: () => {
        set(
          (state) => {
            if (!state.document) {
              return state;
            }

            const width = 520;
            const height = 100;

            const position =
              getCenteredPosition(
                state.document,
                width,
                height,
              );

            const element: EditorTextElement = {
              id: createId("text"),
              type: "text",
              name: "Nuevo texto",
              x: position.x,
              y: position.y,
              width,
              height,
              rotation: 0,
              zIndex: getNextZIndex(
                state.document,
              ),
              opacity: 1,
              visible: true,
              locked: false,
              content:
                "Escribí tu texto",
              fontFamily: "Open Sans",
              fontSize: 36,
              fontWeight: 600,
              fontStyle: "normal",
              color: "#111827",
              textAlign: "left",
              lineHeight: 1.2,
              letterSpacing: 0,
            };

            const nextDocument =
              updateActivePage(
                state.document,
                (page) => ({
                  ...page,
                  elements: [
                    ...page.elements,
                    element,
                  ],
                }),
              );

            return {
              ...commitDocument(
                state,
                nextDocument,
              ),
              selectedElementId:
                element.id,
              selectedElementIds: [
                element.id,
              ],
              activePanel:
                "properties" as const,
            };
          },
        );
      },

      addImageElement: () => {
        set(
          (state) => {
            if (!state.document) {
              return state;
            }

            const width = 520;
            const height = 320;

            const position =
              getCenteredPosition(
                state.document,
                width,
                height,
              );

            const element: EditorImageElement = {
              id: createId("image"),
              type: "image",
              name: "Nueva imagen",
              x: position.x,
              y: position.y,
              width,
              height,
              rotation: 0,
              zIndex: getNextZIndex(
                state.document,
              ),
              opacity: 1,
              visible: true,
              locked: false,
              src: "/templates/assets/hero.jpg",
              alt: "Nueva imagen",
              fit: "cover",
              positionX: 50,
              positionY: 50,
              cropZoom: 1,
              borderRadius: 0,
              maintainAspectRatio: true,
            };

            const nextDocument =
              updateActivePage(
                state.document,
                (page) => ({
                  ...page,
                  elements: [
                    ...page.elements,
                    element,
                  ],
                }),
              );

            return {
              ...commitDocument(
                state,
                nextDocument,
              ),
              selectedElementId:
                element.id,
              selectedElementIds: [
                element.id,
              ],
              activePanel:
                "properties" as const,
            };
          },
        );
      },

      addShapeElement: () => {
        set(
          (state) => {
            if (!state.document) {
              return state;
            }

            const width = 360;
            const height = 220;

            const position =
              getCenteredPosition(
                state.document,
                width,
                height,
              );

            const element: EditorShapeElement = {
              id: createId("shape"),
              type: "shape",
              name: "Nueva forma",
              x: position.x,
              y: position.y,
              width,
              height,
              rotation: 0,
              zIndex: getNextZIndex(
                state.document,
              ),
              opacity: 1,
              visible: true,
              locked: false,
              shape: "rectangle",
              backgroundColor:
                "#FF634A",
              borderColor: "#FF634A",
              borderWidth: 0,
              borderRadius: 8,
            };

            const nextDocument =
              updateActivePage(
                state.document,
                (page) => ({
                  ...page,
                  elements: [
                    ...page.elements,
                    element,
                  ],
                }),
              );

            return {
              ...commitDocument(
                state,
                nextDocument,
              ),
              selectedElementId:
                element.id,
              selectedElementIds: [
                element.id,
              ],
              activePanel:
                "properties" as const,
            };
          },
        );
      },

      duplicateElement: (
        elementId,
      ) => {
        set(
          (state) => {
            if (!state.document) {
              return state;
            }

            const activePage =
              getActivePage(
                state.document,
              );

            const sourceElement =
              activePage?.elements.find(
                (element) =>
                  element.id ===
                  elementId,
              );

            if (!sourceElement) {
              return state;
            }

            const duplicatedElement: EditorElement = {
              ...sourceElement,
              id: createId(
                sourceElement.type,
              ),
              name: `${sourceElement.name} copia`,
              x: sourceElement.x + 20,
              y: sourceElement.y + 20,
              zIndex: getNextZIndex(
                state.document,
              ),
            };

            const nextDocument =
              updateActivePage(
                state.document,
                (page) => ({
                  ...page,
                  elements:
                    normalizeZIndexes([
                      ...page.elements,
                      duplicatedElement,
                    ]),
                }),
              );

            return {
              ...commitDocument(
                state,
                nextDocument,
              ),
              selectedElementId:
                duplicatedElement.id,
              selectedElementIds: [
                duplicatedElement.id,
              ],
            };
          },
        );
      },

      deleteElement: (
        elementId,
      ) => {
        set(
          (state) => {
            if (!state.document) {
              return state;
            }

            const nextDocument =
              updateActivePage(
                state.document,
                (page) => ({
                  ...page,
                  elements:
                    normalizeZIndexes(
                      page.elements.filter(
                        (element) =>
                          element.id !==
                          elementId,
                      ),
                    ),
                }),
              );

            return {
              ...commitDocument(
                state,
                nextDocument,
              ),
              selectedElementId:
                state.selectedElementId ===
                elementId
                  ? state.selectedElementIds
                      .filter(
                        (selectedId) =>
                          selectedId !==
                          elementId,
                      )
                      .at(-1) ??
                    null
                  : state.selectedElementId,

              selectedElementIds:
                state.selectedElementIds.filter(
                  (selectedId) =>
                    selectedId !==
                    elementId,
                ),
            };
          },
        );
      },

      toggleElementVisibility: (
        elementId,
      ) => {
        set(
          (state) => {
            if (!state.document) {
              return state;
            }

            const nextDocument =
              updateActivePage(
                state.document,
                (page) => ({
                  ...page,
                  elements:
                    page.elements.map(
                      (element) =>
                        element.id ===
                        elementId
                          ? {
                              ...element,
                              visible:
                                !element.visible,
                            }
                          : element,
                    ),
                }),
              );

            return commitDocument(
              state,
              nextDocument,
            );
          },
        );
      },

      toggleElementLock: (
        elementId,
      ) => {
        set(
          (state) => {
            if (!state.document) {
              return state;
            }

            const nextDocument =
              updateActivePage(
                state.document,
                (page) => ({
                  ...page,
                  elements:
                    page.elements.map(
                      (element) =>
                        element.id ===
                        elementId
                          ? {
                              ...element,
                              locked:
                                !element.locked,
                            }
                          : element,
                    ),
                }),
              );

            return commitDocument(
              state,
              nextDocument,
            );
          },
        );
      },

      reorderElement: (
        elementId,
        targetElementId,
      ) => {
        set(
          (state) => {
            if (
              !state.document ||
              elementId ===
                targetElementId
            ) {
              return state;
            }

            const nextDocument =
              updateActivePage(
                state.document,
                (page) => {
                  /*
                    Trabajamos en el mismo orden que
                    muestra el drawer:

                    índice 0 = capa más alta / frente
                    último = capa más baja / fondo.
                  */
                  const visualOrder = [
                    ...page.elements,
                  ].sort(
                    (
                      firstElement,
                      secondElement,
                    ) =>
                      secondElement.zIndex -
                      firstElement.zIndex,
                  );

                  const sourceIndex =
                    visualOrder.findIndex(
                      (element) =>
                        element.id ===
                        elementId,
                    );

                  const targetIndex =
                    visualOrder.findIndex(
                      (element) =>
                        element.id ===
                        targetElementId,
                    );

                  if (
                    sourceIndex < 0 ||
                    targetIndex < 0
                  ) {
                    return page;
                  }

                  const nextVisualOrder = [
                    ...visualOrder,
                  ];

                  const [
                    movedElement,
                  ] =
                    nextVisualOrder.splice(
                      sourceIndex,
                      1,
                    );

                  if (!movedElement) {
                    return page;
                  }

                  nextVisualOrder.splice(
                    targetIndex,
                    0,
                    movedElement,
                  );

                  /*
                    visualOrder está frente -> fondo.

                    zIndex debe crecer fondo -> frente,
                    por eso asignamos los valores
                    inversamente.
                  */
                  const total =
                    nextVisualOrder.length;

                  const nextElements =
                    nextVisualOrder.map(
                      (
                        element,
                        index,
                      ) => ({
                        ...element,
                        zIndex:
                          total -
                          index,
                      }),
                    );

                  return {
                    ...page,
                    elements:
                      nextElements,
                  };
                },
              );

            return commitDocument(
              state,
              nextDocument,
            );
          },
        );
      },

      bringForward: (
        elementId,
      ) => {
        set(
          (state) => {
            if (!state.document) {
              return state;
            }

            const nextDocument =
              updateActivePage(
                state.document,
                (page) => {
                  const elements =
                    normalizeZIndexes(
                      page.elements,
                    );

                  const index =
                    elements.findIndex(
                      (element) =>
                        element.id ===
                        elementId,
                    );

                  if (
                    index < 0 ||
                    index ===
                      elements.length - 1
                  ) {
                    return page;
                  }

                  [
                    elements[index],
                    elements[index + 1],
                  ] = [
                    elements[index + 1],
                    elements[index],
                  ];

                  return {
                    ...page,
                    elements:
                      normalizeZIndexes(
                        elements,
                      ),
                  };
                },
              );

            return commitDocument(
              state,
              nextDocument,
            );
          },
        );
      },

      sendBackward: (
        elementId,
      ) => {
        set(
          (state) => {
            if (!state.document) {
              return state;
            }

            const nextDocument =
              updateActivePage(
                state.document,
                (page) => {
                  const elements =
                    normalizeZIndexes(
                      page.elements,
                    );

                  const index =
                    elements.findIndex(
                      (element) =>
                        element.id ===
                        elementId,
                    );

                  if (index <= 0) {
                    return page;
                  }

                  [
                    elements[index],
                    elements[index - 1],
                  ] = [
                    elements[index - 1],
                    elements[index],
                  ];

                  return {
                    ...page,
                    elements:
                      normalizeZIndexes(
                        elements,
                      ),
                  };
                },
              );

            return commitDocument(
              state,
              nextDocument,
            );
          },
        );
      },

      bringToFront: (
        elementId,
      ) => {
        set(
          (state) => {
            if (!state.document) {
              return state;
            }

            const nextDocument =
              updateActivePage(
                state.document,
                (page) => {
                  const selectedElement =
                    page.elements.find(
                      (element) =>
                        element.id ===
                        elementId,
                    );

                  if (!selectedElement) {
                    return page;
                  }

                  return {
                    ...page,
                    elements:
                      normalizeZIndexes([
                        ...page.elements.filter(
                          (element) =>
                            element.id !==
                            elementId,
                        ),
                        selectedElement,
                      ]),
                  };
                },
              );

            return commitDocument(
              state,
              nextDocument,
            );
          },
        );
      },

      sendToBack: (
        elementId,
      ) => {
        set(
          (state) => {
            if (!state.document) {
              return state;
            }

            const nextDocument =
              updateActivePage(
                state.document,
                (page) => {
                  const selectedElement =
                    page.elements.find(
                      (element) =>
                        element.id ===
                        elementId,
                    );

                  if (!selectedElement) {
                    return page;
                  }

                  return {
                    ...page,
                    elements:
                      normalizeZIndexes([
                        selectedElement,
                        ...page.elements.filter(
                          (element) =>
                            element.id !==
                            elementId,
                        ),
                      ]),
                  };
                },
              );

            return commitDocument(
              state,
              nextDocument,
            );
          },
        );
      },

      undo: () => {
        set(
          (state) => {
            if (
              !state.document ||
              state.past.length === 0
            ) {
              return state;
            }

            const previousDocument =
              state.past[
                state.past.length - 1
              ];

            return {
              document:
                synchronizeDocument(
                  clonePresupuestoDocument(
                    previousDocument,
                  ),
                ),
              past:
                state.past.slice(
                  0,
                  -1,
                ),
              future: [
                clonePresupuestoDocument(
                  state.document,
                ),
                ...state.future,
              ].slice(
                0,
                EDITOR_HISTORY_LIMIT,
              ),
              selectedElementId: null,
              selectedElementIds: [],
              isDirty: true,
            };
          },
        );
      },

      redo: () => {
        set(
          (state) => {
            if (
              !state.document ||
              state.future.length === 0
            ) {
              return state;
            }

            const nextDocument =
              state.future[0];

            return {
              document:
                synchronizeDocument(
                  clonePresupuestoDocument(
                    nextDocument,
                  ),
                ),
              past: [
                ...state.past,
                clonePresupuestoDocument(
                  state.document,
                ),
              ].slice(
                -EDITOR_HISTORY_LIMIT,
              ),
              future:
                state.future.slice(1),
              selectedElementId: null,
              selectedElementIds: [],
              isDirty: true,
            };
          },
        );
      },
    }),
  );
