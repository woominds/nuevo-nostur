import {
  supabase,
} from "../../../lib/supabase";

export type PresupuestoRecursoCategoria =
  | "logos"
  | "fondos"
  | "destinos"
  | "operadores"
  | "sellos"
  | "iconos"
  | "banners"
  | "otros";

export type PresupuestoRecursoVisibilidad =
  | "personal"
  | "empresa";

export type PresupuestoRecurso = {
  id: string;

  nombre: string;
  descripcion: string | null;

  categoria: PresupuestoRecursoCategoria;
  etiquetas: string[];

  archivoUrl: string;
  storagePath: string;

  mimeType: string;
  extension: string | null;

  ancho: number | null;
  alto: number | null;

  pesoBytes: number;

  creadoPor: string;

  visibilidad: PresupuestoRecursoVisibilidad;

  favorito: boolean;
  usos: number;

  activo: boolean;

  createdAt: string;
  updatedAt: string;

  canManage: boolean;
};

export type PresupuestoRecursoRecord = {
  id: string;

  nombre: string;
  descripcion: string | null;

  categoria: PresupuestoRecursoCategoria;
  etiquetas: string[] | null;

  archivo_url: string;
  storage_path: string;

  mime_type: string;
  extension: string | null;

  ancho: number | null;
  alto: number | null;

  peso_bytes: number | string | null;

  creado_por: string;

  visibilidad: PresupuestoRecursoVisibilidad;

  favorito: boolean;
  usos: number | null;

  activo: boolean;

  created_at: string;
  updated_at: string;
};

export type CrearPresupuestoRecursoInput = {
  file: File;

  nombre?: string;
  descripcion?: string;

  categoria?: PresupuestoRecursoCategoria;
  etiquetas?: string[];

  visibilidad?: PresupuestoRecursoVisibilidad;
};

export type ActualizarPresupuestoRecursoInput = {
  nombre?: string;
  descripcion?: string | null;

  categoria?: PresupuestoRecursoCategoria;
  etiquetas?: string[];

  visibilidad?: PresupuestoRecursoVisibilidad;
  favorito?: boolean;
};

export type BuscarPresupuestoRecursosInput = {
  search?: string;
  categoria?: PresupuestoRecursoCategoria | "todos";
  scope?: "todos" | "personales" | "empresa";
  favoritos?: boolean;
};

const STORAGE_BUCKET =
  "presupuesto-recursos";

function normalizeError(
  error: unknown,
): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    const message = String(
      (
        error as {
          message?: unknown;
        }
      ).message ||
        "No se pudo completar la operación.",
    );

    if (
      message
        .toLowerCase()
        .includes(
          "row-level security",
        )
    ) {
      return "No tenés permisos para realizar esta acción.";
    }

    return message;
  }

  return "No se pudo completar la operación.";
}

function cleanText(
  value: unknown,
): string {
  return String(
    value ?? "",
  ).trim();
}

function nullableText(
  value: unknown,
): string | null {
  const cleaned =
    cleanText(value);

  return cleaned || null;
}

function normalizeTags(
  values:
    | string[]
    | null
    | undefined,
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) =>
          cleanText(value)
            .toLocaleLowerCase(
              "es-AR",
            ),
        )
        .filter(Boolean),
    ),
  );
}

function getExtension(
  fileName: string,
): string | null {
  const parts =
    fileName.split(".");

  if (parts.length < 2) {
    return null;
  }

  const extension =
    cleanText(
      parts.at(-1),
    ).toLocaleLowerCase();

  return extension || null;
}

function getSafeStorageName(
  file: File,
): string {
  const extension =
    getExtension(
      file.name,
    );

  const baseName =
    extension
      ? file.name
          .split(".")
          .slice(0, -1)
          .join(".")
      : file.name;

  const safeBase =
    baseName
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .replace(/ñ/g, "n")
      .replace(/Ñ/g, "N")
      .replace(
        /[^a-zA-Z0-9_-]/g,
        "-",
      )
      .replace(/-+/g, "-")
      .replace(
        /^-+|-+$/g,
        "",
      )
      .slice(0, 100) ||
    "recurso";

  return extension
    ? `${safeBase}.${extension}`
    : safeBase;
}

async function getCurrentUserId(): Promise<string> {
  const {
    data,
    error,
  } = await supabase.auth.getUser();

  if (
    error ||
    !data.user?.id
  ) {
    throw new Error(
      "No se pudo identificar el usuario actual.",
    );
  }

  return data.user.id;
}

async function getImageDimensions(
  file: File,
): Promise<{
  width: number | null;
  height: number | null;
}> {
  if (
    !file.type.startsWith(
      "image/",
    )
  ) {
    return {
      width: null,
      height: null,
    };
  }

  const objectUrl =
    URL.createObjectURL(file);

  try {
    return await new Promise(
      (resolve) => {
        const image =
          new Image();

        image.onload = () => {
          resolve({
            width:
              image.naturalWidth ||
              null,

            height:
              image.naturalHeight ||
              null,
          });
        };

        image.onerror = () => {
          resolve({
            width: null,
            height: null,
          });
        };

        image.src =
          objectUrl;
      },
    );
  } finally {
    URL.revokeObjectURL(
      objectUrl,
    );
  }
}

function mapRecord(
  record: PresupuestoRecursoRecord,
  currentUserId: string,
): PresupuestoRecurso {
  const parsedSize =
    Number(
      record.peso_bytes ??
      0,
    );

  return {
    id: record.id,

    nombre:
      record.nombre,

    descripcion:
      record.descripcion,

    categoria:
      record.categoria,

    etiquetas:
      normalizeTags(
        record.etiquetas,
      ),

    archivoUrl:
      record.archivo_url,

    storagePath:
      record.storage_path,

    mimeType:
      record.mime_type,

    extension:
      record.extension,

    ancho:
      record.ancho,

    alto:
      record.alto,

    pesoBytes:
      Number.isFinite(
        parsedSize,
      )
        ? parsedSize
        : 0,

    creadoPor:
      record.creado_por,

    visibilidad:
      record.visibilidad,

    favorito:
      Boolean(
        record.favorito,
      ),

    usos:
      Number(
        record.usos ??
        0,
      ),

    activo:
      Boolean(
        record.activo,
      ),

    createdAt:
      record.created_at,

    updatedAt:
      record.updated_at,

    canManage:
      record.creado_por ===
      currentUserId,
  };
}

export async function getPresupuestoRecursos(
  filters: BuscarPresupuestoRecursosInput = {},
): Promise<PresupuestoRecurso[]> {
  const currentUserId =
    await getCurrentUserId();

  let query = supabase
    .from(
      "presupuesto_recursos",
    )
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

  if (
    filters.categoria &&
    filters.categoria !==
      "todos"
  ) {
    query = query.eq(
      "categoria",
      filters.categoria,
    );
  }

  if (
    filters.scope ===
    "personales"
  ) {
    query = query.eq(
      "creado_por",
      currentUserId,
    );
  }

  if (
    filters.scope ===
    "empresa"
  ) {
    query = query.eq(
      "visibilidad",
      "empresa",
    );
  }

  if (
    filters.favoritos
  ) {
    query = query.eq(
      "favorito",
      true,
    );
  }

  const search =
    cleanText(
      filters.search,
    );

  if (search) {
    query = query.or(
      [
        `nombre.ilike.%${search}%`,
        `descripcion.ilike.%${search}%`,
      ].join(","),
    );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    throw new Error(
      normalizeError(error),
    );
  }

  return (
    (
      data ?? []
    ) as unknown as PresupuestoRecursoRecord[]
  ).map((record) =>
    mapRecord(
      record,
      currentUserId,
    ),
  );
}

export async function createPresupuestoRecurso({
  file,
  nombre,
  descripcion,
  categoria = "otros",
  etiquetas = [],
  visibilidad = "personal",
}: CrearPresupuestoRecursoInput): Promise<PresupuestoRecurso> {
  if (
    !file.type.startsWith(
      "image/",
    )
  ) {
    throw new Error(
      "La biblioteca de recursos admite imágenes.",
    );
  }

  const userId =
    await getCurrentUserId();

  const safeName =
    getSafeStorageName(
      file,
    );

  const storagePath =
    `${userId}/${categoria}/${crypto.randomUUID()}-${safeName}`;

  const dimensions =
    await getImageDimensions(
      file,
    );

  const uploadResult =
    await supabase.storage
      .from(
        STORAGE_BUCKET,
      )
      .upload(
        storagePath,
        file,
        {
          contentType:
            file.type ||
            "application/octet-stream",

          cacheControl:
            "31536000",

          upsert: false,
        },
      );

  if (uploadResult.error) {
    throw new Error(
      normalizeError(
        uploadResult.error,
      ),
    );
  }

  const publicResult =
    supabase.storage
      .from(
        STORAGE_BUCKET,
      )
      .getPublicUrl(
        storagePath,
      );

  const publicUrl =
    publicResult.data.publicUrl;

  if (!publicUrl) {
    await supabase.storage
      .from(
        STORAGE_BUCKET,
      )
      .remove([
        storagePath,
      ]);

    throw new Error(
      "No se pudo obtener la URL pública del recurso.",
    );
  }

  const resourceName =
    cleanText(nombre) ||
    file.name
      .replace(
        /\.[^.]+$/,
        "",
      )
      .trim() ||
    "Recurso";

  const {
    data,
    error,
  } = await supabase
    .from(
      "presupuesto_recursos",
    )
    .insert({
      nombre:
        resourceName,

      descripcion:
        nullableText(
          descripcion,
        ),

      categoria,

      etiquetas:
        normalizeTags(
          etiquetas,
        ),

      archivo_url:
        publicUrl,

      storage_path:
        storagePath,

      mime_type:
        file.type ||
        "application/octet-stream",

      extension:
        getExtension(
          file.name,
        ),

      ancho:
        dimensions.width,

      alto:
        dimensions.height,

      peso_bytes:
        file.size,

      creado_por:
        userId,

      visibilidad,

      favorito:
        false,

      usos: 0,

      activo: true,
    })
    .select("*")
    .single();

  if (
    error ||
    !data
  ) {
    await supabase.storage
      .from(
        STORAGE_BUCKET,
      )
      .remove([
        storagePath,
      ]);

    throw new Error(
      normalizeError(error),
    );
  }

  return mapRecord(
    data as unknown as PresupuestoRecursoRecord,
    userId,
  );
}

export async function updatePresupuestoRecurso(
  recursoId: string,
  input: ActualizarPresupuestoRecursoInput,
): Promise<PresupuestoRecurso> {
  const currentUserId =
    await getCurrentUserId();

  const payload: Record<
    string,
    unknown
  > = {};

  if (
    input.nombre !==
    undefined
  ) {
    const nombre =
      cleanText(
        input.nombre,
      );

    if (!nombre) {
      throw new Error(
        "El recurso debe tener un nombre.",
      );
    }

    payload.nombre =
      nombre;
  }

  if (
    input.descripcion !==
    undefined
  ) {
    payload.descripcion =
      nullableText(
        input.descripcion,
      );
  }

  if (
    input.categoria !==
    undefined
  ) {
    payload.categoria =
      input.categoria;
  }

  if (
    input.etiquetas !==
    undefined
  ) {
    payload.etiquetas =
      normalizeTags(
        input.etiquetas,
      );
  }

  if (
    input.visibilidad !==
    undefined
  ) {
    payload.visibilidad =
      input.visibilidad;
  }

  if (
    input.favorito !==
    undefined
  ) {
    payload.favorito =
      input.favorito;
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "presupuesto_recursos",
    )
    .update(payload)
    .eq(
      "id",
      recursoId,
    )
    .eq(
      "creado_por",
      currentUserId,
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

  return mapRecord(
    data as unknown as PresupuestoRecursoRecord,
    currentUserId,
  );
}

export async function incrementPresupuestoRecursoUsage(
  recursoId: string,
): Promise<void> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "presupuesto_recursos",
    )
    .select(
      "usos",
    )
    .eq(
      "id",
      recursoId,
    )
    .maybeSingle();

  if (error) {
    return;
  }

  const currentUsage =
    Number(
      data?.usos ??
      0,
    );

  await supabase
    .from(
      "presupuesto_recursos",
    )
    .update({
      usos:
        currentUsage + 1,
    })
    .eq(
      "id",
      recursoId,
    );
}

export async function deletePresupuestoRecurso(
  recursoId: string,
): Promise<void> {
  const currentUserId =
    await getCurrentUserId();

  const {
    data: record,
    error: recordError,
  } = await supabase
    .from(
      "presupuesto_recursos",
    )
    .select(
      "id,creado_por,storage_path",
    )
    .eq(
      "id",
      recursoId,
    )
    .maybeSingle();

  if (recordError) {
    throw new Error(
      normalizeError(
        recordError,
      ),
    );
  }

  if (!record) {
    throw new Error(
      "El recurso ya no existe.",
    );
  }

  if (
    record.creado_por !==
    currentUserId
  ) {
    throw new Error(
      "Solo podés eliminar recursos creados por tu usuario.",
    );
  }

  const deleteResult =
    await supabase
      .from(
        "presupuesto_recursos",
      )
      .delete()
      .eq(
        "id",
        recursoId,
      )
      .eq(
        "creado_por",
        currentUserId,
      );

  if (
    deleteResult.error
  ) {
    throw new Error(
      normalizeError(
        deleteResult.error,
      ),
    );
  }

  if (
    record.storage_path
  ) {
    await supabase.storage
      .from(
        STORAGE_BUCKET,
      )
      .remove([
        record.storage_path,
      ]);
  }
}
