import { FileDetailFooter } from "./FileDetailFooter";
import { FileDetailHeader } from "./FileDetailHeader";

import {
  useState
} from "react";

import {
  useFilesStore,
  type FileItem
} from "../../../store/filesStore";


import {
  formatMoneyAR
} from "../../../lib/formatters";

import {
  BooleanChip,
  FieldLabel,
  NosturSelect,
  TextArea,
  TextInput
} from "./FileFormControls";

import {
  NosturDateInput
} from "../../ui/NosturDateInput";

import {
  FileVoucherSection
} from "./FileVoucherSection";

import {
  FILE_ESTADO_OPTIONS,
  FILE_MONEDA_OPTIONS,
  formatDateAR,
  parseMoney,
  type SelectOption
} from "../filesModel";

export function FileDetailModal({
  file,
  onClose,
  onSaved
}: {
  file: FileItem;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const saving = useFilesStore((state) => state.saving);
  const catalogos = useFilesStore((state) => state.catalogos);
  const updateFileDetalle = useFilesStore((state) => state.updateFileDetalle);

  const [editing, setEditing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [draft, setDraft] = useState(() => ({
    operador_id: file.operador_id || "",
    operador: file.operador || "",
    servicio: file.servicio || "",
    destino: file.destino || "",
    fecha_in: file.fecha_in || "",
    fecha_out: file.fecha_out || "",
    solo_ida: Boolean(file.solo_ida),
    importe_bruto: String(file.importe_bruto ?? "").replace(".", ","),
    importe_final: String(file.importe_final ?? "").replace(".", ","),
    moneda: file.moneda || "ARS",
    neto_operador: String(file.neto_operador ?? "").replace(".", ","),
    estado: file.estado || "CARGADO",
    observaciones: file.observaciones || "",
    riesgo: Boolean(file.riesgo),
    importe_riesgo: String(file.importe_riesgo ?? "").replace(".", ","),
    riesgo_motivo: file.riesgo_motivo || "",
    fecha_vencimiento_operador: file.fecha_vencimiento_operador || "",
    saldo_pendiente_operador: String(file.saldo_pendiente_operador ?? "").replace(".", ","),
    estado_pago_operador: file.estado_pago_operador || ""
  }));

  const operadorOptions: SelectOption[] = [
    { value: "", label: "Sin operador" },
    ...catalogos.operadores.map((item) => ({
      value: item.id,
      label: item.nombre
    }))
  ];

  const servicioOptions: SelectOption[] = [
    { value: "", label: "Sin servicio" },
    ...catalogos.servicios.map((item) => ({
      value: item.nombre,
      label: item.nombre
    }))
  ];

  const estadoOptions: SelectOption[] = FILE_ESTADO_OPTIONS.filter((option) => option.value !== "todos");

  const estadoPagoOperadorOptions: SelectOption[] = [
    { value: "", label: "Sin definir" },
    { value: "PENDIENTE", label: "Pendiente" },
    { value: "PARCIAL", label: "Parcial" },
    { value: "PAGADO", label: "Pagado" },
    { value: "VENCIDO", label: "Vencido" }
  ];

  const bruto = parseMoney(draft.importe_bruto);
  const final = parseMoney(draft.importe_final);
  const neto = parseMoney(draft.neto_operador);
  const margen = final - neto;
  const saldoOperador = parseMoney(draft.saldo_pendiente_operador);

  function setField<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setLocalError(null);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (final <= 0) {
      setLocalError("El importe final debe ser mayor a cero.");
      return;
    }

    if (!draft.solo_ida && draft.fecha_out && draft.fecha_in && draft.fecha_out < draft.fecha_in) {
      setLocalError("La fecha OUT no puede ser anterior a la fecha IN.");
      return;
    }

    const selectedOperador = catalogos.operadores.find((item) => item.id === draft.operador_id);

    const ok = await updateFileDetalle(file.id, {
      operador_id: draft.operador_id || null,
      operador: selectedOperador?.nombre || draft.operador || null,
      servicio: draft.servicio || null,
      destino: draft.destino || null,
      fecha_in: draft.fecha_in || null,
      fecha_out: draft.solo_ida ? null : draft.fecha_out || null,
      solo_ida: draft.solo_ida,
      importe_bruto: bruto,
      importe_final: final,
      moneda: draft.moneda,
      neto_operador: neto,
      estado: draft.estado || "CARGADO",
      observaciones: draft.observaciones || null,
      riesgo: draft.riesgo,
      importe_riesgo: draft.riesgo ? parseMoney(draft.importe_riesgo) : 0,
      riesgo_motivo: draft.riesgo ? draft.riesgo_motivo || null : null,
      fecha_vencimiento_operador: draft.fecha_vencimiento_operador || null,
      saldo_pendiente_operador: saldoOperador,
      estado_pago_operador: draft.estado_pago_operador || null
    });

    if (ok) {
      onSaved("File actualizado correctamente.");
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/35 px-4 pt-12 backdrop-blur-sm">
      <div className="max-h-[calc(100vh-72px)] w-full max-w-4xl overflow-auto rounded-[18px] border border-black/10 bg-white p-4 text-[#172033] shadow-2xl">
        <FileDetailHeader
          file={file}
          destino={draft.destino}
          editing={editing}
          onToggleEditing={() =>
            setEditing(
              (current) => !current
            )
          }
          onClose={onClose}
        />

        {localError ? (
          <div className="mb-3 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
            {localError}
          </div>
        ) : null}

        <div className="grid gap-2.5 md:grid-cols-3">
          <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
            <FieldLabel>Cliente</FieldLabel>
            <div className="text-[13px] font-semibold text-[#172033]">
              {file.clientes?.nombre_completo || "—"}
            </div>
            <div className="text-[12px] font-normal text-[#64748b]">
              {file.clientes?.telefono || "—"}
            </div>
          </div>

          <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
            <FieldLabel>Viaje</FieldLabel>

            {editing ? (
              <TextInput
                value={draft.destino}
                onChange={(value) => setField("destino", value)}
                placeholder="Destino"
              />
            ) : (
              <>
                <div className="text-[13px] font-semibold text-[#172033]">{draft.destino || "—"}</div>
                <div className="text-[12px] font-normal text-[#64748b]">
                  {formatDateAR(draft.fecha_in)} →{" "}
                  {draft.solo_ida ? "Solo ida" : formatDateAR(draft.fecha_out)}
                </div>
              </>
            )}
          </div>

          <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
            <FieldLabel>Total</FieldLabel>

            {editing ? (
              <div className="grid grid-cols-[1fr_92px] gap-2">
                <TextInput
                  value={draft.importe_final}
                  onChange={(value) => setField("importe_final", value)}
                  placeholder="0,00"
                  inputMode="decimal"
                />

                <NosturSelect
                  value={draft.moneda}
                  onChange={(value) => setField("moneda", value)}
                  options={FILE_MONEDA_OPTIONS}
                />
              </div>
            ) : (
              <>
                <div className="text-[13px] font-semibold text-[#172033]">
                  {formatMoneyAR(final, draft.moneda)}
                </div>
                <div className="text-[12px] font-normal text-[#64748b]">{draft.estado}</div>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 grid gap-2.5 md:grid-cols-2">
          <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3 text-[12px] font-normal text-[#475569]">
            {editing ? (
              <div className="grid gap-3">
                <div>
                  <FieldLabel>Servicio</FieldLabel>
                  <NosturSelect
                    value={draft.servicio}
                    onChange={(value) => setField("servicio", value)}
                    options={servicioOptions}
                    placeholder="Seleccionar servicio"
                  />
                </div>

                <div>
                  <FieldLabel>Operador</FieldLabel>
                  <NosturSelect
                    value={draft.operador_id}
                    onChange={(value) => {
                      const selected = catalogos.operadores.find((item) => item.id === value);
                      setField("operador_id", value);
                      setField("operador", selected?.nombre || "");
                    }}
                    options={operadorOptions}
                    placeholder="Seleccionar operador"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>Fecha IN</FieldLabel>
                    <NosturDateInput
                      value={draft.fecha_in}
                      onChange={(value) => {
                        setField("fecha_in", value);

                        if (draft.fecha_out && value && draft.fecha_out < value) {
                          setField("fecha_out", value);
                        }
                      }}
                    />
                  </div>

                  <div>
                    <FieldLabel>Fecha OUT</FieldLabel>
                    {draft.solo_ida ? (
                      <div className="flex h-8 items-center rounded-[10px] border border-black/10 bg-white px-3 text-[12px] text-[#94a3b8]">
                        Solo ida
                      </div>
                    ) : (
                      <NosturDateInput
                        value={draft.fecha_out}
                        onChange={(value) => setField("fecha_out", value)}
                        min={draft.fecha_in || undefined}
                      />
                    )}
                  </div>
                </div>

                <BooleanChip
                  checked={draft.solo_ida}
                  onChange={(value) => {
                    setField("solo_ida", value);
                    if (value) setField("fecha_out", "");
                  }}
                  label="Solo ida"
                />

                <div>
                  <FieldLabel>Estado file</FieldLabel>
                  <NosturSelect
                    value={draft.estado}
                    onChange={(value) => setField("estado", value)}
                    options={estadoOptions}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="mb-1.5">
                  Servicio: <strong className="font-semibold">{file.servicio || "—"}</strong>
                </div>
                <div className="mb-1.5">
                  Método contacto: <strong className="font-semibold">{file.metodo_contacto || "—"}</strong>
                </div>
                <div className="mb-1.5">
                  Operador: <strong className="font-semibold">{file.operador || "—"}</strong>
                </div>
                <div className="mb-1.5">
                  Vendedor: <strong className="font-semibold">{file.vendedor || "—"}</strong>
                </div>
                <div>
                  Riesgo: <strong className="font-semibold">{file.riesgo ? "SÍ" : "NO"}</strong>
                </div>
              </>
            )}
          </div>

          <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3 text-[12px] font-normal text-[#475569]">
            {editing ? (
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>Bruto</FieldLabel>
                    <TextInput
                      value={draft.importe_bruto}
                      onChange={(value) => setField("importe_bruto", value)}
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                  </div>

                  <div>
                    <FieldLabel>Neto operador</FieldLabel>
                    <TextInput
                      value={draft.neto_operador}
                      onChange={(value) => {
                        setField("neto_operador", value);

                        if (
                          !draft.saldo_pendiente_operador ||
                          parseMoney(draft.saldo_pendiente_operador) === 0
                        ) {
                          setField("saldo_pendiente_operador", value);
                        }
                      }}
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>Vencimiento operador</FieldLabel>
                    <NosturDateInput
                      value={draft.fecha_vencimiento_operador}
                      onChange={(value) => setField("fecha_vencimiento_operador", value)}
                    />
                  </div>

                  <div>
                    <FieldLabel>Saldo operador</FieldLabel>
                    <TextInput
                      value={draft.saldo_pendiente_operador}
                      onChange={(value) => setField("saldo_pendiente_operador", value)}
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel>Estado pago operador</FieldLabel>
                  <NosturSelect
                    value={draft.estado_pago_operador}
                    onChange={(value) => setField("estado_pago_operador", value)}
                    options={estadoPagoOperadorOptions}
                  />
                </div>

                <BooleanChip
                  checked={draft.riesgo}
                  onChange={(value) => {
                    setField("riesgo", value);
                    if (!value) {
                      setField("importe_riesgo", "");
                      setField("riesgo_motivo", "");
                    }
                  }}
                  label="Riesgo operador"
                />

                {draft.riesgo ? (
                  <div className="grid grid-cols-[160px_1fr] gap-2">
                    <div>
                      <FieldLabel>Importe riesgo</FieldLabel>
                      <TextInput
                        value={draft.importe_riesgo}
                        onChange={(value) => setField("importe_riesgo", value)}
                        placeholder="0,00"
                        inputMode="decimal"
                      />
                    </div>

                    <div>
                      <FieldLabel>Motivo riesgo</FieldLabel>
                      <TextInput
                        value={draft.riesgo_motivo}
                        onChange={(value) => setField("riesgo_motivo", value)}
                        placeholder="Motivo"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <div className="mb-1.5">
                  Bruto:{" "}
                  <strong className="font-semibold">
                    {formatMoneyAR(file.importe_bruto, file.moneda)}
                  </strong>
                </div>
                <div className="mb-1.5">
                  Neto operador:{" "}
                  <strong className="font-semibold">
                    {formatMoneyAR(file.neto_operador, file.moneda)}
                  </strong>
                </div>
                <div className="mb-1.5">
                  Pagado:{" "}
                  <strong className="font-semibold">
                    {formatMoneyAR(file.total_pagado, file.moneda)}
                  </strong>
                </div>
                <div className="mb-1.5">
                  Saldo pasajero:{" "}
                  <strong className="font-semibold">
                    {formatMoneyAR(file.saldo_cta_cte, file.moneda)}
                  </strong>
                </div>
                <div className="mb-1.5">
                  Saldo operador:{" "}
                  <strong className="font-semibold">
                    {formatMoneyAR(file.saldo_pendiente_operador || 0, file.moneda)}
                  </strong>
                </div>
                <div>
                  Estado operador:{" "}
                  <strong className="font-semibold">{file.estado_pago_operador || "—"}</strong>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 rounded-[14px] border border-black/10 bg-white p-3 text-[12px]">
          <div className="flex justify-between gap-3">
            <span className="text-[#64748b]">Importe final</span>
            <strong className="font-semibold">{formatMoneyAR(final, draft.moneda)}</strong>
          </div>

          <div className="flex justify-between gap-3">
            <span className="text-[#64748b]">Neto operador</span>
            <strong className="font-semibold">{formatMoneyAR(neto, draft.moneda)}</strong>
          </div>

          <div className="mt-2 flex justify-between gap-3 border-t border-black/10 pt-2">
            <span className="font-semibold text-[#172033]">Margen estimado</span>
            <strong className={margen >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>
              {formatMoneyAR(margen, draft.moneda)}
            </strong>
          </div>
        </div>

        {editing ? (
          <div className="mt-3">
            <FieldLabel>Observaciones</FieldLabel>
            <TextArea
              value={draft.observaciones}
              onChange={(value) => setField("observaciones", value)}
              placeholder="Notas internas del file..."
            />
          </div>
        ) : file.observaciones ? (
          <div className="mt-3 rounded-[14px] border border-black/10 bg-[#f8fafc] p-3 text-[12px] font-normal text-[#475569]">
            <strong className="font-semibold">Observaciones:</strong> {file.observaciones}
          </div>
        ) : null}

        {file.riesgo && !editing ? (
          <div className="mt-3 rounded-[14px] border border-red-200 bg-red-50 p-3 text-[12px] font-medium text-red-700">
            <strong>Motivo riesgo:</strong> {file.riesgo_motivo || "Sin motivo cargado"}
          </div>
        ) : null}
        <FileVoucherSection
          file={file}
          onSaved={onSaved}
          onError={setLocalError}
        />

        <FileDetailFooter
          editing={editing}
          saving={saving}
          onClose={onClose}
          onSave={save}
        />
      </div>
    </div>
  );
}
