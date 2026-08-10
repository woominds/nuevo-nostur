import {
  Check,
  LayoutTemplate,
  MoreVertical,
  Pencil,
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
  templateRegistry,
} from "../../templates/templateRegistry";

import type {
  PresupuestoTemplate,
} from "../../types/editor.types";

type TemplateSelectorProps = {
  open: boolean;
  templates: PresupuestoTemplate[];
  selectedTemplateId: string | null;
  onSelect: (
    templateId: string,
  ) => void;
  onConfirm: () => void;
  onClose: () => void;

  onRenameTemplate?: (
    templateId: string,
    name: string,
  ) => Promise<boolean>;

  onDeleteTemplate?: (
    templateId: string,
  ) => Promise<boolean>;

  managing?: boolean;
};

type TemplateFilter =
  | "all"
  | "system"
  | "saved";

export function TemplateSelector({
  open,
  templates,
  selectedTemplateId,
  onSelect,
  onConfirm,
  onClose,
  onRenameTemplate,
  onDeleteTemplate,
  managing = false,
}: TemplateSelectorProps) {
  const [
    filter,
    setFilter,
  ] = useState<TemplateFilter>(
    "all",
  );

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState<string | null>(
    null,
  );

  const [
    editingTemplate,
    setEditingTemplate,
  ] = useState<PresupuestoTemplate | null>(
    null,
  );

  const [
    editingName,
    setEditingName,
  ] = useState("");

  const [
    deletingTemplate,
    setDeletingTemplate,
  ] = useState<PresupuestoTemplate | null>(
    null,
  );

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!open) {
      setFilter("all");
      setOpenMenuId(null);
      setEditingTemplate(null);
      setEditingName("");
      setDeletingTemplate(null);
      setActionError(null);
    }
  }, [open]);

  const filteredTemplates =
    useMemo(() => {
      if (filter === "system") {
        return templates.filter(
          (template) =>
            templateRegistry.isSystemTemplate(
              template.id,
            ),
        );
      }

      if (filter === "saved") {
        return templates.filter(
          (template) =>
            !templateRegistry.isSystemTemplate(
              template.id,
            ),
        );
      }

      return templates;
    }, [
      filter,
      templates,
    ]);

  const selectedTemplate =
    useMemo(
      () =>
        templates.find(
          (template) =>
            template.id ===
            selectedTemplateId,
        ) ?? null,
      [
        selectedTemplateId,
        templates,
      ],
    );

  const handleRenameStart = (
    template: PresupuestoTemplate,
  ) => {
    setOpenMenuId(null);
    setEditingTemplate(template);
    setEditingName(template.name);
  };

  const handleRenameConfirm =
    async () => {
      if (
        !editingTemplate ||
        !onRenameTemplate ||
        !editingName.trim() ||
        managing
      ) {
        return;
      }

      const renamed =
        await onRenameTemplate(
          editingTemplate.id,
          editingName.trim(),
        );

      if (!renamed) {
        return;
      }

      setEditingTemplate(null);
      setEditingName("");
    };

  const handleDeleteRequest = (
    template: PresupuestoTemplate,
  ) => {
    setOpenMenuId(null);
    setActionError(null);
    setDeletingTemplate(template);
  };

  const handleDeleteConfirm =
    async () => {
      if (
        !deletingTemplate ||
        !onDeleteTemplate ||
        managing
      ) {
        return;
      }

      setActionError(null);

      try {
        const deleted =
          await onDeleteTemplate(
            deletingTemplate.id,
          );

        if (!deleted) {
          setActionError(
            "No se pudo eliminar el template.",
          );

          return;
        }

        setDeletingTemplate(null);
      } catch (
        deleteError
      ) {
        setActionError(
          deleteError instanceof Error
            ? deleteError.message
            : "No se pudo eliminar el template.",
        );
      }
    };

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[340] flex items-center justify-center bg-slate-950/40 p-3 backdrop-blur-[3px] sm:p-6"
        onMouseDown={onClose}
      >
        <section
          className="flex h-[min(860px,94dvh)] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_32px_110px_rgba(15,23,42,0.34)]"
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          <header className="flex shrink-0 items-start justify-between gap-5 border-b border-slate-200 px-5 py-5 sm:px-7">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-[#172033]">
                Elegir template
              </h2>

              <p className="mt-1.5 text-sm leading-5 text-slate-500">
                Seleccioná una hoja diseñada para comenzar el presupuesto.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Cerrar selector"
            >
              <X size={20} />
            </button>
          </header>

          <div className="flex shrink-0 flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="inline-flex w-fit rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() =>
                  setFilter("all")
                }
                className={[
                  "h-9 rounded-lg px-4 text-xs font-semibold transition",
                  filter === "all"
                    ? "bg-white text-[#172033] shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                ].join(" ")}
              >
                Todos
              </button>

              <button
                type="button"
                onClick={() =>
                  setFilter("system")
                }
                className={[
                  "h-9 rounded-lg px-4 text-xs font-semibold transition",
                  filter === "system"
                    ? "bg-white text-[#172033] shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                ].join(" ")}
              >
                NOSTUR
              </button>

              <button
                type="button"
                onClick={() =>
                  setFilter("saved")
                }
                className={[
                  "h-9 rounded-lg px-4 text-xs font-semibold transition",
                  filter === "saved"
                    ? "bg-white text-[#172033] shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                ].join(" ")}
              >
                Mis templates
              </button>
            </div>

            <p className="text-xs font-medium text-slate-500">
              {
                filteredTemplates.length
              }{" "}
              {filteredTemplates.length ===
              1
                ? "template disponible"
                : "templates disponibles"}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] px-5 py-5 sm:px-7 sm:py-6">
            {filteredTemplates.length ===
            0 ? (
              <div className="flex min-h-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                <div>
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                    <LayoutTemplate
                      size={24}
                    />
                  </span>

                  <p className="mt-4 text-sm font-semibold text-slate-800">
                    Todavía no guardaste templates
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Diseñá una hoja en el editor y usá “Guardar template”.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredTemplates.map(
                  (template) => {
                    const selected =
                      selectedTemplateId ===
                      template.id;

                    const systemTemplate =
                      templateRegistry.isSystemTemplate(
                        template.id,
                      );

                    const menuOpen =
                      openMenuId ===
                      template.id;

                    return (
                      <article
                        key={template.id}
                        className={[
                          "relative overflow-hidden rounded-lg border bg-white transition",
                          selected
                            ? "border-[#FF634A] shadow-[0_12px_35px_rgba(255,99,74,0.16)] ring-2 ring-[#FF634A]/15"
                            : "border-slate-200 hover:border-slate-300 hover:shadow-md",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onSelect(
                              template.id,
                            )
                          }
                          className="block w-full text-left"
                        >
                          <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                            {template.thumbnail ? (
                              <img
                                src={
                                  template.thumbnail
                                }
                                alt={
                                  template.name
                                }
                                className="h-full w-full object-cover"
                                draggable={false}
                              />
                            ) : (
                              <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                                <LayoutTemplate
                                  size={38}
                                />

                                <span className="text-xs font-medium">
                                  Sin miniatura
                                </span>
                              </div>
                            )}

                            <span className="absolute left-2 top-2 inline-flex h-7 items-center gap-1 rounded-lg bg-white/95 px-2 text-[10px] font-semibold text-slate-600 shadow-sm backdrop-blur">
                              {systemTemplate ? (
                                <LayoutTemplate
                                  size={12}
                                />
                              ) : (
                                <UserRound
                                  size={12}
                                />
                              )}

                              {systemTemplate
                                ? "NOSTUR"
                                : "Guardado"}
                            </span>

                            {selected ? (
                              <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#FF634A] text-white shadow-md">
                                <Check
                                  size={18}
                                />
                              </span>
                            ) : null}
                          </div>

                          <div className="min-h-[112px] p-4">
                            <p className="truncate pr-8 text-sm font-semibold text-slate-900">
                              {template.name}
                            </p>

                            <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">
                              {
                                template.description
                              }
                            </p>

                            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                              {
                                template.category
                              }
                            </p>
                          </div>
                        </button>

                        {!systemTemplate ? (
                          <div className="absolute bottom-3 right-3">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();

                                setOpenMenuId(
                                  menuOpen
                                    ? null
                                    : template.id,
                                );
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-black/10 transition hover:bg-slate-50 hover:text-slate-900"
                              aria-label="Administrar template"
                              title="Administrar template"
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

                                <div className="absolute bottom-10 right-0 z-30 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                                  <button
                                    type="button"
                                    disabled={
                                      managing ||
                                      !onRenameTemplate
                                    }
                                    onClick={() =>
                                      handleRenameStart(
                                        template,
                                      )
                                    }
                                    className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
                                  >
                                    <Pencil
                                      size={14}
                                    />

                                    Renombrar
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      managing ||
                                      !onDeleteTemplate
                                    }
                                    onClick={() =>
                                      handleDeleteRequest(
                                        template,
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
              {selectedTemplate ? (
                <>
                  <p className="text-xs font-semibold text-slate-500">
                    Template seleccionado
                  </p>

                  <p className="mt-0.5 truncate text-sm font-semibold text-[#172033]">
                    {
                      selectedTemplate.name
                    }
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  Seleccioná un diseño para continuar.
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  !selectedTemplateId ||
                  managing
                }
                onClick={onConfirm}
                className="h-10 rounded-lg bg-[#FF634A] px-5 text-sm font-semibold text-white transition hover:bg-[#f0543d] disabled:cursor-not-allowed disabled:bg-[#FFB7AB]"
              >
                Usar template
              </button>
            </div>
          </footer>
        </section>
      </div>

      {deletingTemplate ? (
        <div
          className="fixed inset-0 z-[430] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          onMouseDown={() => {
            if (!managing) {
              setDeletingTemplate(
                null,
              );

              setActionError(null);
            }
          }}
        >
          <section
            className="w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.28)]"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Eliminar template
                </h3>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Esta acción quitará el diseño de la biblioteca.
                </p>
              </div>

              <button
                type="button"
                disabled={managing}
                onClick={() => {
                  setDeletingTemplate(
                    null,
                  );

                  setActionError(null);
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </header>

            <div className="p-5">
              <p className="text-sm leading-6 text-slate-700">
                ¿Eliminar el template{" "}
                <strong>
                  {deletingTemplate.name}
                </strong>
                ?
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Los presupuestos creados anteriormente con este diseño no serán modificados.
              </p>

              {actionError ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {actionError}
                </div>
              ) : null}
            </div>

            <footer className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                disabled={managing}
                onClick={() => {
                  setDeletingTemplate(
                    null,
                  );

                  setActionError(null);
                }}
                className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={managing}
                onClick={() =>
                  void handleDeleteConfirm()
                }
                className="h-10 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {managing
                  ? "Eliminando..."
                  : "Eliminar template"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {editingTemplate ? (
        <div
          className="fixed inset-0 z-[420] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          onMouseDown={() => {
            if (!managing) {
              setEditingTemplate(
                null,
              );
            }
          }}
        >
          <section
            className="w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.28)]"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Renombrar template
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  El diseño y el contenido no serán modificados.
                </p>
              </div>

              <button
                type="button"
                disabled={managing}
                onClick={() =>
                  setEditingTemplate(
                    null,
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </header>

            <div className="p-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Nombre
                </span>

                <input
                  type="text"
                  value={editingName}
                  onChange={(event) =>
                    setEditingName(
                      event.target.value,
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();

                      void handleRenameConfirm();
                    }
                  }}
                  autoFocus
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A] focus:ring-2 focus:ring-[#FF634A]/10"
                />
              </label>
            </div>

            <footer className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                disabled={managing}
                onClick={() =>
                  setEditingTemplate(
                    null,
                  )
                }
                className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  managing ||
                  !editingName.trim()
                }
                onClick={() =>
                  void handleRenameConfirm()
                }
                className="h-10 rounded-lg bg-[#FF634A] px-5 text-sm font-semibold text-white transition hover:bg-[#f0543d] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {managing
                  ? "Guardando..."
                  : "Guardar"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
