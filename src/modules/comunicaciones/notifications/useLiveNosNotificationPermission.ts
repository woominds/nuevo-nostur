// src/modules/comunicaciones/notifications/useLiveNosNotificationPermission.ts

import {
  useCallback,
  useEffect,
  useState,
  type RefObject
} from "react";

import {
  LIVE_NOS_NOTIFICATION_PROMPT_DISMISSED_KEY,
  LIVE_NOS_NOTIFICATION_PROMPT_RETRY_MS
} from "./liveNosNotificationConfig";

import {
  liveNosNotificationRuntime
} from "./liveNosNotificationRuntime";

import {
  synchronizeLiveNosPushSubscription
} from "./liveNosPushSubscriptionService";

import type {
  VisibleToast
} from "./liveNosNotificationTypes";

type UseLiveNosNotificationPermissionParams = {
  currentUserIdRef:
    RefObject<string | null>;

  enqueueToast: (
    toast: VisibleToast
  ) => void;
};

type LiveNosNotificationPermissionState =
  | NotificationPermission
  | "unsupported";

export function useLiveNosNotificationPermission(
  params: UseLiveNosNotificationPermissionParams
) {
  const [
    notificationPermission,
    setNotificationPermission
  ] = useState<LiveNosNotificationPermissionState>(
    () => {
      if (
        !(
          "Notification" in
          window
        )
      ) {
        return "unsupported";
      }

      return Notification.permission;
    }
  );

  const [
    showPermissionPrompt,
    setShowPermissionPrompt
  ] = useState(false);

  const [
    requestingPermission,
    setRequestingPermission
  ] = useState(false);

  const synchronizePermission =
    useCallback(() => {
      if (
        !(
          "Notification" in
          window
        )
      ) {
        setNotificationPermission(
          "unsupported"
        );

        setShowPermissionPrompt(
          false
        );

        return;
      }

      const permission =
        Notification.permission;

      setNotificationPermission(
        permission
      );

      if (
        permission !== "default"
      ) {
        setShowPermissionPrompt(
          false
        );

        return;
      }

      let dismissedAt = 0;

      try {
        dismissedAt =
          Number(
            window.localStorage.getItem(
              LIVE_NOS_NOTIFICATION_PROMPT_DISMISSED_KEY
            ) || 0
          );
      } catch {
        dismissedAt = 0;
      }

      const canShowAgain =
        !dismissedAt ||
        Date.now() -
          dismissedAt >=
          LIVE_NOS_NOTIFICATION_PROMPT_RETRY_MS;

      setShowPermissionPrompt(
        canShowAgain
      );
    }, []);

  const dismissPermissionPrompt =
    useCallback(() => {
      try {
        window.localStorage.setItem(
          LIVE_NOS_NOTIFICATION_PROMPT_DISMISSED_KEY,
          String(Date.now())
        );
      } catch {
        // No bloquear la interfaz si localStorage no está disponible.
      }

      setShowPermissionPrompt(
        false
      );
    }, []);

  const requestNotificationPermission =
    useCallback(async () => {
      if (
        requestingPermission
      ) {
        return;
      }

      setRequestingPermission(
        true
      );

      try {
        const permission =
          await liveNosNotificationRuntime.requestPermission();

        setNotificationPermission(
          permission
        );

        setShowPermissionPrompt(
          false
        );

        if (
          permission !== "granted"
        ) {
          return;
        }

        try {
          window.localStorage.removeItem(
            LIVE_NOS_NOTIFICATION_PROMPT_DISMISSED_KEY
          );
        } catch {
          // No bloquear la activación si localStorage falla.
        }

        const notificationId =
          `notifications-enabled:${Date.now()}`;

        params.enqueueToast({
          id:
            notificationId,

          title:
            "Notificaciones activadas",

          subtitle:
            "LiveNos",

          body:
            "NOSTUR podrá avisarte cuando lleguen nuevos mensajes y la pestaña esté en segundo plano.",

          createdAt:
            new Date().toISOString()
        });

        await liveNosNotificationRuntime.playSound(
          "gestion"
        );

        await liveNosNotificationRuntime.showSystemNotification(
          {
            id:
              notificationId,

            kind:
              "gestion",

            title:
              "Notificaciones de LiveNos activadas",

            body:
              "Los avisos visuales y sonoros ya están funcionando correctamente."
          }
        );

        const userId =
          params.currentUserIdRef.current;

        if (userId) {
          void synchronizeLiveNosPushSubscription(
            userId
          );
        }
      } finally {
        setRequestingPermission(
          false
        );
      }
    }, [
      params.currentUserIdRef,
      params.enqueueToast,
      requestingPermission
    ]);

  useEffect(() => {
    synchronizePermission();

    window.addEventListener(
      "focus",
      synchronizePermission
    );

    document.addEventListener(
      "visibilitychange",
      synchronizePermission
    );

    return () => {
      window.removeEventListener(
        "focus",
        synchronizePermission
      );

      document.removeEventListener(
        "visibilitychange",
        synchronizePermission
      );
    };
  }, [
    synchronizePermission
  ]);

  return {
    notificationPermission,
    showPermissionPrompt,
    requestingPermission,
    dismissPermissionPrompt,
    requestNotificationPermission
  };
}
