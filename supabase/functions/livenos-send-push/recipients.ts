// supabase/functions/livenos-send-push/recipients.ts

import type {
  SupabaseClient
} from "npm:@supabase/supabase-js@2";

export type LiveNosPushSource =
  | "whatsapp"
  | "internal"
  | "cande"
  | "opportunity"
  | "budget"
  | "system";

export type PushRecipientProfile = {
  id: string;
  rol: string | null;
  activo: boolean | null;
};

export type PushPreferences = {
  user_id: string;
  system_notification_enabled: boolean;
  cande_enabled: boolean;
  internal_messages_enabled: boolean;
  new_conversations_enabled: boolean;
  budgets_enabled: boolean;
  opportunities_enabled: boolean;
  do_not_disturb_enabled: boolean;
  do_not_disturb_from: string | null;
  do_not_disturb_until: string | null;
};

type ConversationRecipientRow = {
  id: string;
  assigned_to: string | null;
  tomada_by: string | null;
  inbox: string | null;
  estado_gestion: string | null;
  deleted_at: string | null;
};

export type ResolvePushRecipientsParams = {
  supabase: SupabaseClient;
  source: LiveNosPushSource;
  conversationId?: string;
  explicitUserIds?: string[];
  assignedUserId?: string;
  excludedUserIds?: string[];
};

function cleanText(value: unknown): string {
  return String(value || "").trim();
}

function normalizeRole(value: unknown): string {
  return cleanText(value).toLowerCase();
}

function parseTimeToMinutes(
  value: string | null
): number | null {
  if (!value) {
    return null;
  }

  const parts = value.split(":");

  if (parts.length < 2) {
    return null;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

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

  return hours * 60 + minutes;
}

function getArgentinaMinutesNow(): number {
  const parts = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: "America/Argentina/Cordoba",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }
  ).formatToParts(new Date());

  const hours = Number(
    parts.find(
      (part) => part.type === "hour"
    )?.value || 0
  );

  const minutes = Number(
    parts.find(
      (part) => part.type === "minute"
    )?.value || 0
  );

  return hours * 60 + minutes;
}

function isInsideDoNotDisturb(
  preferences: PushPreferences
): boolean {
  if (!preferences.do_not_disturb_enabled) {
    return false;
  }

  const from = parseTimeToMinutes(
    preferences.do_not_disturb_from
  );

  const until = parseTimeToMinutes(
    preferences.do_not_disturb_until
  );

  if (from === null || until === null) {
    return false;
  }

  const current = getArgentinaMinutesNow();

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

function isSourceEnabled(
  source: LiveNosPushSource,
  preferences: PushPreferences
): boolean {
  if (!preferences.system_notification_enabled) {
    return false;
  }

  if (source === "cande") {
    return preferences.cande_enabled;
  }

  if (source === "internal") {
    return preferences.internal_messages_enabled;
  }

  if (source === "whatsapp") {
    return preferences.new_conversations_enabled;
  }

  if (source === "budget") {
    return preferences.budgets_enabled;
  }

  if (source === "opportunity") {
    return preferences.opportunities_enabled;
  }

  return true;
}

function isGlobalProfile(
  profile: PushRecipientProfile
): boolean {
  const role = normalizeRole(profile.rol);

  return (
    role === "gerencia" ||
    role === "admin_general"
  );
}

async function loadActiveProfiles(
  supabase: SupabaseClient
): Promise<PushRecipientProfile[]> {
  const {
    data,
    error
  } = await supabase
    .from("profiles")
    .select("id,rol,activo")
    .neq("activo", false);

  if (error) {
    throw new Error(
      `No se pudieron cargar perfiles: ${error.message}`
    );
  }

  return (
    data || []
  ) as PushRecipientProfile[];
}

async function resolveBaseUserIds(
  params: ResolvePushRecipientsParams,
  profiles: PushRecipientProfile[]
): Promise<string[]> {
  const explicitIds = (
    params.explicitUserIds || []
  )
    .map(cleanText)
    .filter(Boolean);

  if (explicitIds.length > 0) {
    return Array.from(
      new Set(explicitIds)
    );
  }

  const assignedUserId = cleanText(
    params.assignedUserId
  );

  if (assignedUserId) {
    return Array.from(
      new Set([
        assignedUserId,
        ...profiles
          .filter(isGlobalProfile)
          .map((profile) => profile.id)
      ])
    );
  }

  const conversationId = cleanText(
    params.conversationId
  );

  if (!conversationId) {
    return profiles
      .filter(isGlobalProfile)
      .map((profile) => profile.id);
  }

  const {
    data,
    error
  } = await params.supabase
    .from("conversaciones")
    .select(
      [
        "id",
        "assigned_to",
        "tomada_by",
        "inbox",
        "estado_gestion",
        "deleted_at"
      ].join(",")
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo cargar la conversación: ${error.message}`
    );
  }

  const conversation =
    data as ConversationRecipientRow | null;

  if (
    !conversation ||
    conversation.deleted_at
  ) {
    return [];
  }

  const ownerId =
    cleanText(conversation.assigned_to) ||
    cleanText(conversation.tomada_by);

  const inbox = cleanText(
    conversation.inbox
  ).toLowerCase();

  const estadoGestion = cleanText(
    conversation.estado_gestion
  ).toLowerCase();

  const isUnassigned =
    !ownerId ||
    inbox === "general" ||
    inbox === "sin_atender" ||
    estadoGestion === "sin_atender";

  if (isUnassigned) {
    return profiles.map(
      (profile) => profile.id
    );
  }

  return Array.from(
    new Set([
      ownerId,
      ...profiles
        .filter(isGlobalProfile)
        .map((profile) => profile.id)
    ])
  );
}

export async function resolvePushRecipientUserIds(
  params: ResolvePushRecipientsParams
): Promise<string[]> {
  const profiles = await loadActiveProfiles(
    params.supabase
  );

  const activeProfileIds = new Set(
    profiles.map(
      (profile) => profile.id
    )
  );

  const baseUserIds =
    await resolveBaseUserIds(
      params,
      profiles
    );

  const excludedUserIds =
    new Set(
      (
        params.excludedUserIds ||
        []
      )
        .map(cleanText)
        .filter(Boolean)
    );

  const userIds = baseUserIds.filter(
    (userId) =>
      activeProfileIds.has(userId) &&
      !excludedUserIds.has(userId)
  );

  if (userIds.length === 0) {
    return [];
  }

  const {
    data,
    error
  } = await params.supabase
    .from(
      "livenos_notification_preferences"
    )
    .select(
      [
        "user_id",
        "system_notification_enabled",
        "cande_enabled",
        "internal_messages_enabled",
        "new_conversations_enabled",
        "budgets_enabled",
        "opportunities_enabled",
        "do_not_disturb_enabled",
        "do_not_disturb_from",
        "do_not_disturb_until"
      ].join(",")
    )
    .in(
      "user_id",
      userIds
    );

  if (error) {
    throw new Error(
      `No se pudieron cargar preferencias: ${error.message}`
    );
  }

  const preferencesByUser =
    new Map<string, PushPreferences>();

  for (
    const row of (
      data || []
    ) as PushPreferences[]
  ) {
    preferencesByUser.set(
      row.user_id,
      row
    );
  }

  return userIds.filter(
    (userId) => {
      const preferences =
        preferencesByUser.get(
          userId
        );

      if (!preferences) {
        return true;
      }

      if (
        !isSourceEnabled(
          params.source,
          preferences
        )
      ) {
        return false;
      }

      return !isInsideDoNotDisturb(
        preferences
      );
    }
  );
}
