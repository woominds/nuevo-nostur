// src/modules/comunicaciones/notifications/LiveNosNotificationToast.tsx

import {
  useEffect
} from "react";

import {
  liveNosNotificationRuntime
} from "./liveNosNotificationRuntime";

import type {
  VisibleToast
} from "./liveNosNotificationTypes";

const TOAST_DURATION_MS = 7000;

type LiveNosNotificationToastProps = {
  toast: VisibleToast | null;
  pendingCount: number;
  onClose: () => void;
};

export function LiveNosNotificationToast(
  props: LiveNosNotificationToastProps
) {
  useEffect(() => {
    if (!props.toast) {
      return undefined;
    }

    const timer =
      window.setTimeout(
        props.onClose,
        TOAST_DURATION_MS
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    props.toast,
    props.onClose
  ]);

  if (!props.toast) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        top: 72,
        zIndex: 99999,
        width: 360,
        maxWidth:
          "calc(100vw - 32px)",
        overflow: "hidden",
        border:
          "1px solid rgba(15, 23, 42, 0.10)",
        borderRadius: 16,
        background:
          "rgba(255,255,255,0.98)",
        boxShadow:
          "0 20px 55px rgba(15, 23, 42, 0.20)",
        color: "#172033",
        backdropFilter:
          "blur(14px)"
      }}
    >
      <button
        type="button"
        onClick={() => {
          liveNosNotificationRuntime.openConversation(
            props.toast
              ?.conversationId,
            props.toast
              ?.messageId
          );

          props.onClose();
        }}
        style={{
          display: "block",
          width: "100%",
          padding:
            "16px 48px 16px 16px",
          border: 0,
          background:
            "transparent",
          color: "inherit",
          textAlign: "left",
          cursor: "pointer"
        }}
      >
        <div
          style={{
            marginBottom: 4,
            color: "#64748b",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing:
              "0.08em",
            textTransform:
              "uppercase"
          }}
        >
          {props.toast.subtitle}
        </div>

        <div
          style={{
            marginBottom: 5,
            fontSize: 14,
            fontWeight: 800,
            lineHeight: 1.3
          }}
        >
          {props.toast.title}
        </div>

        <div
          style={{
            color: "#475569",
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.45,
            wordBreak:
              "break-word"
          }}
        >
          {props.toast.body}
        </div>

        <div
          style={{
            marginTop: 9,
            color: "#4f7c90",
            fontSize: 11,
            fontWeight: 700
          }}
        >
          Abrir conversación
        </div>

        {props.pendingCount > 0 && (
          <div
            style={{
              marginTop: 8,
              color: "#64748b",
              fontSize: 11,
              fontWeight: 700
            }}
          >
            +{props.pendingCount} notificación
            {props.pendingCount === 1
              ? ""
              : "es"}{" "}
            pendiente
            {props.pendingCount === 1
              ? ""
              : "s"}
          </div>
        )}
      </button>

      <button
        type="button"
        aria-label="Cerrar notificación"
        onClick={props.onClose}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 28,
          height: 28,
          border:
            "1px solid rgba(15, 23, 42, 0.08)",
          borderRadius: 8,
          background: "#f8fafc",
          color: "#64748b",
          fontSize: 18,
          lineHeight: "24px",
          cursor: "pointer"
        }}
      >
        ×
      </button>
    </div>
  );
}

export default LiveNosNotificationToast;
