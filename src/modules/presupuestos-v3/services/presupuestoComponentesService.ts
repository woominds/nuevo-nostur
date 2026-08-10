import {
  supabase,
} from "../../../lib/supabase";

import type {
  EditorElement,
  PresupuestoComponente,
  PresupuestoComponenteBounds,
  PresupuestoComponenteCategoria,
  PresupuestoComponenteVisibilidad,
} from "../types/editor.types";

export type PresupuestoComponenteRecord = {
  id: string;

  nombre: string;
  descripcion: string | null;

  categoria: PresupuestoComponenteCategoria;
  etiquetas: string[] | null;

  visibilidad: PresupuestoComponenteVisibilidad;

  thumbnail_url: string | null;

  ancho: number | string | null;
  alto: number | string | null;

  elementos: EditorElement[] | null;

  creado_por: string;

  usos: number | null;
  activo: boolean;

  created_at: string;
  updated_at: string;
};

export type CrearPresupuestoComponenteInput = {
  nombre: string;
  descripcion?: string;

  categoria?: PresupuestoComponenteCategoria;
  etiquetas?: string[];

  visibilidad?: PresupuestoComponenteVisibilidad;

  thumbnailDataUrl?: string | null;

  bounds: PresupuestoComponenteBounds;
  elements: EditorElement[];
};

export type ActualizarPresupuestoComponenteInput = {
  nombre?: string;
  descripcion?: string | null;

  categoria?: PresupuestoComponenteCategoria;
  etiquetas?: string[];

  visibilidad?: PresupuestoComponenteVisibilidad;
};

export type BuscarPresupuestoComponentesInput = {
  search?: string;

  categoria?:
    | PresupuestoComponenteCategoria
    | "todos";

  scope?:
    | "todos"
    | "personales"
    | "empresa";
};

const STORAGE_BUCKET =
  "presupuesto-componentes";

function normalizeError(
  error: unknown,
): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    const message =
      String(
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

function dataUrlToBlob(
  dataUrl: string,
): Blob {
  const [
    metadata,
    encodedData,
  ] = dataUrl.split(",");

  if (
    !metadata ||
    !encodedData
  ) {
    throw new Error(
      "La miniatura generada no es válida.",
    );
  }

  const mimeMatch =
    metadata.match(
      /data:(.*?);base64/,
    );

  const mimeType =
    mimeMatch?.[1] ||
    "image/jpeg";

  const binary =
    window.atob(
      encodedData,
    );

  const bytes =
    new Uint8Array(
      binary.length,
    );

  for (
    let index = 0;
    index < binary.length;
    index += 1
  ) {
    bytes[index] =
      binary.charCodeAt(index);
  }

  return new Blob(
    [
      bytes,
    ],
    {
      type: mimeType,
    },
  );
}

function getImageExtension(
  mimeType: string,
): string {
  if (
    mimeType === "image/png"
  ) {
    return "png";
  }

  if (
    mimeType === "image/webp"
  ) {
    return "webp";
  }

  return "jpg";
}

async function uploadThumbnail(
  userId: string,
  thumbnailDataUrl:
    | string
    | null
    | undefined,
): Promise<{
  url: string | null;
  path: string | null;
}> {
  if (!thumbnailDataUrl) {
    return {
      url: null,
      path: null,
    };
  }

  if (
    !thumbnailDataUrl.startsWith(
      "data:image/",
    )
  ) {
    return {
      url:
        thumbnailDataUrl,
      path: null,
    };
  }

  const blob =
    dataUrlToBlob(
      thumbnailDataUrl,
    );

  const extension =
    getImageExtension(
      blob.type,
    );

  const path =
    `${userId}/thumbnails/${crypto.randomUUID()}.${extension}`;

  const {
    error,
  } = await supabase.storage
    .from(
      STORAGE_BUCKET,
    )
    .upload(
      path,
      blob,
      {
        contentType:
          blob.type ||
          "image/jpeg",

        cacheControl:
          "31536000",

        upsert: false,
      },
    );

  if (error) {
    throw new Error(
      normalizeError(error),
    );
  }

  const publicResult =
    supabase.storage
      .from(
        STORAGE_BUCKET,
      )
      .getPublicUrl(path);

  return {
    url:
      publicResult.data.publicUrl ||
      null,

    path,
  };
}

function cloneElements(
  elements: EditorElement[],
): EditorElement[] {
  return elements.map(
    (element) => ({
      ...element,
    }),
  );
}

function mapRecord(
  record: PresupuestoComponenteRecord,
  currentUserId: string,
): PresupuestoComponente {
  const parsedWidth =
    Number(
      record.ancho ??
      0,
    );

  const parsedHeight =
    Number(
      record.alto ??
      0,
    );

  return {
    id:
      record.id,

    name:
      record.nombre,

    description:
      record.descripcion ??
      "",

    category:
      record.categoria,

    tags:
      normalizeTags(
        record.etiquetas,
      ),

    visibility:
      record.visibilidad,

    thumbnail:
      record.thumbnail_url ??
      "",

    bounds: {
      width:
        Number.isFinite(
          parsedWidth,
        )
          ? parsedWidth
          : 0,

      height:
        Number.isFinite(
          parsedHeight,
        )
          ? parsedHeight
          : 0,
    },

    elements:
      Array.isArray(
        record.elementos,
      )
        ? cloneElements(
            record.elementos,
          )
        : [],

    ownerId:
      record.creado_por,

    usageCount:
      Number(
        record.usos ??
        0,
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

export async function getPresupuestoComponentes(
  filters: BuscarPresupuestoComponentesInput = {},
): Promise<PresupuestoComponente[]> {
  const currentUserId =
    await getCurrentUserId();

  let query = supabase
    .from(
      "presupuesto_componentes",
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
    ) as unknown as PresupuestoComponenteRecord[]
  ).map(
    (record) =>
      mapRecord(
        record,
        currentUserId,
      ),
  );
}

export async function createPresupuestoComponente({
  nombre,
  descripcion,
  categoria = "otros",
  etiquetas = [],
  visibilidad = "personal",
  thumbnailDataUrl = null,
  bounds,
  elements,
}: CrearPresupuestoComponenteInput): Promise<PresupuestoComponente> {
  const normalizedName =
    cleanText(nombre);

  if (!normalizedName) {
    throw new Error(
      "El componente debe tener un nombre.",
    );
  }

  if (
    elements.length === 0
  ) {
    throw new Error(
      "Seleccioná al menos un elemento para guardar el componente.",
    );
  }

  const userId =
    await getCurrentUserId();

  const uploadedThumbnail =
    await uploadThumbnail(
      userId,
      thumbnailDataUrl,
    );

  const {
    data,
    error,
  } = await supabase
    .from(
      "presupuesto_componentes",
    )
    .insert({
      nombre:
        normalizedName,

      descripcion:
        nullableText(
          descripcion,
        ),

      categoria,

      etiquetas:
        normalizeTags(
          etiquetas,
        ),

      visibilidad,

      thumbnail_url:
        uploadedThumbnail.url,

      ancho:
        Math.max(
          0,
          bounds.width,
        ),

      alto:
        Math.max(
          0,
          bounds.height,
        ),

      elementos:
        cloneElements(
          elements,
        ),

      creado_por:
        userId,

      usos: 0,
      activo: true,
    })
    .select("*")
    .single();

  if (
    error ||
    !data
  ) {
    if (
      uploadedThumbnail.path
    ) {
      await supabase.storage
        .from(
          STORAGE_BUCKET,
        )
        .remove([
          uploadedThumbnail.path,
        ]);
    }

    throw new Error(
      normalizeError(error),
    );
  }

  return mapRecord(
    data as unknown as PresupuestoComponenteRecord,
    userId,
  );
}

export async function updatePresupuestoComponente(
  componenteId: string,
  input: ActualizarPresupuestoComponenteInput,
): Promise<PresupuestoComponente> {
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
        "El componente debe tener un nombre.",
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

  const {
    data,
    error,
  } = await supabase
    .from(
      "presupuesto_componentes",
    )
    .update(payload)
    .eq(
      "id",
      componenteId,
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
    data as unknown as PresupuestoComponenteRecord,
    currentUserId,
  );
}

export async function incrementPresupuestoComponenteUsage(
  componenteId: string,
): Promise<void> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "presupuesto_componentes",
    )
    .select(
      "usos",
    )
    .eq(
      "id",
      componenteId,
    )
    .maybeSingle();

  if (
    error ||
    !data
  ) {
    return;
  }

  const currentUsage =
    Number(
      data.usos ??
      0,
    );

  await supabase
    .from(
      "presupuesto_componentes",
    )
    .update({
      usos:
        currentUsage + 1,
    })
    .eq(
      "id",
      componenteId,
    );
}

export async function deletePresupuestoComponente(
  componenteId: string,
): Promise<void> {
  const currentUserId =
    await getCurrentUserId();

  const {
    data: record,
    error: recordError,
  } = await supabase
    .from(
      "presupuesto_componentes",
    )
    .select(
      "id,creado_por",
    )
    .eq(
      "id",
      componenteId,
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
      "El componente ya no existe.",
    );
  }

  if (
    record.creado_por !==
    currentUserId
  ) {
    throw new Error(
      "Solo podés eliminar componentes creados por tu usuario.",
    );
  }

  const {
    error,
  } = await supabase
    .from(
      "presupuesto_componentes",
    )
    .delete()
    .eq(
      "id",
      componenteId,
    )
    .eq(
      "creado_por",
      currentUserId,
    );

  if (error) {
    throw new Error(
      normalizeError(error),
    );
  }
}
