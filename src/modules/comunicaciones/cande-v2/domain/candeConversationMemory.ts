// src/modules/comunicaciones/cande-v2/domain/candeConversationMemory.ts

import type {
  CandeBrainState,
  CandeConversationMessage,
  CandeResponseDecision,
  CandeTravelField,
  CandeTravelFieldKey
} from "./candeBrain.types";

const FIELD_PRIORITY: CandeTravelFieldKey[] = [
  "passenger_name",
  "travel_motivation",
  "destination",
  "adult_count",
  "minor_count",
  "minor_ages",
  "travel_date",
  "trip_duration_days",
  "estimated_budget"
];

const GREETING_PATTERNS = [
  /^hola[\s!.]*$/i,
  /^buen(?:os|as)\s+(?:días|dias|tardes|noches)[\s!.]*$/i,
  /^hol(?:a|i)[\s!.]*$/i,
  /^buenas[\s!.]*$/i
];

const HUMAN_REQUEST_PATTERNS = [
  /\bhumano\b/i,
  /\bpersona\b/i,
  /\bagente\b/i,
  /\basesor(?:a)?\b/i,
  /\bvendedor(?:a)?\b/i,
  /\bquiero hablar con\b/i,
  /\bpasame con\b/i,
  /\bcomunicarme con\b/i
];

const AI_DETECTION_PATTERNS = [
  /\bsos una ia\b/i,
  /\bsos un bot\b/i,
  /\bsos inteligencia artificial\b/i,
  /\bhablo con una maquina\b/i,
  /\bhablo con una máquina\b/i,
  /\besto es automático\b/i,
  /\besto es automatico\b/i
];

function normalizeText(
  value: string
): string {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLowerCase();
}

export function getLastPassengerMessage(
  conversation: CandeConversationMessage[]
): CandeConversationMessage | null {
  for (
    let index =
      conversation.length - 1;
    index >= 0;
    index -= 1
  ) {
    const message =
      conversation[index];

    if (
      message.author ===
      "passenger"
    ) {
      return message;
    }
  }

  return null;
}

export function isSimpleGreeting(
  message:
    CandeConversationMessage | null
): boolean {
  if (!message) {
    return false;
  }

  const text =
    normalizeText(
      message.text
    );

  return GREETING_PATTERNS.some(
    (pattern) =>
      pattern.test(text)
  );
}

export function detectsHumanRequest(
  message:
    CandeConversationMessage | null
): boolean {
  if (!message) {
    return false;
  }

  return HUMAN_REQUEST_PATTERNS.some(
    (pattern) =>
      pattern.test(
        message.text
      )
  );
}

export function detectsAiRecognition(
  message:
    CandeConversationMessage | null
): boolean {
  if (!message) {
    return false;
  }

  return AI_DETECTION_PATTERNS.some(
    (pattern) =>
      pattern.test(
        message.text
      )
  );
}

export function getField(
  fields: CandeTravelField[],
  key: CandeTravelFieldKey
): CandeTravelField | null {
  return (
    fields.find(
      (field) =>
        field.key === key
    ) ||
    null
  );
}

export function hasUsableFieldValue(
  fields: CandeTravelField[],
  key: CandeTravelFieldKey
): boolean {
  const field =
    getField(
      fields,
      key
    );

  if (!field) {
    return false;
  }

  if (
    field.status === "unknown" ||
    field.status === "contradictory"
  ) {
    return false;
  }

  if (
    field.value === null ||
    field.value === undefined
  ) {
    return false;
  }

  if (
    typeof field.value === "string" &&
    !field.value.trim()
  ) {
    return false;
  }

  if (
    Array.isArray(field.value) &&
    field.value.length === 0
  ) {
    return false;
  }

  return true;
}

export function getMissingRelevantFields(
  fields: CandeTravelField[],
  priorityFields:
    CandeTravelFieldKey[] =
      FIELD_PRIORITY
): CandeTravelFieldKey[] {
  const missing =
    priorityFields.filter(
      (key) =>
        !hasUsableFieldValue(
          fields,
          key
        )
    );

  const hasMinorCount =
    hasUsableFieldValue(
      fields,
      "minor_count"
    );

  const minorCountField =
    getField(
      fields,
      "minor_count"
    );

  const minorCount =
    Number(
      minorCountField?.value ||
      0
    );

  if (
    hasMinorCount &&
    minorCount <= 0
  ) {
    return missing.filter(
      (key) =>
        key !== "minor_ages"
    );
  }

  return missing;
}

export function wasQuestionAlreadyAsked(
  conversation:
    CandeConversationMessage[],
  field:
    CandeTravelFieldKey
): boolean {
  const candeMessages =
    conversation.filter(
      (message) =>
        message.author === "cande"
    );

  const patterns:
    Partial<
      Record<
        CandeTravelFieldKey,
        RegExp[]
      >
    > = {
      passenger_name: [
        /con quien tengo el gusto/i,
        /como te llamas/i,
        /cual es tu nombre/i
      ],

      destination: [
        /que destino/i,
        /donde les gustaria viajar/i,
        /tienen algun destino en mente/i
      ],

      travel_motivation: [
        /que los motivo/i,
        /que tipo de viaje/i,
        /que les gustaria vivir/i,
        /buscan descansar/i
      ],

      adult_count: [
        /cuantos adultos/i,
        /cuantas personas viajan/i,
        /cuantos pasajeros/i
      ],

      minor_count: [
        /viajan menores/i,
        /hay chicos/i,
        /cuantos menores/i
      ],

      minor_ages: [
        /que edades tienen/i,
        /edad de los menores/i,
        /edades de los chicos/i
      ],

      travel_date: [
        /para que fecha/i,
        /cuando les gustaria viajar/i,
        /en que fecha viajarian/i
      ],

      trip_duration_days: [
        /cuantos dias/i,
        /cuantas noches/i,
        /duracion del viaje/i
      ],

      estimated_budget: [
        /que presupuesto/i,
        /cuanto tienen pensado invertir/i,
        /presupuesto estimado/i
      ]
    };

  const fieldPatterns =
    patterns[field] || [];

  return candeMessages.some(
    (message) =>
      fieldPatterns.some(
        (pattern) =>
          pattern.test(
            normalizeText(
              message.text
            )
          )
      )
  );
}

export function selectNextRelevantField(
  params: {
    fields: CandeTravelField[];
    conversation:
      CandeConversationMessage[];
    priorityFields?:
      CandeTravelFieldKey[];
  }
): CandeTravelFieldKey | null {
  const missing =
    getMissingRelevantFields(
      params.fields,
      params.priorityFields
    );

  for (
    const field of missing
  ) {
    if (
      !wasQuestionAlreadyAsked(
        params.conversation,
        field
      )
    ) {
      return field;
    }
  }

  return (
    missing[0] ||
    null
  );
}

export function buildNextQuestion(
  field:
    CandeTravelFieldKey | null
): string | null {
  if (!field) {
    return null;
  }

  const questions:
    Partial<
      Record<
        CandeTravelFieldKey,
        string
      >
    > = {
      passenger_name:
        "Cande es mi nombre. ¿Con quién tengo el gusto?",

      travel_motivation:
        "Contame un poco más, ¿qué les gustaría vivir o encontrar en este viaje?",

      destination:
        "¿Tienen algún destino en mente o quieren que los ayude a encontrar uno que encaje con lo que están buscando?",

      adult_count:
        "¿Cuántos adultos viajarían?",

      minor_count:
        "¿Viajan también chicos o menores?",

      minor_ages:
        "¿Qué edades tienen los menores? Así puedo orientarte mejor con destinos y alojamientos adecuados.",

      travel_date:
        "¿Para qué fecha aproximada están pensando el viaje?",

      trip_duration_days:
        "¿Cuántos días les gustaría estar en destino?",

      estimated_budget:
        "¿Tienen una idea aproximada de cuánto quieren invertir en el viaje?"
    };

  return (
    questions[field] ||
    null
  );
}

export function buildMemoryAwareResponseDecision(
  params: {
    state:
      CandeBrainState | null;

    conversation:
      CandeConversationMessage[];

    knownFields:
      CandeTravelField[];

    priorityFields?:
      CandeTravelFieldKey[];
  }
): CandeResponseDecision {
  const lastPassengerMessage =
    getLastPassengerMessage(
      params.conversation
    );

  if (
    detectsHumanRequest(
      lastPassengerMessage
    )
  ) {
    return {
      shouldRespond: true,
      responseObjective:
        "handoff",
      recommendedNextQuestion:
        null,
      proposedResponse:
        "Claro. Te comunico con una persona del equipo para que continúe ayudándote.",
      shouldHandoff: true,
      handoffReason:
        "human_requested"
    };
  }

  if (
    detectsAiRecognition(
      lastPassengerMessage
    )
  ) {
    return {
      shouldRespond: true,
      responseObjective:
        "handoff",
      recommendedNextQuestion:
        null,
      proposedResponse:
        "Claro. Te paso con una persona del equipo para que continúe la conversación.",
      shouldHandoff: true,
      handoffReason:
        "ai_detected"
    };
  }

  const alreadyHasName =
    hasUsableFieldValue(
      params.knownFields,
      "passenger_name"
    );

  if (
    isSimpleGreeting(
      lastPassengerMessage
    ) &&
    !alreadyHasName
  ) {
    return {
      shouldRespond: true,
      responseObjective:
        "greet",
      recommendedNextQuestion:
        "Cande es mi nombre. ¿Con quién tengo el gusto?",
      proposedResponse:
        "¡Hola! Buenas tardes 😊 Cande es mi nombre. ¿Con quién tengo el gusto?",
      shouldHandoff: false,
      handoffReason:
        null
    };
  }

  const nextField =
    selectNextRelevantField({
      fields:
        params.knownFields,
      conversation:
        params.conversation,
      priorityFields:
        params.priorityFields
    });

  const nextQuestion =
    buildNextQuestion(
      nextField
    );

  if (!nextQuestion) {
    return {
      shouldRespond: true,
      responseObjective:
        "confirm_understanding",
      recommendedNextQuestion:
        null,
      proposedResponse:
        "Perfecto, ya entiendo mucho mejor lo que están buscando. Voy a ordenar toda la información para continuar de la mejor manera.",
      shouldHandoff: false,
      handoffReason:
        null
    };
  }

  return {
    shouldRespond: true,
    responseObjective:
      nextField ===
      "travel_motivation"
        ? "discover_passenger"
        : "discover_trip",
    recommendedNextQuestion:
      nextQuestion,
    proposedResponse:
      nextQuestion,
    shouldHandoff: false,
    handoffReason:
      null
  };
}
