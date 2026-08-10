import {
  Loader2,
  Save,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  DocumentPageRenderer,
} from "../DocumentRenderer";

import {
  usePresupuestoTemplates,
} from "../../hooks/usePresupuestoTemplates";

import {
  createTemplateThumbnail,
} from "../../utils/templateThumbnail";

import type {
  PresupuestoPage,
  PresupuestoTemplateCategory,
} from "../../types/editor.types";

import type {
  PresupuestoTemplateVisibility,
} from "../../services/presupuestoTemplatesService";

type SaveTemplateModalProps = {
  open: boolean;
  page: PresupuestoPage | null;
  onClose: () => void;
  onSaved?: (
    templateId: string,
  ) => void;
};

type CategoryOption = {
  value: PresupuestoTemplateCategory;
  label: string;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    value: "general",
    label: "General",
  },
  {
    value: "caribe",
    label: "Caribe",
  },
  {
    value: "europa",
    label: "Europa",
  },
  {
    value: "cruceros",
    label: "Cruceros",
  },
  {
    value: "disney",
    label: "Disney",
  },
  {
    value: "nacional",
    label: "Nacional",
  },
  {
    value: "aereos",
    label: "Aéreos",
  },
  {
    value: "escapadas",
    label: "Escapadas",
  },
  {
    value: "hoteles",
    label: "Hoteles",
  },
];

export function SaveTemplateModal({
  open,
  page,
  onClose,
  onSaved,
}: SaveTemplateModalProps) {
  const thumbnailRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const {
    saveTemplate,
    saving,
    error,
    clearError,
  } = usePresupuestoTemplates();

  const [
    nombre,
    setNombre,
  ] = useState("");

  const [
    descripcion,
    setDescripcion,
  ] = useState("");

  const [
    categoria,
    setCategoria,
  ] = useState<PresupuestoTemplateCategory>(
    "general",
  );

  const [
    visibilidad,
    setVisibilidad,
  ] = useState<PresupuestoTemplateVisibility>(
    "personal",
  );

  const [
    preparingThumbnail,
    setPreparingThumbnail,
  ] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setNombre("");
    setDescripcion("");
    setCategoria("general");
    setVisibilidad("personal");
    setPreparingThumbnail(false);
    clearError();
  }, [
    clearError,
    open,
  ]);

  if (!open) {
    return null;
  }

  const canSave =
    Boolean(
      page &&
      nombre.trim(),
    );

  const handleSave =
    async () => {
      if (
        !page ||
        !canSave ||
        saving ||
        preparingThumbnail
      ) {
        return;
      }

      setPreparingThumbnail(true);

      let thumbnailUrl:
        | string
        | null = null;

      try {
        if (
          thumbnailRef.current
        ) {
          thumbnailUrl =
            await createTemplateThumbnail(
              thumbnailRef.current,
            );
        }
      } catch {
        thumbnailUrl = null;
      } finally {
        setPreparingThumbnail(false);
      }

      const savedTemplate =
        await saveTemplate({
          page,
          nombre,
          descripcion,
          categoria,
          visibilidad,
          thumbnailUrl,
        });

      if (!savedTemplate) {
        return;
      }

      onSaved?.(
        savedTemplate.id,
      );

      onClose();
    };

  const busy =
    saving ||
    preparingThumbnail;

  return (
    <>
      <div
        className="fixed inset-0 z-[360] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
        onMouseDown={onClose}
      >
        <section
          className="w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.28)]"
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-[#172033]">
                Guardar hoja como template
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Se guardará una copia visual completa de la hoja activa.
              </p>
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </header>

          <div className="space-y-4 p-5">
            {page ? (
              <div className="flex justify-center rounded-lg border border-slate-200 bg-slate-100 p-3">
                <DocumentPageRenderer
                  page={page}
                  scale={0.12}
                  className="shadow-md ring-1 ring-black/5"
                />
              </div>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-600">
                Nombre del template
              </span>

              <input
                type="text"
                value={nombre}
                onChange={(event) =>
                  setNombre(
                    event.target.value,
                  )
                }
                placeholder="Ej. Crucero MSC Caribe"
                autoFocus
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-600">
                Descripción
              </span>

              <textarea
                value={descripcion}
                onChange={(event) =>
                  setDescripcion(
                    event.target.value,
                  )
                }
                placeholder="Ej. Base para presupuestos de cruceros por el Caribe."
                className="min-h-[82px] w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-5 text-slate-900 outline-none transition focus:border-[#FF634A]"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-slate-600">
                  Categoría
                </span>

                <select
                  value={categoria}
                  onChange={(event) =>
                    setCategoria(
                      event.target.value as PresupuestoTemplateCategory,
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
                >
                  {CATEGORY_OPTIONS.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-slate-600">
                  Visibilidad
                </span>

                <select
                  value={visibilidad}
                  onChange={(event) =>
                    setVisibilidad(
                      event.target.value as PresupuestoTemplateVisibility,
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
                >
                  <option value="personal">
                    Solo para mí
                  </option>

                  <option value="empresa">
                    Todo el equipo
                  </option>
                </select>
              </label>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
              El diseño guardado será independiente del presupuesto actual.
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="h-9 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={
                !canSave ||
                busy
              }
              onClick={() =>
                void handleSave()
              }
              className="flex h-9 items-center gap-2 rounded-lg bg-[#FF634A] px-4 text-sm font-semibold text-white transition hover:bg-[#f0543d] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Save size={16} />
              )}

              {preparingThumbnail
                ? "Preparando diseño..."
                : saving
                  ? "Guardando..."
                  : "Guardar template"}
            </button>
          </footer>
        </section>
      </div>

      {page ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-[-100000px] top-0 z-[-1]"
        >
          <div
            ref={thumbnailRef}
          >
            <DocumentPageRenderer
              page={page}
              scale={0.35}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
