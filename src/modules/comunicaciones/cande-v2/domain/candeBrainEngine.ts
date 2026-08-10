// src/modules/comunicaciones/cande-v2/domain/candeBrainEngine.ts

import {
  buildMemoryAwareResponseDecision
} from "./candeConversationMemory";

import {
  normalizeCandeBrainState,
  type CandeRawAnalysis
} from "./candeBrainNormalizer";

import type {
  CandeBrainInput,
  CandeBrainResult,
  CandeBrainState,
  CandeHandoffReason,
  CandeNiaSignal,
  CandeOperationalMode,
  CandeResponseDecision,
  CandeTravelField
} from "./candeBrain.types";

type RunCandeBrainParams = {
  input: CandeBrainInput;

  rawAnalysis:
    CandeRawAnalysis;

  conversationId:
    string | null;

  opportunityId:
    string | null;

  customerId:
    string | null;

  lastAnalyzedMessageId:
    string | null;

  model?: string | null;

  promptVersion?: string | null;

  analyzedAt?: string;
};

function buildSilentDecision(
  handoffReason:
    CandeHandoffReason = null
): CandeResponseDecision {
  return {
    shouldRespond: false,
    responseObjective:
      "remain_silent",
    recommendedNextQuestion:
      null,
    proposedResponse:
      null,
    shouldHandoff:
      handoffReason !== null,
    handoffReason
  };
}

function resolveOperationalMode(
  currentMode:
    CandeOperationalMode,
  responseDecision:
    CandeResponseDecision
): CandeOperationalMode {
  if (
    currentMode === "disabled" ||
    currentMode === "paused"
  ) {
    return currentMode;
  }

  if (
    responseDecision.shouldHandoff
  ) {
    return "handed_off";
  }

  if (
    currentMode === "handed_off"
  ) {
    return "handed_off";
  }

  if (
    currentMode === "observing"
  ) {
    return "observing";
  }

  return "responding";
}

function enforceOperationalMode(
  params: {
    operationalMode:
      CandeOperationalMode;

    responseDecision:
      CandeResponseDecision;
  }
): CandeResponseDecision {
  if (
    params.operationalMode ===
      "disabled" ||
    params.operationalMode ===
      "paused" ||
    params.operationalMode ===
      "observing"
  ) {
    return buildSilentDecision(
      params.responseDecision
        .handoffReason
    );
  }

  if (
    params.operationalMode ===
    "handed_off"
  ) {
    return {
      ...buildSilentDecision(
        params.responseDecision
          .handoffReason
      ),

      shouldHandoff:
        params.responseDecision
          .shouldHandoff,

      handoffReason:
        params.responseDecision
          .handoffReason
    };
  }

  return params.responseDecision;
}

function buildHandoffSignal(
  state:
    CandeBrainState
): CandeNiaSignal | null {
  if (
    !state.responseDecision
      .shouldHandoff
  ) {
    return null;
  }

  const reason =
    state.responseDecision
      .handoffReason;

  if (
    reason ===
    "human_requested" ||
    reason ===
    "ai_detected"
  ) {
    return {
      type:
        "human_requested",

      priority:
        "urgent",

      title:
        "El pasajero solicita atención humana",

      summary:
        reason ===
        "ai_detected"
          ? "El pasajero detectó o cuestionó la atención automatizada y debe intervenir una persona."
          : "El pasajero pidió explícitamente hablar con una persona del equipo.",

      recommendedAction:
        "Tomar la conversación y continuar con el contexto ya relevado por CANDE.",

      metadata: {
        handoffReason:
          reason,

        commercialScore:
          state
            .commercialEvaluation
            .commercialScore
      }
    };
  }

  if (
    reason === "urgency"
  ) {
    return {
      type:
        "urgency",

      priority:
        "urgent",

      title:
        "Consulta urgente",

      summary:
        "CANDE detectó una situación que requiere intervención rápida del equipo.",

      recommendedAction:
        "Revisar y tomar la conversación inmediatamente.",

      metadata: {
        handoffReason:
          reason,

        urgencyScore:
          state
            .commercialEvaluation
            .urgencyScore
      }
    };
  }

  if (
    reason === "emergency"
  ) {
    return {
      type:
        "emergency",

      priority:
        "critical",

      title:
        "Posible emergencia",

      summary:
        "CANDE detectó una posible emergencia vinculada con el viaje.",

      recommendedAction:
        "Intervenir de inmediato y verificar la situación con el pasajero.",

      metadata: {
        handoffReason:
          reason
      }
    };
  }

  if (
    reason === "post_sale"
  ) {
    return {
      type:
        "post_sale",

      priority:
        "urgent",

      title:
        "Consulta de postventa",

      summary:
        "El pasajero necesita asistencia sobre una operación o viaje ya contratado.",

      recommendedAction:
        "Derivar al responsable de postventa con prioridad.",

      metadata: {
        handoffReason:
          reason
      }
    };
  }

  if (
    reason ===
      "score_threshold" ||
    reason ===
      "commercial_judgement"
  ) {
    return {
      type:
        "hot_opportunity",

      priority:
        "high",

      title:
        "Oportunidad lista para intervención comercial",

      summary:
        `La oportunidad alcanzó un score comercial de ${
          state
            .commercialEvaluation
            .commercialScore
        }%.`,

      recommendedAction:
        "Tomar la conversación, revisar el Perfil del Viajero y comenzar la cotización.",

      metadata: {
        handoffReason:
          reason,

        commercialScore:
          state
            .commercialEvaluation
            .commercialScore,

        temperature:
          state
            .commercialEvaluation
            .temperature
      }
    };
  }

  return null;
}

function mergeNiaSignals(
  currentSignals:
    CandeNiaSignal[],
  handoffSignal:
    CandeNiaSignal | null
): CandeNiaSignal[] {
  if (!handoffSignal) {
    return currentSignals;
  }

  const alreadyExists =
    currentSignals.some(
      (signal) =>
        signal.type ===
          handoffSignal.type &&
        signal.metadata
          .handoffReason ===
          handoffSignal.metadata
            .handoffReason
    );

  if (alreadyExists) {
    return currentSignals;
  }

  return [
    ...currentSignals,
    handoffSignal
  ];
}

function buildOpportunityFields(
  fields:
    CandeTravelField[]
): Record<string, unknown> {
  return fields.reduce<
    Record<string, unknown>
  >(
    (
      output,
      field
    ) => {
      output[field.key] = {
        value:
          field.value,

        status:
          field.status,

        source:
          field.source,

        confidence:
          field.confidence,

        sourceMessageId:
          field.sourceMessageId,

        passengerConfirmed:
          field.passengerConfirmed,

        manuallyEdited:
          field.manuallyEdited,

        updatedAt:
          field.updatedAt
      };

      return output;
    },
    {}
  );
}

function buildOpportunityPatch(
  state:
    CandeBrainState
): Record<string, unknown> {
  return {
    candeV2: {
      version:
        state.version,

      operationalMode:
        state.operationalMode,

      passengerUnderstanding:
        state.passengerUnderstanding,

      fields:
        buildOpportunityFields(
          state.knownFields
        ),

      missingRelevantFields:
        state
          .missingRelevantFields,

      contradictions:
        state.contradictions,

      departureInference:
        state
          .departureInference,

      commercialEvaluation:
        state
          .commercialEvaluation,

      responseDecision: {
        shouldHandoff:
          state
            .responseDecision
            .shouldHandoff,

        handoffReason:
          state
            .responseDecision
            .handoffReason,

        responseObjective:
          state
            .responseDecision
            .responseObjective
      },

      lastAnalyzedMessageId:
        state
          .lastAnalyzedMessageId,

      analyzedAt:
        state.analyzedAt
    },

    score:
      state
        .commercialEvaluation
        .commercialScore,

    temperature:
      state
        .commercialEvaluation
        .temperature
  };
}

function buildWarnings(
  state:
    CandeBrainState
): string[] {
  const warnings:
    string[] = [];

  if (
    state.contradictions.length >
    0
  ) {
    warnings.push(
      `Se detectaron ${state.contradictions.length} contradicciones que requieren revisión.`
    );
  }

  if (
    state.responseDecision
      .shouldHandoff &&
    !state.responseDecision
      .handoffReason
  ) {
    warnings.push(
      "Se solicitó derivación sin un motivo estructurado."
    );
  }

  if (
    state.operationalMode ===
      "handed_off" &&
    state.responseDecision
      .shouldRespond
  ) {
    warnings.push(
      "CANDE estaba derivada e intentó responder. La respuesta fue bloqueada."
    );
  }

  if (
    state.commercialEvaluation
      .aiConfidenceScore <
      40
  ) {
    warnings.push(
      "El análisis tiene una confianza de IA baja."
    );
  }

  return warnings;
}

export function runCandeBrain(
  params:
    RunCandeBrainParams
): CandeBrainResult {
  const normalizedState =
    normalizeCandeBrainState({
      configuration:
        params.input
          .configuration,

      currentState:
        params.input
          .currentState,

      rawAnalysis:
        params.rawAnalysis,

      conversationId:
        params.conversationId,

      opportunityId:
        params.opportunityId,

      customerId:
        params.customerId,

      lastAnalyzedMessageId:
        params
          .lastAnalyzedMessageId,

      analyzedAt:
        params.analyzedAt
    });

  const memoryDecision =
    buildMemoryAwareResponseDecision({
      state:
        normalizedState,

      conversation:
        params.input
          .conversation,

      knownFields:
        normalizedState
          .knownFields,

      priorityFields:
        params.input
          .configuration
          .priorityFields
    });

  const analysisDecision =
    normalizedState
      .responseDecision;

  const combinedDecision:
    CandeResponseDecision =
      analysisDecision.shouldHandoff
        ? analysisDecision
        : {
            ...memoryDecision,

            proposedResponse:
              analysisDecision
                .proposedResponse ||
              memoryDecision
                .proposedResponse,

            recommendedNextQuestion:
              analysisDecision
                .recommendedNextQuestion ||
              memoryDecision
                .recommendedNextQuestion,

            responseObjective:
              analysisDecision
                .responseObjective !==
              "remain_silent"
                ? analysisDecision
                    .responseObjective
                : memoryDecision
                    .responseObjective,

            shouldRespond:
              analysisDecision
                .shouldRespond ||
              memoryDecision
                .shouldRespond
          };

  const nextOperationalMode =
    resolveOperationalMode(
      params.input
        .operationalMode,
      combinedDecision
    );

  const safeResponseDecision =
    enforceOperationalMode({
      operationalMode:
        nextOperationalMode,

      responseDecision:
        combinedDecision
    });

  const stateWithDecision:
    CandeBrainState = {
      ...normalizedState,

      operationalMode:
        nextOperationalMode,

      responseDecision:
        safeResponseDecision
    };

  const handoffSignal =
    buildHandoffSignal(
      stateWithDecision
    );

  const finalState:
    CandeBrainState = {
      ...stateWithDecision,

      niaSignals:
        mergeNiaSignals(
          stateWithDecision
            .niaSignals,
          handoffSignal
        )
    };

  return {
    state:
      finalState,

    opportunityPatch:
      buildOpportunityPatch(
        finalState
      ),

    audit: {
      inputMessageIds:
        params.input
          .conversation
          .map(
            (message) =>
              message.id
          ),

      model:
        params.model ||
        null,

      promptVersion:
        params.promptVersion ||
        null,

      warnings:
        buildWarnings(
          finalState
        )
    }
  };
}
