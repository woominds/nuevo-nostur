// src/modules/comunicaciones/notifications/LiveNosNotificationPermissionPrompt.tsx

type LiveNosNotificationPermissionPromptProps = {
  visible: boolean;
  requesting: boolean;
  onDismiss: () => void;
  onActivate: () => void;
};

export function LiveNosNotificationPermissionPrompt(
  props: LiveNosNotificationPermissionPromptProps
) {
  if (!props.visible) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 99998,
        width: 380,
        maxWidth: "calc(100vw - 32px)",
        padding: 16,
        border:
          "1px solid rgba(15, 23, 42, 0.10)",
        borderRadius: 14,
        background:
          "rgba(255, 255, 255, 0.98)",
        boxShadow:
          "0 20px 55px rgba(15, 23, 42, 0.18)",
        color: "#172033",
        backdropFilter: "blur(14px)"
      }}
    >
      <div
        style={{
          marginBottom: 5,
          fontSize: 14,
          fontWeight: 800,
          lineHeight: 1.3
        }}
      >
        Activar notificaciones de LiveNos
      </div>

      <div
        style={{
          marginBottom: 14,
          color: "#64748b",
          fontSize: 12,
          fontWeight: 500,
          lineHeight: 1.5
        }}
      >
        Recibí avisos visuales de macOS o Windows
        cuando lleguen nuevos mensajes y NOSTUR esté
        abierto en segundo plano.
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8
        }}
      >
        <button
          type="button"
          onClick={props.onDismiss}
          disabled={props.requesting}
          style={{
            minHeight: 34,
            padding: "0 12px",
            border:
              "1px solid rgba(15, 23, 42, 0.10)",
            borderRadius: 8,
            background: "#ffffff",
            color: "#64748b",
            fontSize: 12,
            fontWeight: 700,
            cursor: props.requesting
              ? "default"
              : "pointer"
          }}
        >
          Más tarde
        </button>

        <button
          type="button"
          onClick={props.onActivate}
          disabled={props.requesting}
          style={{
            minHeight: 34,
            padding: "0 14px",
            border: 0,
            borderRadius: 8,
            background: "#ff634a",
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 800,
            cursor: props.requesting
              ? "wait"
              : "pointer",
            opacity: props.requesting
              ? 0.72
              : 1
          }}
        >
          {props.requesting
            ? "Activando..."
            : "Activar"}
        </button>
      </div>
    </div>
  );
}

export default LiveNosNotificationPermissionPrompt;
