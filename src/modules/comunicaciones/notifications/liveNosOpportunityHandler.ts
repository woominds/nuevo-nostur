// src/modules/comunicaciones/notifications/liveNosOpportunityHandler.ts

import {
  liveNosNotificationBus
} from "./liveNosNotificationBus";

import {
  loadNotificationContext,
  loadPipelineState
} from "./liveNosNotificationQueries";

import {
  buildHandoffNotificationId,
  buildOpportunityNotificationId,
  canReceiveOpportunityNotification,
  cleanText,
  getConversationName,
  getNotificationCopy,
  getOpportunityDestination,
  getOpportunityPassengerName
} from "./liveNosNotificationRules";

import {
  liveNosNotificationRuntime
} from "./liveNosNotificationRuntime";

import type {
  NotificationProfileLite,
  OpportunityLite,
  OpportunityRealtimePayload
} from "./liveNosNotificationTypes";

type LiveNosOpportunityHandlerParams = {
  isMounted: () => boolean;

  loadIdentity: () => Promise<void>;

  getCurrentUserId: () => string | null;

  getCurrentProfile: () => NotificationProfileLite | null;

  getPreferences: () => {
    opportunities_enabled: boolean;
  };

  canReceiveConversationNotification: (
    conversation: Awaited<
      ReturnType<typeof loadNotificationContext>
    >["conversation"]
  ) => Promise<boolean>;
};

export function createLiveNosOpportunityHandlers(
  params: LiveNosOpportunityHandlerParams
) {
  async function handleOpportunityBusinessChange(
    payload: OpportunityRealtimePayload
  ): Promise<void> {
    const opportunity =
      payload.next;

    if (
      !params.isMounted() ||
      !opportunity.id ||
      !liveNosNotificationRuntime.isPrimaryTab()
    ) {
      return;
    }

    await params.loadIdentity();

    const preferences =
      params.getPreferences();

    if (
      !preferences.opportunities_enabled
    ) {
      return;
    }

    const currentUserId =
      params.getCurrentUserId();

    const canReceive =
      canReceiveOpportunityNotification({
        opportunity,
        currentUserId,
        currentProfile:
          params.getCurrentProfile()
      });

    if (!canReceive) {
      return;
    }

    const wasCreated =
      payload.eventType === "INSERT";

    const wasAssigned =
      payload.eventType === "UPDATE" &&
      cleanText(
        payload.old?.assigned_to
      ) !==
        cleanText(
          opportunity.assigned_to
        ) &&
      cleanText(
        opportunity.assigned_to
      ) === currentUserId;

    const stateChanged =
      payload.eventType === "UPDATE" &&
      cleanText(
        payload.old?.estado_id
      ) !==
        cleanText(
          opportunity.estado_id
        );

    if (
      !wasCreated &&
      !wasAssigned &&
      !stateChanged
    ) {
      return;
    }

    const conversationId =
      cleanText(
        opportunity.conversacion_id
      );

    const context =
      conversationId
        ? await loadNotificationContext(
            conversationId
          )
        : {
            conversation: null,
            opportunity
          };

    if (!params.isMounted()) {
      return;
    }

    const passengerName =
      getOpportunityPassengerName(
        opportunity,
        context.conversation
      );

    const destination =
      getOpportunityDestination(
        opportunity
      );

    if (wasCreated) {
      const notificationId =
        buildOpportunityNotificationId({
          opportunity,
          reason: "created"
        });

      if (
        !liveNosNotificationRuntime.markProcessed(
          notificationId
        )
      ) {
        return;
      }

      await liveNosNotificationBus.publish({
        id: notificationId,
        kind: "gestion",
        source: "opportunity",
        opportunityId:
          opportunity.id,

        title:
          `Nueva oportunidad · ${passengerName}`,

        body:
          destination
            ? `Destino: ${destination}. Revisá la oportunidad comercial.`
            : "Revisá la nueva oportunidad comercial.",

        conversationId:
          conversationId ||
          undefined,

        createdAt:
          opportunity.created_at
      });

      window.dispatchEvent(
        new CustomEvent(
          "nostur:global-opportunity-notification",
          {
            detail: {
              reason: "created",
              oportunidad_id:
                opportunity.id,
              conversation_id:
                conversationId ||
                null
            }
          }
        )
      );

      return;
    }

    if (wasAssigned) {
      const notificationId =
        buildOpportunityNotificationId({
          opportunity,
          reason: "assigned"
        });

      if (
        !liveNosNotificationRuntime.markProcessed(
          notificationId
        )
      ) {
        return;
      }

      await liveNosNotificationBus.publish({
        id: notificationId,
        kind: "gestion",
        source: "opportunity",
        opportunityId:
          opportunity.id,

        title:
          `Oportunidad asignada · ${passengerName}`,

        body:
          destination
            ? `Te asignaron una oportunidad para ${destination}.`
            : "Te asignaron una nueva oportunidad comercial.",

        conversationId:
          conversationId ||
          undefined,

        createdAt:
          opportunity.updated_at
      });

      window.dispatchEvent(
        new CustomEvent(
          "nostur:global-opportunity-notification",
          {
            detail: {
              reason: "assigned",
              oportunidad_id:
                opportunity.id,
              conversation_id:
                conversationId ||
                null
            }
          }
        )
      );

      return;
    }

    if (!stateChanged) {
      return;
    }

    const [
      previousState,
      nextState
    ] = await Promise.all([
      loadPipelineState(
        payload.old?.estado_id
      ),
      loadPipelineState(
        opportunity.estado_id
      )
    ]);

    if (!params.isMounted()) {
      return;
    }

    const previousName =
      cleanText(
        previousState?.nombre
      ) ||
      "estado anterior";

    const nextName =
      cleanText(
        nextState?.nombre
      ) ||
      "nuevo estado";

    const notificationId =
      buildOpportunityNotificationId({
        opportunity,
        reason: "state"
      });

    if (
      !liveNosNotificationRuntime.markProcessed(
        notificationId
      )
    ) {
      return;
    }

    await liveNosNotificationBus.publish({
      id: notificationId,
      kind: "gestion",
      source: "opportunity",
      opportunityId:
        opportunity.id,

      title:
        `Oportunidad actualizada · ${passengerName}`,

      body:
        `${previousName} → ${nextName}`,

      conversationId:
        conversationId ||
        undefined,

      createdAt:
        opportunity.updated_at
    });

    window.dispatchEvent(
      new CustomEvent(
        "nostur:global-opportunity-notification",
        {
          detail: {
            reason: "state",
            oportunidad_id:
              opportunity.id,
            conversation_id:
              conversationId ||
              null,
            previous_state:
              previousName,
            next_state:
              nextName
          }
        }
      )
    );
  }

  async function handleOpportunityChange(
    opportunity: OpportunityLite
  ): Promise<void> {
    if (
      !params.isMounted() ||
      !opportunity.id ||
      !opportunity.cande_handoff_requested_at
    ) {
      return;
    }

    if (
      !liveNosNotificationRuntime.isPrimaryTab()
    ) {
      return;
    }

    const handoffTime =
      new Date(
        opportunity.cande_handoff_requested_at
      ).getTime();

    if (
      !Number.isFinite(
        handoffTime
      ) ||
      Date.now() -
        handoffTime >
        120_000
    ) {
      return;
    }

    const conversationId =
      cleanText(
        opportunity.conversacion_id
      );

    if (!conversationId) {
      return;
    }

    const notificationId =
      buildHandoffNotificationId(
        opportunity
      );

    const context =
      await loadNotificationContext(
        conversationId
      );

    if (!params.isMounted()) {
      return;
    }

    const canReceive =
      await params.canReceiveConversationNotification(
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

    const passengerName =
      getConversationName(
        context.conversation
      );

    const copy =
      getNotificationCopy({
        kind:
          "cande_transfer",

        passengerName,

        preview:
          "CANDE derivó esta conversación al equipo."
      });

    await liveNosNotificationBus.publish({
      id:
        notificationId,

      kind:
        "cande_transfer",

      source:
        "cande",

      opportunityId:
        opportunity.id,

      title:
        copy.title,

      body:
        copy.body,

      conversationId,

      createdAt:
        opportunity.cande_handoff_requested_at
    });

    window.dispatchEvent(
      new CustomEvent(
        "nostur:cande-handoff",
        {
          detail: {
            conversation_id:
              conversationId,

            oportunidad_id:
              opportunity.id
          }
        }
      )
    );
  }

  return {
    handleOpportunityBusinessChange,
    handleOpportunityChange
  };
}
