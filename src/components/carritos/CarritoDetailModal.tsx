// src/components/carritos/CarritoDetailModal.tsx

import {
  Pencil,
  X
} from "lucide-react";
import type {
  Carrito,
  ProfileLite
} from "../../store/carritosStore";
import { formatMoneyAR } from "../../lib/formatters";
import {
  FieldLabel,
  SellerBadge
} from "./components";
import {
  formatDateAR,
  getEstadoVisualCarrito,
  parseMoney
} from "./carritosModel";

type CarritoDetailModalProps = {
  carrito: Carrito;
  vendedores: ProfileLite[];
  sucursales: {
    id: string;
    nombre: string;
  }[];
  onClose: () => void;
  onEdit: () => void;
};

export function CarritoDetailModal({
  carrito,
  vendedores,
  sucursales,
  onClose,
  onEdit
}: CarritoDetailModalProps) {
  const abacoUrl =
    `https://abaco.almundo.com/bo/cart/${carrito.numero_carrito}`;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/35 px-2 pt-3 backdrop-blur-sm sm:px-4 sm:pt-8">
      <div className="max-h-[calc(100vh-24px)] w-full max-w-4xl overflow-auto rounded-[18px] border border-black/10 bg-white p-3 text-[#172033] shadow-2xl sm:max-h-[calc(100vh-64px)] sm:p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-semibold text-[#172033]">
              Carrito {carrito.numero_carrito}
            </h2>

            <p className="mt-0.5 text-[12px] font-normal text-[#64748b]">
              {carrito.clientes?.nombre_completo || "Sin cliente"} ·{" "}
              {carrito.destino || "Sin destino"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#172033]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-2.5 md:grid-cols-3">
          <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
            <FieldLabel>
              Cliente
            </FieldLabel>

            <div className="text-[13px] font-semibold text-[#172033]">
              {carrito.clientes?.nombre_completo || "—"}
            </div>

            <div className="text-[12px] font-normal text-[#64748b]">
              {carrito.clientes?.telefono || "—"}
            </div>

            <div className="text-[12px] font-normal text-[#64748b]">
              {carrito.clientes?.email || "Sin email"}
            </div>
          </div>

          <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
            <FieldLabel>
              Viaje
            </FieldLabel>

            <div className="text-[13px] font-semibold text-[#172033]">
              {carrito.destino || "—"}
            </div>

            <div className="text-[12px] font-normal text-[#64748b]">
              {formatDateAR(carrito.fecha_in)} →{" "}
              {carrito.solo_ida
                ? "Solo ida"
                : formatDateAR(carrito.fecha_out)}
            </div>

            <div className="mt-1 text-[12px] font-normal text-[#64748b]">
              {carrito.servicio || "Sin servicio"}
            </div>
          </div>

          <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3">
            <FieldLabel>
              Total
            </FieldLabel>

            <div className="text-[13px] font-semibold text-[#172033]">
              {formatMoneyAR(
                carrito.importe_final ?? carrito.importe,
                carrito.moneda
              )}
            </div>

            <div className="text-[12px] font-normal text-[#64748b]">
              {getEstadoVisualCarrito(carrito)}
            </div>

            {carrito.riesgo ? (
              <div className="mt-2 inline-flex rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                Riesgo
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-3 grid gap-2.5 md:grid-cols-2">
          <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3 text-[12px] font-normal text-[#475569]">
            <div className="mb-3">
              <FieldLabel>
                Vendedor
              </FieldLabel>

              <SellerBadge
                vendedorId={carrito.vendedor_id}
                vendedorNombre={carrito.vendedor}
                vendedores={vendedores}
              />
            </div>

            <div className="mb-1.5">
              Sucursal:{" "}
              <strong className="font-semibold">
                {sucursales.find(
                  (sucursal) =>
                    sucursal.id === carrito.sucursal_id
                )?.nombre || "—"}
              </strong>
            </div>

            <div className="mb-1.5">
              Método contacto:{" "}
              <strong className="font-semibold">
                {carrito.metodo_contacto || "—"}
              </strong>
            </div>

            <div className="mb-1.5">
              Forma de pago:{" "}
              <strong className="font-semibold">
                {carrito.forma_pago || "—"}
              </strong>
            </div>

            <div>
              Riesgo:{" "}
              <strong className="font-semibold">
                {carrito.riesgo ? "SÍ" : "NO"}
              </strong>
            </div>
          </div>

          <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-3 text-[12px] font-normal text-[#475569]">
            <div className="mb-1.5 flex justify-between gap-3">
              <span>Bruto</span>

              <strong className="font-semibold">
                {formatMoneyAR(
                  carrito.importe_bruto,
                  carrito.moneda
                )}
              </strong>
            </div>

            <div className="mb-1.5 flex justify-between gap-3">
              <span>Promo</span>

              <strong className="font-semibold">
                {formatMoneyAR(
                  carrito.promocode_importe,
                  carrito.moneda
                )}
              </strong>
            </div>

            <div className="mb-1.5 flex justify-between gap-3">
              <span>Final</span>

              <strong className="font-semibold">
                {formatMoneyAR(
                  carrito.importe_final ?? carrito.importe,
                  carrito.moneda
                )}
              </strong>
            </div>

            <div className="mb-1.5 flex justify-between gap-3">
              <span>Pagado</span>

              <strong className="font-semibold">
                {formatMoneyAR(
                  carrito.total_pagado,
                  carrito.moneda
                )}
              </strong>
            </div>

            <div className="flex justify-between gap-3 border-t border-black/10 pt-2">
              <span>Saldo</span>

              <strong
                className={
                  parseMoney(carrito.saldo_cta_cte) > 0
                    ? "font-semibold text-red-600"
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
        </div>

        {carrito.riesgo ? (
          <div className="mt-3 rounded-[14px] border border-red-200 bg-red-50 p-3 text-[12px] font-medium text-red-700">
            <strong>
              Motivo riesgo:
            </strong>{" "}
            {carrito.riesgo_motivo || "Sin motivo cargado"}
          </div>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-[#4f7c90] px-4 text-[12px] font-medium text-white hover:bg-[#406b7d]"
          >
            <Pencil size={14} />
            Editar carrito
          </button>

          <button
            type="button"
            onClick={() =>
              window.open(
                abacoUrl,
                "_blank"
              )
            }
            className="h-8 rounded-[10px] border border-black/10 bg-white px-4 text-[12px] font-medium text-[#334155] hover:bg-[#f8fafc]"
          >
            Abrir Ábaco
          </button>
        </div>
      </div>
    </div>
  );
}

export default CarritoDetailModal;
