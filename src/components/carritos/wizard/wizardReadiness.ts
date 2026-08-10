// src/components/carritos/wizard/wizardReadiness.ts

import {
  isDateBefore,
  isValidCarrito,
  parseMoney,
  type WizardDraft
} from "../carritosModel";

export type WizardReadinessInput = {
  draft: WizardDraft;
  totalFinal: number;
  totalComercial: number;
  totalTesoreria: number;
  importeRiesgo: number;
};

export type WizardReadinessResult = {
  ready: boolean;
  issues: string[];
};

export function getWizardReadiness({
  draft,
  totalFinal,
  totalComercial,
  totalTesoreria,
  importeRiesgo
}: WizardReadinessInput): WizardReadinessResult {
  const issues: string[] = [];

  if (
    !draft.cliente.telefono.trim() ||
    draft.phoneLocal.length < 3
  ) {
    issues.push("Falta un teléfono válido.");
  }

  if (!draft.cliente.nombre_completo.trim()) {
    issues.push("Falta el nombre del cliente.");
  }

  if (!draft.cliente.vendedor_id) {
    issues.push("Falta seleccionar el vendedor.");
  }

  if (!draft.cliente.sucursal_id) {
    issues.push("Falta seleccionar la sucursal.");
  }

  if (!draft.cliente.origen.trim()) {
    issues.push("Falta seleccionar el método de contacto.");
  }

  if (
    !isValidCarrito(
      draft.venta.numero_carrito
    )
  ) {
    issues.push("El número de carrito está incompleto.");
  }

  if (!draft.venta.servicio.trim()) {
    issues.push("Falta seleccionar el tipo de servicio.");
  }

  if (
    draft.venta.destinos.length === 0
  ) {
    issues.push("Falta seleccionar al menos un destino.");
  }

  if (!draft.venta.fecha_in) {
    issues.push("Falta la fecha IN.");
  }

  if (
    !draft.venta.solo_ida &&
    !draft.venta.fecha_out
  ) {
    issues.push("Falta la fecha OUT.");
  }

  if (
    !draft.venta.solo_ida &&
    isDateBefore(
      draft.venta.fecha_out,
      draft.venta.fecha_in
    )
  ) {
    issues.push("La fecha OUT es anterior a la fecha IN.");
  }

  if (totalFinal <= 0) {
    issues.push("El importe final debe ser mayor a cero.");
  }

  const pagosInformados =
    draft.pagosComerciales.filter(
      (pago) =>
        parseMoney(pago.importe) > 0
    );

  if (pagosInformados.length === 0) {
    issues.push("Falta registrar el pago informado en ALMUNDO.");
  }

  if (
    pagosInformados.some(
      (pago) =>
        !pago.forma_pago_id ||
        !pago.moneda
    )
  ) {
    issues.push("Hay pagos de ALMUNDO incompletos.");
  }

  if (draft.usaMarkupAdicional) {
    const markup = parseMoney(
      draft.markupAdicionalPct
    );

    if (
      markup <= 0 ||
      markup > 100
    ) {
      issues.push("El porcentaje de markup no es válido.");
    }
  }

  if (draft.riesgo) {
    if (importeRiesgo <= 0) {
      issues.push("Falta el importe imputado a riesgo.");
    }

    if (!draft.riesgo_motivo.trim()) {
      issues.push("Falta el motivo del riesgo.");
    }
  }

  if (totalComercial <= 0) {
    issues.push("Falta completar la imputación comercial.");
  }

  if (
    totalComercial >
    totalFinal + 0.009
  ) {
    issues.push("La imputación comercial supera el total.");
  }

  if (
    !draft.pagoParcial &&
    Math.abs(
      totalComercial - totalFinal
    ) > 0.009
  ) {
    issues.push("La imputación comercial no coincide con el total.");
  }

  if (
    draft.pagoParcial &&
    totalComercial >= totalFinal
  ) {
    issues.push("El pago parcial debe dejar saldo pendiente.");
  }

  if (
    draft.pagoParcial &&
    !draft.fechaIngresoGastos
  ) {
    issues.push("Falta la fecha de ingreso a gastos.");
  }

  const pagosReales =
    draft.movimientosTesoreria.filter(
      (movimiento) =>
        parseMoney(
          movimiento.importe
        ) > 0
    );

  if (pagosReales.length === 0) {
    issues.push("Falta registrar el pago real recibido.");
  }

  if (
    pagosReales.some(
      (movimiento) =>
        !movimiento.caja_id ||
        !movimiento.forma_pago_id ||
        !movimiento.moneda
    )
  ) {
    issues.push("Hay pagos reales incompletos.");
  }

  if (
    totalTesoreria >
    totalFinal + 0.009
  ) {
    issues.push("El pago real supera el total del cliente.");
  }

  if (
    !draft.pagoParcial &&
    Math.abs(
      totalTesoreria - totalFinal
    ) > 0.009
  ) {
    issues.push("El pago real no coincide con el total.");
  }

  if (
    draft.pagoParcial &&
    totalTesoreria >= totalFinal
  ) {
    issues.push("El pago real parcial debe dejar saldo pendiente.");
  }

  return {
    ready: issues.length === 0,
    issues
  };
}
