import {
  Plus,
  RefreshCcw
} from "lucide-react";

type FilesHeaderProps = {
  loading: boolean;
  onRefresh: () => void;
  onCreate: () => void;
};

export function FilesHeader({
  loading,
  onRefresh,
  onCreate
}: FilesHeaderProps) {
  return (
    <header className="shrink-0 border-b border-black/10 bg-white/78 px-5 py-3 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[17px] font-semibold tracking-tight text-[#172033]">
              Files
            </h1>

            <span className="rounded-md bg-orange-50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-nostur-orange ring-1 ring-orange-100">
              Files
            </span>
          </div>

          <p className="mt-1 text-[12px] font-normal text-[#64748b]">
            Carga de files y operadores. Cada vendedor puede consultar sus operaciones y aplicar filtros.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-7 items-center gap-1.5 rounded-[10px] bg-white px-2.5 text-[11px] font-medium text-[#334155] shadow-sm ring-1 ring-black/10 transition hover:bg-[#f8fafc] disabled:opacity-50"
          >
            <RefreshCcw
              size={13}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Actualizar
          </button>

          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-7 items-center gap-1.5 rounded-[10px] bg-[#4f7c90] px-2.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-[#406b7d]"
          >
            <Plus size={13} />

            Nuevo file
          </button>
        </div>
      </div>
    </header>
  );
}
