// src/modules/comunicaciones/cande-v2/domain/candeBrain.types.ts

export type CandeOperationalMode =
  | "responding"
  | "observing"
  | "handed_off"
  | "paused"
  | "disabled";

export type CandeTemperature =
  | "cold"
  | "warm"
  | "hot";

export type CandeMessageAuthor =
  | "passenger"
  | "cande"
  | "seller"
  | "system";

export type CandeHandoffReason =
  | "score_threshold"
  | "human_requested"
  | "ai_detected"
  | "urgency"
  | "emergency"
  | "post_sale"
  | "commercial_judgement"
  | null;

export type CandeNiaSignalType =
  | "hot_opportunity"
  | "opportunity_cooling"
  | "without_follow_up"
  | "budget_pending"
  | "human_requested"
  | "post_sale"
  | "urgency"
  | "emergency"
  | "contradiction_detected"
  | "important_new_information"
  | "seller_action_recommended";

export type CandeNiaSignalPriority =
  | "critical"
  | "urgent"
  | "high"
  | "informative";

export type CandeKnowledgeSource =
  | "conversation"
  | "passenger_confirmed"
  | "manual"
  | "phone_area_code"
  | "customer_history"
  | "approved_learning"
  | "inference";

export type CandeFieldStatus =
  | "unknown"
  | "inferred"
  | "detected"
  | "confirmed"
  | "manually_confirmed"
  | "contradictory";

export type CandeTravelFieldKey =
  | "passenger_name"
  | "destination"
  | "probable_departure_city"
  | "suggested_departure_airport"
  | "travel_date"
  | "date_flexibility"
  | "trip_duration_days"
  | "adult_count"
  | "minor_count"
  | "minor_ages"
  | "estimated_budget"
  | "budget_currency"
  | "trip_type"
  | "travel_motivation"
  | "desired_experience"
  | "hotel_preference"
  | "meal_plan_preference"
  | "payment_preference"
  | "price_sensitivity"
  | "urgency"
  | "concerns"
  | "objections"
  | "special_requirements"
  | "commercial_notes";

export type CandeConversationMessage = {
  id: string;
  author: CandeMessageAuthor;
  text: string;
  createdAt: string;
};

export type CandeTravelField = {
  key: CandeTravelFieldKey;
  value: unknown;
  status: CandeFieldStatus;
  source: CandeKnowledgeSource;
  confidence: number;
  sourceMessageId: string | null;
  passengerConfirmed: boolean;
  manuallyEdited: boolean;
  updatedAt: string;
};

export type CandeDetectedContradiction = {
  field: CandeTravelFieldKey;
  currentValue: unknown;
  detectedValue: unknown;
  sourceMessageId: string | null;
  explanation: string;
};

export type CandePassengerUnderstanding = {
  summary: string;
  travelMotivation: string | null;
  desiredExperience: string | null;
  emotionalContext: string | null;
  mainConcern: string | null;
  purchaseUrgency: string | null;
  priceSensitivity:
    | "low"
    | "medium"
    | "high"
    | "unknown";
  understandingScore: number;
};

export type CandeCommercialEvaluation = {
  commercialScore: number;
  purchaseProbability: number;
  dataQualityScore: number;
  understandingScore: number;
  aiConfidenceScore: number;
  urgencyScore: number;
  abandonmentRiskScore: number;
  temperature: CandeTemperature;
  scoreReasoning: string[];
};

export type CandeDepartureInference = {
  phoneAreaCode: string | null;
  probableCity: string | null;
  probableProvince: string | null;
  suggestedAirportCode: string | null;
  suggestedAirportName: string | null;
  alternativeAirportCodes: string[];
  confidence: number;
  source: CandeKnowledgeSource;
  confirmed: boolean;
};

export type CandeNiaSignal = {
  type: CandeNiaSignalType;
  priority: CandeNiaSignalPriority;
  title: string;
  summary: string;
  recommendedAction: string | null;
  metadata: Record<string, unknown>;
};

export type CandeResponseDecision = {
  shouldRespond: boolean;
  responseObjective:
    | "greet"
    | "discover_passenger"
    | "discover_trip"
    | "clarify_information"
    | "answer_travel_question"
    | "confirm_understanding"
    | "handoff"
    | "remain_silent";

  recommendedNextQuestion: string | null;
  proposedResponse: string | null;
  shouldHandoff: boolean;
  handoffReason: CandeHandoffReason;
};

export type CandeBrainState = {
  version: "2.0";

  conversationId: string | null;
  opportunityId: string | null;
  customerId: string | null;

  operationalMode: CandeOperationalMode;

  passengerUnderstanding:
    CandePassengerUnderstanding;

  knownFields: CandeTravelField[];

  missingRelevantFields:
    CandeTravelFieldKey[];

  contradictions:
    CandeDetectedContradiction[];

  departureInference:
    CandeDepartureInference | null;

  commercialEvaluation:
    CandeCommercialEvaluation;

  responseDecision:
    CandeResponseDecision;

  niaSignals:
    CandeNiaSignal[];

  lastAnalyzedMessageId: string | null;
  analyzedAt: string;
};

export type CandeTemperatureThresholds = {
  coldMinimum: number;
  warmMinimum: number;
  hotMinimum: number;
};

export type CandeBrainConfiguration = {
  enabled: boolean;

  commercialHandoffThreshold: number;

  temperatureThresholds:
    CandeTemperatureThresholds;

  immediateHandoff: {
    humanRequested: boolean;
    aiDetected: boolean;
    urgency: boolean;
    emergency: boolean;
    postSale: boolean;
  };

  priorityFields:
    CandeTravelFieldKey[];

  allowResponseAfterHandoff: false;

  continueAnalyzingAfterHandoff: boolean;

  maximumPrimaryQuestionsPerResponse: number;
};

export type CandeBrainInput = {
  configuration:
    CandeBrainConfiguration;

  operationalMode:
    CandeOperationalMode;

  conversation:
    CandeConversationMessage[];

  currentState:
    CandeBrainState | null;

  phone:
    string | null;

  currentOpportunityData:
    Record<string, unknown>;

  manualOpportunityData:
    Record<string, unknown>;

  approvedKnowledge:
    Array<{
      title: string;
      content: string;
      category: string | null;
    }>;

  approvedCorrections:
    Array<{
      originalQuestion: string;
      correctedAnswer: string;
      context: Record<string, unknown>;
    }>;
};

export type CandeBrainResult = {
  state: CandeBrainState;

  opportunityPatch:
    Record<string, unknown>;

  audit: {
    inputMessageIds: string[];
    model: string | null;
    promptVersion: string | null;
    warnings: string[];
  };
};
