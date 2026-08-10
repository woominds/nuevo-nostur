// src/modules/comunicaciones/notifications/useLiveNosNotificationIdentity.ts

import {
  useCallback,
  useRef
} from "react";

import {
  synchronizeLiveNosPushSubscription
} from "./liveNosPushSubscriptionService";

import {
  loadLiveNosNotificationIdentity
} from "./liveNosNotificationPreferencesService";

import {
  logLiveNosNotificationInfo,
  logLiveNosNotificationWarning
} from "./liveNosNotificationLogger";

import {
  DEFAULT_LIVE_NOS_NOTIFICATION_PREFERENCES
} from "./liveNosNotificationConfig";

import type {
  LiveNosNotificationPreferences,
  NotificationProfileLite
} from "./liveNosNotificationTypes";

export function useLiveNosNotificationIdentity() {
  const currentUserIdRef =
    useRef<string | null>(
      null
    );

  const currentProfileRef =
    useRef<
      NotificationProfileLite | null
    >(
      null
    );

  const notificationPreferencesRef =
    useRef<LiveNosNotificationPreferences>({
      ...DEFAULT_LIVE_NOS_NOTIFICATION_PREFERENCES
    });

  const notificationIdentityReadyRef =
    useRef<
      Promise<void> | null
    >(
      null
    );

  const loadNotificationIdentity =
    useCallback(async () => {
      if (
        notificationIdentityReadyRef.current
      ) {
        await notificationIdentityReadyRef.current;

        return;
      }

      notificationIdentityReadyRef.current =
        (async () => {
          const identity =
            await loadLiveNosNotificationIdentity();

          currentUserIdRef.current =
            identity.userId;

          currentProfileRef.current =
            identity.profile;

          notificationPreferencesRef.current =
            identity.preferences;

          if (
            identity.error &&
            !identity.userId
          ) {
            logLiveNosNotificationWarning(
              "No se pudo identificar usuario para notificaciones",
              identity.error
            );

            return;
          }

          if (identity.error) {
            logLiveNosNotificationWarning(
              "Las preferencias se cargaron con valores predeterminados",
              identity.error
            );
          }

          logLiveNosNotificationInfo(
            "Identidad y preferencias de notificaciones cargadas",
            {
              userId:
                identity.userId,

              rol:
                identity.profile?.rol ||
                null,

              preferences:
                identity.preferences
            }
          );

          if (
            identity.userId &&
            "Notification" in window &&
            Notification.permission ===
              "granted" &&
            identity.preferences
              .system_notification_enabled
          ) {
            void synchronizeLiveNosPushSubscription(
              identity.userId
            );
          }
        })();

      await notificationIdentityReadyRef.current;
    }, []);

  const resetNotificationIdentity =
    useCallback(() => {
      currentUserIdRef.current =
        null;

      currentProfileRef.current =
        null;

      notificationPreferencesRef.current = {
        ...DEFAULT_LIVE_NOS_NOTIFICATION_PREFERENCES
      };

      notificationIdentityReadyRef.current =
        null;
    }, []);

  return {
    currentUserIdRef,
    currentProfileRef,
    notificationPreferencesRef,
    notificationIdentityReadyRef,
    loadNotificationIdentity,
    resetNotificationIdentity
  };
}
