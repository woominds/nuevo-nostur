import {
  supabase,
} from "../../../lib/supabase";

import type {
  PresupuestoLiveNosMatch,
} from "./presupuestoLiveNosService";

type SendPresupuestoWhatsappParams = {
  conversation: PresupuestoLiveNosMatch;
  file: File;
  caption?: string;
};

type UploadedDocument = {
  path: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
};

function getSafeStorageName(
  file: File,
): string {
  const extension =
    file.name.includes(".")
      ? file.name
          .split(".")
          .pop()
          ?.toLowerCase() || ""
      : "";

  const baseName =
    file.name.includes(".")
      ? file.name
          .split(".")
          .slice(0, -1)
          .join(".")
      : file.name;

  const cleanBaseName =
    baseName
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .replace(/ñ/g, "n")
      .replace(/Ñ/g, "N")
      .replace(
        /[^\w.-]/g,
        "-",
      )
      .replace(/-+/g, "-")
      .replace(
        /^-+|-+$/g,
        "",
      )
      .slice(0, 110);

  const safeBaseName =
    cleanBaseName ||
    `presupuesto-${Date.now()}`;

  return extension
    ? `${safeBaseName}.${extension}`
    : safeBaseName;
}

async function getCurrentUserId(): Promise<string> {
  const {
    data,
    error,
  } = await supabase.auth.getUser();

  if (error || !data.user?.id) {
    throw new Error(
      "No se pudo identificar el usuario actual.",
    );
  }

  return data.user.id;
}

async function uploadDocument(
  conversationId: string,
  file: File,
): Promise<UploadedDocument> {
  const safeName =
    getSafeStorageName(file);

  const path =
    `whatsapp-outbound/${conversationId}/${Date.now()}-${safeName}`;

  const uploadResult =
    await supabase.storage
      .from(
        "comunicaciones-media",
      )
      .upload(
        path,
        file,
        {
          contentType:
            file.type ||
            "application/pdf",

          cacheControl: "3600",
          upsert: false,
        },
      );

  if (uploadResult.error) {
    throw new Error(
      uploadResult.error.message ||
      "No se pudo subir el presupuesto.",
    );
  }

  const publicResult =
    supabase.storage
      .from(
        "comunicaciones-media",
      )
      .getPublicUrl(path);

  return {
    path,

    url:
      publicResult.data.publicUrl,

    filename:
      file.name,

    mimeType:
      file.type ||
      "application/pdf",

    size:
      file.size,
  };
}

export async function sendPresupuestoToWhatsapp({
  conversation,
  file,
  caption = "",
}: SendPresupuestoWhatsappParams): Promise<void> {
  if (!conversation.windowOpen) {
    throw new Error(
      "La ventana de 24 horas está cerrada.",
    );
  }

  const userId =
    await getCurrentUserId();

  const uploaded =
    await uploadDocument(
      conversation.conversationId,
      file,
    );

  const now =
    new Date().toISOString();

  const mediaPayload = {
    url: uploaded.url,
    media_url: uploaded.url,

    path: uploaded.path,
    media_path: uploaded.path,

    filename:
      uploaded.filename,

    media_filename:
      uploaded.filename,

    mime_type:
      uploaded.mimeType,

    media_mime_type:
      uploaded.mimeType,

    size:
      uploaded.size,

    media_size:
      uploaded.size,
  };

  const previewText =
    caption.trim() ||
    "Presupuesto enviado";

  const {
    data: insertedMessage,
    error: insertError,
  } = await supabase
    .from("mensajes")
    .insert({
      conversacion_id:
        conversation.conversationId,

      direction: "out",
      type: "document",

      text:
        caption.trim() ||
        null,

      media:
        mediaPayload,

      reply_to_id: null,
      forwarded: false,

      status: "pending",
      error: null,

      wa_message_id: null,

      sender_profile_id:
        userId,

      deleted_at: null,
      delivered_at: null,
      read_at: null,

      wa_timestamp: now,
      sender_kind: "humano",
    })
    .select("id")
    .single();

  if (
    insertError ||
    !insertedMessage?.id
  ) {
    throw new Error(
      insertError?.message ||
      "No se pudo crear el mensaje.",
    );
  }

  const messageId =
    String(
      insertedMessage.id,
    );

  await supabase
    .from("conversaciones")
    .update({
      last_message_at: now,
      last_outbound_message_at:
        now,

      last_message_preview:
        previewText,

      estado_gestion:
        "en_gestion",

      updated_at: now,
    })
    .eq(
      "id",
      conversation.conversationId,
    );

  const {
    error: sendError,
  } = await supabase.functions.invoke(
    "whatsapp-send-message",
    {
      body: {
        conversacion_id:
          conversation.conversationId,

        conversation_id:
          conversation.conversationId,

        message_id:
          messageId,

        local_message_id:
          messageId,

        to:
          conversation.phone,

        wa_phone:
          conversation.phone,

        text:
          caption.trim(),

        message_type:
          "document",

        media_url:
          uploaded.url,

        media_mime_type:
          uploaded.mimeType,

        media_filename:
          uploaded.filename,

        reply_to_whatsapp_message_id:
          null,

        sender_profile_id:
          userId,

        show_agent_name:
          true,
      },
    },
  );

  if (sendError) {
    await supabase
      .from("mensajes")
      .update({
        status: "failed",

        error:
          sendError.message ||
          "No se pudo enviar el presupuesto por WhatsApp.",
      })
      .eq(
        "id",
        messageId,
      );

    throw new Error(
      sendError.message ||
      "No se pudo enviar el presupuesto por WhatsApp.",
    );
  }
}
