import {
  supabase,
} from "../../../lib/supabase";

import type {
  PresupuestoVendedor,
} from "../types/editor.types";

type ProfileVendedorRow = {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
};

export async function getVendedoresParaPresupuesto(): Promise<
  PresupuestoVendedor[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select(
      "id,nombre,apellido,email",
    )
    .eq("activo", true)
    .eq("es_vendedor", true)
    .order("nombre", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (
    (data || []) as ProfileVendedorRow[]
  ).map((profile) => {
    const nombre = [
      profile.nombre,
      profile.apellido,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      id: profile.id,
      nombre:
        nombre ||
        profile.email ||
        "Vendedor",
      email:
        profile.email || "",
    };
  });
}
