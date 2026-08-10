import {
  supabase,
} from "../../../lib/supabase";

import {
  isWindowOpen,
  normalizePhoneForLiveNos,
} from "../../comunicaciones/liveNos/helpers";

import type {
  Conversacion,
} from "../../comunicaciones/liveNos/types";

export type PresupuestoLiveNosMatch = {
  conversationId: string;
  phone: string;
  status: string;
  assignedTo: string | null;
  lastMessageAt: string | null;
  windowExpiresAt: string | null;
  windowOpen: boolean;
};

export type PresupuestoLiveNosResult = {
  normalizedPhone: string;
  matches: PresupuestoLiveNosMatch[];
  openWindowMatches: PresupuestoLiveNosMatch[];
  hasConversation: boolean;
  hasOpenWindow: boolean;
};

const emptyResult = (
  normalizedPhone = "",
): PresupuestoLiveNosResult => ({
  normalizedPhone,
  matches: [],
  openWindowMatches: [],
  hasConversation: false,
  hasOpenWindow: false,
});

const normalizeQueryPhone = (
  value: string,
): {
  digits: string;
  withPlus: string;
} => {
  const digits =
    normalizePhoneForLiveNos(value);

  return {
    digits,
    withPlus: digits
      ? `+${digits}`
      : "",
  };
};

const isAvailableConversation = (
  conversation: Conversacion,
): boolean => {
  return !(
    conversation.closed_at ||
    conversation.archived_at ||
    conversation.deleted_at
  );
};

const mapConversation = (
  conversation: Conversacion,
): PresupuestoLiveNosMatch => ({
  conversationId:
    conversation.id,

  phone:
    conversation.wa_phone,

  status:
    conversation.status,

  assignedTo:
    conversation.assigned_to,

  lastMessageAt:
    conversation.last_message_at,

  windowExpiresAt:
    conversation.whatsapp_24h_expires_at ||
    conversation.window_expires_at,

  windowOpen:
    isWindowOpen(conversation),
});

export async function findLiveNosConversationsByPhone(
  phoneValue: string,
): Promise<PresupuestoLiveNosResult> {
  const {
    digits,
    withPlus,
  } = normalizeQueryPhone(
    phoneValue,
  );

  if (!digits) {
    return emptyResult();
  }

  const filters = [
    `wa_phone.eq.${digits}`,
  ];

  if (withPlus) {
    filters.push(
      `wa_phone.eq.${withPlus}`,
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("conversaciones")
    .select(
      [
        "id",
        "contacto_id",
        "assigned_to",
        "sucursal_id",
        "inbox",
        "status",
        "priority",
        "unread_count",
        "last_message_at",
        "last_message_preview",
        "window_expires_at",
        "wa_phone",
        "created_at",
        "updated_at",
        "last_inbound_message_at",
        "last_outbound_message_at",
        "whatsapp_24h_expires_at",
        "archived_at",
        "deleted_at",
        "closed_at",
        "estado_gestion",
        "estado_comercial",
        "categoria",
        "etapa_comercial",
        "subject",
        "titulo",
        "channel",
        "metadata",
        "tomada_at",
        "tomada_by",
      ].join(","),
    )
    .or(filters.join(","))
    .order(
      "last_message_at",
      {
        ascending: false,
        nullsFirst: false,
      },
    )
    .limit(20);

  if (error) {
    throw new Error(
      error.message ||
      "No se pudo consultar LiveNos.",
    );
  }

  const conversations =
    (
      data ?? []
    ) as unknown as Conversacion[];

  const availableMatches =
    conversations
      .filter(
        isAvailableConversation,
      )
      .map(
        mapConversation,
      );

  const openWindowMatches =
    availableMatches.filter(
      (match) =>
        match.windowOpen,
    );

  return {
    normalizedPhone:
      digits,

    matches:
      availableMatches,

    openWindowMatches,

    hasConversation:
      availableMatches.length > 0,

    hasOpenWindow:
      openWindowMatches.length > 0,
  };
}
