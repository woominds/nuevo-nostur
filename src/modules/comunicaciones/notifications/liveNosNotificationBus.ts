// src/modules/comunicaciones/notifications/liveNosNotificationBus.ts

import type {
  LiveNosNotificationKind
} from "./liveNosNotificationRuntime";

export type LiveNosNotificationSource =
  | "whatsapp"
  | "internal"
  | "cande"
  | "opportunity"
  | "budget"
  | "system";

export type LiveNosNotificationEvent = {
  id: string;
  kind: LiveNosNotificationKind;
  source: LiveNosNotificationSource;
  title: string;
  body: string;
  conversationId?: string;
  messageId?: string;
  opportunityId?: string;
  budgetId?: string;
  createdAt?: string | null;
  metadata?: Record<string, unknown>;
};

export type LiveNosNotificationListener = (
  event: LiveNosNotificationEvent
) => void | Promise<void>;

class LiveNosNotificationBus {
  private readonly listeners =
    new Set<LiveNosNotificationListener>();

  subscribe(
    listener: LiveNosNotificationListener
  ): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  async publish(
    event: LiveNosNotificationEvent
  ): Promise<void> {
    if (
      !event.id ||
      !event.title ||
      !event.body
    ) {
      console.warn(
        "[LiveNosNotificationBus] Evento inválido descartado.",
        event
      );

      return;
    }

    const listeners =
      Array.from(this.listeners);

    if (listeners.length === 0) {
      console.warn(
        "[LiveNosNotificationBus] Evento sin consumidores.",
        {
          id: event.id,
          source: event.source
        }
      );

      return;
    }

    const results =
      await Promise.allSettled(
        listeners.map(
          (listener) =>
            listener(event)
        )
      );

    for (const result of results) {
      if (
        result.status ===
        "rejected"
      ) {
        console.warn(
          "[LiveNosNotificationBus] Un consumidor falló.",
          result.reason
        );
      }
    }
  }

  clear() {
    this.listeners.clear();
  }

  getSubscriberCount(): number {
    return this.listeners.size;
  }
}

export const liveNosNotificationBus =
  new LiveNosNotificationBus();
