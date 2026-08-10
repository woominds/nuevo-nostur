import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ImagePlus,
  Italic,
  Lock,
  Unlock,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  EditorSelect,
} from "../ui/EditorSelect";

import {
  ResourceLibraryModal,
} from "../ResourceLibraryModal/ResourceLibraryModal";

import {
  usePresupuestoEditorStore,
} from "../../store/presupuestoEditorStore";

import type {
  EditorImageFit,
  EditorShapeType,
  EditorTextAlign,
} from "../../types/editor.types";

import type {
  PresupuestoRecurso,
} from "../../services/presupuestoRecursosService";

const fontOptions = [
  {
    value: "Open Sans",
    label: "Open Sans",
  },
  {
    value: "Inter",
    label: "Inter",
  },
  {
    value: "Arial",
    label: "Arial",
  },
  {
    value: "Georgia",
    label: "Georgia",
  },
  {
    value: "Times New Roman",
    label: "Times New Roman",
  },
  {
    value: "Montserrat",
    label: "Montserrat",
  },
  {
    value: "Poppins",
    label: "Poppins",
  },
];

const imageFitOptions: Array<{
  value: EditorImageFit;
  label: string;
}> = [
  {
    value: "cover",
    label: "Cubrir",
  },
  {
    value: "contain",
    label: "Contener",
  },
];

const shapeOptions: Array<{
  value: EditorShapeType;
  label: string;
}> = [
  {
    value: "rectangle",
    label: "Rectángulo",
  },
  {
    value: "rounded-rectangle",
    label: "Rectángulo redondeado",
  },
  {
    value: "circle",
    label: "Círculo / óvalo",
  },
  {
    value: "pill",
    label: "Píldora",
  },
  {
    value: "triangle",
    label: "Triángulo",
  },
  {
    value: "diamond",
    label: "Rombo",
  },
  {
    value: "star",
    label: "Estrella",
  },
  {
    value: "line",
    label: "Línea",
  },
];

const toNumber = (
  value: string,
  fallback = 0,
): number => {
  const parsedValue =
    Number(value);

  return Number.isFinite(
    parsedValue,
  )
    ? parsedValue
    : fallback;
};

export function PropertiesPanel() {
  const [
    resourceLibraryOpen,
    setResourceLibraryOpen,
  ] = useState(false);

  const document =
    usePresupuestoEditorStore(
      (state) => state.document,
    );

  const selectedElementId =
    usePresupuestoEditorStore(
      (state) =>
        state.selectedElementId,
    );

  const updateElement =
    usePresupuestoEditorStore(
      (state) =>
        state.updateElement,
    );

  const toggleElementLock =
    usePresupuestoEditorStore(
      (state) =>
        state.toggleElementLock,
    );

  const setActivePanel =
    usePresupuestoEditorStore(
      (state) =>
        state.setActivePanel,
    );

  const selectedElement =
    document?.elements.find(
      (element) =>
        element.id ===
        selectedElementId,
    ) ?? null;

  const handleReplaceImage = (
    recurso: PresupuestoRecurso,
  ) => {
    const currentState =
      usePresupuestoEditorStore.getState();

    const currentDocument =
      currentState.document;

    const currentElement =
      currentDocument?.elements.find(
        (element) =>
          element.id ===
          currentState.selectedElementId,
      );

    if (
      !currentElement ||
      currentElement.type !== "image"
    ) {
      return;
    }

    currentState.updateElement(
      currentElement.id,
      {
        src:
          recurso.archivoUrl,

        alt:
          recurso.nombre,

        name:
          recurso.nombre,
      },
    );
  };

  if (!selectedElement) {
    return (
      <aside className="absolute inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-[-12px_0_30px_rgba(15,23,42,0.08)] sm:w-80">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4">
          <p className="text-sm font-semibold text-slate-900">
            Propiedades
          </p>

          <button
            type="button"
            onClick={() =>
              setActivePanel(null)
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cerrar propiedades"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div>
            <p className="text-sm font-medium text-slate-800">
              No hay elementos seleccionados
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Seleccioná un elemento del lienzo.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const shapeAllowsRadius =
    selectedElement.type ===
      "shape" &&
    (
      selectedElement.shape ===
        "rectangle" ||
      selectedElement.shape ===
        "rounded-rectangle"
    );

  return (
    <>
      <aside className="absolute inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-[-12px_0_30px_rgba(15,23,42,0.08)] sm:w-80">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              Propiedades
            </p>

            <p className="truncate text-xs text-slate-500">
              {selectedElement.name}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setActivePanel(null)
            }
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cerrar propiedades"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="space-y-5">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Posición y tamaño
                </span>

                <button
                  type="button"
                  onClick={() =>
                    toggleElementLock(
                      selectedElement.id,
                    )
                  }
                  className={[
                    "flex h-8 items-center gap-2 rounded-lg border px-2 text-xs font-medium transition",
                    selectedElement.locked
                      ? "border-[#FF634A] bg-[#FFF4F1] text-[#FF634A]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {selectedElement.locked ? (
                    <Lock size={14} />
                  ) : (
                    <Unlock size={14} />
                  )}

                  {selectedElement.locked
                    ? "Bloqueado"
                    : "Desbloqueado"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-2 block text-xs font-medium text-slate-600">
                    X
                  </span>

                  <input
                    type="number"
                    value={Math.round(
                      selectedElement.x,
                    )}
                    disabled={
                      selectedElement.locked
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          x: Math.max(
                            0,
                            toNumber(
                              event.target.value,
                            ),
                          ),
                        },
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#FF634A] disabled:bg-slate-100"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-xs font-medium text-slate-600">
                    Y
                  </span>

                  <input
                    type="number"
                    value={Math.round(
                      selectedElement.y,
                    )}
                    disabled={
                      selectedElement.locked
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          y: Math.max(
                            0,
                            toNumber(
                              event.target.value,
                            ),
                          ),
                        },
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#FF634A] disabled:bg-slate-100"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-xs font-medium text-slate-600">
                    Ancho
                  </span>

                  <input
                    type="number"
                    min={10}
                    value={Math.round(
                      selectedElement.width,
                    )}
                    disabled={
                      selectedElement.locked
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          width: Math.max(
                            10,
                            toNumber(
                              event.target.value,
                              10,
                            ),
                          ),
                        },
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#FF634A] disabled:bg-slate-100"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-xs font-medium text-slate-600">
                    Alto
                  </span>

                  <input
                    type="number"
                    min={10}
                    value={Math.round(
                      selectedElement.height,
                    )}
                    disabled={
                      selectedElement.locked
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          height: Math.max(
                            10,
                            toNumber(
                              event.target.value,
                              10,
                            ),
                          ),
                        },
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#FF634A] disabled:bg-slate-100"
                  />
                </label>
              </div>

              <label className="mt-3 block">
                <span className="mb-2 flex justify-between text-xs font-medium text-slate-600">
                  Rotación

                  <span>
                    {Math.round(
                      selectedElement.rotation,
                    )}
                    °
                  </span>
                </span>

                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={
                    selectedElement.rotation
                  }
                  disabled={
                    selectedElement.locked
                  }
                  onChange={(event) =>
                    updateElement(
                      selectedElement.id,
                      {
                        rotation:
                          toNumber(
                            event.target.value,
                          ),
                      },
                    )
                  }
                  className="w-full accent-[#FF634A] disabled:opacity-40"
                />
              </label>

              <label className="mt-3 block">
                <span className="mb-2 flex justify-between text-xs font-medium text-slate-600">
                  Opacidad

                  <span>
                    {Math.round(
                      selectedElement.opacity *
                        100,
                    )}
                    %
                  </span>
                </span>

                <input
                  type="range"
                  min={10}
                  max={100}
                  value={
                    selectedElement.opacity *
                    100
                  }
                  onChange={(event) =>
                    updateElement(
                      selectedElement.id,
                      {
                        opacity:
                          toNumber(
                            event.target.value,
                            100,
                          ) / 100,
                      },
                    )
                  }
                  className="w-full accent-[#FF634A]"
                />
              </label>
            </section>

            <div className="h-px bg-slate-200" />

            {selectedElement.type ===
              "text" ? (
              <section className="space-y-5">
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Texto
                </span>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-600">
                    Contenido
                  </span>

                  <textarea
                    value={
                      selectedElement.content
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          content:
                            event.target.value,
                        },
                      )
                    }
                    rows={5}
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#FF634A]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-600">
                    Fuente
                  </span>

                  <EditorSelect
                    value={
                      selectedElement.fontFamily
                    }
                    options={
                      fontOptions
                    }
                    onChange={(value) =>
                      updateElement(
                        selectedElement.id,
                        {
                          fontFamily:
                            value,
                        },
                      )
                    }
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <span className="mb-2 block text-xs font-medium text-slate-600">
                      Tamaño
                    </span>

                    <input
                      type="number"
                      min={8}
                      max={200}
                      value={
                        selectedElement.fontSize
                      }
                      onChange={(event) =>
                        updateElement(
                          selectedElement.id,
                          {
                            fontSize:
                              Math.max(
                                8,
                                toNumber(
                                  event.target.value,
                                  8,
                                ),
                              ),
                          },
                        )
                      }
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#FF634A]"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-medium text-slate-600">
                      Color
                    </span>

                    <input
                      type="color"
                      value={
                        selectedElement.color
                      }
                      onChange={(event) =>
                        updateElement(
                          selectedElement.id,
                          {
                            color:
                              event.target.value,
                          },
                        )
                      }
                      className="h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                    />
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateElement(
                        selectedElement.id,
                        {
                          fontWeight:
                            selectedElement.fontWeight >=
                            700
                              ? 400
                              : 700,
                        },
                      )
                    }
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-lg border",
                      selectedElement.fontWeight >=
                      700
                        ? "border-[#FF634A] bg-[#FFF4F1] text-[#FF634A]"
                        : "border-slate-200 text-slate-600",
                    ].join(" ")}
                    aria-label="Negrita"
                  >
                    <Bold size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateElement(
                        selectedElement.id,
                        {
                          fontStyle:
                            selectedElement.fontStyle ===
                            "italic"
                              ? "normal"
                              : "italic",
                        },
                      )
                    }
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-lg border",
                      selectedElement.fontStyle ===
                      "italic"
                        ? "border-[#FF634A] bg-[#FFF4F1] text-[#FF634A]"
                        : "border-slate-200 text-slate-600",
                    ].join(" ")}
                    aria-label="Cursiva"
                  >
                    <Italic size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      {
                        value: "left",
                        icon: AlignLeft,
                      },
                      {
                        value: "center",
                        icon: AlignCenter,
                      },
                      {
                        value: "right",
                        icon: AlignRight,
                      },
                    ] as {
                      value: EditorTextAlign;
                      icon: typeof AlignLeft;
                    }[]
                  ).map(
                    ({
                      value,
                      icon: Icon,
                    }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          updateElement(
                            selectedElement.id,
                            {
                              textAlign:
                                value,
                            },
                          )
                        }
                        className={[
                          "flex h-9 items-center justify-center rounded-lg border",
                          selectedElement.textAlign ===
                          value
                            ? "border-[#FF634A] bg-[#FFF4F1] text-[#FF634A]"
                            : "border-slate-200 text-slate-600",
                        ].join(" ")}
                        aria-label={`Alinear ${value}`}
                      >
                        <Icon size={16} />
                      </button>
                    ),
                  )}
                </div>
              </section>
            ) : null}

            {selectedElement.type ===
              "image" ? (
              <section className="space-y-5">
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Imagen
                </span>

                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  <div className="aspect-[4/3]">
                    <img
                      src={
                        selectedElement.src
                      }
                      alt={
                        selectedElement.alt
                      }
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setResourceLibraryOpen(
                      true,
                    )
                  }
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 transition hover:border-[#FF634A] hover:bg-[#FFF8F6] hover:text-[#FF634A]"
                >
                  <ImagePlus size={17} />

                  Reemplazar desde biblioteca
                </button>

                <p className="-mt-3 text-xs leading-5 text-slate-400">
                  Conserva posición, tamaño, rotación, recorte y orden de capa.
                </p>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-600">
                    Ajuste
                  </span>

                  <EditorSelect
                    value={
                      selectedElement.fit
                    }
                    options={
                      imageFitOptions
                    }
                    onChange={(value) =>
                      updateElement(
                        selectedElement.id,
                        {
                          fit: value,
                        },
                      )
                    }
                  />
                </label>

                <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Mantener proporción
                    </p>

                    <p className="text-xs text-slate-500">
                      Conserva la relación al escalar.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={
                      selectedElement.maintainAspectRatio
                    }
                    onClick={() =>
                      updateElement(
                        selectedElement.id,
                        {
                          maintainAspectRatio:
                            !selectedElement.maintainAspectRatio,
                        },
                      )
                    }
                    className={[
                      "relative h-6 w-11 shrink-0 rounded-full transition",
                      selectedElement.maintainAspectRatio
                        ? "bg-[#FF634A]"
                        : "bg-slate-300",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition",
                        selectedElement.maintainAspectRatio
                          ? "left-6"
                          : "left-1",
                      ].join(" ")}
                    />
                  </button>
                </label>

                <label className="block">
                  <span className="mb-2 flex justify-between text-xs font-medium text-slate-600">
                    Zoom de imagen

                    <span>
                      {Math.round(
                        (
                          selectedElement.cropZoom ??
                          1
                        ) * 100,
                      )}
                      %
                    </span>
                  </span>

                  <input
                    type="range"
                    min={100}
                    max={300}
                    step={5}
                    value={
                      (
                        selectedElement.cropZoom ??
                        1
                      ) * 100
                    }
                    disabled={
                      selectedElement.fit ===
                      "contain"
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          cropZoom:
                            toNumber(
                              event.target.value,
                              100,
                            ) / 100,
                        },
                      )
                    }
                    className="w-full accent-[#FF634A] disabled:opacity-40"
                  />

                  {selectedElement.fit ===
                  "contain" ? (
                    <p className="mt-1 text-xs text-slate-400">
                      El zoom está disponible con el ajuste Cubrir.
                    </p>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 flex justify-between text-xs font-medium text-slate-600">
                    Posición horizontal

                    <span>
                      {
                        selectedElement.positionX
                      }
                      %
                    </span>
                  </span>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={
                      selectedElement.positionX
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          positionX:
                            toNumber(
                              event.target.value,
                            ),
                        },
                      )
                    }
                    className="w-full accent-[#FF634A]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex justify-between text-xs font-medium text-slate-600">
                    Posición vertical

                    <span>
                      {
                        selectedElement.positionY
                      }
                      %
                    </span>
                  </span>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={
                      selectedElement.positionY
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          positionY:
                            toNumber(
                              event.target.value,
                            ),
                        },
                      )
                    }
                    className="w-full accent-[#FF634A]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-600">
                    Radio de borde
                  </span>

                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={
                      selectedElement.borderRadius
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          borderRadius:
                            Math.max(
                              0,
                              toNumber(
                                event.target.value,
                              ),
                            ),
                        },
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#FF634A]"
                  />
                </label>
              </section>
            ) : null}

            {selectedElement.type ===
              "shape" ? (
              <section className="space-y-5">
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Forma
                </span>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-600">
                    Tipo
                  </span>

                  <EditorSelect
                    value={
                      selectedElement.shape
                    }
                    options={
                      shapeOptions
                    }
                    onChange={(value) =>
                      updateElement(
                        selectedElement.id,
                        {
                          shape: value,

                          borderRadius:
                            value ===
                            "rounded-rectangle"
                              ? Math.max(
                                  selectedElement.borderRadius,
                                  24,
                                )
                              : value ===
                                  "pill"
                                ? 999
                                : selectedElement.borderRadius,

                          borderWidth:
                            value ===
                            "line"
                              ? Math.max(
                                  selectedElement.borderWidth,
                                  4,
                                )
                              : selectedElement.borderWidth,
                        },
                      )
                    }
                  />
                </label>

                {selectedElement.shape !==
                "line" ? (
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-slate-600">
                      Fondo
                    </span>

                    <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2">
                      <input
                        type="color"
                        value={
                          selectedElement.backgroundColor
                        }
                        onChange={(event) =>
                          updateElement(
                            selectedElement.id,
                            {
                              backgroundColor:
                                event.target.value,
                            },
                          )
                        }
                        className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                      />

                      <input
                        type="text"
                        value={
                          selectedElement.backgroundColor
                        }
                        onChange={(event) =>
                          updateElement(
                            selectedElement.id,
                            {
                              backgroundColor:
                                event.target.value,
                            },
                          )
                        }
                        className="min-w-0 flex-1 bg-transparent text-xs font-medium uppercase text-slate-600 outline-none"
                      />
                    </div>
                  </label>
                ) : null}

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-600">
                    {selectedElement.shape ===
                    "line"
                      ? "Color de línea"
                      : "Color de borde"}
                  </span>

                  <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2">
                    <input
                      type="color"
                      value={
                        selectedElement.borderColor
                      }
                      onChange={(event) =>
                        updateElement(
                          selectedElement.id,
                          {
                            borderColor:
                              event.target.value,
                          },
                        )
                      }
                      className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                    />

                    <input
                      type="text"
                      value={
                        selectedElement.borderColor
                      }
                      onChange={(event) =>
                        updateElement(
                          selectedElement.id,
                          {
                            borderColor:
                              event.target.value,
                          },
                        )
                      }
                      className="min-w-0 flex-1 bg-transparent text-xs font-medium uppercase text-slate-600 outline-none"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-600">
                    {selectedElement.shape ===
                    "line"
                      ? "Grosor de línea"
                      : "Grosor de borde"}
                  </span>

                  <input
                    type="number"
                    min={
                      selectedElement.shape ===
                      "line"
                        ? 1
                        : 0
                    }
                    max={40}
                    value={
                      selectedElement.borderWidth
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          borderWidth:
                            Math.max(
                              selectedElement.shape ===
                              "line"
                                ? 1
                                : 0,
                              toNumber(
                                event.target.value,
                              ),
                            ),
                        },
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#FF634A]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-600">
                    Radio de borde
                  </span>

                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={
                      !shapeAllowsRadius
                    }
                    value={
                      selectedElement.borderRadius
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          borderRadius:
                            Math.max(
                              0,
                              toNumber(
                                event.target.value,
                              ),
                            ),
                        },
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#FF634A] disabled:bg-slate-100 disabled:text-slate-400"
                  />

                  {!shapeAllowsRadius ? (
                    <p className="mt-1 text-xs text-slate-400">
                      Esta forma no utiliza radio de borde.
                    </p>
                  ) : null}
                </label>
              </section>
            ) : null}
          </div>
        </div>
      </aside>

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
          handleReplaceImage
        }
      />
    </>
  );
}

export default PropertiesPanel;
