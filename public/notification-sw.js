const DEFAULT_ICON =
  "/brand/NOSSTOUR_favicon_256_transparente.png";

const DEFAULT_BADGE =
  "/brand/NOSSTOUR_favicon_256_transparente.png";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data
      ? event.data.json()
      : {};
  } catch {
    payload = {
      body: event.data
        ? event.data.text()
        : ""
    };
  }

  const title =
    payload.title ||
    "Nuevo mensaje en LiveNos";

  const body =
    payload.body ||
    "Tenés una nueva conversación para revisar.";

  const conversationId =
    payload.conversationId ||
    payload.conversation_id ||
    "";

  const messageId =
    payload.messageId ||
    payload.message_id ||
    "";

  const notificationId =
    payload.id ||
    payload.notificationId ||
    [
      "livenos",
      conversationId,
      messageId,
      Date.now()
    ].join(":");

  const options = {
    body,
    icon:
      payload.icon ||
      DEFAULT_ICON,
    badge:
      payload.badge ||
      DEFAULT_BADGE,
    tag: notificationId,
    silent: true,
    requireInteraction:
      payload.requireInteraction === true,
    data: {
      notificationId,
      conversationId,
      messageId,
      url:
        payload.url ||
        "/"
    }
  };

  event.waitUntil(
    self.registration
      .getNotifications({
        tag: notificationId
      })
      .then((notifications) => {
        for (const notification of notifications) {
          notification.close();
        }

        return self.registration.showNotification(
          title,
          options
        );
      })
  );
});

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const data =
      event.notification.data ||
      {};

    const conversationId =
      data.conversationId ||
      "";

    const messageId =
      data.messageId ||
      "";

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then(async (clients) => {
          const visibleClient =
            clients.find(
              (client) =>
                client.visibilityState ===
                "visible"
            );

          const targetClient =
            visibleClient ||
            clients[0] ||
            null;

          if (targetClient) {
            await targetClient.focus();

            targetClient.postMessage({
              type:
                "nostur:open-livenos-conversation",
              conversationId,
              messageId
            });

            return;
          }

          if (!self.clients.openWindow) {
            return;
          }

          const url = new URL(
            data.url || "/",
            self.location.origin
          );

          if (conversationId) {
            url.searchParams.set(
              "livenosConversation",
              conversationId
            );
          }

          if (messageId) {
            url.searchParams.set(
              "livenosMessage",
              messageId
            );
          }

          await self.clients.openWindow(
            url.toString()
          );
        })
    );
  }
);

self.addEventListener(
  "message",
  (event) => {
    if (
      event.data?.type ===
      "nostur:skip-waiting"
    ) {
      self.skipWaiting();
    }

    if (
      event.data?.type ===
      "nostur:close-notification"
    ) {
      const notificationId =
        event.data.notificationId ||
        "";

      if (!notificationId) {
        return;
      }

      event.waitUntil(
        self.registration
          .getNotifications({
            tag: notificationId
          })
          .then((notifications) => {
            for (const notification of notifications) {
              notification.close();
            }
          })
      );
    }
  }
);
