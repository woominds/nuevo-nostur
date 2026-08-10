// src/store/carritos/carritosTypes.ts

export type ProfileLite = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  sucursal_id: string | null;
  rol: string;
  color: string;
  activo: boolean;
  is_support_user?: boolean | null;
  is_super_admin?: boolean | null;
};

export type CatalogItem = {
  id: string;
  nombre: string;
  color?: string;
  activo?: boolean;
  pais?: string;
  impacta_tesoreria?: boolean;
  activa?: boolean;
};

export type Caja = {
  id: string;
  nombre: string;
  moneda?: string;
  tipo?: string;
  sucursal_id?: string | null;
  activa?: boolean;
  activo?: boolean;
};

export type Cliente = {
  id: string;
  nombre_completo: string;
  telefono: string;
  email: string | null;
  origen: string | null;
  contacto_id: string | null;
  vendedor: string | null;
  vendedor_id: string | null;
  sucursal_id: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type Carrito = {
  id: string;
  cliente_id: string;
  contacto_id: string | null;
  numero_carrito: string;
  fecha_venta: string;
  servicio_id: string | null;
  servicio: string | null;
  metodo_contacto: string | null;
  forma_pago_id: string | null;
  forma_pago: string | null;
  destino: string | null;
  fecha_in: string | null;
  fecha_out: string | null;
  solo_ida: boolean;
  importe: string | number;
  moneda: string;
  vendedor: string | null;
  vendedor_id: string | null;
  sucursal_id: string | null;
  estado: string;
  observaciones: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;

  importe_bruto?: string | number;
  promocode_aplicado?: boolean;
  promocode_importe?: string | number;
  importe_final?: string | number;
  pago_parcial?: boolean;
  fecha_ingreso_gastos?: string | null;
  total_pagado?: string | number;
  saldo_cta_cte?: string | number;
  visible_en_carritos?: boolean;
  fecha_visible_carritos?: string | null;

  pago_diferente_oficina?: boolean;
  forma_pago_oficina_id?: string | null;
  forma_pago_oficina?: string | null;
  observacion_pago_diferente?: string | null;

  usa_markup_adicional?: boolean;
  markup_adicional_pct?: string | number | null;

  riesgo?: boolean;
  importe_riesgo?: string | number;
  riesgo_motivo?: string | null;
  riesgo_resuelto?: boolean;
  riesgo_resuelto_at?: string | null;
  riesgo_resuelto_by?: string | null;
  riesgo_observaciones?: string | null;

  confirmado_vendedor?: boolean;
  confirmado_at?: string | null;
  enviado_control_at?: string | null;

  derivado_control?: boolean;
  controlado?: boolean;
  controlado_at?: string | null;
  controlado_by?: string | null;
  facturado?: boolean;
  cobrado?: boolean;

  clientes?: Cliente | null;
};

export type PagoComercial = {
  id?: string;
  carrito_id?: string;
  forma_pago_id?: string | null;
  forma_pago?: string | null;
  importe: number;
  moneda: string;
};

export type MovimientoTesoreria = {
  id?: string;
  carrito_id?: string;
  caja_id?: string | null;
  caja?: string | null;
  forma_pago_id?: string | null;
  forma_pago?: string | null;
  importe: number;
  moneda: string;
  tipo_cambio?: number | null;
  moneda_equivalente?: string | null;
  importe_equivalente?: number | null;
  fecha_movimiento?: string | null;
};

export type ClienteDraft = {
  id?: string;
  nombre_completo: string;
  telefono: string;
  email?: string | null;
  origen?: string | null;
  vendedor_id?: string | null;
  sucursal_id?: string | null;
};

export type CarritoWizardInput = {
  cliente: ClienteDraft;

  carrito: {
    contacto_id?: string | null;
    numero_carrito: string;
    fecha_venta: string;
    servicio_id?: string | null;
    servicio?: string | null;
    metodo_contacto?: string | null;
    destino?: string | null;
    fecha_in?: string | null;
    fecha_out?: string | null;
    solo_ida?: boolean;

    importe_bruto: number;
    moneda: string;

    promocode_aplicado: boolean;
    promocode_importe: number;

    pago_diferente_oficina: boolean;
    forma_pago_oficina_id?: string | null;
    forma_pago_oficina?: string | null;
    observacion_pago_diferente?: string | null;

    usa_markup_adicional: boolean;
    markup_adicional_pct?: number | null;

    importe_final: number;
    pago_parcial: boolean;
    fecha_ingreso_gastos?: string | null;
    total_pagado: number;
    saldo_cta_cte: number;
    visible_en_carritos: boolean;

    riesgo: boolean;
    importe_riesgo?: number;
    riesgo_motivo?: string | null;

    confirmado_vendedor: boolean;
    observaciones?: string | null;
    vendedor_id?: string | null;
    sucursal_id?: string | null;
  };

  pagosComerciales: PagoComercial[];
  movimientosTesoreria: MovimientoTesoreria[];
};

export type CarritoMobileUpdateInput = {
  carritoId: string;

  cliente?: {
    id?: string;
    nombre_completo?: string;
    telefono?: string;
    email?: string | null;
    origen?: string | null;
  };

  carrito: {
    numero_carrito?: string;
    fecha_venta?: string;
    servicio_id?: string | null;
    servicio?: string | null;
    metodo_contacto?: string | null;
    destino?: string | null;
    fecha_in?: string | null;
    fecha_out?: string | null;
    solo_ida?: boolean;

    importe_bruto?: number;
    moneda?: string;

    promocode_aplicado?: boolean;
    promocode_importe?: number;

    pago_diferente_oficina?: boolean;
    forma_pago_oficina_id?: string | null;
    forma_pago_oficina?: string | null;
    observacion_pago_diferente?: string | null;

    usa_markup_adicional?: boolean;
    markup_adicional_pct?: number | null;

    importe_final?: number;
    pago_parcial?: boolean;
    fecha_ingreso_gastos?: string | null;
    total_pagado?: number;
    saldo_cta_cte?: number;
    visible_en_carritos?: boolean;

    riesgo?: boolean;
    importe_riesgo?: number;
    riesgo_motivo?: string | null;

    estado?: string;
    observaciones?: string | null;
    vendedor_id?: string | null;
    sucursal_id?: string | null;
    activo?: boolean;
  };

  pagosComerciales: PagoComercial[];
  movimientosTesoreria: MovimientoTesoreria[];
};

export type CarritosFilters = {
  periodMode: "mes" | "rango";
  month: string;
  desde: string;
  hasta: string;
  estado: string;
  vendedorId: string;
  sucursalId: string;
  riesgo: "todos" | "riesgo" | "normal";
  activo: "todos" | "activos" | "inactivos";
  search: string;
};

export type CarritosMetrics = {
  carritos: number;
  totalVenta: number;
  totalPagado: number;
  saldo: number;
  riesgos: number;
  cargados: number;
  enControl: number;
  controlados: number;
};

export type CarritosCatalogos = {
  metodosContacto: CatalogItem[];
  destinos: CatalogItem[];
  servicios: CatalogItem[];
  formasPago: CatalogItem[];
  cajas: Caja[];
  vendedores: ProfileLite[];
  sucursales: CatalogItem[];
};

export type CarritosState = {
  loading: boolean;
  saving: boolean;
  error: string | null;

  currentProfile: ProfileLite | null;
  canManageCarritos: boolean;

  carritos: Carrito[];
  pagosComerciales: PagoComercial[];
  movimientosTesoreria: MovimientoTesoreria[];

  clientesSearch: Cliente[];

  catalogos: CarritosCatalogos;

  filters: CarritosFilters;
  selectedCarritoId: string | null;

  loadCarritos: () => Promise<void>;

  searchClientesByPhone: (
    telefono: string
  ) => Promise<void>;

  createDestinoInline: (
    nombre: string,
    pais?: string
  ) => Promise<string | null>;

  saveCarritoWizard: (
    input: CarritoWizardInput
  ) => Promise<boolean>;

  loadCarritoPagos: (
    carritoId: string
  ) => Promise<PagoComercial[]>;

  loadCarritoMovimientos: (
    carritoId: string
  ) => Promise<MovimientoTesoreria[]>;

  updateCarritoMobile: (
    input: CarritoMobileUpdateInput
  ) => Promise<boolean>;

  toggleCarritoActivo: (
    carrito: Carrito
  ) => Promise<boolean>;

  sendToControl: (
    carrito: Carrito
  ) => Promise<boolean>;

  setFilter: <
    K extends keyof CarritosFilters
  >(
    key: K,
    value: CarritosFilters[K]
  ) => void;

  setMonthFilter: (
    month: string
  ) => void;

  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;
  resetFilters: () => void;

  selectCarrito: (
    id: string | null
  ) => void;

  clearError: () => void;

  getFilteredCarritos: () => Carrito[];
  getMetrics: () => CarritosMetrics;
};
