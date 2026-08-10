import {
  ChevronsUpDown,
  Filter,
  Search
} from "lucide-react";

import {
  NosturDateInput
} from "../../ui/NosturDateInput";

import {
  FieldLabel,
  NosturSelect
} from "./FileFormControls";

import type {
  SelectOption
} from "../filesModel";

type FilesFiltersProps = {
  open: boolean;

  monthLabel: string;
  monthValue: string;
  currentMonthValue: string;

  desde: string;
  hasta: string;
  estado: string;
  operadorId: string;
  vendedorId: string;
  sucursalId: string;
  activo: string;
  search: string;

  selectedVendedorLabel: string;

  estadoOptions: SelectOption[];
  operadorOptions: SelectOption[];
  vendedorOptions: SelectOption[];
  sucursalOptions: SelectOption[];
  activoOptions: SelectOption[];

  onToggleOpen: () => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;

  onDesdeChange: (
    value: string
  ) => void;

  onHastaChange: (
    value: string
  ) => void;

  onEstadoChange: (
    value: string
  ) => void;

  onOperadorChange: (
    value: string
  ) => void;

  onVendedorChange: (
    value: string
  ) => void;

  onSucursalChange: (
    value: string
  ) => void;

  onActivoChange: (
    value: string
  ) => void;

  onSearchChange: (
    value: string
  ) => void;

  onApply: () => void;
};

export function FilesFilters({
  open,

  monthLabel,
  monthValue,
  currentMonthValue,

  desde,
  hasta,
  estado,
  operadorId,
  vendedorId,
  sucursalId,
  activo,
  search,

  selectedVendedorLabel,

  estadoOptions,
  operadorOptions,
  vendedorOptions,
  sucursalOptions,
  activoOptions,

  onToggleOpen,
  onPreviousMonth,
  onNextMonth,
  onCurrentMonth,

  onDesdeChange,
  onHastaChange,
  onEstadoChange,
  onOperadorChange,
  onVendedorChange,
  onSucursalChange,
  onActivoChange,
  onSearchChange,

  onApply
}: FilesFiltersProps) {
  return (
    <section className="relative z-[60] mb-3 rounded-[16px] border border-black/10 bg-white/62 p-3 shadow-sm backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onToggleOpen}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Filter
              size={14}
              className="text-[#4f7c90]"
            />

            <h2 className="text-[12px] font-semibold text-[#172033]">
              Filtros
            </h2>

            <span className="rounded-md bg-orange-50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-nostur-orange ring-1 ring-orange-100">
              Mes operativo
            </span>
          </div>

          <div className="mt-1 truncate text-[11.5px] font-normal text-[#64748b]">
            {monthLabel} · {desde} →{" "}
            {hasta} · Estado:{" "}
            {estado === "todos"
              ? "Todos"
              : estado}{" "}
            · Vendedor:{" "}
            {selectedVendedorLabel}
          </div>
        </button>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-1 rounded-[12px] border border-black/10 bg-white p-0.5 shadow-sm">
            <button
              type="button"
              onClick={onPreviousMonth}
              className="h-7 rounded-[10px] px-2.5 text-[11px] font-medium text-[#334155] transition hover:bg-[#f8fafc]"
            >
              Anterior
            </button>

            <div className="flex h-7 min-w-[112px] items-center justify-center rounded-[10px] bg-[#172033] px-3 text-center text-[11px] font-medium text-white">
              {monthLabel}
            </div>

            <button
              type="button"
              onClick={onNextMonth}
              className="h-7 rounded-[10px] px-2.5 text-[11px] font-medium text-[#334155] transition hover:bg-[#f8fafc]"
            >
              Siguiente
            </button>
          </div>

          <button
            type="button"
            onClick={onCurrentMonth}
            className={[
              "h-7 rounded-[10px] px-2.5 text-[11px] font-medium transition",
              monthValue ===
              currentMonthValue
                ? "bg-[#4f7c90] text-white"
                : "bg-white text-[#334155] shadow-sm ring-1 ring-black/10 hover:bg-[#f8fafc]"
            ].join(" ")}
          >
            Este mes
          </button>

          <button
            type="button"
            onClick={onToggleOpen}
            className="inline-flex h-7 items-center gap-1.5 rounded-[10px] bg-white px-2.5 text-[11px] font-medium text-[#334155] shadow-sm ring-1 ring-black/10 hover:bg-[#f8fafc]"
          >
            {open
              ? "Ocultar"
              : "Mostrar"}

            <ChevronsUpDown
              size={13}
              strokeWidth={1.8}
            />
          </button>
        </div>
      </div>

      {open ? (
        <>
          <div className="mt-3 grid gap-2.5 lg:grid-cols-[1fr_1.15fr_1fr_1fr_1fr_1fr_1fr]">
            <div className="rounded-[14px] border border-[#4f7c90]/20 bg-white/70 p-2">
              <FieldLabel>
                Mes operativo
              </FieldLabel>

              <div className="flex h-8 items-center rounded-[10px] border border-black/10 bg-[#172033] px-3 text-[12px] font-medium text-white">
                {monthLabel}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-[14px] border border-black/10 bg-white/70 p-2">
              <div>
                <FieldLabel>
                  Desde
                </FieldLabel>

                <NosturDateInput
                  value={desde}
                  onChange={
                    onDesdeChange
                  }
                />
              </div>

              <div>
                <FieldLabel>
                  Hasta
                </FieldLabel>

                <NosturDateInput
                  value={hasta}
                  onChange={
                    onHastaChange
                  }
                />
              </div>
            </div>

            <div>
              <FieldLabel>
                Estado
              </FieldLabel>

              <NosturSelect
                value={estado}
                onChange={
                  onEstadoChange
                }
                options={
                  estadoOptions
                }
              />
            </div>

            <div>
              <FieldLabel>
                Operador
              </FieldLabel>

              <NosturSelect
                value={operadorId}
                onChange={
                  onOperadorChange
                }
                options={
                  operadorOptions
                }
              />
            </div>

            <div>
              <FieldLabel>
                Vendedor
              </FieldLabel>

              <NosturSelect
                value={vendedorId}
                onChange={
                  onVendedorChange
                }
                options={
                  vendedorOptions
                }
              />
            </div>

            <div>
              <FieldLabel>
                Sucursal
              </FieldLabel>

              <NosturSelect
                value={sucursalId}
                onChange={
                  onSucursalChange
                }
                options={
                  sucursalOptions
                }
              />
            </div>

            <div>
              <FieldLabel>
                Activo
              </FieldLabel>

              <NosturSelect
                value={activo}
                onChange={
                  onActivoChange
                }
                options={
                  activoOptions
                }
              />
            </div>
          </div>

          <div className="mt-2.5 grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div className="flex h-8 items-center gap-2 rounded-[10px] border border-black/10 bg-white px-3">
              <Search
                size={14}
                className="shrink-0 text-[#94a3b8]"
              />

              <input
                value={search}
                onChange={(event) =>
                  onSearchChange(
                    event.target.value
                  )
                }
                placeholder="Buscar por cliente, teléfono, file, destino..."
                className="h-full min-w-0 flex-1 bg-transparent text-[12px] font-normal text-[#172033] outline-none placeholder:text-[#94a3b8]"
              />
            </div>

            <button
              type="button"
              onClick={onApply}
              className="h-8 rounded-[10px] bg-white px-3 text-[12px] font-medium text-[#334155] shadow-sm ring-1 ring-black/10 hover:bg-[#f8fafc]"
            >
              Aplicar filtros
            </button>

            <button
              type="button"
              className="h-8 rounded-[10px] bg-white px-3 text-[12px] font-medium text-[#334155] shadow-sm ring-1 ring-black/10 hover:bg-[#f8fafc]"
              title="La exportación se agrega en la próxima etapa."
            >
              Exportar Excel
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
