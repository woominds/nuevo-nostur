// src/modules/comunicaciones/notifications/liveNosNotificationConfig.ts

import type {
  LiveNosNotificationPreferences
} from "./liveNosNotificationTypes";

export const LIVE_NOS_POLLING_INTERVAL_MS =
  6000;

export const LIVE_NOS_MAX_TOASTS =
  4;

export const LIVE_NOS_NOTIFICATION_PROMPT_DISMISSED_KEY =
  "nostur:livenos:notification-permission-dismissed-at";

export const LIVE_NOS_NOTIFICATION_PROMPT_RETRY_MS =
  24 * 60 * 60 * 1000;

export const DEFAULT_LIVE_NOS_NOTIFICATION_PREFERENCES:
LiveNosNotificationPreferences = {
  user_id: "",
  sound_enabled: true,
  system_notification_enabled: true,
  toast_enabled: true,
  cande_enabled: true,
  internal_messages_enabled: true,
  new_conversations_enabled: true,
  budgets_enabled: true,
  opportunities_enabled: true,
  do_not_disturb_enabled: false,
  do_not_disturb_from: null,
  do_not_disturb_until: null
};
