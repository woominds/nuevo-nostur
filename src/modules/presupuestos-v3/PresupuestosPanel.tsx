import {
  Copy,
  Eye,
  FileText,
  Pencil,
  Phone,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  PresupuestosEditorPage,
} from "./PresupuestosEditorPage";

import {
  DocumentPreviewModal,
} from "./components/DocumentPreviewModal/DocumentPreviewModal";

import {
  PresupuestoContactStep,
} from "./components/PresupuestoContactStep/PresupuestoContactStep";

import {
  PresupuestoRapidoIAModal,
} from "./components/PresupuestoRapidoIAModal/PresupuestoRapidoIAModal";

import {
  PresupuestoLiveNosActions,
} from "./components/PresupuestoLiveNosActions/PresupuestoLiveNosActions";

import {
  PresupuestoDownloadButton,
} from "./components/PresupuestoDownloadButton/PresupuestoDownloadButton";

import {
  TemplateSelector,
} from "./components/TemplateSelector/TemplateSelector";

import {
  clearStoredEditorDraft,
} from "./hooks/useEditorLocalDraft";

import {
  usePresupuestoTemplates,
} from "./hooks/usePresupuestoTemplates";

import {
  usePresupuestoEditorStore,
} from "./store/presupuestoEditorStore";

import {
  templateRegistry,
} from "./templates/templateRegistry";

import {
  createDocumentFromTemplate,
} from "./utils/elementFactory";

import type {
  PresupuestoContacto,
  PresupuestoDocument,
} from "./types/editor.types";

import {
  EMPTY_PRESUPUESTO_CONTACTO,
} from "./types/editor.types";

type PanelMode =
  | "list"
  | "editor";

const LIST_STORAGE_KEY =
  "nostur-travel-presupuestos-v3-list";

const DRAFT_STORAGE_KEY =
  "nostur-travel-presupuestos-v3-draft";

const createId = (
  prefix: string,
): string => {
  return `${prefix}-${crypto.randomUUID()}`;
};

const normalizeStoredDocument = (
  value: unknown,
): PresupuestoDocument | null => {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const storedDocument =
    value as Partial<PresupuestoDocument>;

  if (
    !storedDocument.id ||
    !storedDocument.templateId
  ) {
    return null;
  }

  const legacyCanvas =
    storedDocument.canvas;

  const legacyElements =
    Array.isArray(
      storedDocument.elements,
    )
      ? storedDocument.elements
      : [];

  const storedPages =
    Array.isArray(
      storedDocument.pages,
    )
      ? storedDocument.pages
      : [];

  const pages =
    storedPages.length > 0
      ? storedPages.map(
          (page, index) => ({
            ...page,

            id:
              page.id ||
              createId("pagina"),

            name:
              page.name ||
              `Página ${index + 1}`,

            order: index + 1,

            canvas: {
              ...page.canvas,
            },

            elements:
              Array.isArray(
                page.elements,
              )
                ? page.elements.map(
                    (element) => ({
                      ...element,
                    }),
                  )
                : [],
          }),
        )
      : legacyCanvas
        ? [
            {
              id: createId(
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

  const firstPage =
    pages[0];

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

    vendedor:
      storedDocument.vendedor
        ? {
            ...storedDocument.vendedor,
          }
        : null,

    destino:
      storedDocument.destino ?? "",

    observaciones:
      storedDocument.observaciones ?? "",

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

const readStoredDocuments =
  (): PresupuestoDocument[] => {
    try {
      const storedList =
        window.localStorage.getItem(
          LIST_STORAGE_KEY,
        );

      const parsedList = storedList
        ? JSON.parse(storedList)
        : [];

      const documents =
        Array.isArray(parsedList)
          ? parsedList
              .map(
                normalizeStoredDocument,
              )
              .filter(
                (
                  document,
                ): document is PresupuestoDocument =>
                  document !== null,
              )
          : [];

      const storedDraft =
        window.localStorage.getItem(
          DRAFT_STORAGE_KEY,
        );

      if (!storedDraft) {
        return documents;
      }

      const draft =
        normalizeStoredDocument(
          JSON.parse(
            storedDraft,
          ),
        );

      if (!draft) {
        return documents;
      }

      const existingIndex =
        documents.findIndex(
          (document) =>
            document.id ===
            draft.id,
        );

      if (existingIndex >= 0) {
        documents[
          existingIndex
        ] = draft;
      } else {
        documents.unshift(
          draft,
        );
      }

      return documents;
    } catch {
      return [];
    }
  };

const saveStoredDocuments = (
  documents: PresupuestoDocument[],
) => {
  try {
    window.localStorage.setItem(
      LIST_STORAGE_KEY,
      JSON.stringify(documents),
    );
  } catch {
    window.alert(
      "No se pudo guardar el listado de presupuestos.",
    );
  }
};

const saveDraft = (
  document: PresupuestoDocument,
) => {
  try {
    window.localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify(document),
    );
  } catch {
    // El documento igualmente permanece en memoria.
  }
};

const formatDate = (
  value: string,
): string => {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(date);
};

const cloneDocument = (
  document: PresupuestoDocument,
): PresupuestoDocument => {
  const now =
    new Date().toISOString();

  const pages =
    document.pages.map(
      (page, index) => ({
        ...page,

        id: createId("pagina"),

        name:
          `Página ${index + 1}`,

        order: index + 1,

        canvas: {
          ...page.canvas,
        },

        elements:
          page.elements.map(
            (element) => ({
              ...element,

              id: createId(
                element.type,
              ),
            }),
          ),
      }),
    );

  const firstPage =
    pages[0];

  return {
    ...document,

    id: createId(
      "presupuesto",
    ),

    name:
      `${document.name} copia`,

    contacto: {
      ...document.contacto,
    },

    pages,

    activePageId:
      firstPage?.id ?? "",

    canvas: firstPage
      ? {
          ...firstPage.canvas,
        }
      : {
          ...document.canvas,
        },

    elements: firstPage
      ? firstPage.elements.map(
          (element) => ({
            ...element,
          }),
        )
      : [],

    createdAt: now,
    updatedAt: now,
  };
};

export function PresupuestosPanel() {
  const [
    mode,
    setMode,
  ] = useState<PanelMode>(
    "list",
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    documents,
    setDocuments,
  ] = useState<
    PresupuestoDocument[]
  >([]);

  const [
    previewDocument,
    setPreviewDocument,
  ] = useState<PresupuestoDocument | null>(
    null,
  );

  const [
    contactStepOpen,
    setContactStepOpen,
  ] = useState(false);

  const [
    aiModalOpen,
    setAiModalOpen,
  ] = useState(false);

  const [
    creationFlow,
    setCreationFlow,
  ] = useState<
    "normal" | "ai" | null
  >(null);

  const [
    templateSelectorOpen,
    setTemplateSelectorOpen,
  ] = useState(false);

  const [
    pendingContacto,
    setPendingContacto,
  ] = useState<PresupuestoContacto | null>(
    null,
  );

  const [
    selectedTemplateId,
    setSelectedTemplateId,
  ] = useState<string | null>(
    templateRegistry.getDefault().id,
  );

  const {
    templates,
    loading: templatesLoading,
    saving: templatesSaving,
    error: templatesError,
    refresh: refreshTemplates,
    renameTemplate,
    deleteTemplate,
  } = usePresupuestoTemplates();

  const currentDocument =
    usePresupuestoEditorStore(
      (state) => state.document,
    );

  const loadDocument =
    usePresupuestoEditorStore(
      (state) => state.loadDocument,
    );

  const clearEditor =
    usePresupuestoEditorStore(
      (state) => state.clearEditor,
    );

  useEffect(() => {
    setDocuments(
      readStoredDocuments(),
    );
  }, []);

  const filteredDocuments =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLocaleLowerCase(
            "es-AR",
          );

      const orderedDocuments = [
        ...documents,
      ].sort(
        (
          firstDocument,
          secondDocument,
        ) =>
          new Date(
            secondDocument.updatedAt,
          ).getTime() -
          new Date(
            firstDocument.updatedAt,
          ).getTime(),
      );

      if (!normalizedSearch) {
        return orderedDocuments;
      }

      return orderedDocuments.filter(
        (document) =>
          [
            document.name,
            document.contacto.nombre,
            document.contacto.telefono,
          ]
            .join(" ")
            .toLocaleLowerCase(
              "es-AR",
            )
            .includes(
              normalizedSearch,
            ),
      );
    }, [
      documents,
      search,
    ]);

  const persistCurrentDocument =
    () => {
      const editorDocument =
        usePresupuestoEditorStore
          .getState()
          .document;

      if (!editorDocument) {
        return;
      }

      const nextDocuments = [
        ...documents,
      ];

      const existingIndex =
        nextDocuments.findIndex(
          (document) =>
            document.id ===
            editorDocument.id,
        );

      if (existingIndex >= 0) {
        nextDocuments[
          existingIndex
        ] = editorDocument;
      } else {
        nextDocuments.unshift(
          editorDocument,
        );
      }

      setDocuments(
        nextDocuments,
      );

      saveStoredDocuments(
        nextDocuments,
      );

      saveDraft(
        editorDocument,
      );
    };

  const handleBackToList = () => {
    persistCurrentDocument();
    setMode("list");
  };

  const handleNewDocument = () => {
    setPendingContacto(null);
    setCreationFlow("normal");

    setSelectedTemplateId(
      templateRegistry.getDefault().id,
    );

    void refreshTemplates();

    setContactStepOpen(true);
  };

  const handleNewAiDocument = () => {
    setPendingContacto(null);
    setCreationFlow("ai");

    setSelectedTemplateId(
      templateRegistry.getDefault().id,
    );

    void refreshTemplates();

    setContactStepOpen(true);
  };

  const handleContactContinue = (
    contacto: PresupuestoContacto,
  ) => {
    setPendingContacto(
      contacto,
    );

    setContactStepOpen(false);

    if (
      creationFlow === "ai"
    ) {
      setAiModalOpen(true);
      return;
    }

    setTemplateSelectorOpen(true);
  };

  const handleConfirmTemplate = () => {
    if (
      !pendingContacto ||
      !selectedTemplateId
    ) {
      return;
    }

    const template =
      templates.find(
        (currentTemplate) =>
          currentTemplate.id ===
          selectedTemplateId,
      ) ?? null;

    if (!template) {
      window.alert(
        "No se encontró el template seleccionado.",
      );

      return;
    }

    const newDocument =
      createDocumentFromTemplate(
        template,
        undefined,
        pendingContacto,
      );

    clearStoredEditorDraft();
    clearEditor();

    loadDocument(
      newDocument,
    );

    saveDraft(
      newDocument,
    );

    setTemplateSelectorOpen(
      false,
    );

    setPendingContacto(null);
    setMode("editor");
  };

  const handleEditDocument = (
    document: PresupuestoDocument,
  ) => {
    loadDocument(document);
    saveDraft(document);
    setMode("editor");
  };

  const handleDuplicateDocument = (
    document: PresupuestoDocument,
  ) => {
    const duplicatedDocument =
      cloneDocument(document);

    const nextDocuments = [
      duplicatedDocument,
      ...documents,
    ];

    setDocuments(
      nextDocuments,
    );

    saveStoredDocuments(
      nextDocuments,
    );

    loadDocument(
      duplicatedDocument,
    );

    saveDraft(
      duplicatedDocument,
    );

    setMode("editor");
  };

  const handleDeleteDocument = (
    document: PresupuestoDocument,
  ) => {
    const shouldDelete =
      window.confirm(
        `¿Eliminar el presupuesto “${document.name}”?`,
      );

    if (!shouldDelete) {
      return;
    }

    const nextDocuments =
      documents.filter(
        (currentItem) =>
          currentItem.id !==
          document.id,
      );

    setDocuments(
      nextDocuments,
    );

    saveStoredDocuments(
      nextDocuments,
    );

    if (
      currentDocument?.id ===
      document.id
    ) {
      clearEditor();
      clearStoredEditorDraft();
    }
  };

  if (mode === "editor") {
    return (
      <div
        className="h-full min-h-0"
        onClickCapture={(event) => {
          const target =
            event.target as HTMLElement;

          const backButton =
            target.closest(
              'button[aria-label="Volver"]',
            );

          if (!backButton) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          handleBackToList();
        }}
      >
        <PresupuestosEditorPage />
      </div>
    );
  }

  return (
    <section className="min-h-full bg-[#f8fafc] p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF634A]">
              Ventas
            </p>

            <h1 className="mt-1 text-2xl font-bold text-[#172033]">
              Presupuestos
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Creá, editá y administrá presupuestos turísticos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={
                handleNewAiDocument
              }
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#FF634A]/30 bg-[#FFF4F1] px-4 text-sm font-semibold text-[#FF634A] transition hover:border-[#FF634A]/50 hover:bg-[#ffe8e2]"
            >
              <Sparkles size={17} />

              Presupuesto rápido IA
            </button>

            <button
              type="button"
              onClick={
                handleNewDocument
              }
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#FF634A] px-4 text-sm font-semibold text-white transition hover:bg-[#f0543d]"
            >
              <Plus size={17} />

              Nuevo presupuesto
            </button>
          </div>
        </header>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-sm">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Buscar por presupuesto, contacto o teléfono..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
            />
          </label>

          <p className="text-xs font-medium text-slate-500">
            {
              filteredDocuments.length
            }{" "}
            presupuestos
          </p>
        </div>

        {filteredDocuments.length ===
        0 ? (
          <div className="mt-6 flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
            <div>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#FFF4F1] text-[#FF634A]">
                <FileText
                  size={23}
                />
              </span>

              <h2 className="mt-4 text-base font-semibold text-slate-900">
                No hay presupuestos
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Creá el primero desde un template.
              </p>

              <button
                type="button"
                onClick={
                  handleNewDocument
                }
                className="mt-4 h-9 rounded-lg bg-[#FF634A] px-4 text-sm font-semibold text-white"
              >
                Nuevo presupuesto
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {filteredDocuments.map(
              (
                document,
                index,
              ) => (
                <article
                  key={document.id}
                  className={[
                    "flex flex-col gap-4 p-4 lg:flex-row lg:items-center",
                    index > 0
                      ? "border-t border-slate-100"
                      : "",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleEditDocument(
                        document,
                      )
                    }
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#FFF4F1] text-[#FF634A]">
                      <FileText
                        size={20}
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {document.name}
                      </span>

                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <UserRound
                            size={13}
                          />

                          {document.contacto
                            .nombre ||
                            "Sin contacto"}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <Phone
                            size={13}
                          />

                          {document.contacto
                            .telefono ||
                            "Sin teléfono"}
                        </span>

                        <span>
                          {
                            document.pages
                              .length
                          }{" "}
                          {document.pages
                            .length === 1
                            ? "hoja"
                            : "hojas"}
                        </span>

                        <span>
                          Actualizado{" "}
                          {formatDate(
                            document.updatedAt,
                          )}
                        </span>
                      </span>

                      <span className="mt-1 block text-[11px] font-medium text-slate-400">
                        {document.contacto
                          .clienteId
                          ? "Cliente vinculado"
                          : "Contacto no registrado"}
                      </span>
                    </span>
                  </button>

                  <div className="flex flex-wrap items-center gap-1 lg:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewDocument(
                          document,
                        )
                      }
                      className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Eye size={15} />
                      Vista previa
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleEditDocument(
                          document,
                        )
                      }
                      className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Pencil
                        size={15}
                      />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDuplicateDocument(
                          document,
                        )
                      }
                      className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Copy size={15} />
                      Duplicar
                    </button>

                    <PresupuestoDownloadButton
                      document={document}
                    />

                    <PresupuestoLiveNosActions
                      document={document}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteDocument(
                          document,
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Eliminar presupuesto"
                    >
                      <Trash2
                        size={15}
                      />
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </div>

      <DocumentPreviewModal
        document={previewDocument}
        onClose={() =>
          setPreviewDocument(null)
        }
      />

      <PresupuestoContactStep
        open={contactStepOpen}
        onClose={() => {
          setContactStepOpen(false);
          setPendingContacto(null);
          setCreationFlow(null);
        }}
        onContinue={
          handleContactContinue
        }
      />

      <PresupuestoRapidoIAModal
        open={aiModalOpen}
        contacto={pendingContacto}
        onClose={() => {
          setAiModalOpen(false);
          setPendingContacto(null);
          setCreationFlow(null);
        }}
      />

      <TemplateSelector
        open={templateSelectorOpen}
        templates={templates}
        selectedTemplateId={
          selectedTemplateId
        }
        onSelect={
          setSelectedTemplateId
        }
        onConfirm={
          handleConfirmTemplate
        }
        onRenameTemplate={
          renameTemplate
        }
        onDeleteTemplate={async (
          templateId,
        ) => {
          const deleted =
            await deleteTemplate(
              templateId,
            );

          if (
            deleted &&
            selectedTemplateId ===
              templateId
          ) {
            setSelectedTemplateId(
              templateRegistry.getDefault().id,
            );
          }

          return deleted;
        }}
        managing={
          templatesSaving
        }
        onClose={() => {
          setTemplateSelectorOpen(
            false,
          );

          setPendingContacto(null);
        }}
      />

      {templateSelectorOpen &&
      templatesLoading ? (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[380] rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg">
          Cargando templates...
        </div>
      ) : null}

      {templateSelectorOpen &&
      templatesError ? (
        <div className="fixed bottom-4 right-4 z-[380] max-w-sm rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-lg">
          {templatesError}
        </div>
      ) : null}
    </section>
  );
}
