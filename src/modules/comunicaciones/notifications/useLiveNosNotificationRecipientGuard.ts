// src/modules/comunicaciones/notifications/useLiveNosNotificationRecipientGuard.ts

import {
  useCallback,
  type RefObject
} from "react";

import {
  canReceiveConversationNotification
} from "./liveNosNotificationRules";

import type {
  ConversationLite,
  NotificationProfileLite
} from "./liveNosNotificationTypes";

type UseLiveNosNotificationRecipientGuardParams = {
  currentUserIdRef:
    RefObject<string | null>;

  currentProfileRef:
    RefObject<
      NotificationProfileLite | null
    >;

  identityReady:
    () => Promise<void>;
};

export function useLiveNosNotificationRecipientGuard(
  params: UseLiveNosNotificationRecipientGuardParams
) {
  return useCallback(
    async (
      conversation:
        ConversationLite | null
    ): Promise<boolean> => {
      await params.identityReady();

      return canReceiveConversationNotification({
        conversation,

        currentUserId:
          params.currentUserIdRef.current,

        currentProfile:
          params.currentProfileRef.current
      });
    },
    [
      params.currentProfileRef,
      params.currentUserIdRef,
      params.identityReady
    ]
  );
}
