import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/700.css";
import "@fontsource/open-sans/800.css";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ChangeEvent,
  KeyboardEvent,
} from "react";

import {
  ChevronLeft,
  CircleHelp,
  ClipboardList,
  Expand,
  FilePlus2,
  Images,
  Layers3,
  Redo2,
  Save,
  Settings2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import {
  DocumentDetailsPanel,
} from "./components/DocumentDetailsPanel/DocumentDetailsPanel";

import {
  EditorCanvas,
} from "./components/EditorCanvas";

import {
  EditorToolbar,
} from "./components/EditorToolbar";

import {
  KeyboardShortcutsPanel,
} from "./components/KeyboardShortcutsPanel/KeyboardShortcutsPanel";

import {
  LayersPanel,
} from "./components/LayersPanel/LayersPanel";

import {
  PropertiesPanel,
} from "./components/PropertiesPanel/PropertiesPanel";

import {
  ResourceLibraryModal,
} from "./components/ResourceLibraryModal/ResourceLibraryModal";

import {
  SaveTemplateModal,
} from "./components/SaveTemplateModal/SaveTemplateModal";

import {
  SelectionToolbar,
} from "./components/SelectionToolbar";

import {
  TemplateSelector,
} from "./components/TemplateSelector/TemplateSelector";

import {
  useEditorFitZoom,
} from "./hooks/useEditorFitZoom";

import {
  useEditorKeyboard,
} from "./hooks/useEditorKeyboard";

import {
  clearStoredEditorDraft,
  useEditorLocalDraft,
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

import type {
  PresupuestoRecurso,
} from "./services/presupuestoRecursosService";

export function PresupuestosEditorPage() {
  useEditorKeyboard();

  const [
    shortcutsOpen,
    setShortcutsOpen,
  ] = useState(false);

  const [
    documentDetailsOpen,
    setDocumentDetailsOpen,
  ] = useState(false);

  const [
    documentNameDraft,
    setDocumentNameDraft,
  ] = useState(
    "Nuevo presupuesto",
  );

  const [
    templateSelectorOpen,
    setTemplateSelectorOpen,
  ] = useState(false);

  const [
    saveTemplateOpen,
    setSaveTemplateOpen,
  ] = useState(false);

  const [
    resourceLibraryOpen,
    setResourceLibraryOpen,
  ] = useState(false);

  const [
    editorNotice,
    setEditorNotice,
  ] = useState<string | null>(
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

  const {
    draftReady,
  } = useEditorLocalDraft();

  const {
    workspaceRef,
    fitToScreen,
  } = useEditorFitZoom();

  const document =
    usePresupuestoEditorStore(
      (state) => state.document,
    );

  const zoom =
    usePresupuestoEditorStore(
      (state) => state.zoom,
    );

  const updateDocumentName =
    usePresupuestoEditorStore(
      (state) =>
        state.updateDocumentName,
    );

  const past =
    usePresupuestoEditorStore(
      (state) => state.past,
    );

  const future =
    usePresupuestoEditorStore(
      (state) => state.future,
    );

  const activePanel =
    usePresupuestoEditorStore(
      (state) => state.activePanel,
    );

  const loadTemplate =
    usePresupuestoEditorStore(
      (state) => state.loadTemplate,
    );

  const setZoom =
    usePresupuestoEditorStore(
      (state) => state.setZoom,
    );

  const setActivePanel =
    usePresupuestoEditorStore(
      (state) => state.setActivePanel,
    );

  const undo =
    usePresupuestoEditorStore(
      (state) => state.undo,
    );

  const redo =
    usePresupuestoEditorStore(
      (state) => state.redo,
    );

  const activePage =
    useMemo(() => {
      if (!document) {
        return null;
      }

      return (
        document.pages.find(
          (page) =>
            page.id ===
            document.activePageId,
        ) ??
        document.pages[0] ??
        null
      );
    }, [
      document,
    ]);

  useEffect(() => {
    if (
      !draftReady ||
      document
    ) {
      return;
    }

    loadTemplate(
      templateRegistry.getDefault(),
    );
  }, [
    document,
    draftReady,
    loadTemplate,
  ]);

  useEffect(() => {
    setDocumentNameDraft(
      document?.name ??
        "Nuevo presupuesto",
    );
  }, [
    document?.id,
    document?.name,
  ]);

  useEffect(() => {
    if (!editorNotice) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        setEditorNotice(null);
      }, 3200);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [editorNotice]);

  const commitDocumentName =
    () => {
      const normalizedName =
        documentNameDraft.trim() ||
        "Nuevo presupuesto";

      setDocumentNameDraft(
        normalizedName,
      );

      if (
        normalizedName !==
        document?.name
      ) {
        updateDocumentName(
          normalizedName,
        );
      }
    };

  const handleDocumentNameChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setDocumentNameDraft(
      event.target.value,
    );
  };

  const handleDocumentNameKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitDocumentName();
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();

      setDocumentNameDraft(
        document?.name ??
          "Nuevo presupuesto",
      );

      event.currentTarget.blur();
    }
  };

  const handleNewDocument = () => {
    setSelectedTemplateId(
      templateRegistry.getDefault().id,
    );

    void refreshTemplates();

    setTemplateSelectorOpen(true);
  };

  const handleConfirmTemplate = () => {
    if (!selectedTemplateId) {
      return;
    }

    const selectedTemplate =
      templates.find(
        (template) =>
          template.id ===
          selectedTemplateId,
      );

    if (!selectedTemplate) {
      window.alert(
        "No se encontró el template seleccionado.",
      );

      return;
    }

    const shouldCreate =
      window.confirm(
        "¿Crear un nuevo presupuesto? Se perderán los cambios del borrador actual.",
      );

    if (!shouldCreate) {
      return;
    }

    clearStoredEditorDraft();

    loadTemplate(
      selectedTemplate,
      "Nuevo presupuesto",
    );

    setTemplateSelectorOpen(false);
  };

  const handleOpenSaveTemplate =
    () => {
      if (!activePage) {
        window.alert(
          "No hay una hoja activa para guardar.",
        );

        return;
      }

      setSaveTemplateOpen(true);
    };

  const handleTemplateSaved =
    async () => {
      await refreshTemplates();

      setEditorNotice(
        "La hoja se guardó correctamente como template.",
      );
    };

  const handleRenameTemplate =
    async (
      templateId: string,
      name: string,
    ): Promise<boolean> => {
      return renameTemplate(
        templateId,
        name,
      );
    };

  const handleDeleteTemplate =
    async (
      templateId: string,
    ): Promise<boolean> => {
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
    };

  const handleInsertHeaderResource = (
    recurso: PresupuestoRecurso,
  ) => {
    const editorState =
      usePresupuestoEditorStore.getState();

    editorState.addImageElement();

    const elementId =
      usePresupuestoEditorStore.getState()
        .selectedElementId;

    if (!elementId) {
      return;
    }

    const maxWidth = 620;
    const maxHeight = 420;

    const sourceWidth =
      recurso.ancho &&
      recurso.ancho > 0
        ? recurso.ancho
        : 520;

    const sourceHeight =
      recurso.alto &&
      recurso.alto > 0
        ? recurso.alto
        : 320;

    const scale =
      Math.min(
        maxWidth / sourceWidth,
        maxHeight / sourceHeight,
        1,
      );

    editorState.updateElement(
      elementId,
      {
        src:
          recurso.archivoUrl,

        alt:
          recurso.nombre,

        name:
          recurso.nombre,

        width:
          Math.max(
            80,
            Math.round(
              sourceWidth * scale,
            ),
          ),

        height:
          Math.max(
            80,
            Math.round(
              sourceHeight * scale,
            ),
          ),

        fit:
          "contain",

        maintainAspectRatio:
          true,
      },
    );
  };

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Volver"
          >
            <ChevronLeft
              size={18}
            />
          </button>

          <div className="min-w-0">
            <input
              type="text"
              value={
                documentNameDraft
              }
              onChange={
                handleDocumentNameChange
              }
              onBlur={
                commitDocumentName
              }
              onKeyDown={
                handleDocumentNameKeyDown
              }
              className="h-7 min-w-0 max-w-[180px] truncate rounded-md border border-transparent bg-transparent px-1 text-sm font-semibold text-slate-900 outline-none transition hover:border-slate-200 focus:border-[#FF634A] focus:bg-white sm:max-w-[280px]"
              aria-label="Nombre del presupuesto"
            />

            <p className="hidden px-1 text-xs text-slate-500 sm:block">
              Guardado automáticamente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={
              handleNewDocument
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Nuevo presupuesto"
            title="Nuevo presupuesto"
          >
            <FilePlus2
              size={17}
            />
          </button>

          <button
            type="button"
            disabled={!document}
            onClick={() =>
              setDocumentDetailsOpen(
                true,
              )
            }
            className="flex h-8 items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Datos del presupuesto"
            title="Datos del presupuesto"
          >
            <ClipboardList
              size={17}
            />

            <span className="hidden xl:inline">
              Datos
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setResourceLibraryOpen(
                true,
              )
            }
            className="flex h-8 items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Biblioteca de recursos"
            title="Biblioteca de recursos"
          >
            <Images
              size={17}
            />

            <span className="hidden xl:inline">
              Biblioteca
            </span>
          </button>

          <button
            type="button"
            disabled={!activePage}
            onClick={
              handleOpenSaveTemplate
            }
            className="flex h-8 items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Guardar hoja como template"
            title="Guardar hoja activa como template"
          >
            <Save size={17} />

            <span className="hidden xl:inline">
              Guardar template
            </span>
          </button>

          <div className="mx-1 h-5 w-px bg-slate-200" />

          <button
            type="button"
            disabled={
              past.length === 0
            }
            onClick={undo}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Deshacer"
            title="Deshacer"
          >
            <Undo2 size={17} />
          </button>

          <button
            type="button"
            disabled={
              future.length === 0
            }
            onClick={redo}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Rehacer"
            title="Rehacer"
          >
            <Redo2 size={17} />
          </button>

          <div className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />

          <button
            type="button"
            onClick={() =>
              setZoom(zoom - 0.1)
            }
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 sm:flex"
            aria-label="Alejar"
          >
            <ZoomOut size={17} />
          </button>

          <span className="hidden w-11 text-center text-xs font-medium text-slate-600 sm:block">
            {Math.round(
              zoom * 100,
            )}
            %
          </span>

          <button
            type="button"
            onClick={() =>
              setZoom(zoom + 0.1)
            }
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 sm:flex"
            aria-label="Acercar"
          >
            <ZoomIn size={17} />
          </button>

          <button
            type="button"
            onClick={fitToScreen}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Ajustar a pantalla"
            title="Ajustar a pantalla"
          >
            <Expand size={17} />
          </button>

          <button
            type="button"
            onClick={() =>
              setShortcutsOpen(
                true,
              )
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Ver atajos"
            title="Atajos"
          >
            <CircleHelp
              size={17}
            />
          </button>

          <div className="mx-1 h-5 w-px bg-slate-200" />

          <button
            type="button"
            onClick={() =>
              setActivePanel(
                activePanel ===
                  "properties"
                  ? null
                  : "properties",
              )
            }
            className={[
              "flex h-8 items-center gap-2 rounded-lg px-2 text-sm font-medium transition",
              activePanel ===
              "properties"
                ? "bg-[#FFF4F1] text-[#FF634A]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            ].join(" ")}
            aria-label="Propiedades"
          >
            <Settings2
              size={17}
            />

            <span className="hidden lg:inline">
              Propiedades
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActivePanel(
                activePanel ===
                  "layers"
                  ? null
                  : "layers",
              )
            }
            className={[
              "flex h-8 items-center gap-2 rounded-lg px-2 text-sm font-medium transition",
              activePanel ===
              "layers"
                ? "bg-[#FFF4F1] text-[#FF634A]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            ].join(" ")}
            aria-label="Capas"
          >
            <Layers3
              size={17}
            />

            <span className="hidden lg:inline">
              Capas
            </span>
          </button>
        </div>
      </header>

      <div
        ref={workspaceRef}
        className="relative flex min-h-0 flex-1"
      >
        <EditorCanvas />

        <SelectionToolbar />

        <EditorToolbar />
      </div>

      {activePanel ===
      "layers" ? (
        <LayersPanel />
      ) : null}

      {activePanel ===
      "properties" ? (
        <PropertiesPanel />
      ) : null}

      <KeyboardShortcutsPanel
        open={shortcutsOpen}
        onClose={() =>
          setShortcutsOpen(false)
        }
      />

      <ResourceLibraryModal
        open={
          resourceLibraryOpen
        }
        onClose={() =>
          setResourceLibraryOpen(
            false,
          )
        }
        onInsert={
          handleInsertHeaderResource
        }
      />

      <DocumentDetailsPanel
        open={documentDetailsOpen}
        onClose={() =>
          setDocumentDetailsOpen(
            false,
          )
        }
      />

      <SaveTemplateModal
        open={saveTemplateOpen}
        page={activePage}
        onClose={() =>
          setSaveTemplateOpen(false)
        }
        onSaved={() =>
          void handleTemplateSaved()
        }
      />

      <TemplateSelector
        open={
          templateSelectorOpen
        }
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
        onClose={() =>
          setTemplateSelectorOpen(
            false,
          )
        }
        onRenameTemplate={
          handleRenameTemplate
        }
        onDeleteTemplate={
          handleDeleteTemplate
        }
        managing={
          templatesSaving
        }
      />

      {templateSelectorOpen &&
      templatesLoading ? (
        <div className="pointer-events-none absolute bottom-4 right-4 z-[80] rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg">
          Cargando templates...
        </div>
      ) : null}

      {templateSelectorOpen &&
      templatesError ? (
        <div className="absolute bottom-4 right-4 z-[80] max-w-sm rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-lg">
          {templatesError}
        </div>
      ) : null}

      {editorNotice ? (
        <div className="pointer-events-none fixed right-5 top-5 z-[500] rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-xl">
          {editorNotice}
        </div>
      ) : null}
    </section>
  );
}
