// src/modules/comunicaciones/notifications/useLiveNosNotificationEventSources.ts

import {
  useEffect,
  type MutableRefObject
} from "react";

import {
  LIVE_NOS_POLLING_INTERVAL_MS
} from "./liveNosNotificationConfig";

import {
  createLiveNosBudgetHandler
} from "./liveNosBudgetHandler";

import {
  createLiveNosIncomingMessageHandler
} from "./liveNosIncomingMessageHandler";

import {
  createLiveNosInternalMessageHandler
} from "./liveNosInternalMessageHandler";

import {
  createLiveNosOpportunityHandlers
} from "./liveNosOpportunityHandler";

import {
  logLiveNosNotificationInfo,
  logLiveNosNotificationWarning
} from "./liveNosNotificationLogger";

import {
  fetchRecentLiveNosInboundMessages,
  fetchRecentLiveNosInternalNotes
} from "./liveNosNotificationPollingService";

import {
  subscribeToLiveNosNotificationRealtime
} from "./liveNosNotificationRealtimeService";

import {
  liveNosNotificationRuntime
} from "./liveNosNotificationRuntime";

import type {
  ConversationLite,
  LiveNosNotificationPreferences,
  NotificationProfileLite
} from "./liveNosNotificationTypes";

type UseLiveNosNotificationEventSourcesParams = {
  currentUserIdRef:
    MutableRefObject<string | null>;

  currentProfileRef:
    MutableRefObject<
      NotificationProfileLite | null
    >;

  preferencesRef:
    MutableRefObject<
      LiveNosNotificationPreferences
    >;

  loadIdentity:
    () => Promise<void>;

  canReceiveNotification:
    (
      conversation:
        ConversationLite | null
    ) => Promise<boolean>;
};

export function useLiveNosNotificationEventSources(
  params: UseLiveNosNotificationEventSourcesParams
) {
  useEffect(() => {
    let mounted = true;

    let pollingTimer:
      | number
      | null = null;

    let messagePollingCursor =
      new Date(
        Date.now() - 5000
      ).toISOString();

    let notePollingCursor =
      new Date(
        Date.now() - 5000
      ).toISOString();

    const isMounted =
      () => mounted;

    const handleIncomingMessage =
      createLiveNosIncomingMessageHandler({
        isMounted,

        canReceiveNotification:
          params.canReceiveNotification
      });

    const handleInternalNote =
      createLiveNosInternalMessageHandler({
        isMounted,

        loadIdentity:
          params.loadIdentity,

        getCurrentUserId:
          () =>
            params.currentUserIdRef.current,

        canReceiveNotification:
          params.canReceiveNotification
      });

    const handlePresupuestoBusinessChange =
      createLiveNosBudgetHandler({
        isMounted,

        loadIdentity:
          params.loadIdentity,

        getCurrentUserId:
          () =>
            params.currentUserIdRef.current,

        getCurrentProfile:
          () =>
            params.currentProfileRef.current,

        getPreferences:
          () =>
            params.preferencesRef.current
      });

    const {
      handleOpportunityBusinessChange,
      handleOpportunityChange
    } = createLiveNosOpportunityHandlers({
      isMounted,

      loadIdentity:
        params.loadIdentity,

      getCurrentUserId:
        () =>
          params.currentUserIdRef.current,

      getCurrentProfile:
        () =>
          params.currentProfileRef.current,

      getPreferences:
        () =>
          params.preferencesRef.current,

      canReceiveConversationNotification:
        params.canReceiveNotification
    });

    async function pollRecentInboundMessages() {
      if (
        !mounted ||
        !liveNosNotificationRuntime.isPrimaryTab()
      ) {
        return;
      }

      const result =
        await fetchRecentLiveNosInboundMessages(
          messagePollingCursor
        );

      if (result.error) {
        logLiveNosNotificationWarning(
          "Polling mensajes falló",
          result.error
        );

        return;
      }

      messagePollingCursor =
        result.nextCursor;

      for (
        const message of
        result.messages
      ) {
        if (!mounted) {
          return;
        }

        await handleIncomingMessage(
          message
        );
      }
    }

    async function pollRecentInternalNotes() {
      if (
        !mounted ||
        !liveNosNotificationRuntime.isPrimaryTab()
      ) {
        return;
      }

      const result =
        await fetchRecentLiveNosInternalNotes(
          notePollingCursor
        );

      if (result.error) {
        logLiveNosNotificationWarning(
          "Polling mensajes internos falló",
          result.error
        );

        return;
      }

      notePollingCursor =
        result.nextCursor;

      for (
        const note of
        result.notes
      ) {
        if (!mounted) {
          return;
        }

        await handleInternalNote(
          note
        );
      }
    }

    pollingTimer =
      window.setInterval(
        () => {
          void pollRecentInboundMessages();
          void pollRecentInternalNotes();
        },
        LIVE_NOS_POLLING_INTERVAL_MS
      );

    void pollRecentInboundMessages();
    void pollRecentInternalNotes();

    const unsubscribeRealtime =
      subscribeToLiveNosNotificationRealtime({
        onIncomingMessage:
          handleIncomingMessage,

        onInternalNote:
          handleInternalNote,

        onPresupuestoInsert:
          (presupuesto) =>
            handlePresupuestoBusinessChange({
              old: null,
              next: presupuesto,
              eventType: "INSERT"
            }),

        onPresupuestoUpdate:
          (
            previous,
            next
          ) =>
            handlePresupuestoBusinessChange({
              old: previous,
              next,
              eventType: "UPDATE"
            }),

        onOpportunityInsert:
          (opportunity) =>
            handleOpportunityBusinessChange({
              old: null,
              next: opportunity,
              eventType: "INSERT"
            }),

        onOpportunityUpdate:
          (
            previous,
            next
          ) => {
            void handleOpportunityChange(
              next
            );

            return handleOpportunityBusinessChange({
              old: previous,
              next,
              eventType: "UPDATE"
            });
          },

        onStatusChange:
          (status) => {
            logLiveNosNotificationInfo(
              `Realtime status: ${status}`
            );
          }
      });

    return () => {
      mounted = false;

      if (pollingTimer) {
        window.clearInterval(
          pollingTimer
        );
      }

      unsubscribeRealtime();
    };
  }, [
    params.canReceiveNotification,
    params.currentProfileRef,
    params.currentUserIdRef,
    params.loadIdentity,
    params.preferencesRef
  ]);
}
