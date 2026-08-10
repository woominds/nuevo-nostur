import { NosturDateInput } from "../../ui/NosturDateInput";
import { formatMoneyAR } from "../../../lib/formatters";
import {
  BooleanChip,
  DestinosMultiSelect,
  FieldLabel,
  NosturSelect,
  TextArea,
  TextInput
} from "../components";
import {
  MONEDA_OPTIONS,
  getToday,
  isDateBefore,
  maskCarrito,
  type SelectOption,
  type WizardDraft
} from "../carritosModel";

type WizardVentaProps = {
  draft: WizardDraft;
  bruto: number;
  promocode: number;
  totalFinal: number;
  servicioOptions: SelectOption[];
  destinoOptions: SelectOption[];
  onVentaChange: <
    K extends keyof WizardDraft["venta"]
  >(
    key: K,
    value: WizardDraft["venta"][K]
  ) => void;
  onMonedaChange: (value: string) => void;
  onCreateDestino: (
    nombre: string
  ) => Promise<string | null>;
};

export function WizardVenta({
  draft,
  bruto,
  promocode,
  totalFinal,
  servicioOptions,
  destinoOptions,
  onVentaChange,
  onMonedaChange,
  onCreateDestino
}: WizardVentaProps) {
  return (
    <section>
      <h3 className="mb-3 text-[14px] font-semibold text-[#172033]">
        Paso 2 · Venta Ábaco
      </h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <FieldLabel>Número carrito *</FieldLabel>

          <TextInput
            value={draft.venta.numero_carrito}
            onChange={(value) =>
              onVentaChange(
                "numero_carrito",
                maskCarrito(value)
              )
            }
            placeholder="210-485-162"
            inputMode="numeric"
          />
        </div>

        <div>
          <FieldLabel>Fecha venta</FieldLabel>

          <NosturDateInput
            value={draft.venta.fecha_venta}
            onChange={(value) =>
              onVentaChange("fecha_venta", value)
            }
          />
        </div>

        <div>
          <FieldLabel>Fecha IN</FieldLabel>

          <NosturDateInput
            value={draft.venta.fecha_in}
            onChange={(value) => {
              onVentaChange("fecha_in", value);

              if (
                draft.venta.fecha_out &&
                value &&
                isDateBefore(
                  draft.venta.fecha_out,
                  value
                )
              ) {
                onVentaChange("fecha_out", value);
              }
            }}
            min={getToday()}
          />
        </div>

        <div>
          <FieldLabel>Fecha OUT</FieldLabel>

          {draft.venta.solo_ida ? (
            <div className="flex h-8 items-center rounded-[10px] border border-black/10 bg-[#f8fafc] px-3 text-[12px] font-normal text-[#94a3b8]">
              Solo ida
            </div>
          ) : (
            <NosturDateInput
              value={draft.venta.fecha_out}
              onChange={(value) =>
                onVentaChange("fecha_out", value)
              }
              min={
                draft.venta.fecha_in ||
                getToday()
              }
            />
          )}
        </div>

        <div className="md:col-span-2">
          <BooleanChip
            checked={draft.venta.solo_ida}
            onChange={(value) => {
              onVentaChange("solo_ida", value);

              if (value) {
                onVentaChange("fecha_out", "");
              }
            }}
            label="Solo ida"
          />
        </div>

        <div>
          <FieldLabel>Tipo de servicio</FieldLabel>

          <NosturSelect
            value={draft.venta.servicio}
            onChange={(value) =>
              onVentaChange("servicio", value)
            }
            options={servicioOptions}
            placeholder="Buscar servicio"
          />
        </div>

        <div>
          <FieldLabel>Destinos</FieldLabel>

          <DestinosMultiSelect
            values={draft.venta.destinos}
            onChange={(values) =>
              onVentaChange("destinos", values)
            }
            options={destinoOptions}
            onCreate={onCreateDestino}
          />
        </div>

        <div>
          <FieldLabel>Importe bruto</FieldLabel>

          <TextInput
            value={draft.venta.importe_bruto}
            onChange={(value) =>
              onVentaChange(
                "importe_bruto",
                value
              )
            }
            placeholder="61.148,00"
            inputMode="decimal"
          />
        </div>

        <div>
          <FieldLabel>Moneda</FieldLabel>

          <NosturSelect
            value={draft.venta.moneda}
            onChange={onMonedaChange}
            options={MONEDA_OPTIONS}
          />
        </div>

        <div>
          <BooleanChip
            checked={
              draft.venta.promocode_aplicado
            }
            onChange={(value) =>
              onVentaChange(
                "promocode_aplicado",
                value
              )
            }
            label="Tiene promocode"
          />
        </div>

        {draft.venta.promocode_aplicado ? (
          <div>
            <FieldLabel>
              Importe promocode
            </FieldLabel>

            <TextInput
              value={
                draft.venta.promocode_importe
              }
              onChange={(value) =>
                onVentaChange(
                  "promocode_importe",
                  value
                )
              }
              placeholder="0,00"
              inputMode="decimal"
            />
          </div>
        ) : null}

        <div className="md:col-span-2">
          <FieldLabel>Observaciones</FieldLabel>

          <TextArea
            value={draft.venta.observaciones}
            onChange={(value) =>
              onVentaChange(
                "observaciones",
                value
              )
            }
            placeholder="Notas comerciales o de control..."
          />
        </div>
      </div>

      <div className="mt-3 rounded-[14px] border border-black/10 bg-[#f8fafc] p-3 text-[12px]">
        <div className="flex justify-between">
          <span className="text-[#64748b]">
            Importe bruto
          </span>

          <strong className="font-semibold">
            {formatMoneyAR(
              bruto,
              draft.venta.moneda
            )}
          </strong>
        </div>

        <div className="flex justify-between">
          <span className="text-[#64748b]">
            Promocode
          </span>

          <strong className="font-semibold">
            {formatMoneyAR(
              promocode,
              draft.venta.moneda
            )}
          </strong>
        </div>

        <div className="mt-2 flex justify-between border-t border-black/10 pt-2">
          <span className="font-semibold text-[#172033]">
            Total cliente
          </span>

          <strong className="font-semibold text-[#172033]">
            {formatMoneyAR(
              totalFinal,
              draft.venta.moneda
            )}
          </strong>
        </div>
      </div>
    </section>
  );
}
