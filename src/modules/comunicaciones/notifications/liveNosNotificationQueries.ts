// src/modules/comunicaciones/notifications/liveNosNotificationQueries.ts

import {
  supabase
} from "../../../lib/supabase";

import type {
  ConversationLite,
  NotificationContext,
  OpportunityLite,
  PipelineStateLite
} from "./liveNosNotificationTypes";

function logWarning(
  message: string,
  payload?: unknown
) {
  if (payload === undefined) {
    console.warn(
      `[LiveNosNotificationQueries] ${message}`
    );

    return;
  }

  console.warn(
    `[LiveNosNotificationQueries] ${message}`,
    payload
  );
}

export async function loadNotificationContext(
  conversationId: string
): Promise<NotificationContext> {
  const [
    conversationResult,
    opportunityResult
  ] = await Promise.all([
    supabase
      .from("conversaciones")
      .select(
        [
          "id",
          "wa_phone",
          "titulo",
          "subject",
          "estado_gestion",
          "inbox",
          "assigned_to",
          "tomada_by",
          "deleted_at"
        ].join(",")
      )
      .eq(
        "id",
        conversationId
      )
      .maybeSingle(),

    supabase
      .from(
        "lead_oportunidades"
      )
      .select(
        [
          "id",
          "conversacion_id",
          "cande_handoff_requested_at",
          "estado_id",
          "assigned_to",
          "score",
          "datos",
          "created_at",
          "updated_at"
        ].join(",")
      )
      .eq(
        "conversacion_id",
        conversationId
      )
      .maybeSingle()
  ]);

  if (conversationResult.error) {
    logWarning(
      "No se pudo cargar la conversación.",
      conversationResult.error.message
    );
  }

  if (opportunityResult.error) {
    logWarning(
      "No se pudo cargar la oportunidad.",
      opportunityResult.error.message
    );
  }

  return {
    conversation:
      (
        conversationResult.data ||
        null
      ) as unknown as
        | ConversationLite
        | null,

    opportunity:
      (
        opportunityResult.data ||
        null
      ) as unknown as
        | OpportunityLite
        | null
  };
}

export async function loadPipelineState(
  stateId:
    | string
    | null
    | undefined
): Promise<PipelineStateLite | null> {
  if (!stateId) {
    return null;
  }

  const {
    data,
    error
  } = await supabase
    .from("pipeline_estados")
    .select(
      "id,nombre,es_final,resultado"
    )
    .eq(
      "id",
      stateId
    )
    .maybeSingle();

  if (error) {
    logWarning(
      "No se pudo cargar el estado de la oportunidad.",
      error.message
    );

    return null;
  }

  return (
    data ||
    null
  ) as unknown as
    | PipelineStateLite
    | null;
}

type NotificationAuthorProfile = {
  nombre: string | null;
  apellido: string | null;
  email: string | null;
};

export async function loadNotificationAuthorName(
  authorId: string | null
): Promise<string> {
  if (!authorId) {
    return "Un usuario";
  }

  const {
    data,
    error
  } = await supabase
    .from("profiles")
    .select(
      "nombre,apellido,email"
    )
    .eq(
      "id",
      authorId
    )
    .maybeSingle();

  if (error) {
    logWarning(
      "No se pudo cargar el autor del mensaje interno.",
      error.message
    );

    return "Un usuario";
  }

  const profile =
    (
      data ||
      null
    ) as unknown as
      | NotificationAuthorProfile
      | null;

  if (!profile) {
    return "Un usuario";
  }

  const fullName = [
    profile.nombre,
    profile.apellido
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    profile.email ||
    "Un usuario"
  );
}
