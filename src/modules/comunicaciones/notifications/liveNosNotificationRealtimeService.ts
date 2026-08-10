// src/modules/comunicaciones/notifications/liveNosNotificationRealtimeService.ts

import {
  supabase
} from "../../../lib/supabase";

import type {
  IncomingMessagePayload,
  InternalNotePayload,
  OpportunityLite,
  PresupuestoRealtimeRow
} from "./liveNosNotificationTypes";

type LiveNosNotificationRealtimeHandlers = {
  onIncomingMessage: (
    message: IncomingMessagePayload
  ) => void | Promise<void>;

  onInternalNote: (
    note: InternalNotePayload
  ) => void | Promise<void>;

  onOpportunityInsert: (
    opportunity: OpportunityLite
  ) => void | Promise<void>;

  onOpportunityUpdate: (
    previous: OpportunityLite,
    next: OpportunityLite
  ) => void | Promise<void>;

  onPresupuestoInsert: (
    presupuesto: PresupuestoRealtimeRow
  ) => void | Promise<void>;

  onPresupuestoUpdate: (
    previous: PresupuestoRealtimeRow,
    next: PresupuestoRealtimeRow
  ) => void | Promise<void>;

  onStatusChange?: (
    status: string
  ) => void;
};

export function subscribeToLiveNosNotificationRealtime(
  handlers: LiveNosNotificationRealtimeHandlers
): () => void {
  const channel = supabase
    .channel(
      `global-livenos-notifications-${Date.now()}`
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "mensajes"
      },
      (payload) => {
        void handlers.onIncomingMessage(
          payload.new as IncomingMessagePayload
        );
      }
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notas_conversacion"
      },
      (payload) => {
        void handlers.onInternalNote(
          payload.new as InternalNotePayload
        );
      }
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "presupuestos_v3"
      },
      (payload) => {
        void handlers.onPresupuestoInsert(
          payload.new as PresupuestoRealtimeRow
        );
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "presupuestos_v3"
      },
      (payload) => {
        void handlers.onPresupuestoUpdate(
          payload.old as PresupuestoRealtimeRow,
          payload.new as PresupuestoRealtimeRow
        );
      }
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "lead_oportunidades"
      },
      (payload) => {
        void handlers.onOpportunityInsert(
          payload.new as OpportunityLite
        );
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "lead_oportunidades"
      },
      (payload) => {
        void handlers.onOpportunityUpdate(
          payload.old as OpportunityLite,
          payload.new as OpportunityLite
        );
      }
    )
    .subscribe((status) => {
      handlers.onStatusChange?.(
        status
      );
    });

  return () => {
    void supabase.removeChannel(
      channel
    );
  };
}
