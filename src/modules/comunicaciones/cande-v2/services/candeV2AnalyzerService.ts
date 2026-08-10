// src/modules/comunicaciones/cande-v2/services/candeV2AnalyzerService.ts

import {
  supabase,
} from "../../../../lib/supabase";

import type {
  CandeBrainState,
  CandeConversationMessage,
  CandeRawAnalysis,
} from "../domain";

export type AnalyzeCandeV2Input = {
  conversation:
    CandeConversationMessage[];

  currentState:
    CandeBrainState | null;

  opportunityData?:
    Record<string, unknown>;

  manualOpportunityData?:
    Record<string, unknown>;

  phone?:
    string | null;

  areaCodeInference?:
    Record<string, unknown> | null;

  simulation?:
    boolean;
};

export type AnalyzeCandeV2Result = {
  analysis:
    CandeRawAnalysis;

  metadata: {
    model:
      string | null;

    promptVersion:
      string | null;

    simulation:
      boolean;

    analyzedAt:
      string;
  };
};

type AnalyzeFunctionResponse = {
  analysis?:
    CandeRawAnalysis;

  metadata?: {
    model?: unknown;
    promptVersion?: unknown;
    simulation?: unknown;
    analyzedAt?: unknown;
  };

  error?:
    unknown;
};

function readNullableString(
  value: unknown,
): string | null {
  return typeof value ===
    "string" &&
    value.trim()
    ? value.trim()
    : null;
}

export async function analyzeCandeV2(
  input:
    AnalyzeCandeV2Input,
): Promise<AnalyzeCandeV2Result> {
  if (
    input.conversation
      .length === 0
  ) {
    throw new Error(
      "La conversación está vacía.",
    );
  }

  const {
    data,
    error,
  } =
    await supabase.functions
      .invoke(
        "cande-v2-analyze",
        {
          body: {
            conversation:
              input.conversation,

            currentState:
              input.currentState,

            opportunityData:
              input
                .opportunityData ||
              {},

            manualOpportunityData:
              input
                .manualOpportunityData ||
              {},

            phone:
              input.phone ||
              null,

            areaCodeInference:
              input
                .areaCodeInference ||
              null,

            simulation:
              Boolean(
                input.simulation,
              ),
          },
        },
      );

  if (error) {
    throw new Error(
      error.message ||
      "No se pudo ejecutar el análisis de CANDE 2.0.",
    );
  }

  const response =
    (
      data || {}
    ) as AnalyzeFunctionResponse;

  if (response.error) {
    throw new Error(
      String(
        response.error,
      ),
    );
  }

  if (!response.analysis) {
    throw new Error(
      "La función no devolvió el análisis de CANDE.",
    );
  }

  return {
    analysis:
      response.analysis,

    metadata: {
      model:
        readNullableString(
          response
            .metadata
            ?.model,
        ),

      promptVersion:
        readNullableString(
          response
            .metadata
            ?.promptVersion,
        ),

      simulation:
        Boolean(
          response
            .metadata
            ?.simulation,
        ),

      analyzedAt:
        readNullableString(
          response
            .metadata
            ?.analyzedAt,
        ) ||
        new Date()
          .toISOString(),
    },
  };
}
