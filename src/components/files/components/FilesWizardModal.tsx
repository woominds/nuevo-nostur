import {
  createPortal
} from "react-dom";

import {
  Save,
  Trash2,
  X
} from "lucide-react";

import {
  useFileWizard
} from "../hooks/useFileWizard";

import {
  FileWizardCliente
} from "./FileWizardCliente";

import {
  FileWizardConfirmacion
} from "./FileWizardConfirmacion";

import {
  FileWizardPagos
} from "./FileWizardPagos";

import {
  FileWizardStepper
} from "./FileWizardStepper";

import {
  FileWizardSummary
} from "./FileWizardSummary";

import {
  FileWizardVenta
} from "./FileWizardVenta";

type FilesWizardModalProps = {
  onClose: () => void;

  onSaved: (
    message: string
  ) => void;
};

export function FilesWizardModal({
  onClose,
  onSaved
}: FilesWizardModalProps) {
  const wizard = useFileWizard({
    onClose,
    onSaved
  });

  async function handleCreateDestino(
    nombre: string
  ): Promise<void> {
    await wizard.createDestinoInline(
      nombre
    );
  }

  return createPortal(
    <div className="pointer-events-none fixed bottom-0 right-0 top-[39px] z-[190] flex justify-end">
      <aside className="pointer-events-auto h-full w-full max-w-[980px] overflow-hidden border-l border-black/10 bg-[#edf3f7] text-[#172033] shadow-2xl">
        <div className="flex h-full min-h-0 flex-col">
          <header className="shrink-0 border-b border-black/10 bg-white/90 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-[17px] font-semibold text-[#172033]">
                  Nuevo file
                </h2>

                <p className="mt-0.5 text-[12px] text-[#64748b]">
                  Cliente → Venta → Pagos → Confirmación
                </p>

                {wizard.draftSavedAt ? (
                  <p className="mt-1 text-[10.5px] text-[#94a3b8]">
                    Borrador guardado a las{" "}
                    {wizard.draftSavedAt}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={
                    wizard.saveDraftManually
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-black/10 bg-white px-3 text-[11.5px] font-medium text-[#334155] hover:bg-[#f8fafc]"
                >
                  <Save size={13} />
                  Guardar borrador
                </button>

                <button
                  type="button"
                  onClick={
                    wizard.discardDraft
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-red-200 bg-red-50 px-3 text-[11.5px] font-medium text-red-600 hover:bg-red-100"
                >
                  <Trash2 size={13} />
                  Descartar
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#172033]"
                  aria-label="Cerrar nuevo file"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            <FileWizardStepper
              step={wizard.step}
            />

            {wizard.wizardError ? (
              <div className="mb-3 flex items-start justify-between gap-3 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-medium text-red-700">
                <span>
                  {wizard.wizardError}
                </span>

                <button
                  type="button"
                  onClick={
                    wizard.clearWizardError
                  }
                  className="shrink-0 text-red-500 hover:text-red-700"
                  aria-label="Cerrar error"
                >
                  <X size={14} />
                </button>
              </div>
            ) : null}

            <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_290px]">
              <main className="min-w-0 rounded-[16px] border border-black/10 bg-white p-4 shadow-sm">
                {wizard.step === 1 ? (
                  <FileWizardCliente
                    draft={wizard.draft}
                    clientesSearch={
                      wizard.clientesSearch
                    }
                    metodoOptions={
                      wizard.metodoOptions
                    }
                    vendedorOptions={
                      wizard.vendedorOptions
                    }
                    sucursalOptions={
                      wizard.sucursalOptions
                    }
                    canManageFiles={
                      wizard.canManageFiles
                    }
                    onPhoneChange={
                      wizard.setPhone
                    }
                    onSelectCliente={
                      wizard.selectCliente
                    }
                    onClienteChange={
                      wizard.setCliente
                    }
                  />
                ) : null}

                {wizard.step === 2 ? (
                  <FileWizardVenta
                    draft={wizard.draft}
                    operadorOptions={
                      wizard.operadorOptions
                    }
                    servicioOptions={
                      wizard.servicioOptions
                    }
                    destinoOptions={
                      wizard.destinoOptions
                    }
                    venta={wizard.venta}
                    netoOperador={
                      wizard.netoOperador
                    }
                    utilidad={
                      wizard.utilidad
                    }
                    onVentaChange={
                      wizard.setVenta
                    }
                    onSelectOperador={
                      wizard.selectOperador
                    }
                    onSetMoneda={
                      wizard.setMoneda
                    }
                    onCreateDestino={
                      handleCreateDestino
                    }
                    onVoucherChange={
                      wizard.setVoucher
                    }
                    onRequiereVoucher={
                      wizard.setRequiereVoucher
                    }
                    onUpdateVoucherServicio={
                      wizard.updateVoucherServicio
                    }
                    onAddVoucherServicio={
                      wizard.addVoucherServicio
                    }
                    onRemoveVoucherServicio={
                      wizard.removeVoucherServicio
                    }
                  />
                ) : null}

                {wizard.step === 3 ? (
                  <FileWizardPagos
                    draft={wizard.draft}
                    venta={wizard.venta}
                    totalPagosComerciales={
                      wizard.totalPagosComerciales
                    }
                    totalTesoreria={
                      wizard.totalTesoreria
                    }
                    saldo={wizard.saldo}
                    formaPagoOptions={
                      wizard.formaPagoOptions
                    }
                    cajaOptions={
                      wizard.cajaOptions
                    }
                    onUpdatePago={
                      wizard.updatePago
                    }
                    onSelectFormaPagoComercial={
                      wizard.selectFormaPagoComercial
                    }
                    onAddPago={
                      wizard.addPago
                    }
                    onRemovePago={
                      wizard.removePago
                    }
                    onSetPagoDiferenteOficina={
                      wizard.setPagoDiferenteOficina
                    }
                    onUpdateMovimiento={
                      wizard.updateMovimiento
                    }
                    onSelectCaja={
                      wizard.selectCaja
                    }
                    onSelectFormaPagoReal={
                      wizard.selectFormaPagoReal
                    }
                    onAddMovimiento={
                      wizard.addMovimiento
                    }
                    onRemoveMovimiento={
                      wizard.removeMovimiento
                    }
                    onPagoParcial={
                      wizard.setPagoParcial
                    }
                    onFechaIngresoGastos={
                      wizard.setFechaIngresoGastos
                    }
                    onMarkup={
                      wizard.setUsaMarkupAdicional
                    }
                    onMarkupPct={
                      wizard.setMarkupAdicionalPct
                    }
                  />
                ) : null}

                {wizard.step === 4 ? (
                  <FileWizardConfirmacion
                    draft={wizard.draft}
                    venta={wizard.venta}
                    netoOperador={
                      wizard.netoOperador
                    }
                    utilidad={
                      wizard.utilidad
                    }
                    totalPagosComerciales={
                      wizard.totalPagosComerciales
                    }
                    totalTesoreria={
                      wizard.totalTesoreria
                    }
                    saldo={wizard.saldo}
                    visibleEnFiles={
                      wizard.visibleEnFiles
                    }
                    onConfirmado={
                      wizard.setConfirmado
                    }
                  />
                ) : null}
              </main>

              <FileWizardSummary
                draft={wizard.draft}
                venta={wizard.venta}
                netoOperador={
                  wizard.netoOperador
                }
                utilidad={
                  wizard.utilidad
                }
                totalComercial={
                  wizard.totalPagosComerciales
                }
                totalTesoreria={
                  wizard.totalTesoreria
                }
                saldo={wizard.saldo}
              />
            </div>

            <footer className="sticky bottom-0 mt-4 flex items-center justify-between gap-3 border-t border-black/10 bg-[#edf3f7]/95 py-3 backdrop-blur">
              <button
                type="button"
                onClick={onClose}
                className="h-8 rounded-[10px] px-3 text-[12px] font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#172033]"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    wizard.step === 1 ||
                    wizard.saving
                  }
                  onClick={
                    wizard.previousStep
                  }
                  className="h-8 rounded-[10px] border border-black/10 bg-white px-4 text-[12px] font-medium text-[#334155] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Atrás
                </button>

                {wizard.step < 4 ? (
                  <button
                    type="button"
                    disabled={
                      wizard.saving
                    }
                    onClick={
                      wizard.nextStep
                    }
                    className="h-8 rounded-[10px] bg-[#4f7c90] px-4 text-[12px] font-medium text-white shadow-sm hover:bg-[#406b7d] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={
                      wizard.saving ||
                      !wizard.draft.confirmado
                    }
                    onClick={() =>
                      void wizard.submit()
                    }
                    className="h-8 rounded-[10px] bg-[#4f7c90] px-4 text-[12px] font-medium text-white shadow-sm hover:bg-[#406b7d] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {wizard.saving
                      ? "Creando..."
                      : "Crear file"}
                  </button>
                )}
              </div>
            </footer>
          </div>
        </div>
      </aside>
    </div>,
    document.body
  );
}

export default FilesWizardModal;
