// src/modules/comunicaciones/notifications/liveNosPushSubscriptionService.ts

import {
  supabase
} from "../../../lib/supabase";

const SERVICE_WORKER_PATH =
  "/notification-sw.js";

const SERVICE_WORKER_SCOPE =
  "/";

function cleanText(
  value: unknown
): string {
  return String(
    value || ""
  ).trim();
}

function log(
  message: string,
  data?: unknown
): void {
  if (data === undefined) {
    console.info(
      `[LiveNosPush] ${message}`
    );

    return;
  }

  console.info(
    `[LiveNosPush] ${message}`,
    data
  );
}

function warn(
  message: string,
  data?: unknown
): void {
  console.warn(
    `[LiveNosPush] ${message}`,
    data ?? ""
  );
}

function decodeVapidPublicKey(
  value: string
): Uint8Array {
  const padding =
    "=".repeat(
      (4 - value.length % 4) % 4
    );

  const normalized =
    (
      value +
      padding
    )
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const binary =
    window.atob(
      normalized
    );

  const output =
    new Uint8Array(
      binary.length
    );

  for (
    let index = 0;
    index < binary.length;
    index += 1
  ) {
    output[index] =
      binary.charCodeAt(index);
  }

  return output;
}

function getDeviceLabel(): string {
  const userAgent =
    navigator.userAgent.toLowerCase();

  if (
    userAgent.includes("iphone")
  ) {
    return "iPhone";
  }

  if (
    userAgent.includes("ipad")
  ) {
    return "iPad";
  }

  if (
    userAgent.includes("android")
  ) {
    return "Android";
  }

  if (
    userAgent.includes("windows")
  ) {
    return "Windows";
  }

  if (
    userAgent.includes("macintosh") ||
    userAgent.includes("mac os")
  ) {
    return "Mac";
  }

  return "Navegador web";
}

function getPlatform(): string {
  return (
    cleanText(
      navigator.platform
    ) ||
    "web"
  );
}

export type LiveNosPushSupport = {
  secureContext: boolean;
  notificationsSupported: boolean;
  serviceWorkerSupported: boolean;
  pushSupported: boolean;
  permission:
    | NotificationPermission
    | "unsupported";
  deviceLabel: string;
  platform: string;
  standalone: boolean;
};

export function getLiveNosPushSupport():
LiveNosPushSupport {
  const standalone =
    window.matchMedia?.(
      "(display-mode: standalone)"
    )?.matches === true ||
    (
      "standalone" in navigator &&
      (
        navigator as Navigator & {
          standalone?: boolean;
        }
      ).standalone === true
    );

  return {
    secureContext:
      window.isSecureContext,

    notificationsSupported:
      "Notification" in window,

    serviceWorkerSupported:
      "serviceWorker" in navigator,

    pushSupported:
      "PushManager" in window,

    permission:
      "Notification" in window
        ? Notification.permission
        : "unsupported",

    deviceLabel:
      getDeviceLabel(),

    platform:
      getPlatform(),

    standalone
  };
}

async function getReadyRegistration():
Promise<ServiceWorkerRegistration | null> {
  const support =
    getLiveNosPushSupport();

  log(
    "Estado de compatibilidad.",
    support
  );

  if (!support.secureContext) {
    warn(
      "Push no disponible: la aplicación no está ejecutándose en un contexto HTTPS seguro."
    );

    return null;
  }

  if (
    !support.serviceWorkerSupported
  ) {
    warn(
      "Push no disponible: Service Worker no soportado."
    );

    return null;
  }

  if (!support.pushSupported) {
    warn(
      "Push no disponible: PushManager no soportado."
    );

    return null;
  }

  try {
    const registration =
      await navigator.serviceWorker.register(
        SERVICE_WORKER_PATH,
        {
          scope:
            SERVICE_WORKER_SCOPE
        }
      );

    log(
      "Service Worker registrado.",
      {
        scope:
          registration.scope,

        active:
          Boolean(
            registration.active
          ),

        waiting:
          Boolean(
            registration.waiting
          ),

        installing:
          Boolean(
            registration.installing
          )
      }
    );

    const readyRegistration =
      await navigator.serviceWorker.ready;

    log(
      "Service Worker listo.",
      {
        scope:
          readyRegistration.scope
      }
    );

    return readyRegistration;
  } catch (error) {
    warn(
      "No se pudo registrar o preparar el Service Worker.",
      error instanceof Error
        ? error.message
        : String(error)
    );

    return null;
  }
}

async function persistSubscription(params: {
  userId: string;
  subscription: PushSubscription;
}): Promise<boolean> {
  const serialized =
    params.subscription.toJSON();

  const endpoint =
    cleanText(
      serialized.endpoint
    );

  const p256dh =
    cleanText(
      serialized.keys?.p256dh
    );

  const auth =
    cleanText(
      serialized.keys?.auth
    );

  if (
    !endpoint ||
    !p256dh ||
    !auth
  ) {
    warn(
      "La suscripción obtenida del navegador está incompleta.",
      {
        endpoint:
          Boolean(endpoint),

        p256dh:
          Boolean(p256dh),

        auth:
          Boolean(auth)
      }
    );

    return false;
  }

  log(
    "Persistiendo suscripción.",
    {
      userId:
        params.userId,

      device:
        getDeviceLabel(),

      endpoint:
        `${endpoint.slice(
          0,
          70
        )}...`
    }
  );

  const {
    error
  } = await supabase
    .from(
      "livenos_push_subscriptions"
    )
    .upsert(
      {
        user_id:
          params.userId,

        endpoint,
        p256dh,
        auth,

        user_agent:
          navigator.userAgent,

        platform:
          getPlatform(),

        device_label:
          getDeviceLabel(),

        active:
          true,

        last_used_at:
          new Date().toISOString()
      },
      {
        onConflict:
          "endpoint"
      }
    );

  if (error) {
    warn(
      "No se pudo guardar la suscripción en livenos_push_subscriptions.",
      {
        message:
          error.message,

        code:
          error.code,

        details:
          error.details,

        hint:
          error.hint
      }
    );

    return false;
  }

  log(
    "Suscripción guardada correctamente."
  );

  return true;
}

export async function requestLiveNosPushPermission():
Promise<NotificationPermission | "unsupported"> {
  const support =
    getLiveNosPushSupport();

  log(
    "Solicitud de permiso iniciada.",
    support
  );

  if (
    !support.notificationsSupported
  ) {
    warn(
      "Notifications API no soportada."
    );

    return "unsupported";
  }

  if (
    Notification.permission ===
    "granted"
  ) {
    log(
      "El permiso ya estaba concedido."
    );

    return "granted";
  }

  if (
    Notification.permission ===
    "denied"
  ) {
    warn(
      "Las notificaciones están bloqueadas por el usuario o por el sistema."
    );

    return "denied";
  }

  try {
    const permission =
      await Notification.requestPermission();

    log(
      `Resultado del permiso: ${permission}.`
    );

    return permission;
  } catch (error) {
    warn(
      "Falló Notification.requestPermission().",
      error instanceof Error
        ? error.message
        : String(error)
    );

    return Notification.permission;
  }
}

export async function enableLiveNosPushNotifications(
  userId: string
): Promise<boolean> {
  const cleanUserId =
    cleanText(userId);

  if (!cleanUserId) {
    warn(
      "No se puede habilitar Push sin userId."
    );

    return false;
  }

  const permission =
    await requestLiveNosPushPermission();

  if (permission !== "granted") {
    warn(
      `No se habilita Push porque el permiso quedó en "${permission}".`
    );

    return false;
  }

  return synchronizeLiveNosPushSubscription(
    cleanUserId
  );
}

export async function synchronizeLiveNosPushSubscription(
  userId: string
): Promise<boolean> {
  const cleanUserId =
    cleanText(userId);

  const support =
    getLiveNosPushSupport();

  log(
    "Sincronización iniciada.",
    {
      userId:
        cleanUserId,

      ...support
    }
  );

  if (!cleanUserId) {
    warn(
      "Sincronización cancelada: falta userId."
    );

    return false;
  }

  if (
    !support.notificationsSupported
  ) {
    warn(
      "Sincronización cancelada: Notifications API no disponible."
    );

    return false;
  }

  if (
    Notification.permission !==
      "granted"
  ) {
    log(
      `Sincronización pendiente: permiso actual "${Notification.permission}".`
    );

    return false;
  }

  const vapidPublicKey =
    cleanText(
      import.meta.env
        .VITE_WEB_PUSH_PUBLIC_KEY
    );

  if (!vapidPublicKey) {
    warn(
      "Falta VITE_WEB_PUSH_PUBLIC_KEY."
    );

    return false;
  }

  log(
    "VAPID pública encontrada.",
    {
      length:
        vapidPublicKey.length
    }
  );

  const registration =
    await getReadyRegistration();

  if (!registration) {
    warn(
      "No se obtuvo un Service Worker listo."
    );

    return false;
  }

  try {
    let subscription =
      await registration.pushManager.getSubscription();

    if (subscription) {
      log(
        "El dispositivo ya tenía una PushSubscription.",
        {
          endpoint:
            `${subscription.endpoint.slice(
              0,
              70
            )}...`
        }
      );
    }

    if (!subscription) {
      log(
        "Creando una nueva PushSubscription."
      );

      subscription =
        await registration.pushManager.subscribe({
          userVisibleOnly: true,

          applicationServerKey:
            decodeVapidPublicKey(
              vapidPublicKey
            ) as BufferSource
        });

      log(
        "PushSubscription creada.",
        {
          endpoint:
            `${subscription.endpoint.slice(
              0,
              70
            )}...`
        }
      );
    }

    const persisted =
      await persistSubscription({
        userId:
          cleanUserId,

        subscription
      });

    log(
      `Sincronización finalizada: ${
        persisted
          ? "OK"
          : "ERROR"
      }.`
    );

    return persisted;
  } catch (error) {
    warn(
      "No se pudo crear o sincronizar la PushSubscription.",
      error instanceof Error
        ? {
            name:
              error.name,

            message:
              error.message,

            stack:
              error.stack
          }
        : String(error)
    );

    return false;
  }
}

export async function deactivateCurrentLiveNosPushSubscription(
  userId: string
): Promise<void> {
  const cleanUserId =
    cleanText(userId);

  if (
    !cleanUserId ||
    !(
      "serviceWorker" in
      navigator
    )
  ) {
    return;
  }

  try {
    const registration =
      await navigator.serviceWorker.ready;

    const subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      log(
        "No existe PushSubscription para desactivar."
      );

      return;
    }

    const {
      error
    } = await supabase
      .from(
        "livenos_push_subscriptions"
      )
      .update({
        active: false
      })
      .eq(
        "user_id",
        cleanUserId
      )
      .eq(
        "endpoint",
        subscription.endpoint
      );

    if (error) {
      warn(
        "No se pudo desactivar la suscripción.",
        error.message
      );

      return;
    }

    log(
      "Suscripción desactivada."
    );
  } catch (error) {
    warn(
      "Error desactivando Push durante el cierre de sesión.",
      error instanceof Error
        ? error.message
        : String(error)
    );
  }
}
