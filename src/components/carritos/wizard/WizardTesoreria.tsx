import { formatMoneyAR } from "../../../lib/formatters";
import type {
  MovimientoTesoreria
} from "../../../store/carritosStore";
import {
  FieldLabel,
  LineButton,
  NosturSelect,
  TextInput
} from "../components";
import {
  MONEDA_OPTIONS,
  type SelectOption,
  type WizardDraft
} from "../carritosModel";

type WizardTesoreriaProps = {
  draft: WizardDraft;
  totalFinal: number;
  totalTesoreria: number;
  cajaOptions: SelectOption[];
  formaPagoOptions: SelectOption[];
  onMovimientoChange: (
    index: number,
    patch: Partial<MovimientoTesoreria>
  ) => void;
  onCajaChange: (
    index: number,
    cajaId: string
  ) => void;
  onFormaPagoChange: (
    index: number,
    formaPagoId: string
  ) => void;
  onAddMovimiento: () => void;
  onRemoveMovimiento: (
    index: number
  ) => void;
};

export function WizardTesoreria({
  draft,
  totalFinal,
  totalTesoreria,
  cajaOptions,
  formaPagoOptions,
  onMovimientoChange,
  onCajaChange,
  onFormaPagoChange,
  onAddMovimiento,
  onRemoveMovimiento
}: WizardTesoreriaProps) {
  return (
    <section>
      <h3 className="mb-3 text-[14px] font-semibold text-[#172033]">
        Paso 4 · Tesorería real
      </h3>

      <div className="mb-3 rounded-[14px] border border-black/10 bg-[#f8fafc] px-3 py-2 text-[12px] font-medium text-[#334155]">
        Total cliente a cobrar hoy:{" "}
        {formatMoneyAR(
          totalFinal,
          draft.venta.moneda
        )}
      </div>

      <div className="grid gap-2">
        {draft.movimientosTesoreria.map(
          (movimiento, index) => (
            <div
              key={`movimiento-${index}`}
              className="grid gap-2 rounded-[14px] border border-black/10 bg-[#f8fafc] p-3 md:grid-cols-2"
            >
              <div>
                <FieldLabel>Caja</FieldLabel>

                <NosturSelect
                  value={movimiento.caja_id || ""}
                  onChange={(value) =>
                    onCajaChange(index, value)
                  }
                  options={cajaOptions}
                  placeholder="Buscar caja"
                />
              </div>

              <div>
                <FieldLabel>
                  Forma real
                </FieldLabel>

                <NosturSelect
                  value={
                    movimiento.forma_pago_id ||
                    ""
                  }
                  onChange={(value) =>
                    onFormaPagoChange(
                      index,
                      value
                    )
                  }
                  options={formaPagoOptions}
                  placeholder="Buscar forma"
                />
              </div>

              <div>
                <FieldLabel>Moneda</FieldLabel>

                <NosturSelect
                  value={
                    movimiento.moneda ||
                    draft.venta.moneda
                  }
                  onChange={(value) =>
                    onMovimientoChange(index, {
                      moneda: value
                    })
                  }
                  options={MONEDA_OPTIONS}
                />
              </div>

              <div>
                <FieldLabel>Importe</FieldLabel>

                <TextInput
                  value={
                    movimiento.importe
                      ? String(
                          movimiento.importe
                        ).replace(".", ",")
                      : ""
                  }
                  onChange={(value) =>
                    onMovimientoChange(index, {
                      importe:
                        Number(
                          value
                            .replace(/\./g, "")
                            .replace(",", ".")
                        ) || 0
                    })
                  }
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>

              <div>
                <FieldLabel>TC</FieldLabel>

                <TextInput
                  value={
                    movimiento.tipo_cambio
                      ? String(
                          movimiento.tipo_cambio
                        ).replace(".", ",")
                      : ""
                  }
                  onChange={(value) =>
                    onMovimientoChange(index, {
                      tipo_cambio:
                        Number(
                          value
                            .replace(/\./g, "")
                            .replace(",", ".")
                        ) || 0
                    })
                  }
                  placeholder="—"
                  inputMode="decimal"
                />
              </div>

              <div className="flex items-end justify-end">
                <LineButton
                  onClick={() =>
                    onRemoveMovimiento(index)
                  }
                >
                  Eliminar
                </LineButton>
              </div>
            </div>
          )
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <LineButton onClick={onAddMovimiento}>
          + Agregar movimiento
        </LineButton>
      </div>

      <div className="mt-3 rounded-[14px] border border-black/10 bg-[#f8fafc] p-3 text-[12px]">
        <div className="flex justify-between">
          <span className="text-[#64748b]">
            Total imputado
          </span>

          <strong className="font-semibold">
            {formatMoneyAR(
              totalTesoreria,
              draft.venta.moneda
            )}
          </strong>
        </div>

        <div className="flex justify-between">
          <span className="text-[#64748b]">
            Diferencia
          </span>

          <strong
            className={
              Math.abs(
                totalTesoreria - totalFinal
              ) > 0.009
                ? "font-semibold text-red-600"
                : "font-semibold text-emerald-700"
            }
          >
            {formatMoneyAR(
              totalTesoreria - totalFinal,
              draft.venta.moneda
            )}
          </strong>
        </div>
      </div>
    </section>
  );
}
