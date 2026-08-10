import { createPortal } from "react-dom";
import {
  Check,
  Save,
  Trash2,
  X
} from "lucide-react";

import {
  WizardError
} from "./components";

import {
  WizardCliente,
  WizardConfirmacion,
  WizardPagosComerciales,
  WizardSummary,
  WizardVenta
} from "./wizard";

import {
  useCarritoWizard
} from "./hooks/useCarritoWizard";

type CarritoWizardProps = {
  onClose: () => void;
  onSaved: (
    message: string
  ) => void;
};

const STEPS = [
  {
    id: 1,
    title: "Cliente",
    subtitle: "Datos del pasajero"
  },
  {
    id: 2,
    title: "Venta",
    subtitle: "Venta ALMUNDO"
  },
  {
    id: 3,
    title: "Cobro",
    subtitle: "Comercial y Tesorería"
  },
  {
    id: 4,
    title: "Confirmar",
    subtitle: "Revisión final"
  }
] as const;

export function CarritoWizard({
  onClose,
  onSaved
}: CarritoWizardProps) {
  const {
    saving,
    clientesSearch,
    canManageCarritos,
    createDestinoInline,

    storedDraft,
    step,
    wizardError,
    draftSavedAt,
    draft,

    bruto,
    promocode,
    totalFinal,
    totalPagosComerciales,
    importeRiesgo,
    totalComercial,
    totalTesoreria,
    saldo,
    saldoComercial,
    visibleEnCarritos,

    metodoOptions,
    servicioOptions,
    destinoOptions,
    formaPagoOptions,
    cajaOptions,
    vendedorOptions,
    sucursalOptions,

    clearWizardError,
    setCliente,
    setVenta,
    setPhone,
    selectCliente,

    updatePago,
    addPago,
    removePago,

    setPagoParcial,
    setFechaIngresoGastos,
    setPagoDiferenteOficina,
    setUsaMarkupAdicional,
    setMarkupAdicionalPct,

    setRiesgo,
    setImporteRiesgo,
    setRiesgoMotivo,

    updateMovimiento,
    selectCaja,
    selectFormaPagoTesoreria,
    addMovimiento,
    removeMovimiento,

    setMoneda,
    setConfirmado,

    saveDraftManually,
    discardDraft,
    previousStep,
    nextStep,
    submit
  } = useCarritoWizard({
    onClose,
    onSaved
  });

  return createPortal(
    <div className="pointer-events-none fixed bottom-0 right-0 top-[39px] z-[180] flex w-full justify-end">
      <aside className="pointer-events-auto h-full w-full max-w-[1220px] overflow-hidden border-l border-black/10 bg-[#edf3f7] text-[#172033] shadow-2xl">
        <div className="flex h-full min-h-0 flex-col">

          <header className="shrink-0 border-b border-black/10 bg-white/90 px-5 py-4 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="truncate text-[20px] font-semibold tracking-tight text-[#172033]">
                  Nuevo carrito
                </h2>

                <p className="mt-1 text-[13px] font-normal text-[#5f7392]">
                  Cliente → Venta ALMUNDO → Pagos → Confirmación
                </p>

                {draftSavedAt ? (
                  <p className="mt-1.5 text-[11.5px] font-normal text-[#8295b3]">
                    Borrador guardado a las{" "}
                    {draftSavedAt}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={
                    saveDraftManually
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-[12px] border border-black/10 bg-white px-4 text-[12px] font-semibold text-[#334155] shadow-sm transition hover:bg-[#f8fafc]"
                >
                  <Save size={15} />

                  Guardar borrador
                </button>

                <button
                  type="button"
                  onClick={
                    discardDraft
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-[12px] border border-red-200 bg-white px-4 text-[12px] font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                >
                  <Trash2 size={15} />

                  Descartar
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-[11px] text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#172033]"
                  aria-label="Cerrar nuevo carrito"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-5">

            <div className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {STEPS.map((item) => {
                const active =
                  step === item.id;

                const completed =
                  step > item.id;

                return (
                  <div
                    key={item.id}
                    className={[
                      "relative overflow-hidden rounded-[18px] border px-5 py-4 transition-all",
                      active
                        ? "border-[#4f7c90] bg-[#56879b] text-white shadow-lg"
                        : completed
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-black/10 bg-white/70"
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={[
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[14px] font-semibold",
                          active
                            ? "border-white/70 bg-white text-[#4f7c90]"
                            : completed
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-black/10 bg-white text-[#60718c]"
                        ].join(" ")}
                      >
                        {completed ? (
                          <Check size={17} />
                        ) : (
                          item.id
                        )}
                      </div>

                      <div className="min-w-0">
                        <div
                          className={[
                            "text-[13px] font-semibold",
                            active
                              ? "text-white"
                              : completed
                                ? "text-emerald-700"
                                : "text-[#172033]"
                          ].join(" ")}
                        >
                          {item.title}
                        </div>

                        <div
                          className={[
                            "mt-1 text-[11px]",
                            active
                              ? "text-white/80"
                              : "text-[#60718c]"
                          ].join(" ")}
                        >
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    {active ? (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/35" />
                    ) : completed ? (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500" />
                    ) : null}
                  </div>
                );
              })}
            </div>

            <WizardError
              message={wizardError}
              onClose={
                clearWizardError
              }
            />

            {storedDraft ? (
              <div className="mb-4 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-medium text-amber-800">
                Recuperamos un borrador de carrito pendiente. Podés continuarlo,
                guardarlo o descartarlo.
              </div>
            ) : null}

            <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
              <main className="min-w-0 rounded-[20px] border border-black/10 bg-white p-5 shadow-sm">
                {step === 1 ? (
                  <WizardCliente
                    draft={draft}
                    clientesSearch={
                      clientesSearch
                    }
                    metodoOptions={
                      metodoOptions
                    }
                    vendedorOptions={
                      vendedorOptions
                    }
                    sucursalOptions={
                      sucursalOptions
                    }
                    canManageCarritos={
                      canManageCarritos
                    }
                    onPhoneChange={
                      setPhone
                    }
                    onSelectCliente={
                      selectCliente
                    }
                    onClienteChange={
                      setCliente
                    }
                  />
                ) : null}

                {step === 2 ? (
                  <WizardVenta
                    draft={draft}
                    bruto={bruto}
                    promocode={promocode}
                    totalFinal={totalFinal}
                    servicioOptions={
                      servicioOptions
                    }
                    destinoOptions={
                      destinoOptions
                    }
                    onVentaChange={
                      setVenta
                    }
                    onCreateDestino={
                      createDestinoInline
                    }
                    onMonedaChange={
                      setMoneda
                    }
                  />
                ) : null}

                {step === 3 ? (
                  <WizardPagosComerciales
                    draft={draft}
                    totalFinal={
                      totalFinal
                    }
                    totalPagosComerciales={
                      totalPagosComerciales
                    }
                    totalTesoreria={
                      totalTesoreria
                    }
                    importeRiesgo={
                      importeRiesgo
                    }
                    totalComercial={
                      totalComercial
                    }
                    saldoComercial={
                      saldoComercial
                    }
                    saldo={saldo}
                    formaPagoOptions={
                      formaPagoOptions
                    }
                    cajaOptions={
                      cajaOptions
                    }
                    onPagoChange={
                      updatePago
                    }
                    onAddPago={
                      addPago
                    }
                    onRemovePago={
                      removePago
                    }
                    onMovimientoChange={
                      updateMovimiento
                    }
                    onCajaChange={
                      selectCaja
                    }
                    onFormaPagoRealChange={
                      selectFormaPagoTesoreria
                    }
                    onAddMovimiento={
                      addMovimiento
                    }
                    onRemoveMovimiento={
                      removeMovimiento
                    }
                    onPagoParcialChange={
                      setPagoParcial
                    }
                    onFechaIngresoGastosChange={
                      setFechaIngresoGastos
                    }
                    onPagoDiferenteOficinaChange={
                      setPagoDiferenteOficina
                    }
                    onUsaMarkupAdicionalChange={
                      setUsaMarkupAdicional
                    }
                    onMarkupAdicionalPctChange={
                      setMarkupAdicionalPct
                    }
                    onRiesgoChange={
                      setRiesgo
                    }
                    onImporteRiesgoChange={
                      setImporteRiesgo
                    }
                    onRiesgoMotivoChange={
                      setRiesgoMotivo
                    }
                  />
                ) : null}

                {step === 4 ? (
                  <WizardConfirmacion
                    draft={draft}
                    bruto={bruto}
                    promocode={
                      promocode
                    }
                    totalFinal={
                      totalFinal
                    }
                    totalComercial={
                      totalComercial
                    }
                    totalTesoreria={
                      totalTesoreria
                    }
                    saldo={saldo}
                    importeRiesgo={
                      importeRiesgo
                    }
                    visibleEnCarritos={
                      visibleEnCarritos
                    }
                    onConfirmadoChange={
                      setConfirmado
                    }
                  />
                ) : null}
              </main>

              <div className="min-w-0 xl:sticky xl:top-0 xl:self-start">
                <WizardSummary
                  draft={draft}
                  totalFinal={
                    totalFinal
                  }
                  totalComercial={
                    totalComercial
                  }
                  totalTesoreria={
                    totalTesoreria
                  }
                  saldo={saldo}
                />
              </div>
            </div>
          </div>

          <footer className="shrink-0 border-t border-black/10 bg-[#edf3f7]/95 px-5 py-3 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-[11px] px-4 text-[12px] font-semibold text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#172033]"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    step === 1
                  }
                  onClick={
                    previousStep
                  }
                  className="h-9 rounded-[11px] border border-black/10 bg-white px-4 text-[12px] font-semibold text-[#334155] shadow-sm transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Atrás
                </button>

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={
                      nextStep
                    }
                    className="h-9 rounded-[11px] bg-[#4f7c90] px-5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#406b7d]"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={
                      saving ||
                      !draft.confirmado
                    }
                    onClick={submit}
                    className="h-9 rounded-[11px] bg-[#4f7c90] px-5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#406b7d] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Creando..."
                      : "Crear carrito"}
                  </button>
                )}
              </div>
            </div>
          </footer>
        </div>
      </aside>
    </div>,
    document.body
  );
}

export default CarritoWizard;
