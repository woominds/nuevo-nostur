// src/modules/comunicaciones/notifications/liveNosIncomingMessageHandler.ts

import {
  liveNosNotificationBus
} from "./liveNosNotificationBus";

import {
  loadNotificationContext
} from "./liveNosNotificationQueries";

import {
  buildHandoffNotificationId,
  classifyNotification,
  cleanText,
  getConversationName,
  getMessagePreview,
  getNotificationCopy,
  shouldIgnoreMessage
} from "./liveNosNotificationRules";

import {
  liveNosNotificationRuntime
} from "./liveNosNotificationRuntime";

import type {
  ConversationLite,
  IncomingMessagePayload
} from "./liveNosNotificationTypes";

type LiveNosIncomingMessageHandlerParams = {
  isMounted: () => boolean;

  canReceiveNotification: (
    conversation: ConversationLite | null
  ) => Promise<boolean>;
};

export function createLiveNosIncomingMessageHandler(
  params: LiveNosIncomingMessageHandlerParams
) {
  return async function handleIncomingMessage(
    message: IncomingMessagePayload
  ): Promise<void> {
    if (
      !params.isMounted() ||
      shouldIgnoreMessage(message)
    ) {
      return;
    }

    if (
      !liveNosNotificationRuntime.isPrimaryTab()
    ) {
      return;
    }

    const conversationId =
      cleanText(
        message.conversacion_id
      );

    if (!conversationId) {
      return;
    }

    const context =
      await loadNotificationContext(
        conversationId
      );

    if (!params.isMounted()) {
      return;
    }

    const canReceive =
      await params.canReceiveNotification(
        context.conversation
      );

    if (!canReceive) {
      return;
    }

    const kind =
      classifyNotification(
        context
      );

    const notificationId =
      kind === "cande_transfer" &&
      context.opportunity
        ?.cande_handoff_requested_at
        ? buildHandoffNotificationId(
            context.opportunity
          )
        : `message:${message.id}`;

    if (
      !liveNosNotificationRuntime.markProcessed(
        notificationId
      )
    ) {
      return;
    }

    const passengerName =
      getConversationName(
        context.conversation
      );

    const preview =
      getMessagePreview(
        message
      );

    const copy =
      getNotificationCopy({
        kind,
        passengerName,
        preview
      });

    await liveNosNotificationBus.publish({
      id: notificationId,
      kind,

      source:
        kind === "cande_transfer"
          ? "cande"
          : "whatsapp",

      title: copy.title,
      body: copy.body,

      conversationId,
      messageId: message.id,
      createdAt:
        message.created_at
    });

    window.dispatchEvent(
      new CustomEvent(
        "nostur:global-whatsapp-message",
        {
          detail: {
            kind,
            conversation_id:
              conversationId,
            message_id:
              message.id
          }
        }
      )
    );
  };
}
