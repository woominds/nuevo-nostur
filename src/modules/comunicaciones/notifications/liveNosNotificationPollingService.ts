// src/modules/comunicaciones/notifications/liveNosNotificationPollingService.ts

import {
  supabase
} from "../../../lib/supabase";

import {
  addOverlapToCursor,
  getLatestCreatedAt
} from "./liveNosNotificationRules";

import type {
  IncomingMessagePayload,
  InternalNotePayload
} from "./liveNosNotificationTypes";

export type LiveNosInboundPollingResult = {
  messages: IncomingMessagePayload[];
  nextCursor: string;
  error: string | null;
};

export type LiveNosInternalPollingResult = {
  notes: InternalNotePayload[];
  nextCursor: string;
  error: string | null;
};

export async function fetchRecentLiveNosInboundMessages(
  currentCursor: string
): Promise<LiveNosInboundPollingResult> {
  const cursor =
    addOverlapToCursor(
      currentCursor
    );

  try {
    const {
      data,
      error
    } = await supabase
      .from("mensajes")
      .select(
        [
          "id",
          "conversacion_id",
          "direction",
          "sender_kind",
          "type",
          "text",
          "created_at",
          "wa_timestamp"
        ].join(",")
      )
      .eq(
        "direction",
        "in"
      )
      .gte(
        "created_at",
        cursor
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      )
      .limit(50);

    if (error) {
      return {
        messages: [],
        nextCursor:
          currentCursor,
        error:
          error.message
      };
    }

    const messages =
      (
        data ??
        []
      ) as unknown as IncomingMessagePayload[];

    const latestCreatedAt =
      getLatestCreatedAt(
        messages,
        (message) =>
          message.created_at ||
          message.wa_timestamp
      );

    return {
      messages,
      nextCursor:
        latestCreatedAt ||
        currentCursor,
      error: null
    };
  } catch (error) {
    return {
      messages: [],
      nextCursor:
        currentCursor,
      error:
        error instanceof Error
          ? error.message
          : String(error)
    };
  }
}

export async function fetchRecentLiveNosInternalNotes(
  currentCursor: string
): Promise<LiveNosInternalPollingResult> {
  const cursor =
    addOverlapToCursor(
      currentCursor
    );

  try {
    const {
      data,
      error
    } = await supabase
      .from(
        "notas_conversacion"
      )
      .select(
        [
          "id",
          "conversacion_id",
          "autor_id",
          "contenido",
          "tipo",
          "created_at"
        ].join(",")
      )
      .eq(
        "tipo",
        "mensaje_interno"
      )
      .gte(
        "created_at",
        cursor
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      )
      .limit(50);

    if (error) {
      return {
        notes: [],
        nextCursor:
          currentCursor,
        error:
          error.message
      };
    }

    const notes =
      (
        data ??
        []
      ) as unknown as InternalNotePayload[];

    const latestCreatedAt =
      getLatestCreatedAt(
        notes,
        (note) =>
          note.created_at
      );

    return {
      notes,
      nextCursor:
        latestCreatedAt ||
        currentCursor,
      error: null
    };
  } catch (error) {
    return {
      notes: [],
      nextCursor:
        currentCursor,
      error:
        error instanceof Error
          ? error.message
          : String(error)
    };
  }
}
