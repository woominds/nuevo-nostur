// src/modules/comunicaciones/notifications/liveNosNotificationLogger.ts

const PREFIX =
  "[GlobalWhatsappNotifications]";

export function logLiveNosNotificationInfo(
  message: string,
  payload?: unknown
) {
  if (payload === undefined) {
    console.log(
      `${PREFIX} ${message}`
    );

    return;
  }

  console.log(
    `${PREFIX} ${message}`,
    payload
  );
}

export function logLiveNosNotificationWarning(
  message: string,
  payload?: unknown
) {
  if (payload === undefined) {
    console.warn(
      `${PREFIX} ${message}`
    );

    return;
  }

  console.warn(
    `${PREFIX} ${message}`,
    payload
  );
}

export function logLiveNosNotificationError(
  message: string,
  payload?: unknown
) {
  if (payload === undefined) {
    console.error(
      `${PREFIX} ${message}`
    );

    return;
  }

  console.error(
    `${PREFIX} ${message}`,
    payload
  );
}
