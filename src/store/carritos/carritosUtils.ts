// src/store/carritos/carritosUtils.ts

import { supabase } from "../../lib/supabase";
import type {
  CarritoMobileUpdateInput,
  CarritosFilters,
  ProfileLite
} from "./carritosTypes";

export function getToday(): string {
  const now = new Date();

  const argentinaNow = new Date(
    now.toLocaleString("en-US", {
      timeZone: "America/Argentina/Cordoba"
    })
  );

  const year = argentinaNow.getFullYear();
  const month = String(
    argentinaNow.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    argentinaNow.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getCurrentMonth(): string {
  return getToday().slice(0, 7);
}

export function getMonthRange(
  month: string
): {
  desde: string;
  hasta: string;
} {
  const [yearRaw, monthRaw] = month.split("-");

  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(monthIndex)
  ) {
    const today = getToday();

    return {
      desde: `${today.slice(0, 8)}01`,
      hasta: today
    };
  }

  const firstDay = new Date(
    year,
    monthIndex,
    1
  );

  const lastDay = new Date(
    year,
    monthIndex + 1,
    0
  );

  const desde = [
    firstDay.getFullYear(),
    String(
      firstDay.getMonth() + 1
    ).padStart(2, "0"),
    String(
      firstDay.getDate()
    ).padStart(2, "0")
  ].join("-");

  const hasta = [
    lastDay.getFullYear(),
    String(
      lastDay.getMonth() + 1
    ).padStart(2, "0"),
    String(
      lastDay.getDate()
    ).padStart(2, "0")
  ].join("-");

  return {
    desde,
    hasta
  };
}

export function addMonthsToMonth(
  month: string,
  amount: number
): string {
  const [yearRaw, monthRaw] = month.split("-");

  const date = new Date(
    Number(yearRaw),
    Number(monthRaw) - 1 + amount,
    1
  );

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

export function getDefaultFilters(): CarritosFilters {
  const month = getCurrentMonth();
  const range = getMonthRange(month);

  return {
    periodMode: "mes",
    month,
    desde: range.desde,
    hasta: range.hasta,
    estado: "todos",
    vendedorId: "todos",
    sucursalId: "todos",
    riesgo: "todos",
    activo: "activos",
    search: ""
  };
}

export function normalizeText(
  value: unknown
): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function cleanText(
  value: unknown
): string {
  return String(value || "").trim();
}

export function nullableText(
  value: unknown
): string | null {
  const cleaned = cleanText(value);

  return cleaned
    ? cleaned
    : null;
}

export function normalizePhone(
  value: string
): string {
  return value.replace(/[^\d+]/g, "");
}

export function getNumber(
  value:
    | string
    | number
    | null
    | undefined
): number {
  const parsed = Number(value || 0);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

export function normalizeError(
  error: unknown
): string {
  if (!error) {
    return "Ocurrió un error inesperado.";
  }

  if (
    typeof error === "object" &&
    "message" in error
  ) {
    const message = String(
      (
        error as {
          message?: unknown;
        }
      ).message ||
        "Ocurrió un error."
    );

    const normalizedMessage =
      message.toLowerCase();

    if (
      normalizedMessage.includes(
        "row-level security"
      )
    ) {
      return "No tenés permisos para esta acción.";
    }

    if (
      normalizedMessage.includes(
        "permission denied"
      )
    ) {
      return "Permiso denegado por Supabase/RLS.";
    }

    if (
      normalizedMessage.includes(
        "duplicate key"
      )
    ) {
      return "Ya existe un registro con esos datos.";
    }

    return message;
  }

  return String(error);
}

export async function getCurrentUserId(): Promise<
  string | null
> {
  const { data } =
    await supabase.auth.getUser();

  return data.user?.id || null;
}

export function canProfileManage(
  profile: ProfileLite | null
): boolean {
  return Boolean(
    profile?.activo &&
      (
        profile.is_super_admin ||
        profile.is_support_user ||
        profile.rol === "admin_general" ||
        profile.rol === "gerencia" ||
        profile.rol === "administracion" ||
        profile.rol === "soporte"
      )
  );
}

export function canProfileUse(
  profile: ProfileLite | null
): boolean {
  return Boolean(
    profile?.activo &&
      (
        profile.is_super_admin ||
        profile.is_support_user ||
        profile.rol === "admin_general" ||
        profile.rol === "gerencia" ||
        profile.rol === "administracion" ||
        profile.rol === "soporte" ||
        profile.rol === "vendedor"
      )
  );
}

export function getProfileName(
  profile: ProfileLite | null
): string {
  return profile
    ? `${profile.nombre} ${profile.apellido}`.trim()
    : "";
}

export async function fetchByCarritoIdsInBatches<T>(
  tableName: string,
  carritoIds: string[],
  batchSize = 80
): Promise<{
  data: T[];
  error: unknown | null;
}> {
  if (carritoIds.length === 0) {
    return {
      data: [],
      error: null
    };
  }

  const allRows: T[] = [];

  for (
    let index = 0;
    index < carritoIds.length;
    index += batchSize
  ) {
    const batch = carritoIds.slice(
      index,
      index + batchSize
    );

    const {
      data,
      error
    } = await supabase
      .from(tableName)
      .select("*")
      .in("carrito_id", batch);

    if (error) {
      return {
        data: [],
        error
      };
    }

    allRows.push(
      ...((data || []) as T[])
    );
  }

  return {
    data: allRows,
    error: null
  };
}

export function calculateMobileTotals(
  input: CarritoMobileUpdateInput
) {
  const importeBruto = getNumber(
    input.carrito.importe_bruto
  );

  const promocodeAplicado = Boolean(
    input.carrito.promocode_aplicado
  );

  const promocodeImporte =
    promocodeAplicado
      ? getNumber(
          input.carrito.promocode_importe
        )
      : 0;

  const importeFinal =
    input.carrito.importe_final !== undefined
      ? getNumber(
          input.carrito.importe_final
        )
      : Math.max(
          0,
          importeBruto - promocodeImporte
        );

  const totalTesoreria =
    input.movimientosTesoreria.reduce(
      (total, movimiento) =>
        total +
        getNumber(movimiento.importe),
      0
    );

  const saldoCtaCte =
    input.carrito.saldo_cta_cte !== undefined
      ? getNumber(
          input.carrito.saldo_cta_cte
        )
      : Math.max(
          0,
          importeFinal - totalTesoreria
        );

  const pagoParcial =
    input.carrito.pago_parcial !== undefined
      ? Boolean(
          input.carrito.pago_parcial
        )
      : saldoCtaCte > 0.009;

  const visibleEnCarritos =
    input.carrito.visible_en_carritos !== undefined
      ? Boolean(
          input.carrito.visible_en_carritos
        )
      : true;

  return {
    importeBruto,
    promocodeAplicado,
    promocodeImporte,
    importeFinal,
    totalTesoreria,
    saldoCtaCte,
    pagoParcial,
    visibleEnCarritos
  };
}
