import {
  Boxes,
  ImagePlus,
  Images,
  Shapes,
  Type,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  ComponentLibraryModal,
} from "../ComponentLibraryModal/ComponentLibraryModal";

import {
  ResourceLibraryModal,
} from "../ResourceLibraryModal/ResourceLibraryModal";

import {
  usePresupuestoEditorStore,
} from "../../store/presupuestoEditorStore";

import type {
  PresupuestoRecurso,
} from "../../services/presupuestoRecursosService";

export function EditorToolbar() {
  const [
    resourceLibraryOpen,
    setResourceLibraryOpen,
  ] = useState(false);

  const [
    componentLibraryOpen,
    setComponentLibraryOpen,
  ] = useState(false);

  const addTextElement =
    usePresupuestoEditorStore(
      (state) =>
        state.addTextElement,
    );

  const addImageElement =
    usePresupuestoEditorStore(
      (state) =>
        state.addImageElement,
    );

  const addShapeElement =
    usePresupuestoEditorStore(
      (state) =>
        state.addShapeElement,
    );

  const handleInsertResource = (
    recurso: PresupuestoRecurso,
  ) => {
    addImageElement();

    const editorState =
      usePresupuestoEditorStore.getState();

    const elementId =
      editorState.selectedElementId;

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

    const width =
      Math.max(
        80,
        Math.round(
          sourceWidth * scale,
        ),
      );

    const height =
      Math.max(
        80,
        Math.round(
          sourceHeight * scale,
        ),
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

        width,
        height,

        fit:
          "contain",

        maintainAspectRatio:
          true,
      },
    );
  };

  return (
    <>
      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
        <button
          type="button"
          onClick={
            addTextElement
          }
          className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          aria-label="Agregar texto"
          title="Agregar texto"
        >
          <Type size={17} />

          <span className="hidden sm:inline">
            Texto
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            setResourceLibraryOpen(
              true,
            )
          }
          className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          aria-label="Agregar imagen"
          title="Biblioteca de imágenes"
        >
          <ImagePlus size={17} />

          <span className="hidden sm:inline">
            Imagen
          </span>
        </button>

        <button
          type="button"
          onClick={
            addShapeElement
          }
          className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          aria-label="Agregar forma"
          title="Agregar forma"
        >
          <Shapes size={17} />

          <span className="hidden sm:inline">
            Forma
          </span>
        </button>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        <button
          type="button"
          onClick={() =>
            setResourceLibraryOpen(
              true,
            )
          }
          className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          aria-label="Abrir biblioteca de recursos"
          title="Biblioteca de recursos"
        >
          <Images
            size={17}
          />

          <span className="hidden sm:inline">
            Biblioteca
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            setComponentLibraryOpen(
              true,
            )
          }
          className="flex h-9 items-center gap-2 rounded-lg bg-[#FFF4F1] px-3 text-sm font-semibold text-[#FF634A] transition hover:bg-[#FFE8E2]"
          aria-label="Abrir biblioteca de componentes"
          title="Biblioteca de componentes"
        >
          <Boxes size={17} />

          <span className="hidden sm:inline">
            Componentes
          </span>
        </button>
      </div>

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
          handleInsertResource
        }
      />

      <ComponentLibraryModal
        open={
          componentLibraryOpen
        }
        onClose={() =>
          setComponentLibraryOpen(
            false,
          )
        }
      />
    </>
  );
}
