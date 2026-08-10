import {
  Boxes,
  Building2,
  Check,
  Edit3,
  Loader2,
  MoreVertical,
  Search,
  Trash2,
  UserRound,
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
  EditorTextElement,
  PresupuestoComponente,
  PresupuestoComponenteCategoria,
  PresupuestoComponenteVisibilidad,
} from "../../types/editor.types";

type ComponentLibraryModalProps = {
  open: boolean;
  onClose: () => void;
};

type ComponentScope =
  | "todos"
  | "personales"
  | "empresa";

type CategoryFilter =
  | PresupuestoComponenteCategoria
  | "todos";

type ComponentOrder =
  | "recent"
  | "used"
  | "name";

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

const CATEGORY_FILTER_OPTIONS: Array<{
  value: CategoryFilter;
  label: string;
}> = [
  {
    value: "todos",
    label: "Todas las categorías",
  },
  ...CATEGORY_OPTIONS,
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

const ORDER_OPTIONS: Array<{
  value: ComponentOrder;
  label: string;
}> = [
  {
    value: "recent",
    label: "Más recientes",
  },
  {
    value: "used",
    label: "Más utilizados",
  },
  {
    value: "name",
    label: "Nombre A–Z",
  },
];

function cloneElements(
  elements: EditorElement[],
): EditorElement[] {
  return elements.map(
    (element) => ({
      ...element,
    }),
  );
}

function getComponentVariables(
  component: PresupuestoComponente,
): string[] {
  const variables =
    new Set<string>();

  component.elements.forEach(
    (element) => {
      if (
        element.type !== "text"
      ) {
        return;
      }

      const matches =
        element.content.matchAll(
          /\{\{\s*([^{}]+?)\s*\}\}/g,
        );

      for (const match of matches) {
        const variable =
          String(
            match[1] ?? "",
          )
            .trim()
            .toUpperCase();

        if (variable) {
          variables.add(
            variable,
          );
        }
      }
    },
  );

  return Array.from(
    variables,
  );
}

function replaceVariables(
  component: PresupuestoComponente,
  values: Record<string, string>,
): PresupuestoComponente {
  return {
    ...component,

    elements:
      cloneElements(
        component.elements,
      ).map(
        (
          element,
        ): EditorElement => {
          if (
            element.type !== "text"
          ) {
            return element;
          }

          const textElement =
            element as EditorTextElement;

          const content =
            textElement.content.replace(
              /\{\{\s*([^{}]+?)\s*\}\}/g,
              (
                original,
                variableName: string,
              ) => {
                const normalizedName =
                  String(
                    variableName,
                  )
                    .trim()
                    .toUpperCase();

                const replacement =
                  values[
                    normalizedName
                  ];

                return replacement?.trim()
                  ? replacement
                  : original;
              },
            );

          return {
            ...textElement,
            content,
          };
        },
      ),
  };
}

function formatCategory(
  category: PresupuestoComponenteCategoria,
): string {
  return (
    CATEGORY_OPTIONS.find(
      (option) =>
        option.value ===
        category,
    )?.label ??
    category
  );
}

function createComponentDraft(
  component: PresupuestoComponente,
): ComponentDraft {
  return {
    nombre:
      component.name,

    descripcion:
      component.description,

    categoria:
      component.category,

    etiquetas:
      component.tags.join(
        ", ",
      ),

    visibilidad:
      component.visibility,
  };
}

export function ComponentLibraryModal({
  open,
  onClose,
}: ComponentLibraryModalProps) {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState<CategoryFilter>(
    "todos",
  );

  const [
    scope,
    setScope,
  ] = useState<ComponentScope>(
    "todos",
  );

  const [
    order,
    setOrder,
  ] = useState<ComponentOrder>(
    "recent",
  );

  const [
    selectedComponentId,
    setSelectedComponentId,
  ] = useState<string | null>(
    null,
  );

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState<string | null>(
    null,
  );

  const [
    editingComponent,
    setEditingComponent,
  ] = useState<PresupuestoComponente | null>(
    null,
  );

  const [
    deletingComponent,
    setDeletingComponent,
  ] = useState<PresupuestoComponente | null>(
    null,
  );

  const [
    variableComponent,
    setVariableComponent,
  ] = useState<PresupuestoComponente | null>(
    null,
  );

  const [
    variableValues,
    setVariableValues,
  ] = useState<Record<string, string>>(
    {},
  );

  const [
    componentDraft,
    setComponentDraft,
  ] = useState<ComponentDraft>({
    nombre: "",
    descripcion: "",
    categoria: "otros",
    etiquetas: "",
    visibilidad: "personal",
  });

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(
    null,
  );

  const {
    componentes,
    loading,
    saving,
    error,
    refresh,
    updateComponent,
    deleteComponent,
    registerUsage,
    clearError,
  } = usePresupuestoComponentes();

  const insertComponent =
    usePresupuestoEditorStore(
      (state) =>
        state.insertComponent,
    );

  const selectedComponent =
    useMemo(
      () =>
        componentes.find(
          (component) =>
            component.id ===
            selectedComponentId,
        ) ?? null,
      [
        componentes,
        selectedComponentId,
      ],
    );

  const visibleComponents =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLocaleLowerCase(
            "es-AR",
          );

      let result =
        componentes.filter(
          (component) => {
            if (
              category !== "todos" &&
              component.category !==
                category
            ) {
              return false;
            }

            if (
              scope ===
                "personales" &&
              !component.canManage
            ) {
              return false;
            }

            if (
              scope === "empresa" &&
              component.visibility !==
                "empresa"
            ) {
              return false;
            }

            if (
              normalizedSearch
            ) {
              const haystack = [
                component.name,
                component.description,
                component.category,
                ...component.tags,
              ]
                .join(" ")
                .toLocaleLowerCase(
                  "es-AR",
                );

              if (
                !haystack.includes(
                  normalizedSearch,
                )
              ) {
                return false;
              }
            }

            return true;
          },
        );

      if (order === "used") {
        result = result.sort(
          (
            firstComponent,
            secondComponent,
          ) =>
            secondComponent.usageCount -
            firstComponent.usageCount,
        );
      } else if (
        order === "name"
      ) {
        result = result.sort(
          (
            firstComponent,
            secondComponent,
          ) =>
            firstComponent.name.localeCompare(
              secondComponent.name,
              "es-AR",
            ),
        );
      } else {
        result = result.sort(
          (
            firstComponent,
            secondComponent,
          ) =>
            new Date(
              secondComponent.updatedAt,
            ).getTime() -
            new Date(
              firstComponent.updatedAt,
            ).getTime(),
        );
      }

      return result;
    }, [
      category,
      componentes,
      order,
      scope,
      search,
    ]);

  const variableNames =
    useMemo(
      () =>
        variableComponent
          ? getComponentVariables(
              variableComponent,
            )
          : [],
      [
        variableComponent,
      ],
    );

  useEffect(() => {
    if (!open) {
      return;
    }

    clearError();
    setActionError(null);

    void refresh();
  }, [
    clearError,
    open,
    refresh,
  ]);

  useEffect(() => {
    if (open) {
      return;
    }

    setSearch("");
    setCategory("todos");
    setScope("todos");
    setOrder("recent");
    setSelectedComponentId(null);
    setOpenMenuId(null);
    setEditingComponent(null);
    setDeletingComponent(null);
    setVariableComponent(null);
    setVariableValues({});
    setActionError(null);
    clearError();
  }, [
    clearError,
    open,
  ]);

  if (!open) {
    return null;
  }

  const performInsert =
    async (
      component: PresupuestoComponente,
    ) => {
      insertComponent(
        component,
      );

      await registerUsage(
        component.id,
      );

      onClose();
    };

  const handleInsertRequest =
    () => {
      if (!selectedComponent) {
        return;
      }

      const variables =
        getComponentVariables(
          selectedComponent,
        );

      if (
        variables.length === 0
      ) {
        void performInsert(
          selectedComponent,
        );

        return;
      }

      setVariableComponent(
        selectedComponent,
      );

      setVariableValues(
        Object.fromEntries(
          variables.map(
            (variable) => [
              variable,
              "",
            ],
          ),
        ),
      );
    };

  const handleVariableInsert =
    async () => {
      if (!variableComponent) {
        return;
      }

      const preparedComponent =
        replaceVariables(
          variableComponent,
          variableValues,
        );

      await performInsert(
        preparedComponent,
      );
    };

  const handleEditRequest = (
    component: PresupuestoComponente,
  ) => {
    if (!component.canManage) {
      return;
    }

    setOpenMenuId(null);
    setActionError(null);

    setEditingComponent(
      component,
    );

    setComponentDraft(
      createComponentDraft(
        component,
      ),
    );
  };

  const handleEditSave =
    async () => {
      if (
        !editingComponent ||
        !componentDraft.nombre.trim() ||
        saving
      ) {
        return;
      }

      setActionError(null);

      const updated =
        await updateComponent(
          editingComponent.id,
          {
            nombre:
              componentDraft.nombre,

            descripcion:
              componentDraft.descripcion,

            categoria:
              componentDraft.categoria,

            etiquetas:
              componentDraft.etiquetas
                .split(",")
                .map((tag) =>
                  tag.trim(),
                )
                .filter(Boolean),

            visibilidad:
              componentDraft.visibilidad,
          },
        );

      if (!updated) {
        setActionError(
          "No se pudo guardar el componente.",
        );

        return;
      }

      setEditingComponent(null);
      setActionError(null);
    };

  const handleDeleteRequest = (
    component: PresupuestoComponente,
  ) => {
    if (!component.canManage) {
      return;
    }

    setOpenMenuId(null);
    setActionError(null);

    setDeletingComponent(
      component,
    );
  };

  const handleDeleteConfirm =
    async () => {
      if (
        !deletingComponent ||
        saving
      ) {
        return;
      }

      setActionError(null);

      const deleted =
        await deleteComponent(
          deletingComponent.id,
        );

      if (!deleted) {
        setActionError(
          "No se pudo eliminar el componente.",
        );

        return;
      }

      if (
        selectedComponentId ===
        deletingComponent.id
      ) {
        setSelectedComponentId(
          null,
        );
      }

      setDeletingComponent(null);
      setActionError(null);
    };

  return (
    <>
      <div
        className="fixed inset-0 z-[440] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[3px] sm:p-6"
        onMouseDown={onClose}
      >
        <section
          className="flex h-[min(900px,94dvh)] w-full max-w-7xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_32px_110px_rgba(15,23,42,0.34)]"
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          <header className="flex shrink-0 items-start justify-between gap-5 border-b border-slate-200 px-5 py-5 sm:px-7">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF4F1] text-[#FF634A]">
                <Boxes size={21} />
              </span>

              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-[#172033]">
                  Biblioteca de componentes
                </h2>

                <p className="mt-1.5 text-sm leading-5 text-slate-500">
                  Insertá bloques completos y editables dentro del presupuesto.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </header>

          <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-4 sm:px-7">
            <div className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_210px_180px_auto]">
              <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-[#FF634A] focus-within:ring-2 focus-within:ring-[#FF634A]/10">
                <Search
                  size={16}
                  className="shrink-0 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Buscar componente..."
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>

              <EditorSelect
                value={category}
                options={
                  CATEGORY_FILTER_OPTIONS
                }
                onChange={
                  setCategory
                }
              />

              <EditorSelect
                value={order}
                options={
                  ORDER_OPTIONS
                }
                onChange={
                  setOrder
                }
              />

              <div className="inline-flex w-fit rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setScope(
                      "todos",
                    )
                  }
                  className={[
                    "h-8 rounded-lg px-3 text-xs font-semibold transition",
                    scope === "todos"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800",
                  ].join(" ")}
                >
                  Todos
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setScope(
                      "personales",
                    )
                  }
                  className={[
                    "h-8 rounded-lg px-3 text-xs font-semibold transition",
                    scope ===
                    "personales"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800",
                  ].join(" ")}
                >
                  Míos
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setScope(
                      "empresa",
                    )
                  }
                  className={[
                    "h-8 rounded-lg px-3 text-xs font-semibold transition",
                    scope === "empresa"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800",
                  ].join(" ")}
                >
                  Empresa
                </button>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] px-5 py-5 sm:px-7">
            {loading ? (
              <div className="flex min-h-full items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Cargando componentes...
              </div>
            ) : error ? (
              <div className="flex min-h-full items-center justify-center">
                <div className="max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                  {error}
                </div>
              </div>
            ) : visibleComponents.length ===
              0 ? (
              <div className="flex min-h-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                <div>
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                    <Boxes size={25} />
                  </span>

                  <p className="mt-4 text-sm font-semibold text-slate-800">
                    No hay componentes disponibles
                  </p>

                  <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                    Seleccioná dos o más elementos con Shift + clic y elegí Guardar componente.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleComponents.map(
                  (component) => {
                    const selected =
                      component.id ===
                      selectedComponentId;

                    const menuOpen =
                      component.id ===
                      openMenuId;

                    const variables =
                      getComponentVariables(
                        component,
                      );

                    return (
                      <article
                        key={
                          component.id
                        }
                        className={[
                          "relative overflow-hidden rounded-lg border bg-white transition",
                          selected
                            ? "border-[#FF634A] shadow-[0_12px_35px_rgba(255,99,74,0.14)] ring-2 ring-[#FF634A]/15"
                            : "border-slate-200 hover:border-slate-300 hover:shadow-md",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedComponentId(
                              component.id,
                            )
                          }
                          className="block w-full text-left"
                        >
                          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-100">
                            {component.thumbnail ? (
                              <img
                                src={
                                  component.thumbnail
                                }
                                alt={
                                  component.name
                                }
                                draggable={false}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <div className="text-center text-slate-400">
                                <Boxes
                                  size={38}
                                  className="mx-auto"
                                />

                                <p className="mt-2 text-xs font-medium">
                                  {
                                    component.elements
                                      .length
                                  }{" "}
                                  elementos
                                </p>
                              </div>
                            )}

                            <span className="absolute left-2 top-2 inline-flex h-7 items-center gap-1 rounded-lg bg-white/95 px-2 text-[10px] font-semibold text-slate-600 shadow-sm backdrop-blur">
                              {component.visibility ===
                              "empresa" ? (
                                <Building2
                                  size={12}
                                />
                              ) : (
                                <UserRound
                                  size={12}
                                />
                              )}

                              {component.visibility ===
                              "empresa"
                                ? "Empresa"
                                : "Personal"}
                            </span>

                            {variables.length >
                            0 ? (
                              <span className="absolute bottom-2 left-2 rounded-lg bg-slate-900/80 px-2 py-1 text-[10px] font-semibold text-white">
                                {
                                  variables.length
                                }{" "}
                                {variables.length ===
                                1
                                  ? "variable"
                                  : "variables"}
                              </span>
                            ) : null}

                            {selected ? (
                              <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#FF634A] text-white shadow-md">
                                <Check
                                  size={18}
                                />
                              </span>
                            ) : null}
                          </div>

                          <div className="min-h-[118px] p-3">
                            <p className="truncate pr-7 text-sm font-semibold text-slate-900">
                              {
                                component.name
                              }
                            </p>

                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                              {component.description ||
                                "Sin descripción"}
                            </p>

                            <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.07em] text-slate-400">
                              <span className="truncate">
                                {formatCategory(
                                  component.category,
                                )}
                              </span>

                              <span className="shrink-0">
                                {
                                  component.usageCount
                                }{" "}
                                {component.usageCount ===
                                1
                                  ? "uso"
                                  : "usos"}
                              </span>
                            </div>
                          </div>
                        </button>

                        {component.canManage ? (
                          <div className="absolute bottom-3 right-3">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();

                                setOpenMenuId(
                                  menuOpen
                                    ? null
                                    : component.id,
                                );
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-black/10 transition hover:bg-slate-50 hover:text-slate-900"
                              aria-label="Administrar componente"
                            >
                              <MoreVertical
                                size={16}
                              />
                            </button>

                            {menuOpen ? (
                              <>
                                <button
                                  type="button"
                                  className="fixed inset-0 z-20 cursor-default bg-transparent"
                                  onClick={() =>
                                    setOpenMenuId(
                                      null,
                                    )
                                  }
                                  aria-label="Cerrar menú"
                                />

                                <div className="absolute bottom-10 right-0 z-30 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() =>
                                      handleEditRequest(
                                        component,
                                      )
                                    }
                                    className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
                                  >
                                    <Edit3
                                      size={14}
                                    />

                                    Editar datos
                                  </button>

                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() =>
                                      handleDeleteRequest(
                                        component,
                                      )
                                    }
                                    className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                                  >
                                    <Trash2
                                      size={14}
                                    />

                                    Eliminar
                                  </button>
                                </div>
                              </>
                            ) : null}
                          </div>
                        ) : null}
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </div>

          <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="min-w-0">
              {selectedComponent ? (
                <>
                  <p className="text-xs font-semibold text-slate-500">
                    Componente seleccionado
                  </p>

                  <p className="mt-0.5 truncate text-sm font-semibold text-[#172033]">
                    {
                      selectedComponent.name
                    }
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  Seleccioná un componente para insertarlo.
                </p>
              )}
            </div>

            <div className="flex shrink-0 justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  !selectedComponent
                }
                onClick={
                  handleInsertRequest
                }
                className="h-10 rounded-lg bg-[#FF634A] px-5 text-sm font-semibold text-white transition hover:bg-[#f0543d] disabled:cursor-not-allowed disabled:bg-[#FFB7AB]"
              >
                Insertar componente
              </button>
            </div>
          </footer>
        </section>
      </div>

      {variableComponent ? (
        <div
          className="fixed inset-0 z-[480] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]"
          onMouseDown={() => {
            setVariableComponent(
              null,
            );
            setVariableValues({});
          }}
        >
          <section
            className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.3)]"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Completar componente
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Los campos vacíos conservarán la variable original.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setVariableComponent(
                    null,
                  );
                  setVariableValues(
                    {},
                  );
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid gap-4">
                {variableNames.map(
                  (variable) => (
                    <label
                      key={variable}
                      className="block"
                    >
                      <span className="mb-2 block text-xs font-semibold text-slate-600">
                        {variable}
                      </span>

                      <input
                        type="text"
                        value={
                          variableValues[
                            variable
                          ] ?? ""
                        }
                        onChange={(event) =>
                          setVariableValues(
                            (current) => ({
                              ...current,

                              [variable]:
                                event.target
                                  .value,
                            }),
                          )
                        }
                        placeholder={`Completar ${variable.toLocaleLowerCase(
                          "es-AR",
                        )}`}
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A] focus:ring-2 focus:ring-[#FF634A]/10"
                      />
                    </label>
                  ),
                )}
              </div>
            </div>

            <footer className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setVariableComponent(
                    null,
                  );
                  setVariableValues(
                    {},
                  );
                }}
                className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleVariableInsert()
                }
                className="h-10 rounded-lg bg-[#FF634A] px-5 text-sm font-semibold text-white transition hover:bg-[#f0543d]"
              >
                Insertar componente
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {editingComponent ? (
        <div
          className="fixed inset-0 z-[490] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]"
          onMouseDown={() => {
            if (!saving) {
              setEditingComponent(
                null,
              );
              setActionError(null);
            }
          }}
        >
          <section
            className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.3)]"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Editar componente
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  El diseño guardado no será modificado.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setEditingComponent(
                    null,
                  );
                  setActionError(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-slate-600">
                    Nombre
                  </span>

                  <input
                    type="text"
                    value={
                      componentDraft.nombre
                    }
                    onChange={(event) =>
                      setComponentDraft(
                        (current) => ({
                          ...current,
                          nombre:
                            event.target.value,
                        }),
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-slate-600">
                      Categoría
                    </span>

                    <EditorSelect
                      value={
                        componentDraft.categoria
                      }
                      options={
                        CATEGORY_OPTIONS
                      }
                      onChange={(value) =>
                        setComponentDraft(
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
                        componentDraft.visibilidad
                      }
                      options={
                        VISIBILITY_OPTIONS
                      }
                      onChange={(value) =>
                        setComponentDraft(
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
                      componentDraft.etiquetas
                    }
                    onChange={(event) =>
                      setComponentDraft(
                        (current) => ({
                          ...current,
                          etiquetas:
                            event.target.value,
                        }),
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-slate-600">
                    Descripción
                  </span>

                  <textarea
                    value={
                      componentDraft.descripcion
                    }
                    onChange={(event) =>
                      setComponentDraft(
                        (current) => ({
                          ...current,
                          descripcion:
                            event.target.value,
                        }),
                      )
                    }
                    className="min-h-[110px] w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
                  />
                </label>
              </div>

              {actionError ||
              error ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {actionError ||
                    error}
                </div>
              ) : null}
            </div>

            <footer className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setEditingComponent(
                    null,
                  );
                  setActionError(null);
                }}
                className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  saving ||
                  !componentDraft.nombre.trim()
                }
                onClick={() =>
                  void handleEditSave()
                }
                className="flex h-10 items-center gap-2 rounded-lg bg-[#FF634A] px-5 text-sm font-semibold text-white transition hover:bg-[#f0543d] disabled:opacity-40"
              >
                {saving ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Edit3 size={16} />
                )}

                {saving
                  ? "Guardando..."
                  : "Guardar cambios"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {deletingComponent ? (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]"
          onMouseDown={() => {
            if (!saving) {
              setDeletingComponent(
                null,
              );
              setActionError(null);
            }
          }}
        >
          <section
            className="w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.3)]"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Eliminar componente
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Esta acción no modifica los presupuestos existentes.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setDeletingComponent(
                    null,
                  );
                  setActionError(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </header>

            <div className="p-5">
              <p className="text-sm leading-6 text-slate-700">
                ¿Eliminar el componente{" "}
                <strong>
                  {
                    deletingComponent.name
                  }
                </strong>
                ?
              </p>

              {actionError ||
              error ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {actionError ||
                    error}
                </div>
              ) : null}
            </div>

            <footer className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setDeletingComponent(
                    null,
                  );
                  setActionError(null);
                }}
                className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void handleDeleteConfirm()
                }
                className="flex h-10 items-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
              >
                {saving ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2 size={16} />
                )}

                {saving
                  ? "Eliminando..."
                  : "Eliminar componente"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
