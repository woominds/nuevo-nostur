import {
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode
} from "react";

import {
  AlertTriangle,
  RotateCcw,
  Search,
  X
} from "lucide-react";

import {
  formatNumeroCarrito,
  useControlVentasStore
} from "../../store/controlVentasStore";

import {
  NosturDateInput
} from "../ui/NosturDateInput";

import {
  formatMoneyAR
} from "../../lib/formatters";

type ControlVentaReversionModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (
    message: string
  ) => void;
};

function getToday(): string {
  const now = new Date();

  const argentinaNow =
    new Date(
      now.toLocaleString(
        "en-US",
        {
          timeZone:
            "America/Argentina/Cordoba"
        }
      )
    );

  const year =
    argentinaNow.getFullYear();

  const month =
    String(
      argentinaNow.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      argentinaNow.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseMoney(
  value:
    | string
    | number
    | null
    | undefined
): number {
  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  const raw =
    String(value || "")
      .trim();

  if (!raw) return 0;

  let normalized =
    raw
      .replace(/\s/g, "")
      .replace(/\$/g, "")
      .replace(/ARS/gi, "")
      .replace(/USD/gi, "");

  const hasComma =
    normalized.includes(",");

  const hasDot =
    normalized.includes(".");

  if (
    hasComma &&
    hasDot
  ) {
    const lastComma =
      normalized.lastIndexOf(",");

    const lastDot =
      normalized.lastIndexOf(".");

    if (
      lastComma >
      lastDot
    ) {
      normalized =
        normalized
          .replace(/\./g, "")
          .replace(",", ".");
    } else {
      normalized =
        normalized.replace(
          /,/g,
          ""
        );
    }
  } else if (hasComma) {
    normalized =
      normalized
        .replace(/\./g, "")
        .replace(",", ".");
  }

  normalized =
    normalized.replace(
      /[^\d.-]/g,
      ""
    );

  const parsed =
    Number(normalized);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function formatInputMoney(
  value: number
): string {
  if (!value) return "";

  return new Intl.NumberFormat(
    "es-AR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  ).format(value);
}

function formatDateAR(
  value?: string | null
): string {
  if (!value) return "—";

  const [
    year,
    month,
    day
  ] = value
    .slice(0, 10)
    .split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return "—";
  }

  return `${day}/${month}/${year}`;
}

function FieldLabel({
  children
}: {
  children: ReactNode;
}) {
  return (
    <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#64748b]">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  inputMode = "text",
  disabled = false
}: {
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  disabled?: boolean;
}) {
  return (
    <input
      value={value}
      disabled={disabled}
      inputMode={inputMode}
      placeholder={placeholder}
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      className="h-9 w-full rounded-[10px] border border-black/10 bg-white px-3 text-[12px] font-normal text-[#172033] outline-none transition placeholder:text-[#94a3b8] focus:border-[#4f7c90] disabled:bg-[#f8fafc] disabled:text-[#94a3b8]"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      placeholder={placeholder}
      className="min-h-[82px] w-full resize-none rounded-[10px] border border-black/10 bg-white px-3 py-2 text-[12px] font-normal leading-relaxed text-[#172033] outline-none transition placeholder:text-[#94a3b8] focus:border-[#4f7c90]"
    />
  );
}

function InfoRow({
  label,
  value,
  strong = false
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-[#64748b]">
        {label}
      </span>

      <span
        className={
          strong
            ? "text-right font-semibold text-[#172033]"
            : "text-right font-medium text-[#334155]"
        }
      >
        {value}
      </span>
    </div>
  );
}

export function ControlVentaReversionModal({
  open,
  onClose,
  onSaved
}: ControlVentaReversionModalProps) {
  const saving =
    useControlVentasStore(
      (state) =>
        state.saving
    );

  const loading =
    useControlVentasStore(
      (state) =>
        state.reversionSearchLoading
    );

  const carrito =
    useControlVentasStore(
      (state) =>
        state.reversionCarrito
    );

  const reversiones =
    useControlVentasStore(
      (state) =>
        state.reversionesAlmundo
    );

  const buscarCarrito =
    useControlVentasStore(
      (state) =>
        state.buscarCarritoParaReversion
    );

  const registrarReversion =
    useControlVentasStore(
      (state) =>
        state.registrarReversionAlmundo
    );

  const clearSearch =
    useControlVentasStore(
      (state) =>
        state.clearReversionSearch
    );

  const storeError =
    useControlVentasStore(
      (state) =>
        state.error
    );

  const [
    numeroCarrito,
    setNumeroCarrito
  ] = useState("");

  const [
    fechaReversion,
    setFechaReversion
  ] = useState(
    getToday()
  );

  const [
    utilidad,
    setUtilidad
  ] = useState("");

  const [
    regalias,
    setRegalias
  ] = useState("");

  const [
    observaciones,
    setObservaciones
  ] = useState("");

  const [
    localError,
    setLocalError
  ] = useState<
    string | null
  >(null);

  const [
    confirmando,
    setConfirmando
  ] = useState(false);

  const utilidadOriginal =
    Math.abs(
      parseMoney(
        carrito
          ?.utilidad_neta
      )
    );

  const regaliasOriginal =
    Math.abs(
      parseMoney(
        carrito
          ?.regalias
      )
    );

  const utilidadYaRevertida =
    Math.abs(
      reversiones.reduce(
        (
          total,
          item
        ) =>
          total +
          parseMoney(
            item.utilidad_almundo
          ),
        0
      )
    );

  const regaliasYaRevertidas =
    Math.abs(
      reversiones.reduce(
        (
          total,
          item
        ) =>
          total +
          parseMoney(
            item.regalias
          ),
        0
      )
    );

  const utilidadPendiente =
    Math.max(
      0,
      utilidadOriginal -
        utilidadYaRevertida
    );

  const regaliasPendientes =
    Math.max(
      0,
      regaliasOriginal -
        regaliasYaRevertidas
    );

  const utilidadIngresada =
    Math.abs(
      parseMoney(
        utilidad
      )
    );

  const regaliasIngresadas =
    Math.abs(
      parseMoney(
        regalias
      )
    );

  const preview =
    useMemo(
      () => {
        const utilidadNegativa =
          -utilidadIngresada;

        const regaliasNegativas =
          -regaliasIngresadas;

        const utilidadNossix =
          utilidadNegativa -
          regaliasNegativas;

        return {
          utilidadNegativa,
          regaliasNegativas,
          utilidadNossix,
          importeFacturar:
            utilidadNossix *
            1.21
        };
      },
      [
        utilidadIngresada,
        regaliasIngresadas
      ]
    );

  useEffect(() => {
    if (!open) {
      return;
    }

    setNumeroCarrito("");
    setFechaReversion(
      getToday()
    );
    setUtilidad("");
    setRegalias("");
    setObservaciones("");
    setLocalError(null);
    setConfirmando(false);

    clearSearch();
  }, [
    open,
    clearSearch
  ]);

  useEffect(() => {
    if (!carrito) {
      return;
    }

    setUtilidad(
      formatInputMoney(
        utilidadPendiente
      )
    );

    setRegalias(
      formatInputMoney(
        regaliasPendientes
      )
    );
  }, [
    carrito?.id,
    utilidadPendiente,
    regaliasPendientes
  ]);

  if (!open) {
    return null;
  }

  async function handleBuscar() {
    setLocalError(null);
    setConfirmando(false);

    const formatted =
      formatNumeroCarrito(
        numeroCarrito
      );

    setNumeroCarrito(
      formatted
    );

    if (
      formatted.length !== 11
    ) {
      setLocalError(
        "Completá el número de carrito con formato XXX-XXX-XXX."
      );

      return;
    }

    await buscarCarrito(
      formatted
    );
  }

  function handleNumeroChange(
    value: string
  ) {
    setLocalError(null);
    setConfirmando(false);

    const formatted =
      formatNumeroCarrito(
        value
      );

    setNumeroCarrito(
      formatted
    );

    if (
      carrito &&
      formatted !==
        carrito.numero_carrito
    ) {
      clearSearch();
    }
  }

  function validate(): string | null {
    if (!carrito) {
      return "Primero buscá el carrito que querés revertir.";
    }

    if (
      utilidadOriginal <= 0
    ) {
      return "Este carrito no tiene utilidad ALMUNDO cargada.";
    }

    if (
      utilidadPendiente <= 0.009
    ) {
      return "La utilidad de este carrito ya fue revertida completamente.";
    }

    if (
      !fechaReversion
    ) {
      return "Seleccioná la fecha de reversión.";
    }

    if (
      utilidadIngresada <= 0
    ) {
      return "Ingresá la utilidad devuelta por ALMUNDO.";
    }

    if (
      utilidadIngresada >
      utilidadPendiente +
        0.009
    ) {
      return "La utilidad a revertir supera el saldo pendiente.";
    }

    if (
      regaliasIngresadas >
      regaliasPendientes +
        0.009
    ) {
      return "Las regalías a revertir superan el saldo pendiente.";
    }

    return null;
  }

  function handlePrepareSave() {
    const issue =
      validate();

    if (issue) {
      setLocalError(issue);
      return;
    }

    setLocalError(null);
    setConfirmando(true);
  }

  async function handleConfirmSave() {
    if (!carrito) {
      return;
    }

    const issue =
      validate();

    if (issue) {
      setLocalError(issue);
      setConfirmando(false);
      return;
    }

    const ok =
      await registrarReversion(
        carrito,
        {
          fecha_reversion:
            fechaReversion,

          utilidad_almundo:
            utilidadIngresada,

          regalias:
            regaliasIngresadas,

          observaciones
        }
      );

    if (!ok) {
      setConfirmando(false);
      return;
    }

    onSaved(
      `Reversión del carrito ${carrito.numero_carrito} registrada correctamente.`
    );

    onClose();
  }

  const cliente =
    carrito?.clientes;

  const moneda =
    carrito?.moneda ||
    "ARS";

  const reversionTotal =
    Boolean(
      carrito &&
        utilidadIngresada >=
          utilidadPendiente -
            0.009
    );

  return (
    <div className="fixed inset-0 z-[290] flex items-start justify-center bg-black/35 px-3 pt-12 backdrop-blur-sm sm:px-4">
      <div className="flex max-h-[calc(100vh-72px)] w-full max-w-3xl flex-col overflow-hidden rounded-[18px] border border-black/10 bg-[#edf3f7] text-[#172033] shadow-2xl">

        <header className="shrink-0 border-b border-black/10 bg-white/90 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-red-50 text-red-600 ring-1 ring-red-100">
                <RotateCcw
                  size={15}
                />
              </div>

              <div>
                <h2 className="text-[16px] font-semibold text-[#172033]">
                  Registrar reversión ALMUNDO
                </h2>

                <p className="mt-0.5 text-[11.5px] font-normal text-[#64748b]">
                  Cancelación o devolución informada posteriormente por ALMUNDO.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#172033] disabled:opacity-50"
              aria-label="Cerrar reversión"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto p-4">

          <div className="rounded-[16px] border border-black/10 bg-white p-4">
            <FieldLabel>
              Número de carrito
            </FieldLabel>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_110px]">
              <TextInput
                value={
                  numeroCarrito
                }
                onChange={
                  handleNumeroChange
                }
                placeholder="000-000-000"
                inputMode="numeric"
              />

              <button
                type="button"
                disabled={
                  loading ||
                  numeroCarrito.length !==
                    11
                }
                onClick={
                  handleBuscar
                }
                className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] bg-[#4f7c90] px-3 text-[12px] font-medium text-white shadow-sm transition hover:bg-[#406b7d] disabled:opacity-50"
              >
                <Search size={14} />

                {loading
                  ? "Buscando..."
                  : "Buscar"}
              </button>
            </div>

            <p className="mt-2 text-[11px] font-normal text-[#64748b]">
              La búsqueda se realiza sobre todos los carritos, sin importar el mes de venta.
            </p>
          </div>

          {localError ||
          storeError ? (
            <div className="mt-3 flex items-start gap-2 rounded-[14px] border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-medium text-red-700">
              <AlertTriangle
                size={14}
                className="mt-0.5 shrink-0"
              />

              <span>
                {localError ||
                  storeError}
              </span>
            </div>
          ) : null}

          {carrito ? (
            <div className="mt-3 grid gap-3">

              <section className="rounded-[16px] border border-black/10 bg-white p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#64748b]">
                      Operación encontrada
                    </div>

                    <div className="mt-1 text-[15px] font-semibold text-[#172033]">
                      {carrito.numero_carrito}
                    </div>

                    <div className="mt-0.5 text-[12px] text-[#64748b]">
                      {cliente
                        ?.nombre_completo ||
                        "Sin cliente"}
                    </div>
                  </div>

                  {carrito.cancelado ? (
                    <span className="rounded-[8px] border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700">
                      CANCELADO
                    </span>
                  ) : (
                    <span className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                      ACTIVO
                    </span>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3 text-[12px]">
                    <InfoRow
                      label="Fecha venta"
                      value={
                        formatDateAR(
                          carrito.fecha_venta
                        )
                      }
                    />

                    <InfoRow
                      label="Destino"
                      value={
                        carrito.destino ||
                        "—"
                      }
                    />

                    <InfoRow
                      label="Vendedor"
                      value={
                        carrito.vendedor ||
                        "—"
                      }
                    />

                    <InfoRow
                      label="Venta"
                      value={formatMoneyAR(
                        carrito.importe_final,
                        moneda
                      )}
                      strong
                    />
                  </div>

                  <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3 text-[12px]">
                    <InfoRow
                      label="Utilidad ALMUNDO"
                      value={formatMoneyAR(
                        utilidadOriginal,
                        moneda
                      )}
                    />

                    <InfoRow
                      label="Regalías"
                      value={formatMoneyAR(
                        regaliasOriginal,
                        moneda
                      )}
                    />

                    <InfoRow
                      label="Utilidad NOSSIX"
                      value={formatMoneyAR(
                        parseMoney(
                          carrito.utilidad_bruta
                        ),
                        moneda
                      )}
                      strong
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[16px] border border-black/10 bg-white p-4">
                <div className="mb-3">
                  <h3 className="text-[13px] font-semibold text-[#172033]">
                    Saldo disponible para revertir
                  </h3>

                  <p className="mt-0.5 text-[11.5px] font-normal text-[#64748b]">
                    Las reversiones anteriores se descuentan automáticamente.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-[14px] border border-red-200 bg-red-50 p-3">
                    <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-red-600">
                      Utilidad pendiente
                    </div>

                    <div className="mt-1 text-[17px] font-semibold text-red-700">
                      {formatMoneyAR(
                        utilidadPendiente,
                        moneda
                      )}
                    </div>
                  </div>

                  <div className="rounded-[14px] border border-orange-200 bg-orange-50 p-3">
                    <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-orange-700">
                      Regalías pendientes
                    </div>

                    <div className="mt-1 text-[17px] font-semibold text-orange-800">
                      {formatMoneyAR(
                        regaliasPendientes,
                        moneda
                      )}
                    </div>
                  </div>

                  <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
                    <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#64748b]">
                      Reversiones previas
                    </div>

                    <div className="mt-1 text-[17px] font-semibold text-[#172033]">
                      {reversiones.length}
                    </div>
                  </div>
                </div>
              </section>

              {reversiones.length >
              0 ? (
                <section className="rounded-[16px] border border-black/10 bg-white p-4">
                  <div className="mb-2 text-[12px] font-semibold text-[#172033]">
                    Reversiones registradas
                  </div>

                  <div className="grid gap-1.5">
                    {reversiones.map(
                      (
                        item
                      ) => (
                        <div
                          key={
                            item.id
                          }
                          className="grid gap-1 rounded-[12px] border border-black/10 bg-[#f8fafc] px-3 py-2 text-[11.5px] sm:grid-cols-[100px_1fr_1fr]"
                        >
                          <div className="font-medium text-[#64748b]">
                            {formatDateAR(
                              item.fecha_reversion
                            )}
                          </div>

                          <div className="font-semibold text-red-700">
                            Utilidad{" "}
                            {formatMoneyAR(
                              item.utilidad_almundo,
                              moneda
                            )}
                          </div>

                          <div className="font-semibold text-orange-700">
                            Regalías{" "}
                            {formatMoneyAR(
                              item.regalias,
                              moneda
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>
              ) : null}

              <section className="rounded-[16px] border border-black/10 bg-white p-4">
                <div className="mb-3">
                  <h3 className="text-[13px] font-semibold text-[#172033]">
                    Nueva reversión
                  </h3>

                  <p className="mt-0.5 text-[11.5px] font-normal text-[#64748b]">
                    Ingresá los importes en positivo. NOSTUR los registrará internamente como negativos.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FieldLabel>
                      Fecha reversión
                    </FieldLabel>

                    <NosturDateInput
                      value={
                        fechaReversion
                      }
                      onChange={
                        setFechaReversion
                      }
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Utilidad devuelta
                    </FieldLabel>

                    <TextInput
                      value={
                        utilidad
                      }
                      onChange={(value) => {
                        setLocalError(null);
                        setConfirmando(false);
                        setUtilidad(value);
                      }}
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Regalías devueltas
                    </FieldLabel>

                    <TextInput
                      value={
                        regalias
                      }
                      onChange={(value) => {
                        setLocalError(null);
                        setConfirmando(false);
                        setRegalias(value);
                      }}
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <FieldLabel>
                    Observaciones
                  </FieldLabel>

                  <TextArea
                    value={
                      observaciones
                    }
                    onChange={
                      setObservaciones
                    }
                    placeholder="Ej: cancelación informada por ALMUNDO, devolución total, diferencia del Excel..."
                  />
                </div>

                <div className="mt-3 rounded-[14px] border border-red-200 bg-red-50 p-3">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-red-700">
                    Impacto de la reversión
                  </div>

                  <div className="grid gap-1 text-[12px] sm:grid-cols-2">
                    <InfoRow
                      label="Utilidad ALMUNDO"
                      value={formatMoneyAR(
                        preview.utilidadNegativa,
                        moneda
                      )}
                    />

                    <InfoRow
                      label="Regalías"
                      value={formatMoneyAR(
                        preview.regaliasNegativas,
                        moneda
                      )}
                    />

                    <InfoRow
                      label="Utilidad NOSSIX"
                      value={formatMoneyAR(
                        preview.utilidadNossix,
                        moneda
                      )}
                      strong
                    />

                    <InfoRow
                      label="Ajuste facturación"
                      value={formatMoneyAR(
                        preview.importeFacturar,
                        moneda
                      )}
                      strong
                    />
                  </div>

                  {reversionTotal ? (
                    <div className="mt-3 rounded-[10px] border border-red-200 bg-white/75 px-3 py-2 text-[11.5px] font-medium text-red-700">
                      Esta reversión completa el total de la utilidad original. El carrito quedará marcado como cancelado.
                    </div>
                  ) : null}
                </div>
              </section>

              {confirmando ? (
                <section className="rounded-[16px] border border-red-300 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={18}
                      className="mt-0.5 shrink-0 text-red-600"
                    />

                    <div className="min-w-0">
                      <h3 className="text-[13px] font-semibold text-red-800">
                        Confirmar reversión
                      </h3>

                      <p className="mt-1 text-[12px] font-normal leading-relaxed text-red-700">
                        Se registrará un movimiento económico negativo vinculado al carrito{" "}
                        <strong>
                          {carrito.numero_carrito}
                        </strong>
                        . La utilidad original no será sobrescrita.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        setConfirmando(
                          false
                        )
                      }
                      className="h-8 rounded-[10px] border border-black/10 bg-white px-3 text-[12px] font-medium text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-50"
                    >
                      Volver
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={
                        handleConfirmSave
                      }
                      className="h-8 rounded-[10px] bg-red-600 px-4 text-[12px] font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      {saving
                        ? "Registrando..."
                        : "Confirmar reversión"}
                    </button>
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-black/10 bg-white/90 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-8 rounded-[10px] px-3 text-[12px] font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#172033] disabled:opacity-50"
            >
              Cerrar
            </button>

            {carrito &&
            !confirmando ? (
              <button
                type="button"
                disabled={
                  saving ||
                  utilidadPendiente <=
                    0.009
                }
                onClick={
                  handlePrepareSave
                }
                className="inline-flex h-8 items-center gap-2 rounded-[10px] bg-red-600 px-4 text-[12px] font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                <RotateCcw
                  size={14}
                />

                Registrar reversión
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default ControlVentaReversionModal;
