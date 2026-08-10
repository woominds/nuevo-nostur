import {
  CheckCircle2,
  Eye,
  Pencil,
  ShoppingCart,
  ToggleLeft,
  ToggleRight
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
import { SellerBadge } from "./CarritosDisplayComponents";

type CarritosListProps = {
  carritos: Carrito[];
  vendedores: ProfileLite[];
  selectedCarritoId?: string | null;
  loading: boolean;
  onSelect: (
    carritoId: string
  ) => void | Promise<void>;
  onView: (carrito: Carrito) => void;
  onEdit: (carrito: Carrito) => void;
  onSendToControl: (
    carrito: Carrito
  ) => void | Promise<void>;
  onToggle: (
    carrito: Carrito
  ) => void | Promise<void>;
};

export function CarritosList({
  carritos,
  vendedores,
  selectedCarritoId,
  loading,
  onSelect,
  onView,
  onEdit,
  onSendToControl,
  onToggle
}: CarritosListProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[16px] border border-black/10 bg-white/62 p-3 shadow-sm backdrop-blur-xl">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[14px] font-semibold text-[#172033]">
            Listado de carritos
          </h2>

          <p className="text-[11.5px] font-normal text-[#64748b]">
            {loading
              ? "Cargando..."
              : `${carritos.length} carritos cargados`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-5 text-center text-[12px] font-normal text-[#64748b]">
          Cargando carritos...
        </div>
      ) : carritos.length === 0 ? (
        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-5 text-center text-[12px] font-normal text-[#64748b]">
          No hay carritos para los filtros seleccionados.
        </div>
      ) : (
        <div className="grid gap-1.5">
          {carritos.map((carrito) => {
            const selected =
              selectedCarritoId === carrito.id;

            const cliente = carrito.clientes;

            const tieneSaldo =
              parseMoney(
                carrito.saldo_cta_cte
              ) > 0.009;

            const estaInactivo =
              carrito.activo === false;

            const estadoVisual =
              getEstadoVisualCarrito(carrito);

            const yaFueEnviadoAControl = [
              "EN_CONTROL",
              "CONTROLADO",
              "FACTURADO",
              "COBRADO"
            ].includes(estadoVisual);

            return (
              <article
                key={carrito.id}
                onClick={() => {
                  void onSelect(carrito.id);
                }}
                className={[
                  "carrito-row grid min-w-0 cursor-pointer gap-3 rounded-[14px] border px-3 py-3 text-left transition",
                  selected
                    ? "border-[#4f7c90]/50 bg-[#eef6f7]"
                    : estaInactivo
                      ? "border-black/10 bg-[#f8fafc] opacity-60 hover:bg-white"
                      : "border-black/10 bg-[#f8fafc] hover:bg-white"
                ].join(" ")}
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#e2e8f0] text-[11px] font-semibold text-[#334155]">
                      {getInitials(
                        cliente?.nombre_completo ||
                          "C"
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-[#172033]">
                        {cliente?.nombre_completo ||
                          "Sin cliente"}
                      </div>

                      <div className="truncate text-[11.5px] font-normal text-[#64748b]">
                        {cliente?.telefono || "—"}
                      </div>

                      <div className="truncate text-[11.5px] font-medium text-[#4f7c90]">
                        {carrito.numero_carrito}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <SellerBadge
                      vendedorId={
                        carrito.vendedor_id
                      }
                      vendedorNombre={
                        carrito.vendedor
                      }
                      vendedores={vendedores}
                    />
                  </div>
                </div>

                <div className="carrito-row-travel min-w-0">
                  <div className="carrito-row-mobile-label text-[10px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                    Viaje
                  </div>

                  <div className="truncate text-[12px] font-semibold text-[#172033]">
                    {carrito.destino ||
                      "Sin destino"}
                  </div>

                  <div className="truncate text-[11px] font-normal text-[#64748b]">
                    {formatDateAR(
                      carrito.fecha_in
                    )}{" "}
                    →{" "}
                    {carrito.solo_ida
                      ? "Solo ida"
                      : formatDateAR(
                          carrito.fecha_out
                        )}
                  </div>

                  <div className="truncate text-[11px] font-normal text-[#64748b]">
                    {carrito.servicio ||
                      "Sin servicio"}{" "}
                    ·{" "}
                    {carrito.metodo_contacto ||
                      "Sin método"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 min-[980px]:block">
                  <div className="carrito-row-money-block">
                    <div className="carrito-row-mobile-label text-[10px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                      Final
                    </div>

                    <div className="truncate text-[12px] font-semibold text-[#172033]">
                      {formatMoneyAR(
                        carrito.importe_final ??
                          carrito.importe,
                        carrito.moneda
                      )}
                    </div>

                    <div className="truncate text-[11px] font-normal text-[#64748b]">
                      Pagado{" "}
                      {formatMoneyAR(
                        carrito.total_pagado,
                        carrito.moneda
                      )}
                    </div>

                    <div className="mt-0.5 truncate text-[10.5px] font-normal text-[#64748b]">
                      Venta:{" "}
                      {formatDateAR(
                        carrito.fecha_venta
                      )}
                    </div>
                  </div>

                  <div className="carrito-row-money-block min-[980px]:hidden">
                    <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                      Saldo
                    </div>

                    <div
                      className={[
                        "truncate text-[12px] font-semibold",
                        tieneSaldo
                          ? "text-amber-700"
                          : "text-emerald-700"
                      ].join(" ")}
                    >
                      {formatMoneyAR(
                        carrito.saldo_cta_cte,
                        carrito.moneda
                      )}
                    </div>
                  </div>

                  {tieneSaldo ? (
                    <div className="hidden text-[11px] font-medium text-[#64748b] min-[980px]:block">
                      Saldo{" "}
                      {formatMoneyAR(
                        carrito.saldo_cta_cte,
                        carrito.moneda
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <span className="rounded-md border border-black/10 bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#334155]">
                    {estadoVisual}
                  </span>

                  {tieneSaldo ? (
                    <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                      Cta Cte
                    </span>
                  ) : null}

                  {carrito.riesgo ? (
                    <span className="rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                      Riesgo
                    </span>
                  ) : null}

                  {estaInactivo ? (
                    <span className="rounded-md border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                      Inactivo
                    </span>
                  ) : null}
                </div>

                <div
                  className="carrito-row-actions"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  <button
                    type="button"
                    onClick={() => {
                      void onSelect(carrito.id);
                      onView(carrito);
                    }}
                    className="inline-flex h-8 w-full items-center justify-center rounded-[10px] bg-white text-[#334155] shadow-sm ring-1 ring-black/10 transition hover:bg-[#f8fafc] min-[980px]:h-7 min-[980px]:w-7"
                    title="Ver detalle"
                    aria-label="Ver detalle"
                  >
                    <Eye size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      void onSelect(carrito.id);
                      onEdit(carrito);
                    }}
                    className="inline-flex h-8 w-full items-center justify-center rounded-[10px] bg-white text-[#334155] shadow-sm ring-1 ring-black/10 transition hover:bg-[#f8fafc] min-[980px]:h-7 min-[980px]:w-7"
                    title="Editar carrito"
                    aria-label="Editar carrito"
                  >
                    <Pencil size={14} />
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
                    className="inline-flex h-8 w-full items-center justify-center rounded-[10px] bg-white text-[#334155] shadow-sm ring-1 ring-black/10 transition hover:bg-[#f8fafc] min-[980px]:h-7 min-[980px]:w-7"
                    title="Abrir Ábaco"
                    aria-label="Abrir Ábaco"
                  >
                    <ShoppingCart size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      void onSendToControl(
                        carrito
                      );
                    }}
                    className={[
                      "inline-flex h-8 w-full items-center justify-center rounded-[10px] shadow-sm ring-1 ring-black/10 transition hover:bg-white min-[980px]:h-7 min-[980px]:w-7",
                      yaFueEnviadoAControl
                        ? "bg-emerald-50 text-emerald-600 opacity-60"
                        : "bg-[#eef6f7] text-[#4f7c90]"
                    ].join(" ")}
                    title={
                      yaFueEnviadoAControl
                        ? "Ya fue enviado a control o ya fue controlado"
                        : "Enviar a control"
                    }
                    aria-label="Enviar a control"
                  >
                    <CheckCircle2 size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      void onToggle(carrito);
                    }}
                    className="inline-flex h-8 w-full items-center justify-center rounded-[10px] bg-white text-[#334155] shadow-sm ring-1 ring-black/10 transition hover:bg-[#f8fafc] min-[980px]:h-7 min-[980px]:w-7"
                    title={
                      carrito.activo
                        ? "Desactivar"
                        : "Activar"
                    }
                    aria-label={
                      carrito.activo
                        ? "Desactivar"
                        : "Activar"
                    }
                  >
                    {carrito.activo ? (
                      <ToggleRight size={14} />
                    ) : (
                      <ToggleLeft size={14} />
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
