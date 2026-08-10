import {
  ArrowDownToLine,
  ArrowUpToLine,
  Boxes,
  Copy,
  Lock,
  Trash2,
  Unlock,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  SaveComponentModal,
} from "../SaveComponentModal/SaveComponentModal";

import {
  usePresupuestoEditorStore,
} from "../../store/presupuestoEditorStore";

export function SelectionToolbar() {
  const [
    saveComponentOpen,
    setSaveComponentOpen,
  ] = useState(false);

  const document =
    usePresupuestoEditorStore(
      (state) =>
        state.document,
    );

  const selectedElementId =
    usePresupuestoEditorStore(
      (state) =>
        state.selectedElementId,
    );

  const selectedElementIds =
    usePresupuestoEditorStore(
      (state) =>
        state.selectedElementIds,
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

  const toggleElementLock =
    usePresupuestoEditorStore(
      (state) =>
        state.toggleElementLock,
    );

  const bringToFront =
    usePresupuestoEditorStore(
      (state) =>
        state.bringToFront,
    );

  const sendToBack =
    usePresupuestoEditorStore(
      (state) =>
        state.sendToBack,
    );

  const clearElementSelection =
    usePresupuestoEditorStore(
      (state) =>
        state.clearElementSelection,
    );

  const selectedElements =
    useMemo(
      () =>
        document?.elements.filter(
          (element) =>
            selectedElementIds.includes(
              element.id,
            ),
        ) ?? [],
      [
        document?.elements,
        selectedElementIds,
      ],
    );

  const primaryElement =
    selectedElements.find(
      (element) =>
        element.id ===
        selectedElementId,
    ) ??
    selectedElements.at(-1) ??
    null;

  if (!primaryElement) {
    return null;
  }

  const multipleSelection =
    selectedElements.length > 1;

  const allLocked =
    selectedElements.length > 0 &&
    selectedElements.every(
      (element) =>
        element.locked,
    );

  const handleToggleLock =
    () => {
      selectedElements.forEach(
        (element) => {
          if (
            allLocked
              ? element.locked
              : !element.locked
          ) {
            toggleElementLock(
              element.id,
            );
          }
        },
      );
    };

  const handleDelete =
    () => {
      selectedElements.forEach(
        (element) =>
          deleteElement(
            element.id,
          ),
      );

      clearElementSelection();
    };

  return (
    <>
      <div className="absolute bottom-16 left-1/2 z-30 flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-[0_10px_25px_rgba(15,23,42,0.14)] sm:bottom-4 sm:left-4 sm:translate-x-0">
        {multipleSelection ? (
          <>
            <span className="whitespace-nowrap px-2 text-xs font-semibold text-[#FF634A]">
              {selectedElements.length} seleccionados
            </span>

            <div className="mx-1 h-5 w-px bg-slate-200" />

            <button
              type="button"
              onClick={() =>
                setSaveComponentOpen(
                  true,
                )
              }
              className="flex h-8 items-center gap-2 rounded-lg bg-[#FFF4F1] px-2.5 text-xs font-semibold text-[#FF634A] transition hover:bg-[#FFE8E2]"
              aria-label="Guardar como componente"
              title="Guardar como componente"
            >
              <Boxes size={15} />

              <span className="hidden sm:inline">
                Guardar componente
              </span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() =>
              duplicateElement(
                primaryElement.id,
              )
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Duplicar elemento"
            title="Duplicar"
          >
            <Copy size={16} />
          </button>
        )}

        <button
          type="button"
          onClick={
            handleToggleLock
          }
          className={[
            "flex h-8 w-8 items-center justify-center rounded-lg transition",
            allLocked
              ? "bg-[#FFF4F1] text-[#FF634A]"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          ].join(" ")}
          aria-label={
            allLocked
              ? "Desbloquear selección"
              : "Bloquear selección"
          }
          title={
            allLocked
              ? "Desbloquear"
              : "Bloquear"
          }
        >
          {allLocked ? (
            <Lock size={16} />
          ) : (
            <Unlock size={16} />
          )}
        </button>

        {!multipleSelection ? (
          <>
            <div className="mx-1 h-5 w-px bg-slate-200" />

            <button
              type="button"
              onClick={() =>
                sendToBack(
                  primaryElement.id,
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Enviar al fondo"
              title="Enviar al fondo"
            >
              <ArrowDownToLine size={16} />
            </button>

            <button
              type="button"
              onClick={() =>
                bringToFront(
                  primaryElement.id,
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Traer al frente"
              title="Traer al frente"
            >
              <ArrowUpToLine size={16} />
            </button>
          </>
        ) : null}

        <div className="mx-1 h-5 w-px bg-slate-200" />

        <button
          type="button"
          onClick={
            handleDelete
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          aria-label={
            multipleSelection
              ? "Eliminar selección"
              : "Eliminar elemento"
          }
          title="Eliminar"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <SaveComponentModal
        open={
          saveComponentOpen
        }
        onClose={() =>
          setSaveComponentOpen(
            false,
          )
        }
      />
    </>
  );
}
