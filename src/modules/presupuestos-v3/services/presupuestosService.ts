import {
  supabase,
} from "../../../lib/supabase";

import type {
  PresupuestoDocument,
  PresupuestoEstado,
} from "../types/editor.types";

export type PresupuestoRecord = {
  id: string;
  numero: number;
  nombre: string;

  cliente_id: string | null;
  contacto_nombre: string;
  contacto_telefono: string;

  destino: string | null;
  estado: PresupuestoEstado;
  observaciones: string | null;

  template_id: string | null;
  documento: PresupuestoDocument;

  creado_por: string;
  vendedor_id: string | null;
  sucursal_id: string | null;

  activo: boolean;

  created_at: string;
  updated_at: string;
};

export type SavePresupuestoResult = {
  record: PresupuestoRecord;
  document: PresupuestoDocument;
};

function normalizeError(
  error: unknown,
): string {
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
        "No se pudo completar la operación.",
    );
  }

  return "No se pudo completar la operación.";
}

function normalizeNamePart(
  value: string,
): string {
  const normalized = value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^a-zA-Z0-9 ]/g,
      " ",
    )
    .trim()
    .replace(/\s+/g, "-")
    .toUpperCase();

  return normalized || "SIN-NOMBRE";
}

export function formatPresupuestoNumber(
  numero: number,
): string {
  return String(numero).padStart(
    4,
    "0",
  );
}

export function createPersistedPresupuestoName(
  numero: number,
  contactoNombre: string,
): string {
  return `PPTO-${formatPresupuestoNumber(
    numero,
  )}-${normalizeNamePart(
    contactoNombre,
  )}`;
}

async function getCurrentUserContext(): Promise<{
  userId: string;
  sucursalId: string | null;
}> {
  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  if (
    userError ||
    !userData.user?.id
  ) {
    throw new Error(
      "No se pudo identificar el usuario actual.",
    );
  }

  const userId =
    userData.user.id;

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      "id,sucursal_id",
    )
    .eq(
      "id",
      userId,
    )
    .maybeSingle();

  if (profileError) {
    throw new Error(
      normalizeError(
        profileError,
      ),
    );
  }

  return {
    userId,

    sucursalId:
      profile?.sucursal_id ??
      null,
  };
}

function mapRecord(
  value: unknown,
): PresupuestoRecord {
  return value as unknown as PresupuestoRecord;
}

export async function getPresupuestos(): Promise<
  PresupuestoRecord[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("presupuestos_v3")
    .select("*")
    .eq(
      "activo",
      true,
    )
    .order(
      "updated_at",
      {
        ascending: false,
      },
    );

  if (error) {
    throw new Error(
      normalizeError(error),
    );
  }

  return (
    data ?? []
  ).map(
    mapRecord,
  );
}

export async function createPresupuesto(
  document: PresupuestoDocument,
): Promise<SavePresupuestoResult> {
  const {
    userId,
    sucursalId,
  } = await getCurrentUserContext();

  const {
    data: insertedRecord,
    error: insertError,
  } = await supabase
    .from("presupuestos_v3")
    .insert({
      nombre:
        document.name,

      cliente_id:
        document.contacto.clienteId,

      contacto_nombre:
        document.contacto.nombre,

      contacto_telefono:
        document.contacto.telefono,

      destino:
        document.destino?.trim() ||
        null,

      estado:
        document.status,

      observaciones:
        document.observaciones?.trim() ||
        null,

      template_id:
        document.templateId ||
        null,

      documento:
        document,

      creado_por:
        userId,

      vendedor_id:
        userId,

      sucursal_id:
        sucursalId,

      activo: true,
    })
    .select("*")
    .single();

  if (
    insertError ||
    !insertedRecord
  ) {
    throw new Error(
      normalizeError(
        insertError,
      ),
    );
  }

  const record =
    mapRecord(
      insertedRecord,
    );

  const persistedName =
    createPersistedPresupuestoName(
      record.numero,
      document.contacto.nombre,
    );

  const persistedDocument: PresupuestoDocument = {
    ...document,
    id: record.id,
    name:
      persistedName,
    updatedAt:
      new Date().toISOString(),
  };

  const {
    data: updatedRecord,
    error: updateError,
  } = await supabase
    .from("presupuestos_v3")
    .update({
      nombre:
        persistedName,

      documento:
        persistedDocument,
    })
    .eq(
      "id",
      record.id,
    )
    .select("*")
    .single();

  if (
    updateError ||
    !updatedRecord
  ) {
    throw new Error(
      normalizeError(
        updateError,
      ),
    );
  }

  return {
    record:
      mapRecord(
        updatedRecord,
      ),

    document:
      persistedDocument,
  };
}

export async function updatePresupuesto(
  document: PresupuestoDocument,
): Promise<SavePresupuestoResult> {
  const {
    data,
    error,
  } = await supabase
    .from("presupuestos_v3")
    .update({
      nombre:
        document.name,

      cliente_id:
        document.contacto.clienteId,

      contacto_nombre:
        document.contacto.nombre,

      contacto_telefono:
        document.contacto.telefono,

      destino:
        document.destino?.trim() ||
        null,

      estado:
        document.status,

      observaciones:
        document.observaciones?.trim() ||
        null,

      template_id:
        document.templateId ||
        null,

      documento:
        document,
    })
    .eq(
      "id",
      document.id,
    )
    .select("*")
    .single();

  if (
    error ||
    !data
  ) {
    throw new Error(
      normalizeError(error),
    );
  }

  return {
    record:
      mapRecord(data),

    document,
  };
}

export async function savePresupuesto(
  document: PresupuestoDocument,
  persistedIds: Set<string>,
): Promise<SavePresupuestoResult> {
  if (
    persistedIds.has(
      document.id,
    )
  ) {
    return updatePresupuesto(
      document,
    );
  }

  return createPresupuesto(
    document,
  );
}

export async function archivePresupuesto(
  presupuestoId: string,
): Promise<void> {
  const {
    error,
  } = await supabase
    .from("presupuestos_v3")
    .update({
      activo: false,
    })
    .eq(
      "id",
      presupuestoId,
    );

  if (error) {
    throw new Error(
      normalizeError(error),
    );
  }
}
