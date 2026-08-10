// src/components/carritos/wizard/WizardSummary.tsx

import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Contact,
  CreditCard,
  MapPin,
  Plane,
  ReceiptText,
  ShieldAlert
} from "lucide-react";

import {
  formatMoneyAR
} from "../../../lib/formatters";

import {
  formatDateAR,
  parseMoney,
  type WizardDraft
} from "../carritosModel";

import {
  getWizardReadiness
} from "./wizardReadiness";

type WizardSummaryProps = {
  draft: WizardDraft;
  totalFinal: number;
  totalComercial: number;
  totalTesoreria: number;
  saldo: number;
};

function SummaryLabel({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8b95a5]">
      {children}
    </div>
  );
}

function StatusChip({
  active,
  activeLabel,
  inactiveLabel
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className={[
        "inline-flex min-h-6 items-center rounded-[6px] border px-2 text-[9.5px] font-medium",
        active
          ? "border-[#4f7c90]/20 bg-[#eef6f7] text-[#4f7c90]"
          : "border-black/10 bg-white text-[#8a94a5]"
      ].join(" ")}
    >
      {active
        ? activeLabel
        : inactiveLabel}
    </span>
  );
}

export function WizardSummary({
  draft,
  totalFinal,
  totalComercial,
  totalTesoreria,
  saldo
}: WizardSummaryProps) {
  const importeRiesgo =
    draft.riesgo
      ? parseMoney(
          draft.importe_riesgo
        )
      : 0;

  const readiness =
    getWizardReadiness({
      draft,
      totalFinal,
      totalComercial,
      totalTesoreria,
      importeRiesgo
    });

  const pagosAlmundo =
    draft.pagosComerciales.filter(
      (pago) =>
        parseMoney(pago.importe) > 0
    );

  const pagosReales =
    draft.movimientosTesoreria.filter(
      (movimiento) =>
        parseMoney(
          movimiento.importe
        ) > 0
    );

  return (
    <aside className="overflow-hidden rounded-[16px] border border-black/10 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-black/10 bg-[#f8fafc] px-3 py-3">
        <div>
          <h3 className="text-[13px] font-semibold text-[#172033]">
            Ficha de venta
          </h3>

          <p className="mt-0.5 text-[10px] text-[#7b8495]">
            Se actualiza automáticamente mientras completás el carrito.
          </p>
        </div>

        <div
          className={[
            "inline-flex shrink-0 items-center gap-1.5 rounded-[7px] border px-2 py-1 text-[9.5px] font-semibold",
            readiness.ready
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          ].join(" ")}
        >
          {readiness.ready ? (
            <CheckCircle2 size={12} />
          ) : (
            <AlertTriangle size={12} />
          )}

          {readiness.ready
            ? "Lista para crear"
            : `${readiness.issues.length} pendiente${
                readiness.issues.length === 1
                  ? ""
                  : "s"
              }`}
        </div>
      </div>

      <div className="grid gap-3 p-3">
        <section className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-[10px] border border-black/10 bg-[#f8fafc] p-2.5">
            <div className="flex items-center gap-1.5 text-[#64748b]">
              <Contact size={13} />
              <SummaryLabel>Cliente</SummaryLabel>
            </div>

            <div className="mt-1 truncate text-[12px] font-semibold text-[#172033]">
              {draft.cliente.nombre_completo ||
                "Sin cliente"}
            </div>

            <div className="truncate text-[10px] text-[#7b8495]">
              {draft.cliente.telefono ||
                "Sin teléfono"}
            </div>

            <div className="truncate text-[10px] text-[#7b8495]">
              {draft.cliente.origen ||
                "Sin método de contacto"}
            </div>
          </div>

          <div className="rounded-[10px] border border-black/10 bg-[#f8fafc] p-2.5">
            <div className="flex items-center gap-1.5 text-[#64748b]">
              <ReceiptText size={13} />
              <SummaryLabel>Carrito</SummaryLabel>
            </div>

            <div className="mt-1 text-[12px] font-semibold text-[#172033]">
              {draft.venta.numero_carrito ||
                "Sin número"}
            </div>

            <div className="truncate text-[10px] text-[#7b8495]">
              {draft.venta.servicio ||
                "Sin servicio"}
            </div>
          </div>
        </section>

        <section className="rounded-[10px] border border-black/10 bg-[#f8fafc] p-2.5">
          <div className="flex items-center gap-1.5 text-[#64748b]">
            <MapPin size={13} />
            <SummaryLabel>Viaje</SummaryLabel>
          </div>

          <div className="mt-1 truncate text-[11px] font-semibold text-[#172033]">
            {draft.venta.destinos.length > 0
              ? draft.venta.destinos.join(
                  " · "
                )
              : "Sin destinos"}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-[#7b8495]">
            <Plane size={11} />

            <span>
              {formatDateAR(
                draft.venta.fecha_in
              )}
            </span>

            <span>→</span>

            <span>
              {draft.venta.solo_ida
                ? "Solo ida"
                : formatDateAR(
                    draft.venta.fecha_out
                  )}
            </span>
          </div>
        </section>

        <section className="rounded-[10px] border border-black/10 bg-white p-2.5 ring-1 ring-black/5">
          <div className="flex items-center gap-1.5 text-[#64748b]">
            <CircleDollarSign size={13} />
            <SummaryLabel>Resultado</SummaryLabel>
          </div>

          <div className="mt-2 grid gap-1 text-[10.5px]">
            <div className="flex justify-between gap-3">
              <span className="text-[#64748b]">
                Venta final
              </span>

              <strong className="font-semibold text-[#172033]">
                {formatMoneyAR(
                  totalFinal,
                  draft.venta.moneda
                )}
              </strong>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-[#64748b]">
                Imputación ALMUNDO
              </span>

              <strong className="font-semibold text-[#172033]">
                {formatMoneyAR(
                  totalComercial,
                  draft.venta.moneda
                )}
              </strong>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-[#64748b]">
                Pago real
              </span>

              <strong className="font-semibold text-[#172033]">
                {formatMoneyAR(
                  totalTesoreria,
                  draft.venta.moneda
                )}
              </strong>
            </div>

            <div className="mt-1 flex justify-between gap-3 border-t border-black/10 pt-1.5">
              <span className="text-[#64748b]">
                Saldo pasajero
              </span>

              <strong
                className={
                  saldo > 0
                    ? "font-semibold text-red-600"
                    : "font-semibold text-emerald-700"
                }
              >
                {formatMoneyAR(
                  saldo,
                  draft.venta.moneda
                )}
              </strong>
            </div>
          </div>
        </section>

        {(pagosAlmundo.length > 0 ||
          pagosReales.length > 0) ? (
          <section className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-[10px] border border-black/10 bg-[#f8fafc] p-2.5">
              <div className="flex items-center gap-1.5 text-[#64748b]">
                <CreditCard size={13} />
                <SummaryLabel>ALMUNDO</SummaryLabel>
              </div>

              <div className="mt-2 grid gap-1">
                {pagosAlmundo.length > 0 ? (
                  pagosAlmundo.map(
                    (pago, index) => (
                      <div
                        key={`summary-almundo-${index}`}
                        className="flex items-center justify-between gap-2 text-[9.5px]"
                      >
                        <span className="min-w-0 truncate text-[#64748b]">
                          {pago.forma_pago ||
                            "Sin forma"}
                        </span>

                        <strong className="shrink-0 font-semibold text-[#172033]">
                          {formatMoneyAR(
                            parseMoney(
                              pago.importe
                            ),
                            pago.moneda
                          )}
                        </strong>
                      </div>
                    )
                  )
                ) : (
                  <div className="text-[9.5px] text-[#929baa]">
                    Sin pagos informados
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[10px] border border-black/10 bg-[#f8fafc] p-2.5">
              <div className="flex items-center gap-1.5 text-[#64748b]">
                <CreditCard size={13} />
                <SummaryLabel>Pago real</SummaryLabel>
              </div>

              <div className="mt-2 grid gap-1">
                {pagosReales.length > 0 ? (
                  pagosReales.map(
                    (
                      movimiento,
                      index
                    ) => (
                      <div
                        key={`summary-real-${index}`}
                        className="text-[9.5px]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-[#64748b]">
                            {movimiento.forma_pago ||
                              "Sin forma"}
                          </span>

                          <strong className="shrink-0 font-semibold text-[#172033]">
                            {formatMoneyAR(
                              parseMoney(
                                movimiento.importe
                              ),
                              movimiento.moneda
                            )}
                          </strong>
                        </div>

                        <div className="truncate text-[9px] text-[#929baa]">
                          {movimiento.caja ||
                            "Sin caja"}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="text-[9.5px] text-[#929baa]">
                    Sin pagos reales
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}

        <section className="flex flex-wrap gap-1.5">
          <StatusChip
            active={
              draft.pagoParcial
            }
            activeLabel="Cuenta corriente"
            inactiveLabel="Pago total"
          />

          <StatusChip
            active={
              draft.pagoDiferenteOficina
            }
            activeLabel="Pago diferente"
            inactiveLabel="Pago coincidente"
          />

          <StatusChip
            active={
              draft.venta
                .promocode_aplicado
            }
            activeLabel="Promocode"
            inactiveLabel="Sin promocode"
          />

          <StatusChip
            active={
              draft.usaMarkupAdicional
            }
            activeLabel={`Markup ${
              draft.markupAdicionalPct ||
              "0"
            }%`}
            inactiveLabel="Sin markup"
          />

          <StatusChip
            active={draft.riesgo}
            activeLabel="A riesgo"
            inactiveLabel="Sin riesgo"
          />
        </section>

        {!readiness.ready ? (
          <section className="rounded-[10px] border border-amber-200 bg-amber-50 p-2.5">
            <div className="flex items-center gap-1.5 text-amber-800">
              <ShieldAlert size={13} />

              <span className="text-[10px] font-semibold">
                Falta completar
              </span>
            </div>

            <div className="mt-1.5 grid gap-1">
              {readiness.issues
                .slice(0, 5)
                .map((issue) => (
                  <div
                    key={issue}
                    className="flex items-start gap-1.5 text-[9.5px] leading-relaxed text-amber-700"
                  >
                    <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-amber-500" />

                    <span>{issue}</span>
                  </div>
                ))}

              {readiness.issues.length >
              5 ? (
                <div className="text-[9.5px] font-medium text-amber-700">
                  +{" "}
                  {readiness.issues.length -
                    5}{" "}
                  pendientes más
                </div>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="rounded-[10px] border border-emerald-200 bg-emerald-50 p-2.5">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 size={14} />

              <div>
                <div className="text-[10.5px] font-semibold">
                  Venta lista para crear
                </div>

                <div className="text-[9.5px]">
                  No se detectaron inconsistencias.
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
