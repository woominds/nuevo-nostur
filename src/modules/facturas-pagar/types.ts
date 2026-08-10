// Facturas a Pagar - Types
// V4

export type ProfileLite = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  sucursal_id: string | null;
  rol: string;
  color: string | null;
  activo: boolean;
};

export type ProveedorLite = {
  id: string;
  nombre: string | null;
  nombre_comercial?: string | null;
  razon_social: string | null;
  cuit: string | null;
  email?: string | null;
  telefono?: string | null;
  observaciones?: string | null;
  activo: boolean;
};

export type SucursalLite = {
  id: string;
  nombre: string;
  color?: string | null;
  activa?: boolean;
  activo?: boolean;
};

export type CajaLite = {
  id: string;
  nombre: string;
  moneda?: string | null;
  tipo?: string | null;
  activa?: boolean;
  activo?: boolean;
};

export type FacturaPagar = {
  id: string;
  proveedor_id: string | null;
  proveedor_nombre: string | null;
  descripcion: string;
  numero_factura: string | null;
  fecha_emision: string | null;
  fecha_vencimiento: string;
  moneda: string;
  sucursal_id: string | null;
  sucursal_nombre?: string | null;

  neto_gravado: string | number;
  iva_porcentaje: string | number;
  iva_importe: string | number;
  no_gravado: string | number;
  exento: string | number;
  total: string | number;
  saldo_pendiente: string | number;
  total_pagado: string | number;

  estado: string;
  estado_visual?: string | null;
  origen: string;
  recurrente_id: string | null;
  periodo: string | null;
  plan_pago: boolean;
  no_impacta_caja: boolean;

  archivo_url: string | null;
  archivo_nombre: string | null;
  observaciones: string | null;

  activo: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;

  cantidad_cuotas?: number;
  cantidad_pagos?: number;
};

export type FacturaPagarCuota = {
  id: string;
  factura_id: string;
  numero_cuota: number;
  descripcion: string | null;
  fecha_vencimiento: string;
  moneda: string;
  importe: string | number;
  saldo_pendiente: string | number;
  total_pagado: string | number;
  estado: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type FacturaPagarPago = {
  id: string;
  factura_id: string;
  cuota_id: string | null;
  fecha_pago: string;
  caja_id: string | null;
  caja_nombre: string | null;
  forma_pago_id: string | null;
  forma_pago: string | null;
  moneda: string;
  importe: string | number;
  no_impacta_caja: boolean;
  movimiento_caja_id: string | null;
  observaciones: string | null;
  anulado: boolean;
  motivo_anulacion: string | null;
  anulado_at: string | null;
  anulado_by: string | null;
  created_by: string | null;
  created_at: string;
};

export type GastoRecurrente = {
  id: string;
  proveedor_id: string | null;
  proveedor_nombre: string | null;
  descripcion: string;
  sucursal_id: string | null;
  moneda: string;
  importe_estimado: string | number;
  frecuencia: "MENSUAL" | "SEMANAL" | "ANUAL";
  dia_vencimiento: number;
  mes_vencimiento: number | null;
  categoria: string | null;
  no_impacta_caja: boolean;
  generar_automatico: boolean;
  fecha_inicio: string;
  fecha_fin: string | null;
  observaciones: string | null;
  activo: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type FacturaCuotaDraft = {
  id: string | null;
  numero_cuota: number;
  descripcion: string;
  fecha_vencimiento: string;
  importe: string;
};

export type FacturaPagarDraft = {
  id: string | null;
  proveedor_id: string | null;
  proveedor_nombre: string;
  descripcion: string;
  numero_factura: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  moneda: string;
  sucursal_id: string | null;

  neto_gravado: string;
  iva_porcentaje: string;
  iva_importe: string;
  iva_manual: boolean;
  no_gravado: string;
  exento: string;
  total: string;

  origen: "MANUAL" | "RECURRENTE";
  recurrente_id: string | null;
  periodo: string | null;
  plan_pago: boolean;
  no_impacta_caja: boolean;
  confirmar_proyectada: boolean;

  archivo_url: string;
  archivo_nombre: string;
  observaciones: string;

  cuotas: FacturaCuotaDraft[];
};

export type FacturaPagarPagoDraft = {
  factura_id: string;
  cuota_id: string | null;
  fecha_pago: string;
  caja_id: string | null;
  caja_nombre: string;
  forma_pago_id: string | null;
  forma_pago: string;
  moneda: string;
  importe: string;
  no_impacta_caja: boolean;
  observaciones: string;
};

export type GastoRecurrenteDraft = {
  id: string | null;
  proveedor_id: string | null;
  proveedor_nombre: string;
  descripcion: string;
  sucursal_id: string | null;
  moneda: string;
  importe_estimado: string;
  frecuencia: "MENSUAL" | "SEMANAL" | "ANUAL";
  dia_vencimiento: string;
  mes_vencimiento: string;
  categoria: string;
  no_impacta_caja: boolean;
  generar_automatico: boolean;
  fecha_inicio: string;
  fecha_fin: string;
  observaciones: string;
};

export type FacturasPagarFilters = {
  desde: string;
  hasta: string;
  estado: "pendientes" | "vencidas" | "por_vencer" | "proyectadas" | "pagadas" | "todas";
  moneda: "todas" | "ARS" | "USD";
  proveedorId: string;
  sucursalId: string;
  search: string;
};
