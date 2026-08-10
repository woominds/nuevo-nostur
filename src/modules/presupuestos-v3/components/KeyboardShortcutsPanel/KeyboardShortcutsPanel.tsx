import {
  X,
} from "lucide-react";

type KeyboardShortcutsPanelProps = {
  open: boolean;
  onClose: () => void;
};

const shortcuts = [
  {
    keys: "Cmd/Ctrl + Z",
    action: "Deshacer",
  },
  {
    keys: "Cmd/Ctrl + Shift + Z",
    action: "Rehacer",
  },
  {
    keys: "Cmd/Ctrl + C",
    action: "Copiar elemento",
  },
  {
    keys: "Cmd/Ctrl + V",
    action: "Pegar elemento, texto o imagen",
  },
  {
    keys: "Cmd/Ctrl + D",
    action: "Duplicar elemento",
  },
  {
    keys: "Delete / Backspace",
    action: "Eliminar elemento",
  },
  {
    keys: "Escape",
    action: "Deseleccionar",
  },
  {
    keys: "Flechas",
    action: "Mover 1 px",
  },
  {
    keys: "Shift + Flechas",
    action: "Mover 10 px",
  },
  {
    keys: "Doble clic",
    action: "Editar texto",
  },
];

export function KeyboardShortcutsPanel({
  open,
  onClose,
}: KeyboardShortcutsPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4 backdrop-blur-[1px]"
      onMouseDown={onClose}
    >
      <section
        className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Atajos del editor
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              Acciones rápidas para editar el presupuesto.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cerrar atajos"
          >
            <X size={18} />
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto p-3">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between gap-4 border-b border-slate-100 px-2 py-3 last:border-b-0"
            >
              <span className="text-sm text-slate-600">
                {shortcut.action}
              </span>

              <kbd className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] font-medium text-slate-700">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
