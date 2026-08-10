// src/modules/comunicaciones/cande-v2/domain/candeBrainNormalizer.ts

import type {
  CandeBrainConfiguration,
  CandeBrainState,
  CandeCommercialEvaluation,
  CandeDetectedContradiction,
  CandeFieldStatus,
  CandeKnowledgeSource,
  CandePassengerUnderstanding,
  CandeResponseDecision,
  CandeTemperature,
  CandeTravelField,
  CandeTravelFieldKey
} from "./candeBrain.types";

export type CandeRawDetectedField = {
  key: CandeTravelFieldKey;
  value: unknown;
  confidence?: number;
  sourceMessageId?: string | null;
  passengerConfirmed?: boolean;
};

export type CandeRawAnalysis = {
  passengerUnderstanding?: Partial<
    CandePassengerUnderstanding
  >;

  detectedFields?: CandeRawDetectedField[];

  commercialEvaluation?: Partial<
    Omit<
      CandeCommercialEvaluation,
      "temperature"
    >
  >;

  responseDecision?: Partial<
    CandeResponseDecision
  >;

  contradictions?: Array<{
    field: CandeTravelFieldKey;
    detectedValue: unknown;
    explanation?: string;
    sourceMessageId?: string | null;
  }>;

  niaSignals?: CandeBrainState["niaSignals"];
};

type NormalizeCandeBrainStateParams = {
  configuration: CandeBrainConfiguration;

  currentState: CandeBrainState | null;

  rawAnalysis: CandeRawAnalysis;

  conversationId: string | null;
  opportunityId: string | null;
  customerId: string | null;

  lastAnalyzedMessageId: string | null;
  analyzedAt?: string;
};

const DEFAULT_PASSENGER_UNDERSTANDING:
  CandePassengerUnderstanding = {
    summary: "",
    travelMotivation: null,
    desiredExperience: null,
    emotionalContext: null,
    mainConcern: null,
    purchaseUrgency: null,
    priceSensitivity: "unknown",
    understandingScore: 0
  };

const DEFAULT_COMMERCIAL_EVALUATION:
  CandeCommercialEvaluation = {
    commercialScore: 0,
    purchaseProbability: 0,
    dataQualityScore: 0,
    understandingScore: 0,
    aiConfidenceScore: 0,
    urgencyScore: 0,
    abandonmentRiskScore: 0,
    temperature: "cold",
    scoreReasoning: []
  };

const DEFAULT_RESPONSE_DECISION:
  CandeResponseDecision = {
    shouldRespond: false,
    responseObjective: "remain_silent",
    recommendedNextQuestion: null,
    proposedResponse: null,
    shouldHandoff: false,
    handoffReason: null
  };

function clampScore(
  value: unknown
): number {
  const numericValue =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(numericValue)
    )
  );
}

function normalizeConfidence(
  value: unknown
): number {
  const numericValue =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  const normalizedValue =
    numericValue > 1
      ? numericValue / 100
      : numericValue;

  return Math.max(
    0,
    Math.min(
      1,
      normalizedValue
    )
  );
}

function hasMeaningfulValue(
  value: unknown
): boolean {
  if (
    value === null ||
    value === undefined
  ) {
    return false;
  }

  if (
    typeof value === "string"
  ) {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

function areValuesEqual(
  firstValue: unknown,
  secondValue: unknown
): boolean {
  try {
    return (
      JSON.stringify(firstValue) ===
      JSON.stringify(secondValue)
    );
  } catch {
    return (
      String(firstValue) ===
      String(secondValue)
    );
  }
}

function getTemperature(
  score: number,
  configuration:
    CandeBrainConfiguration
): CandeTemperature {
  const {
    warmMinimum,
    hotMinimum
  } =
    configuration.temperatureThresholds;

  if (score >= hotMinimum) {
    return "hot";
  }

  if (score >= warmMinimum) {
    return "warm";
  }

  return "cold";
}

function getFieldPriority(
  field: CandeTravelField
): number {
  if (
    field.status ===
      "manually_confirmed" ||
    field.manuallyEdited
  ) {
    return 5;
  }

  if (
    field.status === "confirmed" ||
    field.passengerConfirmed
  ) {
    return 4;
  }

  if (
    field.status === "detected"
  ) {
    return 3;
  }

  if (
    field.status === "inferred"
  ) {
    return 2;
  }

  return 1;
}

function getDetectedFieldStatus(
  field: CandeRawDetectedField
): CandeFieldStatus {
  if (field.passengerConfirmed) {
    return "confirmed";
  }

  return "detected";
}

function getDetectedFieldSource(
  field: CandeRawDetectedField
): CandeKnowledgeSource {
  if (field.passengerConfirmed) {
    return "passenger_confirmed";
  }

  return "conversation";
}

function buildDetectedField(
  field: CandeRawDetectedField,
  analyzedAt: string
): CandeTravelField {
  return {
    key: field.key,
    value: field.value,
    status:
      getDetectedFieldStatus(field),
    source:
      getDetectedFieldSource(field),
    confidence:
      normalizeConfidence(
        field.confidence
      ),
    sourceMessageId:
      field.sourceMessageId || null,
    passengerConfirmed:
      Boolean(
        field.passengerConfirmed
      ),
    manuallyEdited: false,
    updatedAt: analyzedAt
  };
}

function mergeDetectedFields(
  currentFields: CandeTravelField[],
  detectedFields: CandeRawDetectedField[],
  analyzedAt: string
): {
  fields: CandeTravelField[];
  contradictions:
    CandeDetectedContradiction[];
} {
  const fieldsByKey =
    new Map<
      CandeTravelFieldKey,
      CandeTravelField
    >();

  for (
    const field of currentFields
  ) {
    fieldsByKey.set(
      field.key,
      field
    );
  }

  const contradictions:
    CandeDetectedContradiction[] = [];

  for (
    const detectedField of
      detectedFields
  ) {
    if (
      !hasMeaningfulValue(
        detectedField.value
      )
    ) {
      continue;
    }

    const currentField =
      fieldsByKey.get(
        detectedField.key
      );

    const nextField =
      buildDetectedField(
        detectedField,
        analyzedAt
      );

    if (!currentField) {
      fieldsByKey.set(
        detectedField.key,
        nextField
      );

      continue;
    }

    if (
      areValuesEqual(
        currentField.value,
        nextField.value
      )
    ) {
      fieldsByKey.set(
        detectedField.key,
        {
          ...currentField,
          confidence:
            Math.max(
              currentField.confidence,
              nextField.confidence
            ),
          passengerConfirmed:
            currentField.passengerConfirmed ||
            nextField.passengerConfirmed,
          status:
            currentField.passengerConfirmed ||
            nextField.passengerConfirmed
              ? "confirmed"
              : currentField.status,
          sourceMessageId:
            nextField.sourceMessageId ||
            currentField.sourceMessageId,
          updatedAt: analyzedAt
        }
      );

      continue;
    }

    const currentPriority =
      getFieldPriority(
        currentField
      );

    const nextPriority =
      getFieldPriority(
        nextField
      );

    if (
      currentPriority >= 4 &&
      nextPriority < currentPriority
    ) {
      contradictions.push({
        field:
          detectedField.key,
        currentValue:
          currentField.value,
        detectedValue:
          nextField.value,
        sourceMessageId:
          nextField.sourceMessageId,
        explanation:
          "El nuevo valor contradice un dato manual o confirmado y no fue aplicado automáticamente."
      });

      continue;
    }

    if (
      nextPriority < currentPriority &&
      nextField.confidence <=
        currentField.confidence
    ) {
      continue;
    }

    fieldsByKey.set(
      detectedField.key,
      nextField
    );
  }

  return {
    fields:
      Array.from(
        fieldsByKey.values()
      ),

    contradictions
  };
}

function normalizePassengerUnderstanding(
  current:
    CandePassengerUnderstanding | null,
  raw:
    CandeRawAnalysis["passengerUnderstanding"]
): CandePassengerUnderstanding {
  const base =
    current ||
    DEFAULT_PASSENGER_UNDERSTANDING;

  const priceSensitivity =
    raw?.priceSensitivity;

  return {
    summary:
      raw?.summary?.trim() ||
      base.summary,

    travelMotivation:
      raw?.travelMotivation?.trim() ||
      base.travelMotivation,

    desiredExperience:
      raw?.desiredExperience?.trim() ||
      base.desiredExperience,

    emotionalContext:
      raw?.emotionalContext?.trim() ||
      base.emotionalContext,

    mainConcern:
      raw?.mainConcern?.trim() ||
      base.mainConcern,

    purchaseUrgency:
      raw?.purchaseUrgency?.trim() ||
      base.purchaseUrgency,

    priceSensitivity:
      priceSensitivity === "low" ||
      priceSensitivity === "medium" ||
      priceSensitivity === "high" ||
      priceSensitivity === "unknown"
        ? priceSensitivity
        : base.priceSensitivity,

    understandingScore:
      clampScore(
        raw?.understandingScore ??
        base.understandingScore
      )
  };
}

function normalizeCommercialEvaluation(
  current:
    CandeCommercialEvaluation | null,
  raw:
    CandeRawAnalysis["commercialEvaluation"],
  configuration:
    CandeBrainConfiguration
): CandeCommercialEvaluation {
  const base =
    current ||
    DEFAULT_COMMERCIAL_EVALUATION;

  const commercialScore =
    clampScore(
      raw?.commercialScore ??
      base.commercialScore
    );

  return {
    commercialScore,

    purchaseProbability:
      clampScore(
        raw?.purchaseProbability ??
        base.purchaseProbability
      ),

    dataQualityScore:
      clampScore(
        raw?.dataQualityScore ??
        base.dataQualityScore
      ),

    understandingScore:
      clampScore(
        raw?.understandingScore ??
        base.understandingScore
      ),

    aiConfidenceScore:
      clampScore(
        raw?.aiConfidenceScore ??
        base.aiConfidenceScore
      ),

    urgencyScore:
      clampScore(
        raw?.urgencyScore ??
        base.urgencyScore
      ),

    abandonmentRiskScore:
      clampScore(
        raw?.abandonmentRiskScore ??
        base.abandonmentRiskScore
      ),

    temperature:
      getTemperature(
        commercialScore,
        configuration
      ),

    scoreReasoning:
      Array.isArray(
        raw?.scoreReasoning
      )
        ? raw.scoreReasoning
            .filter(
              (
                reason
              ): reason is string =>
                typeof reason ===
                  "string" &&
                reason.trim().length > 0
            )
            .map(
              (reason) =>
                reason.trim()
            )
        : base.scoreReasoning
  };
}

function normalizeResponseDecision(
  current:
    CandeResponseDecision | null,
  raw:
    CandeRawAnalysis["responseDecision"],
  commercialEvaluation:
    CandeCommercialEvaluation,
  configuration:
    CandeBrainConfiguration
): CandeResponseDecision {
  const base =
    current ||
    DEFAULT_RESPONSE_DECISION;

  const reachedThreshold =
    commercialEvaluation
      .commercialScore >=
    configuration
      .commercialHandoffThreshold;

  const shouldHandoff =
    Boolean(
      raw?.shouldHandoff
    ) ||
    (
      configuration
        .immediateHandoff
        .humanRequested &&
      raw?.handoffReason ===
        "human_requested"
    ) ||
    (
      configuration
        .immediateHandoff
        .aiDetected &&
      raw?.handoffReason ===
        "ai_detected"
    ) ||
    (
      configuration
        .immediateHandoff
        .urgency &&
      raw?.handoffReason ===
        "urgency"
    ) ||
    (
      configuration
        .immediateHandoff
        .emergency &&
      raw?.handoffReason ===
        "emergency"
    ) ||
    (
      configuration
        .immediateHandoff
        .postSale &&
      raw?.handoffReason ===
        "post_sale"
    ) ||
    reachedThreshold;

  const handoffReason =
    raw?.handoffReason ||
    (
      reachedThreshold
        ? "score_threshold"
        : null
    );

  return {
    shouldRespond:
      typeof raw?.shouldRespond ===
        "boolean"
        ? raw.shouldRespond
        : base.shouldRespond,

    responseObjective:
      raw?.responseObjective ||
      base.responseObjective,

    recommendedNextQuestion:
      typeof raw?.recommendedNextQuestion ===
        "string"
        ? raw.recommendedNextQuestion.trim() ||
          null
        : base.recommendedNextQuestion,

    proposedResponse:
      typeof raw?.proposedResponse ===
        "string"
        ? raw.proposedResponse.trim() ||
          null
        : base.proposedResponse,

    shouldHandoff,

    handoffReason
  };
}

function normalizeRawContradictions(
  currentFields:
    CandeTravelField[],
  contradictions:
    CandeRawAnalysis["contradictions"]
): CandeDetectedContradiction[] {
  if (
    !Array.isArray(
      contradictions
    )
  ) {
    return [];
  }

  return contradictions.map(
    (contradiction) => {
      const currentField =
        currentFields.find(
          (field) =>
            field.key ===
            contradiction.field
        );

      return {
        field:
          contradiction.field,

        currentValue:
          currentField?.value ??
          null,

        detectedValue:
          contradiction.detectedValue,

        sourceMessageId:
          contradiction.sourceMessageId ||
          null,

        explanation:
          contradiction.explanation?.trim() ||
          "Se detectaron valores incompatibles para el mismo campo."
      };
    }
  );
}

export function normalizeCandeBrainState(
  params:
    NormalizeCandeBrainStateParams
): CandeBrainState {
  const analyzedAt =
    params.analyzedAt ||
    new Date().toISOString();

  const currentFields =
    params.currentState
      ?.knownFields ||
    [];

  const merged =
    mergeDetectedFields(
      currentFields,
      params.rawAnalysis
        .detectedFields ||
        [],
      analyzedAt
    );

  const passengerUnderstanding =
    normalizePassengerUnderstanding(
      params.currentState
        ?.passengerUnderstanding ||
        null,
      params.rawAnalysis
        .passengerUnderstanding
    );

  const commercialEvaluation =
    normalizeCommercialEvaluation(
      params.currentState
        ?.commercialEvaluation ||
        null,
      params.rawAnalysis
        .commercialEvaluation,
      params.configuration
    );

  const responseDecision =
    normalizeResponseDecision(
      params.currentState
        ?.responseDecision ||
        null,
      params.rawAnalysis
        .responseDecision,
      commercialEvaluation,
      params.configuration
    );

  const rawContradictions =
    normalizeRawContradictions(
      merged.fields,
      params.rawAnalysis
        .contradictions
    );

  return {
    version: "2.0",

    conversationId:
      params.conversationId,

    opportunityId:
      params.opportunityId,

    customerId:
      params.customerId,

    operationalMode:
      params.currentState
        ?.operationalMode ||
      "responding",

    passengerUnderstanding,

    knownFields:
      merged.fields,

    missingRelevantFields:
      params.configuration
        .priorityFields.filter(
          (fieldKey) =>
            !merged.fields.some(
              (field) =>
                field.key ===
                  fieldKey &&
                hasMeaningfulValue(
                  field.value
                ) &&
                field.status !==
                  "contradictory"
            )
        ),

    contradictions: [
      ...merged.contradictions,
      ...rawContradictions
    ],

    departureInference:
      params.currentState
        ?.departureInference ||
      null,

    commercialEvaluation,

    responseDecision,

    niaSignals:
      Array.isArray(
        params.rawAnalysis
          .niaSignals
      )
        ? params.rawAnalysis
            .niaSignals
        : params.currentState
            ?.niaSignals ||
          [],

    lastAnalyzedMessageId:
      params.lastAnalyzedMessageId,

    analyzedAt
  };
}
