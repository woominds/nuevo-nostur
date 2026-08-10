import {
  ClipboardList,
  Save,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  usePresupuestoEditorStore,
} from "../../store/presupuestoEditorStore";

import type {
  PresupuestoEstado,
} from "../../types/editor.types";

type DocumentDetailsPanelProps = {
  open: boolean;
  onClose: () => void;
};

type DetailsDraft = {
  name: string;
  nombreContacto: string;
  telefono: string;
  destino: string;
  status: PresupuestoEstado;
  observaciones: string;
};

const STATUS_OPTIONS: Array<{
  value: PresupuestoEstado;
  label: string;
}> = [
  {
    value: "draft",
    label: "Borrador",
  },
  {
    value: "editing",
    label: "En edición",
  },
  {
    value: "completed",
    label: "Finalizado",
  },
];

export function DocumentDetailsPanel({
  open,
  onClose,
}: DocumentDetailsPanelProps) {
  const document =
    usePresupuestoEditorStore(
      (state) => state.document,
    );

  const updateDocumentDetails =
    usePresupuestoEditorStore(
      (state) =>
        state.updateDocumentDetails,
    );

  const [
    draft,
    setDraft,
  ] = useState<DetailsDraft>({
    name: "",
    nombreContacto: "",
    telefono: "",
    destino: "",
    status: "draft",
    observaciones: "",
  });

  useEffect(() => {
    if (
      !open ||
      !document
    ) {
      return;
    }

    setDraft({
      name: document.name,
      nombreContacto:
        document.contacto.nombre,
      telefono:
        document.contacto.telefono,
      destino:
        document.destino ?? "",
      status:
        document.status,
      observaciones:
        document.observaciones ?? "",
    });
  }, [
    document,
    open,
  ]);

  if (
    !open ||
    !document
  ) {
    return null;
  }

  const canSave =
    draft.name.trim().length > 0 &&
    draft.nombreContacto.trim().length >
      0;

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    updateDocumentDetails({
      name:
        draft.name,

      contacto: {
        clienteId:
          document.contacto.clienteId,

        nombre:
          draft.nombreContacto.trim(),

        telefono:
          draft.telefono.trim(),
      },

      destino:
        draft.destino,

      status:
        draft.status,

      observaciones:
        draft.observaciones,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[350] flex justify-end bg-slate-950/30 backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <aside
        className="flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-[#f8fafc] shadow-[-24px_0_70px_rgba(15,23,42,0.18)]"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF4F1] text-[#FF634A]">
              <ClipboardList
                size={20}
              />
            </span>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#172033]">
                Datos del presupuesto
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Información comercial vinculada al diseño.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cerrar"
          >
            <X size={19} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Nombre del presupuesto
              </span>

              <input
                type="text"
                value={draft.name}
                onChange={(event) =>
                  setDraft(
                    (current) => ({
                      ...current,
                      name:
                        event.target.value,
                    }),
                  )
                }
                placeholder="PPTO-0000-NOMBREDELCLIENTE"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#FF634A] focus:ring-2 focus:ring-[#FF634A]/10"
              />

              <p className="mt-1.5 text-xs text-slate-400">
                El correlativo definitivo reemplazará el 0000 cuando los presupuestos se persistan en Supabase.
              </p>
            </label>

            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-[#172033]">
                Cliente o contacto
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-slate-600">
                    Nombre
                  </span>

                  <input
                    type="text"
                    value={
                      draft.nombreContacto
                    }
                    onChange={(event) =>
                      setDraft(
                        (current) => ({
                          ...current,
                          nombreContacto:
                            event.target
                              .value,
                        }),
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-slate-600">
                    Teléfono
                  </span>

                  <input
                    type="tel"
                    value={
                      draft.telefono
                    }
                    onChange={(event) =>
                      setDraft(
                        (current) => ({
                          ...current,
                          telefono:
                            event.target
                              .value,
                        }),
                      )
                    }
                    placeholder="+54 9..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
                  />
                </label>
              </div>

              <p className="mt-3 text-xs font-medium text-slate-400">
                {document.contacto
                  .clienteId
                  ? "Cliente vinculado al CRM"
                  : "Contacto no registrado"}
              </p>
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Destino
                </span>

                <input
                  type="text"
                  value={draft.destino}
                  onChange={(event) =>
                    setDraft(
                      (current) => ({
                        ...current,
                        destino:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="Ej. Caribe, Europa, Bariloche..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Estado
                </span>

                <select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft(
                      (current) => ({
                        ...current,
                        status:
                          event.target
                            .value as PresupuestoEstado,
                      }),
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
                >
                  {STATUS_OPTIONS.map(
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
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Observaciones
              </span>

              <textarea
                value={
                  draft.observaciones
                }
                onChange={(event) =>
                  setDraft(
                    (current) => ({
                      ...current,
                      observaciones:
                        event.target.value,
                    }),
                  )
                }
                placeholder="Notas internas del presupuesto..."
                className="min-h-[150px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-[#FF634A] focus:ring-2 focus:ring-[#FF634A]/10"
              />
            </label>
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="flex h-10 items-center gap-2 rounded-lg bg-[#FF634A] px-5 text-sm font-semibold text-white transition hover:bg-[#f0543d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save size={16} />

            Guardar datos
          </button>
        </footer>
      </aside>
    </div>
  );
}
