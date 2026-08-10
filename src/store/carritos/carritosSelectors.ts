// src/store/carritos/carritosSelectors.ts

import type {
  Carrito,
  CarritosMetrics
} from "./carritosTypes";
import {
  getNumber,
  normalizeText
} from "./carritosUtils";

export function filterCarritosBySearch(
  carritos: Carrito[],
  searchValue: string
): Carrito[] {
  const search = normalizeText(searchValue);

  if (!search) {
    return carritos;
  }

  return carritos.filter((carrito) => {
    const cliente = carrito.clientes;

    const haystack = normalizeText(
      [
        carrito.numero_carrito,
        carrito.destino,
        carrito.servicio,
        carrito.estado,
        carrito.vendedor,
        carrito.metodo_contacto,
        cliente?.nombre_completo,
        cliente?.telefono,
        cliente?.email
      ].join(" ")
    );

    return haystack.includes(search);
  });
}

export function calculateCarritosMetrics(
  carritos: Carrito[]
): CarritosMetrics {
  const totalVenta = carritos.reduce(
    (total, carrito) =>
      total +
      getNumber(
        carrito.importe_final ??
          carrito.importe
      ),
    0
  );

  const totalPagado = carritos.reduce(
    (total, carrito) =>
      total +
      getNumber(carrito.total_pagado),
    0
  );

  const saldo = carritos.reduce(
    (total, carrito) =>
      total +
      getNumber(carrito.saldo_cta_cte),
    0
  );

  return {
    carritos: carritos.length,
    totalVenta,
    totalPagado,
    saldo,
    riesgos: carritos.filter(
      (carrito) => Boolean(carrito.riesgo)
    ).length,
    cargados: carritos.filter(
      (carrito) =>
        carrito.estado === "CARGADO"
    ).length,
    enControl: carritos.filter(
      (carrito) =>
        carrito.estado === "EN_CONTROL"
    ).length,
    controlados: carritos.filter(
      (carrito) =>
        carrito.estado === "CONTROLADO"
    ).length
  };
}
