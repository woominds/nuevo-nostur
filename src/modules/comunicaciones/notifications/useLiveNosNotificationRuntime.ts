// src/modules/comunicaciones/notifications/useLiveNosNotificationRuntime.ts

import {
  useEffect,
  type MutableRefObject
} from "react";

import {
  supabase
} from "../../../lib/supabase";

import {
  DEFAULT_LIVE_NOS_NOTIFICATION_PREFERENCES
} from "./liveNosNotificationConfig";

import {
  liveNosNotificationBus,
  type LiveNosNotificationEvent,
  type LiveNosNotificationListener
} from "./liveNosNotificationBus";

import {
  liveNosNotificationRuntime
} from "./liveNosNotificationRuntime";

import type {
  LiveNosNotificationPreferences,
  NotificationProfileLite
} from "./liveNosNotificationTypes";

type UseLiveNosNotificationRuntimeParams = {
  deliverNotification:
    LiveNosNotificationListener;

  loadNotificationIdentity:
    () => Promise<void>;

  clearToasts:
    () => void;

  currentUserIdRef:
    MutableRefObject<string | null>;

  currentProfileRef:
    MutableRefObject<
      NotificationProfileLite | null
    >;

  notificationPreferencesRef:
    MutableRefObject<
      LiveNosNotificationPreferences
    >;

  notificationIdentityReadyRef:
    MutableRefObject<
      Promise<void> | null
    >;
};

export function useLiveNosNotificationRuntime(
  params: UseLiveNosNotificationRuntimeParams
) {
  useEffect(() => {
    const unsubscribeBus =
      liveNosNotificationBus.subscribe(
        (
          event:
            LiveNosNotificationEvent
        ) =>
          params.deliverNotification(
            event
          )
      );

    liveNosNotificationRuntime.initialize();

    void params.loadNotificationIdentity();

    const {
      data: authListener
    } =
      supabase.auth.onAuthStateChange(
        () => {
          params.currentUserIdRef.current =
            null;

          params.currentProfileRef.current =
            null;

          params.notificationPreferencesRef.current = {
            ...DEFAULT_LIVE_NOS_NOTIFICATION_PREFERENCES
          };

          params.notificationIdentityReadyRef.current =
            null;

          params.clearToasts();

          void params.loadNotificationIdentity();
        }
      );

    return () => {
      unsubscribeBus();

      authListener.subscription.unsubscribe();

      liveNosNotificationRuntime.destroy();
    };
  }, [
    params.clearToasts,
    params.currentProfileRef,
    params.currentUserIdRef,
    params.deliverNotification,
    params.loadNotificationIdentity,
    params.notificationIdentityReadyRef,
    params.notificationPreferencesRef
  ]);
}
