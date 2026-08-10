// supabase/functions/livenos-send-push/index.ts

import {
  createClient
} from "npm:@supabase/supabase-js@2";

import webpush from "npm:web-push@3.6.7";

import {
  resolvePushRecipientUserIds,
  type LiveNosPushSource
} from "./recipients.ts";

type PushRequestBody = {
  id: string;
  source: LiveNosPushSource;
  title: string;
  body: string;
  conversationId?: string;
  messageId?: string;
  opportunityId?: string;
  budgetId?: string;
  assignedUserId?: string;
  recipientUserIds?: string[];
  excludedUserIds?: string[];
  url?: string;
  requireInteraction?: boolean;
};

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS"
};

function jsonResponse(
  body: unknown,
  status = 200
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json"
      }
    }
  );
}

function cleanText(
  value: unknown
): string {
  return String(
    value || ""
  ).trim();
}

function getRequiredEnv(
  name: string
): string {
  const value = cleanText(
    Deno.env.get(name)
  );

  if (!value) {
    throw new Error(
      `Falta configurar ${name}.`
    );
  }

  return value;
}

function validateBody(
  body: PushRequestBody
) {
  if (!cleanText(body.id)) {
    throw new Error(
      "Falta id del evento."
    );
  }

  if (!cleanText(body.source)) {
    throw new Error(
      "Falta source del evento."
    );
  }

  if (!cleanText(body.title)) {
    throw new Error(
      "Falta title."
    );
  }

  if (!cleanText(body.body)) {
    throw new Error(
      "Falta body."
    );
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(
      "ok",
      {
        headers: corsHeaders
      }
    );
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        ok: false,
        error:
          "Método no permitido."
      },
      405
    );
  }

  try {
    const supabaseUrl =
      getRequiredEnv(
        "SUPABASE_URL"
      );

    const serviceRoleKey =
      getRequiredEnv(
        "SUPABASE_SERVICE_ROLE_KEY"
      );

    const vapidPublicKey =
      getRequiredEnv(
        "WEB_PUSH_VAPID_PUBLIC_KEY"
      );

    const vapidPrivateKey =
      getRequiredEnv(
        "WEB_PUSH_VAPID_PRIVATE_KEY"
      );

    const vapidSubject =
      getRequiredEnv(
        "WEB_PUSH_SUBJECT"
      );

    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    const payload =
      await request.json() as PushRequestBody;

    validateBody(payload);

    const supabase =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );

    const recipientUserIds =
      await resolvePushRecipientUserIds({
        supabase,
        source: payload.source,
        conversationId:
          payload.conversationId,
        explicitUserIds:
          payload.recipientUserIds,
        assignedUserId:
          payload.assignedUserId,
        excludedUserIds:
          payload.excludedUserIds
      });

    if (
      recipientUserIds.length === 0
    ) {
      return jsonResponse({
        ok: true,
        sent: 0,
        failed: 0,
        recipients: 0,
        reason:
          "Sin destinatarios habilitados."
      });
    }

    const {
      data,
      error
    } = await supabase
      .from(
        "livenos_push_subscriptions"
      )
      .select(
        [
          "id",
          "user_id",
          "endpoint",
          "p256dh",
          "auth"
        ].join(",")
      )
      .in(
        "user_id",
        recipientUserIds
      )
      .eq(
        "active",
        true
      );

    if (error) {
      throw new Error(
        `No se pudieron cargar suscripciones: ${error.message}`
      );
    }

    const subscriptions =
      (
        data || []
      ) as PushSubscriptionRow[];

    const pushPayload =
      JSON.stringify({
        id: payload.id,
        title: payload.title,
        body: payload.body,
        source: payload.source,
        conversationId:
          payload.conversationId ||
          "",
        messageId:
          payload.messageId ||
          "",
        opportunityId:
          payload.opportunityId ||
          "",
        budgetId:
          payload.budgetId ||
          "",
        url:
          payload.url ||
          "/",
        requireInteraction:
          payload.requireInteraction ===
          true
      });

    let sent = 0;
    let failed = 0;

    const invalidSubscriptionIds:
      string[] = [];

    const results =
      await Promise.allSettled(
        subscriptions.map(
          async (
            subscription
          ) => {
            try {
              await webpush.sendNotification(
                {
                  endpoint:
                    subscription.endpoint,

                  keys: {
                    p256dh:
                      subscription.p256dh,

                    auth:
                      subscription.auth
                  }
                },
                pushPayload,
                {
                  TTL: 60 * 60,
                  urgency: "high",
                  topic:
                    payload.id.slice(
                      0,
                      32
                    )
                }
              );

              sent += 1;
            } catch (error) {
              failed += 1;

              const statusCode =
                typeof error ===
                  "object" &&
                error !== null &&
                "statusCode" in error
                  ? Number(
                      (
                        error as {
                          statusCode?: unknown;
                        }
                      ).statusCode
                    )
                  : 0;

              if (
                statusCode === 404 ||
                statusCode === 410
              ) {
                invalidSubscriptionIds.push(
                  subscription.id
                );
              }

              console.warn(
                "[livenos-send-push] Falló una suscripción.",
                {
                  subscriptionId:
                    subscription.id,
                  userId:
                    subscription.user_id,
                  statusCode,
                  message:
                    error instanceof Error
                      ? error.message
                      : String(error)
                }
              );
            }
          }
        )
      );

    for (const result of results) {
      if (
        result.status ===
        "rejected"
      ) {
        console.warn(
          "[livenos-send-push] Envío rechazado.",
          result.reason
        );
      }
    }

    if (
      invalidSubscriptionIds.length >
      0
    ) {
      const {
        error:
          deactivateError
      } = await supabase
        .from(
          "livenos_push_subscriptions"
        )
        .update({
          active: false
        })
        .in(
          "id",
          invalidSubscriptionIds
        );

      if (deactivateError) {
        console.warn(
          "[livenos-send-push] No se pudieron desactivar suscripciones inválidas.",
          deactivateError.message
        );
      }
    }

    return jsonResponse({
      ok: true,
      sent,
      failed,
      recipients:
        recipientUserIds.length,
      subscriptions:
        subscriptions.length,
      deactivated:
        invalidSubscriptionIds.length
    });
  } catch (error) {
    console.error(
      "[livenos-send-push] Error general.",
      error
    );

    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : String(error)
      },
      500
    );
  }
});
