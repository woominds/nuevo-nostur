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
  enableLiveNosPushNotifications
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

        const userId =
          params.currentUserIdRef.current;

        if (!userId) {
          console.warn(
            "[LiveNosPush] No se puede habilitar Push porque todavía no hay usuario identificado."
          );

          return;
        }

        const enabled =
          await enableLiveNosPushNotifications(
            userId
          );

        const permission =
          Notification.permission;

        setNotificationPermission(
          permission
        );

        setShowPermissionPrompt(
          false
        );

        if (
          permission !== "granted" ||
          !enabled
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
            "NOSTUR podrá avisarte cuando lleguen nuevos mensajes incluso cuando la aplicación esté en segundo plano.",

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
              "Este dispositivo quedó registrado para recibir avisos de LiveNos."
          }
        );
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
