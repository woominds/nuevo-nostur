// src/modules/comunicaciones/notifications/liveNosNotificationPreferencesService.ts

import {
  supabase
} from "../../../lib/supabase";

import {
  DEFAULT_LIVE_NOS_NOTIFICATION_PREFERENCES
} from "./liveNosNotificationConfig";

import type {
  LiveNosNotificationPreferences,
  NotificationProfileLite
} from "./liveNosNotificationTypes";

export type LiveNosNotificationIdentity = {
  userId: string | null;
  profile: NotificationProfileLite | null;
  preferences: LiveNosNotificationPreferences;
  error: string | null;
};

export async function loadLiveNosNotificationIdentity():
Promise<LiveNosNotificationIdentity> {
  const {
    data: authData,
    error: authError
  } = await supabase.auth.getUser();

  const userId =
    authData.user?.id || null;

  if (
    authError ||
    !userId
  ) {
    return {
      userId: null,
      profile: null,
      preferences:
        DEFAULT_LIVE_NOS_NOTIFICATION_PREFERENCES,
      error:
        authError?.message ||
        "No hay una sesión activa."
    };
  }

  const [
    profileResult,
    preferencesResult
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        [
          "id",
          "rol",
          "activo",
          "is_support_user",
          "is_super_admin"
        ].join(",")
      )
      .eq(
        "id",
        userId
      )
      .maybeSingle(),

    supabase
      .from(
        "livenos_notification_preferences"
      )
      .select(
        [
          "user_id",
          "sound_enabled",
          "system_notification_enabled",
          "toast_enabled",
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
      .eq(
        "user_id",
        userId
      )
      .maybeSingle()
  ]);

  if (
    profileResult.error
  ) {
    return {
      userId,
      profile: null,
      preferences: {
        ...DEFAULT_LIVE_NOS_NOTIFICATION_PREFERENCES,
        user_id: userId
      },
      error:
        profileResult.error.message
    };
  }

  const profile =
    (
      profileResult.data ||
      null
    ) as unknown as
      | NotificationProfileLite
      | null;

  const storedPreferences =
    (
      preferencesResult.data ||
      {}
    ) as unknown as Partial<LiveNosNotificationPreferences>;

  const preferences: LiveNosNotificationPreferences = {
    ...DEFAULT_LIVE_NOS_NOTIFICATION_PREFERENCES,
    ...storedPreferences,
    user_id: userId
  };

  return {
    userId,
    profile,
    preferences,
    error:
      preferencesResult.error
        ?.message ||
      null
  };
}
