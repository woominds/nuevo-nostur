import {
  supabase,
} from "../../../lib/supabase";

export type PresupuestoClienteOption = {
  id: string;
  nombre_completo: string;
  telefono: string;
  email: string | null;
};

const normalizeError = (
  error: unknown,
): string => {
  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    return String(
      (
        error as {
          message?: unknown;
        }
      ).message ||
        "No se pudieron cargar los clientes.",
    );
  }

  return "No se pudieron cargar los clientes.";
};

export async function getClientesParaPresupuesto(): Promise<
  PresupuestoClienteOption[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("clientes")
    .select(
      "id,nombre_completo,telefono,email",
    )
    .eq("activo", true)
    .order(
      "nombre_completo",
      {
        ascending: true,
      },
    );

  if (error) {
    throw new Error(
      normalizeError(error),
    );
  }

  return (
    data ?? []
  ) as PresupuestoClienteOption[];
}
