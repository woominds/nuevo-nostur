// src/modules/comunicaciones/notifications/liveNosBudgetHandler.ts

import {
  liveNosNotificationBus
} from "./liveNosNotificationBus";

import {
  buildPresupuestoNotificationId,
  canReceivePresupuestoNotification,
  cleanText,
  getPresupuestoDisplayName
} from "./liveNosNotificationRules";

import {
  liveNosNotificationRuntime
} from "./liveNosNotificationRuntime";

import type {
  LiveNosNotificationPreferences,
  NotificationProfileLite,
  PresupuestoRealtimePayload
} from "./liveNosNotificationTypes";

type LiveNosBudgetHandlerParams = {
  isMounted: () => boolean;

  loadIdentity: () => Promise<void>;

  getCurrentUserId: () => string | null;

  getCurrentProfile: () => NotificationProfileLite | null;

  getPreferences: () => LiveNosNotificationPreferences;
};

export function createLiveNosBudgetHandler(
  params: LiveNosBudgetHandlerParams
) {
  return async function handlePresupuestoBusinessChange(
    payload: PresupuestoRealtimePayload
  ): Promise<void> {
    const presupuesto =
      payload.next;

    if (
      !params.isMounted() ||
      !presupuesto.id ||
      presupuesto.activo === false ||
      !liveNosNotificationRuntime.isPrimaryTab()
    ) {
      return;
    }

    await params.loadIdentity();

    const preferences =
      params.getPreferences();

    if (
      !preferences.budgets_enabled
    ) {
      return;
    }

    const currentUserId =
      params.getCurrentUserId();

    const canReceive =
      canReceivePresupuestoNotification({
        presupuesto,
        currentUserId,
        currentProfile:
          params.getCurrentProfile()
      });

    if (!canReceive) {
      return;
    }

    const previousSellerId =
      cleanText(
        payload.old?.vendedor_id
      );

    const nextSellerId =
      cleanText(
        presupuesto.vendedor_id
      );

    const assignedToCurrentUser =
      payload.eventType === "UPDATE" &&
      previousSellerId !==
        nextSellerId &&
      nextSellerId ===
        currentUserId &&
      cleanText(
        presupuesto.creado_por
      ) !==
        currentUserId;

    const previousStatus =
      cleanText(
        payload.old?.estado
      ).toLowerCase();

    const nextStatus =
      cleanText(
        presupuesto.estado
      ).toLowerCase();

    const becameCompleted =
      payload.eventType === "UPDATE" &&
      previousStatus !==
        "completed" &&
      nextStatus ===
        "completed";

    if (
      !assignedToCurrentUser &&
      !becameCompleted
    ) {
      return;
    }

    const passengerName =
      getPresupuestoDisplayName(
        presupuesto
      );

    const destination =
      cleanText(
        presupuesto.destino
      );

    if (
      assignedToCurrentUser
    ) {
      const notificationId =
        buildPresupuestoNotificationId({
          presupuesto,
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
        id:
          notificationId,

        kind:
          "gestion",

        source:
          "budget",

        budgetId:
          presupuesto.id,

        title:
          `Presupuesto asignado · ${passengerName}`,

        body:
          destination
            ? `Te asignaron un presupuesto para ${destination}.`
            : "Te asignaron un nuevo presupuesto.",

        createdAt:
          presupuesto.updated_at
      });

      window.dispatchEvent(
        new CustomEvent(
          "nostur:global-budget-notification",
          {
            detail: {
              reason:
                "assigned",

              presupuesto_id:
                presupuesto.id
            }
          }
        )
      );

      return;
    }

    const notificationId =
      buildPresupuestoNotificationId({
        presupuesto,
        reason: "completed"
      });

    if (
      !liveNosNotificationRuntime.markProcessed(
        notificationId
      )
    ) {
      return;
    }

    await liveNosNotificationBus.publish({
      id:
        notificationId,

      kind:
        "gestion",

      source:
        "budget",

      budgetId:
        presupuesto.id,

      title:
        `Presupuesto finalizado · ${passengerName}`,

      body:
        destination
          ? `El presupuesto para ${destination} quedó listo para enviar.`
          : "El presupuesto quedó listo para enviar.",

      createdAt:
        presupuesto.updated_at
    });

    window.dispatchEvent(
      new CustomEvent(
        "nostur:global-budget-notification",
        {
          detail: {
            reason:
              "completed",

            presupuesto_id:
              presupuesto.id
          }
        }
      )
    );
  };
}
