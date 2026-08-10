import {
  Plus,
  RefreshCcw
} from "lucide-react";

type CarritosHeaderProps = {
  loading: boolean;
  onRefresh: () => void;
  onCreate: () => void;
};

export function CarritosHeader({
  loading,
  onRefresh,
  onCreate
}: CarritosHeaderProps) {
  return (
    <header className="shrink-0 border-b border-black/10 bg-white/78 px-4 py-3 backdrop-blur-xl sm:px-5">
      <div className="carritos-panel-header-inner">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[17px] font-semibold tracking-tight text-[#172033]">
              Carritos
            </h1>

            <span className="rounded-md bg-orange-50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-nostur-orange ring-1 ring-orange-100">
              Almundo
            </span>
          </div>

          <p className="mt-1 max-w-2xl text-[12px] font-normal leading-5 text-[#64748b]">
            Carga de ventas Almundo. Por defecto cada vendedor ve sus
            carritos, pero puede filtrar por todos.
          </p>
        </div>

        <div className="carritos-panel-header-actions flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-white px-3 text-[11.5px] font-medium text-[#334155] shadow-sm ring-1 ring-black/10 transition hover:bg-[#f8fafc] disabled:opacity-50"
          >
            <RefreshCcw
              size={13}
              className={loading ? "animate-spin" : ""}
            />

            Actualizar
          </button>

          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-[#4f7c90] px-3 text-[11.5px] font-medium text-white shadow-sm transition hover:bg-[#406b7d]"
          >
            <Plus size={13} />

            Nuevo carrito
          </button>
        </div>
      </div>
    </header>
  );
}
