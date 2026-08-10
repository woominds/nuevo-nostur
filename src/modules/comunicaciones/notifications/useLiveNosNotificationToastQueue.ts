// src/modules/comunicaciones/notifications/useLiveNosNotificationToastQueue.ts

import {
  useCallback,
  useMemo,
  useState
} from "react";

import {
  LIVE_NOS_MAX_TOASTS
} from "./liveNosNotificationConfig";

import type {
  VisibleToast
} from "./liveNosNotificationTypes";

type UseLiveNosNotificationToastQueueResult = {
  visibleToast: VisibleToast | null;
  pendingCount: number;
  enqueueToast: (
    toast: VisibleToast
  ) => void;
  closeVisibleToast: () => void;
  clearToasts: () => void;
};

export function useLiveNosNotificationToastQueue():
UseLiveNosNotificationToastQueueResult {
  const [
    toastQueue,
    setToastQueue
  ] = useState<VisibleToast[]>([]);

  const visibleToast =
    toastQueue[0] || null;

  const pendingCount =
    useMemo(
      () =>
        Math.max(
          toastQueue.length - 1,
          0
        ),
      [
        toastQueue.length
      ]
    );

  const closeVisibleToast =
    useCallback(() => {
      setToastQueue(
        (current) =>
          current.slice(1)
      );
    }, []);

  const clearToasts =
    useCallback(() => {
      setToastQueue([]);
    }, []);

  const enqueueToast =
    useCallback(
      (
        toast: VisibleToast
      ) => {
        setToastQueue(
          (current) => {
            if (
              current.some(
                (
                  currentToast
                ) =>
                  currentToast.id ===
                  toast.id
              )
            ) {
              return current;
            }

            return [
              ...current,
              toast
            ].slice(
              -LIVE_NOS_MAX_TOASTS
            );
          }
        );
      },
      []
    );

  return {
    visibleToast,
    pendingCount,
    enqueueToast,
    closeVisibleToast,
    clearToasts
  };
}
