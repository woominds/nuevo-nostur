import {
  Edit3,
  X
} from "lucide-react";

import type {
  FileItem
} from "../../../store/filesStore";

type FileDetailHeaderProps = {
  file: FileItem;
  destino: string;
  editing: boolean;
  onToggleEditing: () => void;
  onClose: () => void;
};

export function FileDetailHeader({
  file,
  destino,
  editing,
  onToggleEditing,
  onClose
}: FileDetailHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-[17px] font-semibold text-[#172033]">
          File {file.numero_file}
        </h2>

        <p className="mt-0.5 truncate text-[12px] font-normal text-[#64748b]">
          {file.clientes?.nombre_completo ||
            "Sin cliente"}{" "}
          ·{" "}
          {destino ||
            "Sin destino"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggleEditing}
          className={[
            "inline-flex h-8 items-center gap-1.5 rounded-[10px] px-3 text-[12px] font-medium transition",
            editing
              ? "border border-[#4f7c90]/30 bg-[#eef6f7] text-[#172033]"
              : "border border-black/10 bg-white text-[#334155] hover:bg-[#f8fafc]"
          ].join(" ")}
        >
          <Edit3 size={13} />

          {editing
            ? "Editando"
            : "Editar"}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#172033]"
          aria-label="Cerrar detalle del file"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
