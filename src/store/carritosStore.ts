import {
  create } from "zustand";
import { supabase } from "../lib/supabase";
import { createDestinoInlineApi } from "./carritos/carritosApi";

import type {
  CarritosState,
  Cliente,
  MovimientoTesoreria,
  PagoComercial
} from "./carritos/carritosTypes";

export type {
  Caja,
  Carrito,
  CarritoMobileUpdateInput,
  CarritosFilters,
  CarritoWizardInput,
  CatalogItem,
  Cliente,
  ClienteDraft,
  MovimientoTesoreria,
  PagoComercial,
  ProfileLite
} from "./carritos/carritosTypes";

import {
  addMonthsToMonth,
  calculateMobileTotals,
  canProfileManage,
  canProfileUse,
  cleanText,
  getCurrentMonth,
  getCurrentUserId,
  getDefaultFilters,
  getMonthRange,
  getNumber,
  getToday,
  normalizeError,
  normalizePhone,
  normalizeText,
} from "./carritos/carritosUtils";

import {
  calculateCarritosMetrics,
  filterCarritosBySearch
} from "./carritos/carritosSelectors";

import { sendCarritoToControlApi } from "./carritos/carritosApi";
import { toggleCarritoActivoApi } from "./carritos/carritosApi";
import { loadCarritosDataApi } from "./carritos/carritosApi";
import { loadCurrentProfileApi } from "./carritos/carritosApi";
import { saveCarritoWizardApi } from "./carritos/carritosApi";
import { updateCarritoMobileApi } from "./carritos/carritosApi";
export const useCarritosStore = create<CarritosState>((set, get) => ({
  loading: false,
  saving: false,
  error: null,

currentProfile: null,
canManageCarritos: false,


  carritos: [],
  pagosComerciales: [],
  movimientosTesoreria: [],

  clientesSearch: [],

  catalogos: {
    metodosContacto: [],
    destinos: [],
    servicios: [],
    formasPago: [],
    cajas: [],
    vendedores: [],
    sucursales: []
  },

  filters: getDefaultFilters(),
  selectedCarritoId: null,

  loadCarritos: async () => {
    set({
      loading: true,
      error: null
    });

    const currentUserId =
      await getCurrentUserId();

    if (!currentUserId) {
      set({
        loading: false,
        currentProfile: null,
        canManageCarritos: false,
        carritos: [],
        pagosComerciales: [],
        movimientosTesoreria: [],
        clientesSearch: [],
        error: "No hay usuario autenticado."
      });

      return;
    }

    try {
      const currentProfile =
        await loadCurrentProfileApi(
          currentUserId
        );

      const canManageCarritos =
        canProfileManage(currentProfile);

      if (
        !canProfileUse(currentProfile)
      ) {
        set({
          loading: false,
          currentProfile,
          canManageCarritos,
          carritos: [],
          pagosComerciales: [],
          movimientosTesoreria: [],
          clientesSearch: [],
          error:
            "Tu usuario no tiene acceso al módulo Carritos."
        });

        return;
      }

      const result =
        await loadCarritosDataApi(
          get().filters
        );

      set({
        loading: false,
        error: null,
        currentProfile,
        canManageCarritos,
        carritos: result.carritos,
        pagosComerciales:
          result.pagosComerciales,
        movimientosTesoreria:
          result.movimientosTesoreria,
        catalogos: result.catalogos
      });
    } catch (error) {
      set({
        loading: false,
        error: normalizeError(error)
      });
    }
  },

  searchClientesByPhone: async (telefono) => {
    const normalized = normalizePhone(telefono);
    const digits = normalized.replace(/\D/g, "");

    if (digits.length < 3) {
      set({ clientesSearch: [] });
      return;
    }

    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .ilike("telefono", `%${digits}%`)
      .limit(10);

    if (error) {
      set({ error: normalizeError(error) });
      return;
    }

    set({ clientesSearch: (data || []) as Cliente[] });
  },

  createDestinoInline: async (
    nombre,
    pais = "Sin especificar"
  ) => {
    const cleanNombre = cleanText(nombre);
    const cleanPais =
      cleanText(pais) || "Sin especificar";

    if (!cleanNombre) {
      set({
        error: "Ingresá un destino válido."
      });

      return null;
    }

    const existing =
      get().catalogos.destinos.find(
        (destino) =>
          normalizeText(destino.nombre) ===
            normalizeText(cleanNombre) &&
          normalizeText(
            destino.pais ||
              "Sin especificar"
          ) === normalizeText(cleanPais)
      );

    if (existing) {
      return existing.nombre;
    }

    try {
      const created =
        await createDestinoInlineApi(
          cleanNombre,
          cleanPais
        );

      set((state) => ({
        error: null,
        catalogos: {
          ...state.catalogos,
          destinos: [
            ...state.catalogos.destinos,
            created
          ].sort((a, b) =>
            a.nombre.localeCompare(
              b.nombre
            )
          )
        }
      }));

      return created.nombre;
    } catch (error) {
      set({
        error: normalizeError(error)
      });

      return null;
    }
  },

  saveCarritoWizard: async (input) => {
    set({
      saving: true,
      error: null
    });

    const currentUserId =
      await getCurrentUserId();

    const {
      currentProfile,
      canManageCarritos,
      catalogos
    } = get();

    if (
      !currentUserId ||
      !currentProfile
    ) {
      set({
        saving: false,
        error:
          "No hay usuario autenticado."
      });

      return false;
    }

    if (
      !input.carrito
        .confirmado_vendedor
    ) {
      set({
        saving: false,
        error:
          "El vendedor debe confirmar que los datos son correctos."
      });

      return false;
    }

    const vaACuentaCorriente =
      Boolean(
        input.carrito.pago_parcial
      ) &&
      getNumber(
        input.carrito.saldo_cta_cte
      ) > 0.009;

    if (
      vaACuentaCorriente &&
      !input.carrito
        .fecha_ingreso_gastos
    ) {
      set({
        saving: false,
        error:
          "Completá la fecha de ingreso a gastos para enviar el carrito a cuenta corriente."
      });

      return false;
    }

    try {
      await saveCarritoWizardApi({
        input,
        currentUserId,
        currentProfile,
        canManageCarritos,
        vendedores:
          catalogos.vendedores
      });

      await get().loadCarritos();

      set({
        saving: false,
        clientesSearch: []
      });

      return true;
    } catch (error) {
      set({
        saving: false,
        error: normalizeError(error)
      });

      return false;
    }
  },

  loadCarritoPagos: async (carritoId) => {
    set({ error: null });

    const { data, error } = await supabase
      .from("carrito_pagos_comerciales")
      .select("*")
      .eq("carrito_id", carritoId)
      .order("created_at", { ascending: true });

    if (error) {
      set({ error: normalizeError(error) });
      return [];
    }

    return (data || []) as PagoComercial[];
  },

  loadCarritoMovimientos: async (carritoId) => {
    set({ error: null });

    const { data, error } = await supabase
      .from("carrito_movimientos_tesoreria")
      .select("*")
      .eq("carrito_id", carritoId)
      .order("created_at", { ascending: true });

    if (error) {
      set({ error: normalizeError(error) });
      return [];
    }

    return (data || []) as MovimientoTesoreria[];
  },

  updateCarritoMobile: async (input) => {
    set({
      saving: true,
      error: null
    });

    const currentUserId =
      await getCurrentUserId();

    const {
      currentProfile,
      canManageCarritos,
      catalogos,
      carritos
    } = get();

    if (
      !currentUserId ||
      !currentProfile
    ) {
      set({
        saving: false,
        error:
          "No hay usuario autenticado."
      });

      return false;
    }

    const carritoActual =
      carritos.find(
        (item) =>
          item.id === input.carritoId
      ) || null;

    if (!carritoActual) {
      set({
        saving: false,
        error:
          "No encontramos el carrito seleccionado."
      });

      return false;
    }

    const totals =
      calculateMobileTotals(input);

    if (totals.importeFinal <= 0) {
      set({
        saving: false,
        error:
          "El importe final debe ser mayor a cero."
      });

      return false;
    }

    if (
      totals.pagoParcial &&
      totals.saldoCtaCte > 0.009 &&
      !input.carrito
        .fecha_ingreso_gastos
    ) {
      set({
        saving: false,
        error:
          "Completá la fecha de ingreso a gastos para el saldo pendiente."
      });

      return false;
    }

    try {
      await updateCarritoMobileApi({
        input,
        carritoActual,
        totals,
        currentUserId,
        currentProfile,
        canManageCarritos,
        vendedores:
          catalogos.vendedores
      });

      await get().loadCarritos();

      set({
        saving: false
      });

      return true;
    } catch (error) {
      set({
        saving: false,
        error: normalizeError(error)
      });

      return false;
    }
  },

  toggleCarritoActivo: async (carrito) => {
    set({
      saving: true,
      error: null
    });

    try {
      await toggleCarritoActivoApi(
        carrito.id,
        !carrito.activo
      );

      await get().loadCarritos();

      set({
        saving: false
      });

      return true;
    } catch (error) {
      set({
        saving: false,
        error: normalizeError(error)
      });

      return false;
    }
  },

  sendToControl: async (carrito) => {
    set({
      saving: true,
      error: null
    });

    if (
      [
        "EN_CONTROL",
        "CONTROLADO",
        "FACTURADO",
        "COBRADO"
      ].includes(carrito.estado)
    ) {
      set({
        saving: false,
        error:
          "Este carrito ya fue enviado a control o ya fue controlado. No se puede reenviar."
      });

      return false;
    }

    const now = new Date().toISOString();

    try {
      await sendCarritoToControlApi({
        carritoId: carrito.id,
        confirmadoAt:
          carrito.confirmado_at || now,
        fechaVisibleCarritos:
          carrito.fecha_visible_carritos ||
          getToday(),
        now
      });

      await get().loadCarritos();

      set({
        saving: false
      });

      return true;
    } catch (error) {
      set({
        saving: false,
        error: normalizeError(error)
      });

      return false;
    }
  },

  setFilter: (key, value) => {
    set((state) => {
      const shouldSwitchToRange = key === "desde" || key === "hasta";

      return {
        filters: {
          ...state.filters,
          periodMode: shouldSwitchToRange ? "rango" : state.filters.periodMode,
          [key]: value
        }
      };
    });
  },

  setMonthFilter: (month) => {
    const range = getMonthRange(month);

    set((state) => ({
      filters: {
        ...state.filters,
        periodMode: "mes",
        month,
        desde: range.desde,
        hasta: range.hasta
      }
    }));
  },

  goToPreviousMonth: () => {
    const currentMonth = get().filters.month;
    const nextMonth = addMonthsToMonth(currentMonth, -1);
    const range = getMonthRange(nextMonth);

    set((state) => ({
      filters: {
        ...state.filters,
        periodMode: "mes",
        month: nextMonth,
        desde: range.desde,
        hasta: range.hasta
      }
    }));
  },

  goToNextMonth: () => {
    const currentMonth = get().filters.month;
    const nextMonth = addMonthsToMonth(currentMonth, 1);
    const range = getMonthRange(nextMonth);

    set((state) => ({
      filters: {
        ...state.filters,
        periodMode: "mes",
        month: nextMonth,
        desde: range.desde,
        hasta: range.hasta
      }
    }));
  },

  goToCurrentMonth: () => {
    const month = getCurrentMonth();
    const range = getMonthRange(month);

    set((state) => ({
      filters: {
        ...state.filters,
        periodMode: "mes",
        month,
        desde: range.desde,
        hasta: range.hasta
      }
    }));
  },

resetFilters: () => {
  set({
    filters: getDefaultFilters()
  });
},
  selectCarrito: (id) => {
    set({ selectedCarritoId: id });
  },

  clearError: () => {
    set({ error: null });
  },

  getFilteredCarritos: () => {
    const {
      carritos,
      filters
    } = get();

    return filterCarritosBySearch(
      carritos,
      filters.search
    );
  },

  getMetrics: () => {
    return calculateCarritosMetrics(
      get().getFilteredCarritos()
    );
  }
}));