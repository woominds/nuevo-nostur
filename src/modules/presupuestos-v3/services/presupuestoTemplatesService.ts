import {
  supabase,
} from "../../../lib/supabase";

import type {
  EditorCanvas,
  EditorElement,
  EditorImageElement,
  PresupuestoPage,
  PresupuestoTemplate,
  PresupuestoTemplateCategory,
} from "../types/editor.types";

export type PresupuestoTemplateVisibility =
  | "personal"
  | "empresa";

export type PresupuestoTemplateRecord = {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: PresupuestoTemplateCategory;
  canvas: EditorCanvas;
  elements: EditorElement[];
  thumbnail_url: string | null;
  creado_por: string;
  visibilidad: PresupuestoTemplateVisibility;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type SavePresupuestoTemplateInput = {
  page: PresupuestoPage;
  nombre: string;
  descripcion?: string;
  categoria?: PresupuestoTemplateCategory;
  visibilidad?: PresupuestoTemplateVisibility;
  thumbnailUrl?: string | null;
};

const STORAGE_BUCKET =
  "presupuesto-templates";

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

function mapRecordToTemplate(
  record: PresupuestoTemplateRecord,
): PresupuestoTemplate {
  return {
    id: record.id,

    name:
      record.nombre,

    description:
      record.descripcion ||
      "Template guardado por el vendedor.",

    category:
      record.categoria ||
      "general",

    thumbnail:
      record.thumbnail_url || "",

    canvas: {
      ...record.canvas,
    },

    elements:
      Array.isArray(record.elements)
        ? record.elements.map(
            (element) => ({
              ...element,
            }),
          )
        : [],
  };
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
      "El archivo generado no es válido.",
    );
  }

  const mimeMatch =
    metadata.match(
      /data:(.*?);base64/,
    );

  const mimeType =
    mimeMatch?.[1] ||
    "application/octet-stream";

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

  if (
    mimeType === "image/gif"
  ) {
    return "gif";
  }

  return "jpg";
}

async function uploadImageDataUrl(
  userId: string,
  dataUrl: string,
  folder: "thumbnails" | "assets",
): Promise<string> {
  const blob =
    dataUrlToBlob(
      dataUrl,
    );

  if (
    !blob.type.startsWith(
      "image/",
    )
  ) {
    throw new Error(
      "El recurso visual no es una imagen válida.",
    );
  }

  const extension =
    getImageExtension(
      blob.type,
    );

  const path =
    `${userId}/${folder}/${crypto.randomUUID()}.${extension}`;

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
          blob.type,

        cacheControl:
          "31536000",

        upsert: false,
      },
    );

  if (error) {
    throw new Error(
      error.message ||
      "No se pudo subir una imagen del template.",
    );
  }

  const publicResult =
    supabase.storage
      .from(
        STORAGE_BUCKET,
      )
      .getPublicUrl(path);

  const publicUrl =
    publicResult.data.publicUrl;

  if (!publicUrl) {
    throw new Error(
      "No se pudo obtener la URL de una imagen del template.",
    );
  }

  return publicUrl;
}

async function uploadTemplateThumbnail(
  userId: string,
  thumbnail:
    | string
    | null
    | undefined,
): Promise<string | null> {
  if (!thumbnail) {
    return null;
  }

  if (
    !thumbnail.startsWith(
      "data:image/",
    )
  ) {
    return thumbnail;
  }

  return uploadImageDataUrl(
    userId,
    thumbnail,
    "thumbnails",
  );
}

async function normalizeTemplateElement(
  userId: string,
  element: EditorElement,
): Promise<EditorElement> {
  if (
    element.type !== "image"
  ) {
    return {
      ...element,
    };
  }

  const imageElement =
    element as EditorImageElement;

  if (
    !imageElement.src.startsWith(
      "data:image/",
    )
  ) {
    return {
      ...imageElement,
    };
  }

  const storedImageUrl =
    await uploadImageDataUrl(
      userId,
      imageElement.src,
      "assets",
    );

  return {
    ...imageElement,
    src: storedImageUrl,
  };
}

async function normalizeTemplateElements(
  userId: string,
  elements: EditorElement[],
): Promise<EditorElement[]> {
  return Promise.all(
    elements.map(
      (element) =>
        normalizeTemplateElement(
          userId,
          element,
        ),
    ),
  );
}

export async function getPresupuestoTemplates(): Promise<
  PresupuestoTemplate[]
> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "presupuesto_templates",
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

  if (error) {
    throw new Error(
      normalizeError(error),
    );
  }

  return (
    (
      data ?? []
    ) as unknown as PresupuestoTemplateRecord[]
  ).map(
    mapRecordToTemplate,
  );
}

export async function savePageAsPresupuestoTemplate({
  page,
  nombre,
  descripcion,
  categoria = "general",
  visibilidad = "personal",
  thumbnailUrl = null,
}: SavePresupuestoTemplateInput): Promise<PresupuestoTemplate> {
  const normalizedName =
    nombre.trim();

  if (!normalizedName) {
    throw new Error(
      "El template debe tener un nombre.",
    );
  }

  const userId =
    await getCurrentUserId();

  const [
    storedThumbnailUrl,
    storedElements,
  ] = await Promise.all([
    uploadTemplateThumbnail(
      userId,
      thumbnailUrl,
    ),

    normalizeTemplateElements(
      userId,
      page.elements,
    ),
  ]);

  const {
    data,
    error,
  } = await supabase
    .from(
      "presupuesto_templates",
    )
    .insert({
      nombre:
        normalizedName,

      descripcion:
        descripcion?.trim() ||
        null,

      categoria,

      canvas: {
        ...page.canvas,
      },

      elements:
        storedElements,

      thumbnail_url:
        storedThumbnailUrl,

      creado_por:
        userId,

      visibilidad,

      activo: true,
    })
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

  return mapRecordToTemplate(
    data as unknown as PresupuestoTemplateRecord,
  );
}

export async function renamePresupuestoTemplate(
  templateId: string,
  nombre: string,
): Promise<void> {
  const normalizedName =
    nombre.trim();

  if (!normalizedName) {
    throw new Error(
      "El template debe tener un nombre.",
    );
  }

  const {
    error,
  } = await supabase
    .from(
      "presupuesto_templates",
    )
    .update({
      nombre:
        normalizedName,
    })
    .eq(
      "id",
      templateId,
    );

  if (error) {
    throw new Error(
      normalizeError(error),
    );
  }
}

export async function deletePresupuestoTemplate(
  templateId: string,
): Promise<void> {
  const {
    data: currentUserData,
    error: currentUserError,
  } = await supabase.auth.getUser();

  const currentUserId =
    currentUserData.user?.id ??
    null;

  if (
    currentUserError ||
    !currentUserId
  ) {
    throw new Error(
      "No se pudo identificar el usuario actual.",
    );
  }

  const {
    data: templateRecord,
    error: templateError,
  } = await supabase
    .from(
      "presupuesto_templates",
    )
    .select(
      "id,creado_por",
    )
    .eq(
      "id",
      templateId,
    )
    .maybeSingle();

  if (templateError) {
    throw new Error(
      normalizeError(
        templateError,
      ),
    );
  }

  if (!templateRecord) {
    throw new Error(
      "El template ya no existe o no está disponible.",
    );
  }

  if (
    templateRecord.creado_por !==
    currentUserId
  ) {
    throw new Error(
      "Solo podés eliminar templates creados por tu usuario.",
    );
  }

  const {
    error: deleteError,
  } = await supabase
    .from(
      "presupuesto_templates",
    )
    .delete()
    .eq(
      "id",
      templateId,
    )
    .eq(
      "creado_por",
      currentUserId,
    );

  if (deleteError) {
    const message =
      normalizeError(
        deleteError,
      );

    if (
      message
        .toLowerCase()
        .includes(
          "row-level security",
        )
    ) {
      throw new Error(
        "No tenés permiso para eliminar este template.",
      );
    }

    throw new Error(
      message,
    );
  }
}

