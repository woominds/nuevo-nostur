// src/modules/comunicaciones/notifications/useLiveNosNotificationDelivery.ts

import {
  useCallback,
  type RefObject
} from "react";

import {
  liveNosNotificationRuntime
} from "./liveNosNotificationRuntime";

import {
  isConversationCurrentlyVisible,
  isInsideDoNotDisturb,
  isNotificationKindEnabled,
  shouldShowInternalToast,
  shouldShowSystemNotification
} from "./liveNosNotificationRules";

import type {
  LiveNosNotificationEvent
} from "./liveNosNotificationBus";

import type {
  LiveNosNotificationPreferences,
  VisibleToast
} from "./liveNosNotificationTypes";

type UseLiveNosNotificationDeliveryParams = {
  preferencesRef:
    RefObject<LiveNosNotificationPreferences>;

  enqueueToast: (
    toast: VisibleToast
  ) => void;
};

export function useLiveNosNotificationDelivery(
  params: UseLiveNosNotificationDeliveryParams
) {
  return useCallback(
    async (
      event: LiveNosNotificationEvent
    ) => {
      if (
        isConversationCurrentlyVisible(
          event.conversationId
        )
      ) {
        return;
      }

      const preferences =
        params.preferencesRef.current;

      if (!preferences) {
        return;
      }

      if (
        !isNotificationKindEnabled(
          event.kind,
          preferences
        )
      ) {
        return;
      }

      const doNotDisturb =
        isInsideDoNotDisturb(
          preferences
        );

      if (
        preferences.sound_enabled &&
        !doNotDisturb
      ) {
        await liveNosNotificationRuntime.playSound(
          event.kind
        );
      }

      if (
        preferences.system_notification_enabled &&
        !doNotDisturb &&
        shouldShowSystemNotification()
      ) {
        await liveNosNotificationRuntime.showSystemNotification(
          {
            id: event.id,
            kind: event.kind,
            title: event.title,
            body: event.body,
            conversationId:
              event.conversationId,
            messageId:
              event.messageId
          }
        );
      }

      if (
        preferences.toast_enabled &&
        shouldShowInternalToast()
      ) {
        params.enqueueToast({
          id: event.id,
          title: event.title,
          subtitle: "LiveNos",
          body: event.body,
          conversationId:
            event.conversationId,
          messageId:
            event.messageId,
          createdAt:
            event.createdAt ||
            new Date().toISOString()
        });
      }
    },
    [
      params.enqueueToast,
      params.preferencesRef
    ]
  );
}
