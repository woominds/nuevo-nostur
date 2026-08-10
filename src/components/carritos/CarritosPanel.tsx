import { useEffect } from "react";
// src/components/carritos/CarritosPanel.tsx

import {
  ChevronsUpDown,
  Filter,
  Search,
  X
} from "lucide-react";
import {NosturDateInput} from "../ui/NosturDateInput";
import "./CarritosPanel.css";
import {
  CarritoSideDetail,
  CarritosHeader,
  CarritosList,
  CarritosMetrics,
  FieldLabel,
  NosturSelect,
  Toast
} from "./components";
import {CarritoWizard} from "./CarritoWizard";
import {CarritoEditModal} from "./CarritoEditModal";
import {CarritoDetailModal} from "./CarritoDetailModal";
import {
  ESTADO_OPTIONS,
  formatMonthLabel
} from "./carritosModel";
import {useCarritosPanel} from "./hooks/useCarritosPanel";

export function CarritosPanel() {
  useEffect(() => {
    console.log("🟢 Carritos MOUNT");

    return () => {
      console.log("🔴 Carritos UNMOUNT");
    };
  }, []);

  const {
    loading,
    saving,
    error,
    filters,
    catalogos,
    canManageCarritos,

    carritos,
    metrics,
    selectedCarrito,

    filtersOpen,
    wizardOpen,
    detailCarrito,
    editingCarrito,
    toast,

    vendedorOptions,
    sucursalOptions,
    riesgoOptions,
    activoOptions,
    selectedVendedorFilterLabel,

    setFiltersOpen,
    setDetailCarrito,
    setEditingCarrito,
    setToast,

    loadCarritos,
    setFilter,
    clearError,
    selectCarrito,

    handlePreviousMonth,
    handleNextMonth,
    handleCurrentMonth,
    handleUseOperationalMonth,
    handleVendedorFilter,
    handleToggle,
    handleSendToControl,

    openWizard,
    closeWizard,
    closeEditor,
    closeDetail,
    editFromDetail,
    handleWizardSaved,
    handleEditorSaved
  } = useCarritosPanel();

  return (
    <div className="carritos-panel-root flex h-full min-h-0 flex-col overflow-hidden bg-[#edf3f7] text-[#172033]">
      <CarritosHeader
        loading={loading}
        onRefresh={loadCarritos}
        onCreate={openWizard}
      />

      <main className="min-h-0 flex-1 overflow-auto p-3.5">
        {error ? (
          <div className="mb-3 flex items-start justify-between gap-3 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-medium text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              <X size={14} />
            </button>
          </div>
        ) : null}

        <section className="relative z-[60] mb-3 rounded-[16px] border border-black/10 bg-white/62 p-3 shadow-sm backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                setFiltersOpen(
                  (current) => !current
                )
              }
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

                <span className="rounded-md bg-white px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-[#64748b] ring-1 ring-black/10">
                  {filters.periodMode ===
                  "mes"
                    ? "Vista mensual"
                    : "Rango manual"}
                </span>
              </div>

              <div className="mt-1 truncate text-[11.5px] font-normal text-[#64748b]">
                {filters.periodMode ===
                "mes"
                  ? `${formatMonthLabel(
                      filters.month
                    )} · ${filters.desde} → ${filters.hasta}`
                  : `Rango reportes · ${filters.desde} → ${filters.hasta}`}{" "}
                · Vendedor:{" "}
                {
                  selectedVendedorFilterLabel
                }{" "}
                · Estado:{" "}
                {filters.estado ===
                "todos"
                  ? "Todos"
                  : filters.estado}{" "}
                · Riesgo:{" "}
                {filters.riesgo}
              </div>
            </button>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <div className="flex items-center gap-1 rounded-[12px] border border-black/10 bg-white p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={
                    handlePreviousMonth
                  }
                  className="h-7 rounded-[10px] px-2.5 text-[11px] font-medium text-[#334155] transition hover:bg-[#f8fafc]"
                >
                  Anterior
                </button>

                <div className="flex h-7 min-w-[112px] items-center justify-center rounded-[10px] bg-[#172033] px-3 text-center text-[11px] font-medium text-white">
                  {formatMonthLabel(
                    filters.month
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="h-7 rounded-[10px] px-2.5 text-[11px] font-medium text-[#334155] transition hover:bg-[#f8fafc]"
                >
                  Siguiente
                </button>
              </div>

              <button
                type="button"
                onClick={
                  handleCurrentMonth
                }
                className="h-7 rounded-[10px] bg-[#4f7c90] px-2.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-[#406b7d]"
              >
                Este mes
              </button>

              <button
                type="button"
                onClick={() =>
                  setFiltersOpen(
                    (current) =>
                      !current
                  )
                }
                className="inline-flex h-7 items-center gap-1.5 rounded-[10px] bg-white px-2.5 text-[11px] font-medium text-[#334155] shadow-sm ring-1 ring-black/10 hover:bg-[#f8fafc]"
              >
                {filtersOpen
                  ? "Ocultar"
                  : "Mostrar"}

                <ChevronsUpDown
                  size={13}
                  strokeWidth={1.8}
                />
              </button>
            </div>
          </div>

          {filtersOpen ? (
            <>
              <div className="mt-3 grid gap-2.5 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
                <div className="grid grid-cols-2 gap-2 rounded-[14px] border border-[#4f7c90]/20 bg-white/70 p-2">
                  <div>
                    <FieldLabel>
                      Desde reportes
                    </FieldLabel>

                    <NosturDateInput
                      value={
                        filters.desde
                      }
                      onChange={(value) =>
                        setFilter(
                          "desde",
                          value
                        )
                      }
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Hasta reportes
                    </FieldLabel>

                    <NosturDateInput
                      value={
                        filters.hasta
                      }
                      onChange={(value) =>
                        setFilter(
                          "hasta",
                          value
                        )
                      }
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel>
                    Estado
                  </FieldLabel>

                  <NosturSelect
                    value={
                      filters.estado
                    }
                    onChange={(value) =>
                      setFilter(
                        "estado",
                        value
                      )
                    }
                    options={
                      ESTADO_OPTIONS
                    }
                  />
                </div>

                <div>
                  <FieldLabel>
                    Vendedor
                  </FieldLabel>

                  <NosturSelect
                    value={
                      filters.vendedorId
                    }
                    onChange={
                      handleVendedorFilter
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
                    value={
                      filters.sucursalId
                    }
                    onChange={(value) =>
                      setFilter(
                        "sucursalId",
                        value
                      )
                    }
                    options={
                      sucursalOptions
                    }
                  />
                </div>

                <div>
                  <FieldLabel>
                    Riesgo
                  </FieldLabel>

                  <NosturSelect
                    value={
                      filters.riesgo
                    }
                    onChange={(value) =>
                      setFilter(
                        "riesgo",
                        value as typeof filters.riesgo
                      )
                    }
                    options={
                      riesgoOptions
                    }
                  />
                </div>

                <div>
                  <FieldLabel>
                    Activo
                  </FieldLabel>

                  <NosturSelect
                    value={
                      filters.activo
                    }
                    onChange={(value) =>
                      setFilter(
                        "activo",
                        value as typeof filters.activo
                      )
                    }
                    options={
                      activoOptions
                    }
                  />
                </div>
              </div>

              <div className="mt-2.5 grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                <div className="flex h-8 items-center gap-2 rounded-[10px] border border-black/10 bg-white px-3">
                  <Search
                    size={14}
                    className="shrink-0 text-[#94a3b8]"
                  />

                  <input
                    value={
                      filters.search
                    }
                    onChange={(event) =>
                      setFilter(
                        "search",
                        event.target.value
                      )
                    }
                    placeholder="Buscar por cliente, teléfono, carrito, destino..."
                    className="h-full min-w-0 flex-1 bg-transparent text-[12px] font-normal text-[#172033] outline-none placeholder:text-[#94a3b8]"
                  />
                </div>

                <button
                  type="button"
                  onClick={
                    handleUseOperationalMonth
                  }
                  className="h-8 rounded-[10px] bg-white px-3 text-[12px] font-medium text-[#334155] shadow-sm ring-1 ring-black/10 hover:bg-[#f8fafc]"
                >
                  Usar mes operativo
                </button>

                <button
                  type="button"
                  onClick={loadCarritos}
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

        <CarritosMetrics
          metrics={metrics}
        />

        <div className="carritos-layout relative z-0 grid min-w-0 gap-3">
          <CarritosList
            carritos={carritos}
            vendedores={
              catalogos.vendedores
            }
            selectedCarritoId={
              selectedCarrito?.id
            }
            loading={loading}
            onSelect={
              selectCarrito
            }
            onView={
              setDetailCarrito
            }
            onEdit={
              setEditingCarrito
            }
            onSendToControl={
              handleSendToControl
            }
            onToggle={
              handleToggle
            }
          />

          <CarritoSideDetail
            carrito={
              selectedCarrito
            }
            vendedores={
              catalogos.vendedores
            }
            saving={saving}
            onEdit={
              setEditingCarrito
            }
            onView={
              setDetailCarrito
            }
            onSendToControl={
              handleSendToControl
            }
            onToggle={
              handleToggle
            }
          />
        </div>
      </main>

      <Toast
        toast={toast}
        onClose={() =>
          setToast(null)
        }
      />

      {wizardOpen ? (
        <CarritoWizard
          onClose={closeWizard}
          onSaved={
            handleWizardSaved
          }
        />
      ) : null}

      {editingCarrito ? (
        <CarritoEditModal
          carrito={
            editingCarrito
          }
          catalogos={catalogos}
          canManageCarritos={
            canManageCarritos
          }
          onClose={closeEditor}
          onSaved={
            handleEditorSaved
          }
        />
      ) : null}

      {detailCarrito ? (
        <CarritoDetailModal
          carrito={
            detailCarrito
          }
          vendedores={
            catalogos.vendedores
          }
          sucursales={
            catalogos.sucursales
          }
          onClose={closeDetail}
          onEdit={editFromDetail}
        />
      ) : null}
    </div>
  );
}

export default CarritosPanel;
