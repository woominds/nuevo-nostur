// src/modules/comunicaciones/notifications/liveNosNotificationRules.ts

import type {
  LiveNosNotificationKind
} from "./liveNosNotificationRuntime";

import type {
  ConversationLite,
  IncomingMessagePayload,
  LiveNosNotificationPreferences,
  NotificationContext,
  NotificationProfileLite,
  OpportunityLite,
  PresupuestoRealtimeRow
} from "./liveNosNotificationTypes";

const POLLING_OVERLAP_MS = 1500;

export function cleanText(
  value: unknown
): string {
  return String(value || "").trim();
}

export function truncateText(
  value: string,
  max = 120
): string {
  const clean = cleanText(value).replace(
    /\s+/g,
    " "
  );

  if (clean.length <= max) {
    return clean;
  }

  return `${clean.slice(0, max - 1)}…`;
}

export function canProfileReceiveAllNotifications(
  profile: NotificationProfileLite | null
): boolean {
  if (
    !profile ||
    profile.activo === false
  ) {
    return false;
  }

  const role = cleanText(
    profile.rol
  ).toLowerCase();

  return (
    role === "gerencia" ||
    role === "admin_general" ||
    profile.is_support_user === true ||
    profile.is_super_admin === true
  );
}

export function getConversationOwnerId(
  conversation: ConversationLite | null
): string | null {
  return (
    cleanText(
      conversation?.assigned_to
    ) ||
    cleanText(
      conversation?.tomada_by
    ) ||
    null
  );
}

export function canReceiveConversationNotification(
  params: {
    conversation:
      | ConversationLite
      | null;

    currentUserId:
      | string
      | null;

    currentProfile:
      | NotificationProfileLite
      | null;
  }
): boolean {
  if (
    !params.currentUserId ||
    !params.currentProfile ||
    params.currentProfile.activo === false
  ) {
    return false;
  }

  if (
    !params.conversation ||
    params.conversation.deleted_at
  ) {
    return false;
  }

  if (
    canProfileReceiveAllNotifications(
      params.currentProfile
    )
  ) {
    return true;
  }

  const ownerId =
    getConversationOwnerId(
      params.conversation
    );

  const estadoGestion =
    cleanText(
      params.conversation
        .estado_gestion
    ).toLowerCase();

  const inbox =
    cleanText(
      params.conversation.inbox
    ).toLowerCase();

  const isUnassignedConversation =
    !ownerId ||
    estadoGestion ===
      "sin_atender" ||
    inbox === "sin_atender" ||
    inbox === "general";

  if (isUnassignedConversation) {
    return true;
  }

  return (
    ownerId ===
    params.currentUserId
  );
}

export function getConversationName(
  conversation: ConversationLite | null
): string {
  return (
    cleanText(
      conversation?.titulo
    ) ||
    cleanText(
      conversation?.subject
    ) ||
    cleanText(
      conversation?.wa_phone
    ) ||
    "Pasajero"
  );
}

export function shouldIgnoreMessage(
  message: IncomingMessagePayload
): boolean {
  if (
    !message.id ||
    !message.conversacion_id
  ) {
    return true;
  }

  const direction =
    cleanText(
      message.direction
    ).toLowerCase();

  if (
    direction !== "in" &&
    direction !== "inbound"
  ) {
    return true;
  }

  const senderKind =
    cleanText(
      message.sender_kind
    ).toLowerCase();

  return (
    senderKind === "cande" ||
    senderKind === "nia" ||
    senderKind === "sistema"
  );
}

export function getMessagePreview(
  message: IncomingMessagePayload
): string {
  const text =
    cleanText(message.text);

  if (text) {
    return truncateText(text);
  }

  const type =
    cleanText(
      message.type
    ).toLowerCase();

  if (type === "audio") {
    return "Audio recibido";
  }

  if (type === "image") {
    return "Imagen recibida";
  }

  if (type === "document") {
    return "Archivo recibido";
  }

  if (type === "video") {
    return "Video recibido";
  }

  return "Nuevo mensaje recibido";
}

export function classifyNotification(
  context: NotificationContext
): LiveNosNotificationKind {
  const handoffAt =
    context.opportunity
      ?.cande_handoff_requested_at;

  if (handoffAt) {
    const handoffTime =
      new Date(
        handoffAt
      ).getTime();

    if (
      Number.isFinite(
        handoffTime
      ) &&
      Date.now() -
        handoffTime <
        90_000
    ) {
      return "cande_transfer";
    }
  }

  const ownerId =
    getConversationOwnerId(
      context.conversation
    );

  const estadoGestion =
    cleanText(
      context.conversation
        ?.estado_gestion
    ).toLowerCase();

  const inbox =
    cleanText(
      context.conversation?.inbox
    ).toLowerCase();

  if (
    !ownerId ||
    estadoGestion ===
      "sin_atender" ||
    inbox === "sin_atender"
  ) {
    return "nuevo";
  }

  return "gestion";
}

export function getNotificationCopy(
  params: {
    kind:
      LiveNosNotificationKind;

    passengerName: string;
    preview: string;
  }
) {
  if (
    params.kind ===
    "cande_transfer"
  ) {
    return {
      title:
        `CANDE derivó a ${params.passengerName}`,

      body:
        `Requiere atención de vendedor. ${params.preview}`
    };
  }

  if (params.kind === "nuevo") {
    return {
      title:
        `Nuevo pasajero · ${params.passengerName}`,

      body:
        `Mensaje sin atender. ${params.preview}`
    };
  }

  if (
    params.kind === "internal"
  ) {
    return {
      title:
        `Mensaje interno · ${params.passengerName}`,

      body:
        params.preview
    };
  }

  return {
    title:
      `Nuevo mensaje · ${params.passengerName}`,

    body:
      params.preview
  };
}

export function addOverlapToCursor(
  value: string
): string {
  const timestamp =
    new Date(value).getTime();

  if (
    !Number.isFinite(
      timestamp
    )
  ) {
    return value;
  }

  return new Date(
    timestamp -
      POLLING_OVERLAP_MS
  ).toISOString();
}

export function getLatestCreatedAt<T>(
  items: T[],
  getCreatedAt: (
    item: T
  ) => string | null
): string | null {
  let latestTimestamp = 0;

  let latestValue:
    | string
    | null = null;

  for (const item of items) {
    const value =
      getCreatedAt(item);

    if (!value) {
      continue;
    }

    const timestamp =
      new Date(value).getTime();

    if (
      Number.isFinite(
        timestamp
      ) &&
      timestamp >
        latestTimestamp
    ) {
      latestTimestamp =
        timestamp;

      latestValue = value;
    }
  }

  return latestValue;
}

function parseTimeToMinutes(
  value: string | null
): number | null {
  if (!value) {
    return null;
  }

  const parts =
    value.split(":");

  if (parts.length < 2) {
    return null;
  }

  const hours =
    Number(parts[0]);

  const minutes =
    Number(parts[1]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return (
    hours * 60 +
    minutes
  );
}

export function isInsideDoNotDisturb(
  preferences:
    LiveNosNotificationPreferences
): boolean {
  if (
    !preferences
      .do_not_disturb_enabled
  ) {
    return false;
  }

  const from =
    parseTimeToMinutes(
      preferences
        .do_not_disturb_from
    );

  const until =
    parseTimeToMinutes(
      preferences
        .do_not_disturb_until
    );

  if (
    from === null ||
    until === null
  ) {
    return false;
  }

  const now = new Date();

  const current =
    now.getHours() * 60 +
    now.getMinutes();

  if (from === until) {
    return true;
  }

  if (from < until) {
    return (
      current >= from &&
      current < until
    );
  }

  return (
    current >= from ||
    current < until
  );
}

export function isNotificationKindEnabled(
  kind:
    LiveNosNotificationKind,

  preferences:
    LiveNosNotificationPreferences
): boolean {
  if (
    kind ===
    "cande_transfer"
  ) {
    return (
      preferences
        .cande_enabled
    );
  }

  if (kind === "internal") {
    return (
      preferences
        .internal_messages_enabled
    );
  }

  if (kind === "nuevo") {
    return (
      preferences
        .new_conversations_enabled
    );
  }

  return true;
}

export function shouldShowSystemNotification():
boolean {
  return (
    document.visibilityState !==
      "visible" ||
    !document.hasFocus()
  );
}

export function shouldShowInternalToast():
boolean {
  return (
    document.visibilityState ===
      "visible" &&
    document.hasFocus()
  );
}

export function isConversationCurrentlyVisible(
  conversationId?: string
): boolean {
  if (!conversationId) {
    return false;
  }

  if (
    document.visibilityState !==
      "visible" ||
    !document.hasFocus()
  ) {
    return false;
  }

  const root =
    document.documentElement;

  return (
    root.dataset
      .livenosConversationVisible ===
      "1" &&
    root.dataset
      .livenosActiveConversationId ===
      conversationId
  );
}

export function canReceiveOpportunityNotification(
  params: {
    opportunity:
      OpportunityLite;

    currentUserId:
      | string
      | null;

    currentProfile:
      | NotificationProfileLite
      | null;
  }
): boolean {
  if (
    !params.currentUserId ||
    !params.currentProfile ||
    params.currentProfile.activo === false
  ) {
    return false;
  }

  if (
    canProfileReceiveAllNotifications(
      params.currentProfile
    )
  ) {
    return true;
  }

  return (
    cleanText(
      params.opportunity
        .assigned_to
    ) ===
    params.currentUserId
  );
}

export function getOpportunityPassengerName(
  opportunity:
    OpportunityLite,

  conversation:
    ConversationLite | null
): string {
  const datos =
    opportunity.datos &&
    typeof opportunity.datos ===
      "object"
      ? opportunity.datos
      : {};

  return (
    cleanText(
      datos.nombre_cliente
    ) ||
    cleanText(
      datos.nombre
    ) ||
    cleanText(
      datos.contacto_nombre
    ) ||
    getConversationName(
      conversation
    ) ||
    "Nueva oportunidad"
  );
}

export function getOpportunityDestination(
  opportunity:
    OpportunityLite
): string {
  const datos =
    opportunity.datos &&
    typeof opportunity.datos ===
      "object"
      ? opportunity.datos
      : {};

  return (
    cleanText(
      datos.destino
    ) ||
    cleanText(
      datos.destino_principal
    ) ||
    cleanText(
      datos.destino_sugerido
    )
  );
}

export function getPresupuestoDisplayName(
  presupuesto:
    PresupuestoRealtimeRow
): string {
  return (
    cleanText(
      presupuesto
        .contacto_nombre
    ) ||
    cleanText(
      presupuesto.nombre
    ) ||
    (
      presupuesto.numero
        ? `Presupuesto ${presupuesto.numero}`
        : "Presupuesto"
    )
  );
}

export function buildPresupuestoNotificationId(
  params: {
    presupuesto:
      PresupuestoRealtimeRow;

    reason:
      | "assigned"
      | "completed";
  }
): string {
  return [
    "budget",
    params.reason,
    params.presupuesto.id,

    params.presupuesto
      .updated_at ||
      params.presupuesto
        .created_at ||
      ""
  ].join(":");
}

export function canReceivePresupuestoNotification(
  params: {
    presupuesto:
      PresupuestoRealtimeRow;

    currentUserId:
      | string
      | null;

    currentProfile:
      | NotificationProfileLite
      | null;
  }
): boolean {
  if (
    !params.currentUserId ||
    !params.currentProfile ||
    params.currentProfile.activo === false
  ) {
    return false;
  }

  if (
    canProfileReceiveAllNotifications(
      params.currentProfile
    )
  ) {
    return true;
  }

  return (
    cleanText(
      params.presupuesto
        .vendedor_id
    ) ===
    params.currentUserId
  );
}

export function buildOpportunityNotificationId(
  params: {
    opportunity:
      OpportunityLite;

    reason:
      | "created"
      | "assigned"
      | "state";
  }
): string {
  return [
    "opportunity",
    params.reason,
    params.opportunity.id,

    params.opportunity
      .updated_at ||
      params.opportunity
        .created_at ||
      ""
  ].join(":");
}

export function buildHandoffNotificationId(
  opportunity:
    OpportunityLite
): string {
  return [
    "handoff",
    opportunity.id,

    opportunity
      .cande_handoff_requested_at ||
      ""
  ].join(":");
}
