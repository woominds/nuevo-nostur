import { FilesFilters } from "./components/FilesFilters";
import { FilesMetrics } from "./components/FilesMetrics";
import { FilesHeader } from "./components/FilesHeader";
// src/modules/files/FilesPanel.tsx

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { printFileVoucherPdf } from "../../lib/fileVoucherPdf";
import {
  Eye,
  ToggleLeft,
  ToggleRight,
  UserRound,
  X
} from "lucide-react";
import {
  useFilesStore,
  type FileItem,
} from "../../store/filesStore";
import { IconButton } from "../ui/IconButton";
import { formatMoneyAR } from "../../lib/formatters";
import { FilesWizardModal } from "./components/FilesWizardModal";
import { FileDetailModal } from "./components/FileDetailModal";

type SelectOption = {
  value: string;
  label: string;
};


type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

const ESTADO_OPTIONS: SelectOption[] = [
  { value: "todos", label: "Todos" },
  { value: "CARGADO", label: "Cargado" },
  { value: "PENDIENTE_OPERADOR", label: "Pendiente operador" },
  { value: "CONTROLADO", label: "Controlado" },
  { value: "FACTURADO", label: "Facturado" },
  { value: "COBRADO", label: "Cobrado" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "CTA_CTE", label: "Cta Cte" }
];


const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];


function getToday(): string {
  const now = new Date();
  const argentinaNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Argentina/Cordoba" })
  );
  const year = argentinaNow.getFullYear();
  const month = String(argentinaNow.getMonth() + 1).padStart(2, "0");
  const day = String(argentinaNow.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentMonthValue(): string {
  const today = getToday();
  return today.slice(0, 7);
}

function shiftMonthValue(monthValue: string, offset: number): string {
  const [yearRaw, monthRaw] = monthValue.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (!year || !month) return getCurrentMonthValue();

  const date = new Date(year, month - 1 + offset, 1);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");

  return `${nextYear}-${nextMonth}`;
}

function getMonthLabel(monthValue: string): string {
  const [yearRaw, monthRaw] = monthValue.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (!year || !month) return monthValue;

  const monthName = MONTH_NAMES[month - 1] || monthRaw;

  return `${monthName} ${year}`;
}

function toDisplayDate(value?: string | null): string {
  if (!value) return "";

  const clean = value.slice(0, 10);
  const [year, month, day] = clean.split("-");

  if (!year || !month || !day) return "";

  return `${day}/${month}/${year}`;
}



function formatDateAR(value?: string | null): string {
  if (!value) return "—";
  return toDisplayDate(value) || "—";
}





function parseMoney(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const normalized = String(value || "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}


function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
}





function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#64748b]">
      {children}
    </label>
  );
}





function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      onClose();
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed right-5 top-5 z-[260] w-[300px] rounded-[14px] border border-black/10 bg-white px-3.5 py-3 text-[12px] shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={[
              "mb-0.5 font-semibold",
              toast.type === "success" ? "text-emerald-700" : "text-red-700"
            ].join(" ")}
          >
            {toast.type === "success" ? "Operación exitosa" : "Atención"}
          </div>

          <div className="font-normal leading-relaxed text-[#334155]">{toast.message}</div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#172033]"
          aria-label="Cerrar aviso"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}


export function FilesPanel() {
  const loading = useFilesStore((state) => state.loading);
  const saving = useFilesStore((state) => state.saving);
  const error = useFilesStore((state) => state.error);
  const filters = useFilesStore((state) => state.filters);
  const catalogos = useFilesStore((state) => state.catalogos);
  const selectedFileId = useFilesStore((state) => state.selectedFileId);
    const vouchers = useFilesStore((state) => state.vouchers);
  const voucherServicios = useFilesStore((state) => state.voucherServicios);

  const loadFiles = useFilesStore((state) => state.loadFiles);
  const setFilter = useFilesStore((state) => state.setFilter);
  const clearError = useFilesStore((state) => state.clearError);
  const selectFile = useFilesStore((state) => state.selectFile);
  const toggleFileActivo = useFilesStore((state) => state.toggleFileActivo);

  const getFilteredFiles = useFilesStore((state) => state.getFilteredFiles);
  const getMetrics = useFilesStore((state) => state.getMetrics);

  const files = getFilteredFiles();
  const metrics = getMetrics();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [detailFile, setDetailFile] = useState<FileItem | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const selectedFile = useMemo(
    () => files.find((file) => file.id === selectedFileId) || files[0] || null,
    [files, selectedFileId]
  );

    const selectedVoucher = useMemo(
    () => (selectedFile ? vouchers.find((voucher) => voucher.file_id === selectedFile.id) || null : null),
    [selectedFile, vouchers]
  );

  const selectedVoucherServicios = useMemo(
    () =>
      selectedVoucher
        ? voucherServicios.filter((servicio) => servicio.voucher_id === selectedVoucher.id)
        : [],
    [selectedVoucher, voucherServicios]
  );

  const selectedMonthLabel = getMonthLabel(filters.mes);
  const currentMonthValue = getCurrentMonthValue();

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ type, message });
  }

  function applyMonthAndReload(monthValue: string) {
    setFilter("mes", monthValue);

    window.setTimeout(() => {
      loadFiles();
    }, 0);
  }

  function goToPreviousMonth() {
    applyMonthAndReload(shiftMonthValue(filters.mes, -1));
  }

  function goToNextMonth() {
    applyMonthAndReload(shiftMonthValue(filters.mes, 1));
  }

  function goToCurrentMonth() {
    applyMonthAndReload(currentMonthValue);
  }

  async function handleToggle(file: FileItem) {
    const ok = await toggleFileActivo(file);

    if (ok) showToast(file.activo ? "File desactivado." : "File activado.");
  }

    function handlePrintSelectedVoucher() {
    if (!selectedFile || !selectedVoucher) {
      showToast("Este file no tiene voucher cargado.", "error");
      return;
    }

    try {
      printFileVoucherPdf({
        file: selectedFile,
        voucher: selectedVoucher,
        servicios: selectedVoucherServicios
      });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "No se pudo generar el voucher.", "error");
    }
  }

  const vendedorOptions: SelectOption[] = [
    { value: "todos", label: "Todos" },
    ...catalogos.vendedores.map((item) => ({
      value: item.id,
      label: `${item.nombre} ${item.apellido}`.trim()
    }))
  ];

  const sucursalOptions: SelectOption[] = [
    { value: "todos", label: "Todas" },
    ...catalogos.sucursales.map((item) => ({
      value: item.id,
      label: item.nombre
    }))
  ];

  const operadorOptions: SelectOption[] = [
    { value: "todos", label: "Todos" },
    ...catalogos.operadores.map((item) => ({
      value: item.id,
      label: item.nombre
    }))
  ];

  const activoOptions: SelectOption[] = [
    { value: "activos", label: "Activos" },
    { value: "inactivos", label: "Inactivos" },
    { value: "todos", label: "Todos" }
  ];

  const selectedVendedorFilterLabel =
    vendedorOptions.find((option) => option.value === filters.vendedorId)?.label || "Todos";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#edf3f7] text-[#172033]">
      <FilesHeader
        loading={loading}
        onRefresh={loadFiles}
        onCreate={() =>
          setWizardOpen(true)
        }
      />

      <main className="min-h-0 flex-1 overflow-auto p-3.5">
        {error ? (
          <div className="mb-3 flex items-start justify-between gap-3 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-medium text-red-700">
            <span>{error}</span>
            <button type="button" onClick={clearError} className="text-red-500 hover:text-red-700">
              <X size={14} />
            </button>
          </div>
        ) : null}

        <FilesFilters
          open={filtersOpen}
          monthLabel={selectedMonthLabel}
          monthValue={filters.mes}
          currentMonthValue={currentMonthValue}
          desde={filters.desde}
          hasta={filters.hasta}
          estado={filters.estado}
          operadorId={filters.operadorId}
          vendedorId={filters.vendedorId}
          sucursalId={filters.sucursalId}
          activo={filters.activo}
          search={filters.search}
          selectedVendedorLabel={selectedVendedorFilterLabel}
          estadoOptions={ESTADO_OPTIONS}
          operadorOptions={operadorOptions}
          vendedorOptions={vendedorOptions}
          sucursalOptions={sucursalOptions}
          activoOptions={activoOptions}
          onToggleOpen={() =>
            setFiltersOpen(
              (current) => !current
            )
          }
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onCurrentMonth={goToCurrentMonth}
          onDesdeChange={(value) =>
            setFilter("desde", value)
          }
          onHastaChange={(value) =>
            setFilter("hasta", value)
          }
          onEstadoChange={(value) =>
            setFilter("estado", value)
          }
          onOperadorChange={(value) =>
            setFilter("operadorId", value)
          }
          onVendedorChange={(value) =>
            setFilter("vendedorId", value)
          }
          onSucursalChange={(value) =>
            setFilter("sucursalId", value)
          }
          onActivoChange={(value) =>
            setFilter(
              "activo",
              value as typeof filters.activo
            )
          }
          onSearchChange={(value) =>
            setFilter("search", value)
          }
          onApply={loadFiles}
        />

        <FilesMetrics
          metrics={metrics}
        />

        <div className="relative z-0 grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 rounded-[16px] border border-black/10 bg-white/62 p-3 shadow-sm backdrop-blur-xl">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold text-[#172033]">Listado de files</h2>
                <p className="text-[11.5px] font-normal text-[#64748b]">
                  {loading ? "Cargando..." : `${files.length} files cargados`}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-5 text-center text-[12px] font-normal text-[#64748b]">
                Cargando files...
              </div>
            ) : files.length === 0 ? (
              <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-5 text-center text-[12px] font-normal text-[#64748b]">
                No hay files para los filtros seleccionados.
              </div>
            ) : (
              <div className="grid gap-1.5">
                {files.map((file) => {
                  const selected = selectedFile?.id === file.id;
                  const cliente = file.clientes;
                  const margen = parseMoney(file.importe_final) - parseMoney(file.neto_operador);

                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => selectFile(file.id)}
                      className={[
                        "grid min-w-0 gap-2 rounded-[12px] border px-2.5 py-2 text-left transition lg:grid-cols-[1.35fr_1.15fr_1fr_128px_136px]",
                        selected
                          ? "border-[#4f7c90]/50 bg-[#eef6f7]"
                          : "border-black/10 bg-[#f8fafc] hover:bg-white"
                      ].join(" ")}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[12px] font-semibold text-[#172033]">
                          {cliente?.nombre_completo || "Sin cliente"}
                        </div>
                        <div className="truncate text-[11px] font-normal text-[#64748b]">
                          {cliente?.telefono || "—"}
                        </div>
                        <div className="truncate text-[11px] font-medium text-[#4f7c90]">
                          {file.numero_file}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-[12px] font-semibold text-[#172033]">
                          {file.destino || "Sin destino"}
                        </div>
                        <div className="truncate text-[11px] font-normal text-[#64748b]">
                          {formatDateAR(file.fecha_in)} →{" "}
                          {file.solo_ida ? "Solo ida" : formatDateAR(file.fecha_out)}
                        </div>
                        <div className="truncate text-[11px] font-normal text-[#64748b]">
                          {file.servicio || "Sin servicio"} ·{" "}
                          {file.metodo_contacto || "Sin método"}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-[#172033]">
                          {formatMoneyAR(file.importe_final, file.moneda)}
                        </div>
                        <div className="text-[11px] font-normal text-[#64748b]">
                          Margen {formatMoneyAR(margen, file.moneda)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        <span className="rounded-md border border-black/10 bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#334155]">
                          {file.estado}
                        </span>

                        {file.riesgo ? (
                          <span className="rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                            Riesgo
                          </span>
                        ) : null}

                        {parseMoney(file.neto_operador) <= 0 ? (
                          <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            Falta neto
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon={Eye}
                          label="Ver detalle"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDetailFile(file);
                          }}
                        />

                        <IconButton
                          icon={file.activo ? ToggleRight : ToggleLeft}
                          label={file.activo ? "Desactivar" : "Activar"}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleToggle(file);
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="min-w-0 rounded-[16px] border border-black/10 bg-white/68 p-3 shadow-sm backdrop-blur-xl">
            {selectedFile ? (
              <>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#4f7c90] text-[12px] font-semibold text-white">
                      {getInitials(selectedFile.clientes?.nombre_completo || "C")}
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-[13.5px] font-semibold text-[#172033]">
                        {selectedFile.numero_file}
                      </h2>
                      <p className="truncate text-[11.5px] font-normal text-[#64748b]">
                        {selectedFile.clientes?.nombre_completo || "Sin cliente"}
                      </p>
                    </div>
                  </div>

                  {selectedFile.riesgo ? (
                    <span className="rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                      Riesgo
                    </span>
                  ) : null}
                </div>

                <div className="grid gap-2.5 text-[12px]">
                  <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      <UserRound size={14} className="text-[#4f7c90]" />
                      <span className="truncate font-semibold text-[#172033]">
                        {selectedFile.clientes?.nombre_completo || "Sin cliente"}
                      </span>
                    </div>
                    <div className="font-normal text-[#64748b]">
                      {selectedFile.clientes?.telefono || "—"}
                    </div>
                    <div className="font-normal text-[#64748b]">
                      {selectedFile.clientes?.email || "Sin email"}
                    </div>
                  </div>

                  <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
                    <FieldLabel>Viaje</FieldLabel>
                    <div className="font-semibold text-[#172033]">
                      {selectedFile.destino || "Sin destino"}
                    </div>
                    <div className="font-normal text-[#64748b]">
                      {formatDateAR(selectedFile.fecha_in)} →{" "}
                      {selectedFile.solo_ida ? "Solo ida" : formatDateAR(selectedFile.fecha_out)}
                    </div>
                  </div>

                  <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
                    <FieldLabel>Operador</FieldLabel>
                    <div className="font-semibold text-[#172033]">
                      {selectedFile.operador || "Sin operador"}
                    </div>
                    <div className="font-normal text-[#64748b]">
                      {selectedFile.servicio || "Sin servicio"}
                    </div>
                  </div>

                  <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
                    <FieldLabel>Importes</FieldLabel>
                    <div className="flex justify-between">
                      <span>Bruto</span>
                      <strong className="font-semibold">
                        {formatMoneyAR(selectedFile.importe_bruto, selectedFile.moneda)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Neto operador</span>
                      <strong className="font-semibold">
                        {formatMoneyAR(selectedFile.neto_operador, selectedFile.moneda)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Final</span>
                      <strong className="font-semibold">
                        {formatMoneyAR(selectedFile.importe_final, selectedFile.moneda)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Margen</span>
                      <strong className="font-semibold">
                        {formatMoneyAR(
                          parseMoney(selectedFile.importe_final) - parseMoney(selectedFile.neto_operador),
                          selectedFile.moneda
                        )}
                      </strong>
                    </div>
                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailFile(selectedFile)}
                      className="h-8 rounded-[10px] border border-black/10 bg-white text-[12px] font-medium text-[#334155] hover:bg-[#f8fafc]"
                    >
                      Ver / editar
                    </button>

                    <button
                      type="button"
                      onClick={() => setDetailFile(selectedFile)}
                      className="h-8 rounded-[10px] border border-black/10 bg-white text-[12px] font-medium text-[#334155] hover:bg-[#f8fafc]"
                    >
                      Operador
                    </button>

                    {selectedVoucher ? (
                      <button
                        type="button"
                        onClick={handlePrintSelectedVoucher}
                        className="col-span-2 h-8 rounded-[10px] bg-[#4f7c90] text-[12px] font-medium text-white shadow-sm hover:bg-[#406b7d]"
                      >
                        Generar voucher PDF
                      </button>
                                    ) : (
                      <button
                        type="button"
                        onClick={() => setDetailFile(selectedFile)}
                        className="col-span-2 h-8 rounded-[10px] border border-[#4f7c90]/30 bg-[#eef6f7] text-[12px] font-medium text-[#172033] hover:bg-white"
                      >
                        Ver / generar voucher
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggle(selectedFile)}
                      disabled={saving}
                      className="col-span-2 h-8 rounded-[10px] border border-red-200 bg-red-50 text-[12px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      {selectedFile.activo ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-5 text-center text-[12px] font-normal text-[#64748b]">
                Seleccioná un file para ver el detalle.
              </div>
            )}
          </aside>
        </div>
      </main>

      <Toast toast={toast} onClose={() => setToast(null)} />

      {wizardOpen ? (
        <FilesWizardModal
          onClose={() => setWizardOpen(false)}
          onSaved={(message) => showToast(message)}
        />
      ) : null}

      {detailFile ? (
        <FileDetailModal
          file={detailFile}
          onClose={() => setDetailFile(null)}
          onSaved={(message) => showToast(message)}
        />
      ) : null}
    </div>
  );
}

export default FilesPanel;