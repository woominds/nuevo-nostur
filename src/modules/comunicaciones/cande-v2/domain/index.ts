// src/modules/comunicaciones/cande-v2/domain/index.ts

export {
  runCandeBrain
} from "./candeBrainEngine";

export {
  normalizeCandeBrainState
} from "./candeBrainNormalizer";

export type {
  CandeRawAnalysis,
  CandeRawDetectedField
} from "./candeBrainNormalizer";

export {
  buildMemoryAwareResponseDecision,
  buildNextQuestion,
  detectsAiRecognition,
  detectsHumanRequest,
  getField,
  getLastPassengerMessage,
  getMissingRelevantFields,
  hasUsableFieldValue,
  isSimpleGreeting,
  selectNextRelevantField,
  wasQuestionAlreadyAsked
} from "./candeConversationMemory";

export type {
  CandeBrainConfiguration,
  CandeBrainInput,
  CandeBrainResult,
  CandeBrainState,
  CandeCommercialEvaluation,
  CandeConversationMessage,
  CandeDepartureInference,
  CandeDetectedContradiction,
  CandeFieldStatus,
  CandeHandoffReason,
  CandeKnowledgeSource,
  CandeMessageAuthor,
  CandeNiaSignal,
  CandeNiaSignalPriority,
  CandeNiaSignalType,
  CandeOperationalMode,
  CandePassengerUnderstanding,
  CandeResponseDecision,
  CandeTemperature,
  CandeTemperatureThresholds,
  CandeTravelField,
  CandeTravelFieldKey
} from "./candeBrain.types";
