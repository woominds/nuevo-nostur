import {
  useRef,
  useState,
} from "react";

import type {
  DragEvent,
  MouseEvent,
} from "react";

import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Lock,
  Trash2,
  Unlock,
  X,
} from "lucide-react";

import {
  usePresupuestoEditorStore,
} from "../../store/presupuestoEditorStore";

export function LayersPanel() {
  const draggedElementIdRef =
    useRef<string | null>(
      null,
    );

  const [
    draggedElementId,
    setDraggedElementId,
  ] = useState<string | null>(
    null,
  );

  const [
    dropTargetId,
    setDropTargetId,
  ] = useState<string | null>(
    null,
  );

  const document =
    usePresupuestoEditorStore(
      (state) =>
        state.document,
    );

  const selectedElementIds =
    usePresupuestoEditorStore(
      (state) =>
        state.selectedElementIds,
    );

  const selectElement =
    usePresupuestoEditorStore(
      (state) =>
        state.selectElement,
    );

  const setActivePanel =
    usePresupuestoEditorStore(
      (state) =>
        state.setActivePanel,
    );

  const duplicateElement =
    usePresupuestoEditorStore(
      (state) =>
        state.duplicateElement,
    );

  const deleteElement =
    usePresupuestoEditorStore(
      (state) =>
        state.deleteElement,
    );

  const toggleElementVisibility =
    usePresupuestoEditorStore(
      (state) =>
        state.toggleElementVisibility,
    );

  const toggleElementLock =
    usePresupuestoEditorStore(
      (state) =>
        state.toggleElementLock,
    );

  const reorderElement =
    usePresupuestoEditorStore(
      (state) =>
        state.reorderElement,
    );

  const bringForward =
    usePresupuestoEditorStore(
      (state) =>
        state.bringForward,
    );

  const sendBackward =
    usePresupuestoEditorStore(
      (state) =>
        state.sendBackward,
    );

  const elements =
    document
      ? [
          ...document.elements,
        ].sort(
          (
            firstElement,
            secondElement,
          ) =>
            secondElement.zIndex -
            firstElement.zIndex,
        )
      : [];

  const handleLayerSelect = (
    event: MouseEvent<HTMLButtonElement>,
    elementId: string,
  ) => {
    event.stopPropagation();

    selectElement(
      elementId,
      event.shiftKey,
    );
  };

  const handleDragStart = (
    event: DragEvent<HTMLDivElement>,
    elementId: string,
  ) => {
    draggedElementIdRef.current =
      elementId;

    setDraggedElementId(
      elementId,
    );

    setDropTargetId(null);

    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "application/x-nostur-layer",
      elementId,
    );

    event.dataTransfer.setData(
      "text/plain",
      elementId,
    );
  };

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>,
    targetElementId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    event.dataTransfer.dropEffect =
      "move";

    if (
      draggedElementIdRef.current &&
      draggedElementIdRef.current !==
        targetElementId
    ) {
      setDropTargetId(
        targetElementId,
      );
    }
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
    targetElementId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const sourceElementId =
      event.dataTransfer.getData(
        "application/x-nostur-layer",
      ) ||
      event.dataTransfer.getData(
        "text/plain",
      ) ||
      draggedElementIdRef.current;

    if (
      sourceElementId &&
      sourceElementId !==
        targetElementId
    ) {
      reorderElement(
        sourceElementId,
        targetElementId,
      );
    }

    draggedElementIdRef.current =
      null;

    setDraggedElementId(null);
    setDropTargetId(null);
  };

  const handleDragEnd = () => {
    draggedElementIdRef.current =
      null;

    setDraggedElementId(null);
    setDropTargetId(null);
  };

  return (
    <aside className="absolute inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-[-12px_0_30px_rgba(15,23,42,0.08)] sm:w-80">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Capas
          </p>

          <p className="text-xs text-slate-500">
            {selectedElementIds.length >
            1
              ? `${selectedElementIds.length} seleccionados · ${elements.length} elementos`
              : `${elements.length} elementos`}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setActivePanel(null)
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Cerrar capas"
        >
          <X size={18} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {elements.map(
            (element) => {
              const selected =
                selectedElementIds.includes(
                  element.id,
                );

              const dragging =
                draggedElementId ===
                element.id;

              const dropTarget =
                dropTargetId ===
                  element.id &&
                draggedElementId !==
                  element.id;

              return (
                <div
                  key={element.id}
                  onDragEnter={(
                    event,
                  ) =>
                    handleDragOver(
                      event,
                      element.id,
                    )
                  }
                  onDragOver={(
                    event,
                  ) =>
                    handleDragOver(
                      event,
                      element.id,
                    )
                  }
                  onDrop={(event) =>
                    handleDrop(
                      event,
                      element.id,
                    )
                  }
                  className={[
                    "relative rounded-lg border p-2 transition",
                    selected
                      ? "border-[#FF634A] bg-[#FFF4F1]"
                      : "border-slate-200 bg-white hover:border-slate-300",
                    dragging
                      ? "opacity-35"
                      : "opacity-100",
                    dropTarget
                      ? "border-[#FF634A] ring-2 ring-[#FF634A]/20"
                      : "",
                  ].join(" ")}
                >
                  {dropTarget ? (
                    <div className="pointer-events-none absolute -top-[3px] left-2 right-2 h-[3px] rounded-full bg-[#FF634A]" />
                  ) : null}

                  <div className="flex items-center gap-2">
                    <div
                      draggable
                      onDragStart={(
                        event,
                      ) =>
                        handleDragStart(
                          event,
                          element.id,
                        )
                      }
                      onDragEnd={
                        handleDragEnd
                      }
                      className="flex h-9 w-6 shrink-0 cursor-grab items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing"
                      title="Arrastrar capa"
                      aria-label="Arrastrar capa"
                    >
                      <GripVertical
                        size={17}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={(
                        event,
                      ) =>
                        handleLayerSelect(
                          event,
                          element.id,
                        )
                      }
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold uppercase text-slate-600">
                        {element.type.slice(
                          0,
                          2,
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {element.name}
                        </p>

                        <p className="text-xs capitalize text-slate-500">
                          {element.type}
                          {" · "}
                          capa{" "}
                          {
                            element.zIndex
                          }
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-end gap-1 border-t border-slate-100 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        toggleElementVisibility(
                          element.id,
                        )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      aria-label={
                        element.visible
                          ? "Ocultar"
                          : "Mostrar"
                      }
                    >
                      {element.visible ? (
                        <Eye
                          size={15}
                        />
                      ) : (
                        <EyeOff
                          size={15}
                        />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toggleElementLock(
                          element.id,
                        )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      aria-label={
                        element.locked
                          ? "Desbloquear"
                          : "Bloquear"
                      }
                    >
                      {element.locked ? (
                        <Lock
                          size={15}
                        />
                      ) : (
                        <Unlock
                          size={15}
                        />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        bringForward(
                          element.id,
                        )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      aria-label="Subir capa"
                      title="Subir una posición"
                    >
                      <ChevronUp
                        size={15}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        sendBackward(
                          element.id,
                        )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      aria-label="Bajar capa"
                      title="Bajar una posición"
                    >
                      <ChevronDown
                        size={15}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        duplicateElement(
                          element.id,
                        )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      aria-label="Duplicar"
                    >
                      <Copy
                        size={15}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteElement(
                          element.id,
                        )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600"
                      aria-label="Eliminar"
                    >
                      <Trash2
                        size={15}
                      />
                    </button>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>
    </aside>
  );
}

export default LayersPanel;
