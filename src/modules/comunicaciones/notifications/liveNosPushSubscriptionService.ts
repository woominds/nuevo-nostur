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

async function getReadyRegistration():
Promise<ServiceWorkerRegistration | null> {
  if (
    !window.isSecureContext ||
    !(
      "serviceWorker" in
      navigator
    ) ||
    !(
      "PushManager" in
      window
    )
  ) {
    return null;
  }

  try {
    await navigator.serviceWorker.register(
      SERVICE_WORKER_PATH,
      {
        scope:
          SERVICE_WORKER_SCOPE
      }
    );

    return await navigator.serviceWorker.ready;
  } catch {
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
    return false;
  }

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

        active: true,

        last_used_at:
          new Date().toISOString()
      },
      {
        onConflict:
          "endpoint"
      }
    );

  if (error) {
    console.warn(
      "[LiveNosPush] No se pudo guardar la suscripción.",
      error.message
    );

    return false;
  }

  return true;
}

export async function synchronizeLiveNosPushSubscription(
  userId: string
): Promise<boolean> {
  const cleanUserId =
    cleanText(userId);

  if (
    !cleanUserId ||
    !(
      "Notification" in
      window
    ) ||
    Notification.permission !==
      "granted"
  ) {
    return false;
  }

  const vapidPublicKey =
    cleanText(
      import.meta.env
        .VITE_WEB_PUSH_PUBLIC_KEY
    );

  if (!vapidPublicKey) {
    console.info(
      "[LiveNosPush] Falta VITE_WEB_PUSH_PUBLIC_KEY. La suscripción push queda pendiente."
    );

    return false;
  }

  const registration =
    await getReadyRegistration();

  if (!registration) {
    return false;
  }

  try {
    let subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription =
        await registration.pushManager.subscribe({
          userVisibleOnly: true,

          applicationServerKey:
            decodeVapidPublicKey(
              vapidPublicKey
            ) as BufferSource
        });
    }

    return await persistSubscription({
      userId:
        cleanUserId,

      subscription
    });
  } catch (error) {
    console.warn(
      "[LiveNosPush] No se pudo crear la suscripción.",
      error instanceof Error
        ? error.message
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
      return;
    }

    await supabase
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
  } catch {
    // No bloquear el cierre de sesión si el navegador no permite acceder.
  }
}
