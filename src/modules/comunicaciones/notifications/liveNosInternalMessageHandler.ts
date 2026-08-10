// src/modules/comunicaciones/notifications/liveNosInternalMessageHandler.ts

import {
  liveNosNotificationBus
} from "./liveNosNotificationBus";

import {
  loadNotificationAuthorName,
  loadNotificationContext
} from "./liveNosNotificationQueries";

import {
  cleanText,
  getConversationName,
  getNotificationCopy,
  truncateText
} from "./liveNosNotificationRules";

import {
  liveNosNotificationRuntime
} from "./liveNosNotificationRuntime";

import type {
  ConversationLite,
  InternalNotePayload
} from "./liveNosNotificationTypes";

type LiveNosInternalMessageHandlerParams = {
  isMounted: () => boolean;

  loadIdentity: () => Promise<void>;

  getCurrentUserId: () => string | null;

  canReceiveNotification: (
    conversation: ConversationLite | null
  ) => Promise<boolean>;
};

export function createLiveNosInternalMessageHandler(
  params: LiveNosInternalMessageHandlerParams
) {
  return async function handleInternalNote(
    note: InternalNotePayload
  ): Promise<void> {
    if (
      !params.isMounted() ||
      cleanText(
        note.tipo
      ).toLowerCase() !==
        "mensaje_interno" ||
      !note.id ||
      !note.conversacion_id
    ) {
      return;
    }

    if (
      !liveNosNotificationRuntime.isPrimaryTab()
    ) {
      return;
    }

    await params.loadIdentity();

    const currentUserId =
      params.getCurrentUserId();

    if (
      currentUserId &&
      note.autor_id ===
        currentUserId
    ) {
      return;
    }

    const notificationId =
      `internal:${note.id}`;

    const conversationId =
      cleanText(
        note.conversacion_id
      );

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

    if (
      !liveNosNotificationRuntime.markProcessed(
        notificationId
      )
    ) {
      return;
    }

    const authorName =
      await loadNotificationAuthorName(
        note.autor_id
      );

    if (!params.isMounted()) {
      return;
    }

    const passengerName =
      getConversationName(
        context.conversation
      );

    const preview =
      truncateText(
        cleanText(
          note.contenido
        ) ||
          "Nuevo mensaje interno"
      );

    const copy =
      getNotificationCopy({
        kind: "internal",
        passengerName,
        preview:
          `${authorName}: ${preview}`
      });

    await liveNosNotificationBus.publish({
      id: notificationId,
      kind: "internal",
      source: "internal",
      title: copy.title,
      body: copy.body,
      conversationId,
      messageId: note.id,
      createdAt:
        note.created_at
    });

    window.dispatchEvent(
      new CustomEvent(
        "nostur:global-internal-message",
        {
          detail: {
            kind: "internal",
            conversation_id:
              conversationId,
            note_id:
              note.id
          }
        }
      )
    );
  };
}
