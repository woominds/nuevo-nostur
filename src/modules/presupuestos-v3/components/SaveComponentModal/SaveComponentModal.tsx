import {
  Boxes,
  Loader2,
  Save,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  EditorSelect,
} from "../ui/EditorSelect";

import {
  usePresupuestoComponentes,
} from "../../hooks/usePresupuestoComponentes";

import {
  usePresupuestoEditorStore,
} from "../../store/presupuestoEditorStore";

import type {
  EditorElement,
  PresupuestoComponenteCategoria,
  PresupuestoComponenteVisibilidad,
} from "../../types/editor.types";

type SaveComponentModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

type ComponentDraft = {
  nombre: string;
  descripcion: string;
  categoria: PresupuestoComponenteCategoria;
  etiquetas: string;
  visibilidad: PresupuestoComponenteVisibilidad;
};

const CATEGORY_OPTIONS: Array<{
  value: PresupuestoComponenteCategoria;
  label: string;
}> = [
  {
    value: "encabezados",
    label: "Encabezados",
  },
  {
    value: "pies",
    label: "Pies de página",
  },
  {
    value: "incluye",
    label: "Incluye",
  },
  {
    value: "no-incluye",
    label: "No incluye",
  },
  {
    value: "hoteles",
    label: "Hoteles",
  },
  {
    value: "vuelos",
    label: "Vuelos",
  },
  {
    value: "cruceros",
    label: "Cruceros",
  },
  {
    value: "precios",
    label: "Precios",
  },
  {
    value: "contacto",
    label: "Contacto",
  },
  {
    value: "sellos",
    label: "Sellos",
  },
  {
    value: "llamadas",
    label: "Llamadas a la acción",
  },
  {
    value: "otros",
    label: "Otros",
  },
];

const VISIBILITY_OPTIONS: Array<{
  value: PresupuestoComponenteVisibilidad;
  label: string;
}> = [
  {
    value: "personal",
    label: "Solo para mí",
  },
  {
    value: "empresa",
    label: "Todo el equipo",
  },
];

function calculateSelectionBounds(
  elements: EditorElement[],
) {
  if (elements.length === 0) {
    return {
      minX: 0,
      minY: 0,
      width: 0,
      height: 0,
    };
  }

  const minX =
    Math.min(
      ...elements.map(
        (element) =>
          element.x,
      ),
    );

  const minY =
    Math.min(
      ...elements.map(
        (element) =>
          element.y,
      ),
    );

  const maxX =
    Math.max(
      ...elements.map(
        (element) =>
          element.x +
          element.width,
      ),
    );

  const maxY =
    Math.max(
      ...elements.map(
        (element) =>
          element.y +
          element.height,
      ),
    );

  return {
    minX,
    minY,

    width:
      Math.max(
        1,
        maxX - minX,
      ),

    height:
      Math.max(
        1,
        maxY - minY,
      ),
  };
}

function normalizeSelectedElements(
  elements: EditorElement[],
): {
  elements: EditorElement[];
  bounds: {
    width: number;
    height: number;
  };
} {
  const selectionBounds =
    calculateSelectionBounds(
      elements,
    );

  const minimumZIndex =
    Math.min(
      ...elements.map(
        (element) =>
          element.zIndex,
      ),
    );

  const normalizedElements =
    elements
      .map(
        (
          element,
        ): EditorElement => ({
          ...element,

          x:
            element.x -
            selectionBounds.minX,

          y:
            element.y -
            selectionBounds.minY,

          zIndex:
            element.zIndex -
            minimumZIndex +
            1,
        }),
      )
      .sort(
        (
          firstElement,
          secondElement,
        ) =>
          firstElement.zIndex -
          secondElement.zIndex,
      );

  return {
    elements:
      normalizedElements,

    bounds: {
      width:
        selectionBounds.width,

      height:
        selectionBounds.height,
    },
  };
}

function getElementTypeLabel(
  element: EditorElement,
): string {
  if (
    element.type === "text"
  ) {
    return "Texto";
  }

  if (
    element.type === "image"
  ) {
    return "Imagen";
  }

  return "Forma";
}

export function SaveComponentModal({
  open,
  onClose,
  onSaved,
}: SaveComponentModalProps) {
  const [
    draft,
    setDraft,
  ] = useState<ComponentDraft>({
    nombre: "",
    descripcion: "",
    categoria: "otros",
    etiquetas: "",
    visibilidad: "personal",
  });

  const getSelectedElements =
    usePresupuestoEditorStore(
      (state) =>
        state.getSelectedElements,
    );

  const selectedElementIds =
    usePresupuestoEditorStore(
      (state) =>
        state.selectedElementIds,
    );

  const {
    saving,
    error,
    createComponent,
    clearError,
  } = usePresupuestoComponentes();

  const selectedElements =
    useMemo(
      () =>
        open
          ? getSelectedElements()
          : [],
      [
        getSelectedElements,
        open,
        selectedElementIds,
      ],
    );

  const normalizedSelection =
    useMemo(
      () =>
        normalizeSelectedElements(
          selectedElements,
        ),
      [
        selectedElements,
      ],
    );

  useEffect(() => {
    if (!open) {
      return;
    }

    clearError();

    setDraft({
      nombre: "",
      descripcion: "",
      categoria: "otros",
      etiquetas: "",
      visibilidad: "personal",
    });
  }, [
    clearError,
    open,
  ]);

  if (!open) {
    return null;
  }

  const canSave =
    selectedElements.length >= 2 &&
    draft.nombre.trim().length > 0 &&
    !saving;

  const handleSave =
    async () => {
      if (!canSave) {
        return;
      }

      const component =
        await createComponent({
          nombre:
            draft.nombre,

          descripcion:
            draft.descripcion,

          categoria:
            draft.categoria,

          etiquetas:
            draft.etiquetas
              .split(",")
              .map((tag) =>
                tag.trim(),
              )
              .filter(Boolean),

          visibilidad:
            draft.visibilidad,

          bounds:
            normalizedSelection.bounds,

          elements:
            normalizedSelection.elements,

          thumbnailDataUrl:
            null,
        });

      if (!component) {
        return;
      }

      onSaved?.();
      onClose();
    };

  return (
    <div
      className="fixed inset-0 z-[470] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[3px] sm:p-6"
      onMouseDown={() => {
        if (!saving) {
          onClose();
        }
      }}
    >
      <section
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_32px_110px_rgba(15,23,42,0.34)]"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="flex shrink-0 items-start justify-between gap-5 border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF4F1] text-[#FF634A]">
              <Boxes size={20} />
            </span>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#172033]">
                Guardar como componente
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Guardá este bloque para reutilizarlo en otros presupuestos.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
            aria-label="Cerrar"
          >
            <X size={19} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#172033]">
                    Selección
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedElements.length} elementos
                  </p>
                </div>

                <span className="rounded-lg bg-[#FFF4F1] px-2.5 py-1 text-xs font-semibold text-[#FF634A]">
                  {Math.round(
                    normalizedSelection.bounds.width,
                  )}
                  {" × "}
                  {Math.round(
                    normalizedSelection.bounds.height,
                  )}
                </span>
              </div>

              <div className="mt-4 grid max-h-[350px] gap-2 overflow-y-auto">
                {selectedElements.map(
                  (
                    element,
                    index,
                  ) => (
                    <div
                      key={
                        element.id
                      }
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-semibold text-slate-500 shadow-sm">
                        {index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {
                            element.name
                          }
                        </p>

                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {getElementTypeLabel(
                            element,
                          )}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-400">
                Al insertarlo nuevamente, todos los elementos conservarán sus posiciones relativas y seguirán siendo editables.
              </p>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-slate-600">
                    Nombre del componente
                  </span>

                  <input
                    type="text"
                    value={
                      draft.nombre
                    }
                    onChange={(event) =>
                      setDraft(
                        (current) => ({
                          ...current,
                          nombre:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="Ej. Tarjeta hotel premium"
                    autoFocus
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A] focus:ring-2 focus:ring-[#FF634A]/10"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-slate-600">
                      Categoría
                    </span>

                    <EditorSelect
                      value={
                        draft.categoria
                      }
                      options={
                        CATEGORY_OPTIONS
                      }
                      onChange={(value) =>
                        setDraft(
                          (current) => ({
                            ...current,
                            categoria:
                              value,
                          }),
                        )
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-slate-600">
                      Visibilidad
                    </span>

                    <EditorSelect
                      value={
                        draft.visibilidad
                      }
                      options={
                        VISIBILITY_OPTIONS
                      }
                      onChange={(value) =>
                        setDraft(
                          (current) => ({
                            ...current,
                            visibilidad:
                              value,
                          }),
                        )
                      }
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-slate-600">
                    Etiquetas
                  </span>

                  <input
                    type="text"
                    value={
                      draft.etiquetas
                    }
                    onChange={(event) =>
                      setDraft(
                        (current) => ({
                          ...current,
                          etiquetas:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="hotel, premium, precio"
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
                  />

                  <p className="mt-1 text-[11px] text-slate-400">
                    Separadas por comas.
                  </p>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-slate-600">
                    Descripción
                  </span>

                  <textarea
                    value={
                      draft.descripcion
                    }
                    onChange={(event) =>
                      setDraft(
                        (current) => ({
                          ...current,
                          descripcion:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="Descripción opcional del bloque..."
                    className="min-h-[110px] w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm leading-5 text-slate-900 outline-none transition focus:border-[#FF634A] focus:ring-2 focus:ring-[#FF634A]/10"
                  />
                </label>
              </div>

              {error ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </section>
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={!canSave}
            onClick={() =>
              void handleSave()
            }
            className="flex h-10 items-center gap-2 rounded-lg bg-[#FF634A] px-5 text-sm font-semibold text-white transition hover:bg-[#f0543d] disabled:cursor-not-allowed disabled:bg-[#FFB7AB]"
          >
            {saving ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Save size={16} />
            )}

            {saving
              ? "Guardando..."
              : "Guardar componente"}
          </button>
        </footer>
      </section>
    </div>
  );
}
