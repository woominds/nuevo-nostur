import {
  UserRound
} from "lucide-react";
import type {
  Carrito,
  ProfileLite
} from "../../../store/carritosStore";
import { formatMoneyAR } from "../../../lib/formatters";
import {
  formatDateAR,
  getEstadoVisualCarrito,
  getInitials,
  parseMoney
} from "../carritosModel";
import {
  FieldLabel
} from "./CarritosFormControls";
import {
  SellerBadge
} from "./CarritosDisplayComponents";

type CarritoSideDetailProps = {
  carrito: Carrito | null;
  vendedores: ProfileLite[];
  saving: boolean;
  onEdit: (carrito: Carrito) => void;
  onView: (carrito: Carrito) => void;
  onSendToControl: (
    carrito: Carrito
  ) => void | Promise<void>;
  onToggle: (
    carrito: Carrito
  ) => void | Promise<void>;
};

export function CarritoSideDetail({
  carrito,
  vendedores,
  saving,
  onEdit,
  onView,
  onSendToControl,
  onToggle
}: CarritoSideDetailProps) {
  if (!carrito) {
    return (
      <aside className="carritos-side-detail min-w-0 rounded-[16px] border border-black/10 bg-white/68 p-3 shadow-sm backdrop-blur-xl">
        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-5 text-center text-[12px] font-normal text-[#64748b]">
          Seleccioná un carrito para ver el detalle.
        </div>
      </aside>
    );
  }

  const estadoVisual =
    getEstadoVisualCarrito(carrito);

  const yaFueEnviadoAControl = [
    "EN_CONTROL",
    "CONTROLADO",
    "FACTURADO",
    "COBRADO"
  ].includes(estadoVisual);

  const tieneSaldo =
    parseMoney(carrito.saldo_cta_cte) > 0.009;

  return (
    <aside className="carritos-side-detail min-w-0 rounded-[16px] border border-black/10 bg-white/68 p-3 shadow-sm backdrop-blur-xl">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#4f7c90] text-[12px] font-semibold text-white">
            {getInitials(
              carrito.clientes?.nombre_completo ||
                "C"
            )}
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-[13.5px] font-semibold text-[#172033]">
              {carrito.numero_carrito}
            </h2>

            <p className="truncate text-[11.5px] font-normal text-[#64748b]">
              {carrito.clientes?.nombre_completo ||
                "Sin cliente"}
            </p>
          </div>
        </div>

        {carrito.riesgo ? (
          <span className="rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
            Riesgo
          </span>
        ) : null}
      </div>

      <div className="grid gap-2.5 text-[12px]">
        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <UserRound
              size={14}
              className="text-[#4f7c90]"
            />

            <span className="truncate font-semibold text-[#172033]">
              {carrito.clientes?.nombre_completo ||
                "Sin cliente"}
            </span>
          </div>

          <div className="font-normal text-[#64748b]">
            {carrito.clientes?.telefono || "—"}
          </div>

          <div className="font-normal text-[#64748b]">
            {carrito.clientes?.email || "Sin email"}
          </div>
        </div>

        <div>
          <FieldLabel>Vendedor</FieldLabel>

          <SellerBadge
            vendedorId={carrito.vendedor_id}
            vendedorNombre={carrito.vendedor}
            vendedores={vendedores}
          />
        </div>

        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
          <FieldLabel>Viaje</FieldLabel>

          <div className="font-semibold text-[#172033]">
            {carrito.destino || "Sin destino"}
          </div>

          <div className="font-normal text-[#64748b]">
            {formatDateAR(carrito.fecha_in)} →{" "}
            {carrito.solo_ida
              ? "Solo ida"
              : formatDateAR(carrito.fecha_out)}
          </div>

          <div className="mt-1 font-normal text-[#64748b]">
            {carrito.servicio || "Sin servicio"} ·{" "}
            {carrito.metodo_contacto ||
              "Sin método"}
          </div>
        </div>

        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
          <FieldLabel>Importes</FieldLabel>

          <div className="flex justify-between">
            <span>Bruto</span>

            <strong className="font-semibold">
              {formatMoneyAR(
                carrito.importe_bruto,
                carrito.moneda
              )}
            </strong>
          </div>

          <div className="flex justify-between">
            <span>Promo</span>

            <strong className="font-semibold">
              {formatMoneyAR(
                carrito.promocode_importe,
                carrito.moneda
              )}
            </strong>
          </div>

          <div className="flex justify-between">
            <span>Final</span>

            <strong className="font-semibold">
              {formatMoneyAR(
                carrito.importe_final ??
                  carrito.importe,
                carrito.moneda
              )}
            </strong>
          </div>

          <div className="flex justify-between">
            <span>Pagado</span>

            <strong className="font-semibold">
              {formatMoneyAR(
                carrito.total_pagado,
                carrito.moneda
              )}
            </strong>
          </div>

          <div className="mt-1 flex justify-between border-t border-black/10 pt-1">
            <span>Saldo</span>

            <strong
              className={
                tieneSaldo
                  ? "font-semibold text-amber-700"
                  : "font-semibold text-emerald-700"
              }
            >
              {formatMoneyAR(
                carrito.saldo_cta_cte,
                carrito.moneda
              )}
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onEdit(carrito)}
            className="h-8 rounded-[10px] border border-[#4f7c90]/25 bg-[#eef6f7] text-[12px] font-medium text-[#4f7c90] hover:bg-[#dfeff2]"
          >
            Editar
          </button>

          <button
            type="button"
            onClick={() => onView(carrito)}
            className="h-8 rounded-[10px] border border-black/10 bg-white text-[12px] font-medium text-[#334155] hover:bg-[#f8fafc]"
          >
            Ver
          </button>

          <button
            type="button"
            onClick={() => {
              window.open(
                `https://abaco.almundo.com/bo/cart/${carrito.numero_carrito}`,
                "_blank",
                "noopener,noreferrer"
              );
            }}
            className="h-8 rounded-[10px] border border-black/10 bg-white text-[12px] font-medium text-[#334155] hover:bg-[#f8fafc]"
          >
            Ábaco
          </button>

          <button
            type="button"
            onClick={() => {
              void onSendToControl(carrito);
            }}
            disabled={
              saving ||
              yaFueEnviadoAControl
            }
            className="h-8 rounded-[10px] border border-[#4f7c90]/25 bg-[#eef6f7] text-[12px] font-medium text-[#4f7c90] hover:bg-[#dfeff2] disabled:opacity-50"
          >
            Enviar a control
          </button>

          <button
            type="button"
            onClick={() => {
              void onToggle(carrito);
            }}
            disabled={saving}
            className="col-span-2 h-8 rounded-[10px] border border-red-200 bg-red-50 text-[12px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            {carrito.activo
              ? "Desactivar"
              : "Activar"}
          </button>
        </div>
      </div>
    </aside>
  );
}
