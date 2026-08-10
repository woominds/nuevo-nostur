// src/modules/comunicaciones/notifications/useLiveNosNotificationPreferencesRealtime.ts

import {
  useEffect,
  type RefObject
} from "react";

import {
  supabase
} from "../../../lib/supabase";

import {
  DEFAULT_LIVE_NOS_NOTIFICATION_PREFERENCES
} from "./liveNosNotificationConfig";

import {
  logLiveNosNotificationInfo
} from "./liveNosNotificationLogger";

import type {
  LiveNosNotificationPreferences
} from "./liveNosNotificationTypes";

type UseLiveNosNotificationPreferencesRealtimeParams = {
  currentUserIdRef:
    RefObject<string | null>;

  preferencesRef:
    RefObject<LiveNosNotificationPreferences>;

  identityReady:
    () => Promise<void>;
};

export function useLiveNosNotificationPreferencesRealtime(
  params: UseLiveNosNotificationPreferencesRealtimeParams
) {
  useEffect(() => {
    let active = true;

    let channel:
      | ReturnType<typeof supabase.channel>
      | null = null;

    const subscribe =
      async () => {
        await params.identityReady();

        if (!active) {
          return;
        }

        const userId =
          params.currentUserIdRef.current;

        if (!userId) {
          return;
        }

        const applyPreferences =
          (
            rawPreferences: unknown
          ) => {
            const storedPreferences =
              (
                rawPreferences ||
                {}
              ) as Partial<LiveNosNotificationPreferences>;

            params.preferencesRef.current = {
              ...DEFAULT_LIVE_NOS_NOTIFICATION_PREFERENCES,
              ...storedPreferences,
              user_id: userId
            };

            logLiveNosNotificationInfo(
              "Preferencias de notificaciones actualizadas en tiempo real",
              params.preferencesRef.current
            );
          };

        channel = supabase
          .channel(
            `livenos-notification-preferences-${userId}-${Date.now()}`
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table:
                "livenos_notification_preferences",
              filter:
                `user_id=eq.${userId}`
            },
            (payload) => {
              applyPreferences(
                payload.new
              );
            }
          )
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table:
                "livenos_notification_preferences",
              filter:
                `user_id=eq.${userId}`
            },
            (payload) => {
              applyPreferences(
                payload.new
              );
            }
          )
          .subscribe((status) => {
            logLiveNosNotificationInfo(
              `Preferencias Realtime: ${status}`
            );
          });
      };

    void subscribe();

    return () => {
      active = false;

      if (channel) {
        void supabase.removeChannel(
          channel
        );
      }
    };
  }, [
    params.currentUserIdRef,
    params.identityReady,
    params.preferencesRef
  ]);
}
