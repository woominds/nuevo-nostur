// src/components/GlobalWhatsappNotifications.tsx

import {
  LiveNosNotificationPermissionPrompt
} from "../modules/comunicaciones/notifications/LiveNosNotificationPermissionPrompt";

import {
  LiveNosNotificationToast
} from "../modules/comunicaciones/notifications/LiveNosNotificationToast";

import {
  useLiveNosNotificationDelivery
} from "../modules/comunicaciones/notifications/useLiveNosNotificationDelivery";

import {
  useLiveNosNotificationEventSources
} from "../modules/comunicaciones/notifications/useLiveNosNotificationEventSources";

import {
  useLiveNosNotificationIdentity
} from "../modules/comunicaciones/notifications/useLiveNosNotificationIdentity";

import {
  useLiveNosNotificationPermission
} from "../modules/comunicaciones/notifications/useLiveNosNotificationPermission";

import {
  useLiveNosNotificationPreferencesRealtime
} from "../modules/comunicaciones/notifications/useLiveNosNotificationPreferencesRealtime";

import {
  useLiveNosNotificationRecipientGuard
} from "../modules/comunicaciones/notifications/useLiveNosNotificationRecipientGuard";

import {
  useLiveNosNotificationRuntime
} from "../modules/comunicaciones/notifications/useLiveNosNotificationRuntime";

import {
  useLiveNosNotificationToastQueue
} from "../modules/comunicaciones/notifications/useLiveNosNotificationToastQueue";

export function GlobalWhatsappNotifications() {
  const {
    currentUserIdRef,
    currentProfileRef,
    notificationPreferencesRef,
    notificationIdentityReadyRef,
    loadNotificationIdentity
  } = useLiveNosNotificationIdentity();

  const {
    visibleToast,
    pendingCount,
    enqueueToast,
    closeVisibleToast,
    clearToasts
  } = useLiveNosNotificationToastQueue();

  const deliverNotification =
    useLiveNosNotificationDelivery({
      preferencesRef:
        notificationPreferencesRef,

      enqueueToast
    });

  const canReceiveNotification =
    useLiveNosNotificationRecipientGuard({
      currentUserIdRef,
      currentProfileRef,

      identityReady:
        loadNotificationIdentity
    });

  const {
    notificationPermission,
    showPermissionPrompt,
    requestingPermission,
    dismissPermissionPrompt,
    requestNotificationPermission
  } = useLiveNosNotificationPermission({
    currentUserIdRef,
    enqueueToast
  });

  useLiveNosNotificationRuntime({
    deliverNotification,
    loadNotificationIdentity,
    clearToasts,
    currentUserIdRef,
    currentProfileRef,
    notificationPreferencesRef,
    notificationIdentityReadyRef
  });

  useLiveNosNotificationPreferencesRealtime({
    currentUserIdRef,

    preferencesRef:
      notificationPreferencesRef,

    identityReady:
      loadNotificationIdentity
  });

  useLiveNosNotificationEventSources({
    currentUserIdRef,
    currentProfileRef,

    preferencesRef:
      notificationPreferencesRef,

    loadIdentity:
      loadNotificationIdentity,

    canReceiveNotification
  });

  return (
    <>
      <LiveNosNotificationPermissionPrompt
        visible={
          showPermissionPrompt &&
          notificationPermission ===
            "default"
        }
        requesting={
          requestingPermission
        }
        onDismiss={
          dismissPermissionPrompt
        }
        onActivate={() => {
          void requestNotificationPermission();
        }}
      />

      <LiveNosNotificationToast
        toast={visibleToast}
        pendingCount={
          pendingCount
        }
        onClose={
          closeVisibleToast
        }
      />
    </>
  );
}

export default GlobalWhatsappNotifications;
