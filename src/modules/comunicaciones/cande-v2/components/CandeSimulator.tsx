// src/modules/comunicaciones/cande-v2/components/CandeSimulator.tsx

import {
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  BrainCircuit,
  Flame,
  Loader2,
  MessageCircle,
  RefreshCcw,
  Send,
  Snowflake,
  Sparkles,
  ThermometerSun,
  UserRound,
} from "lucide-react";

import {
  runCandeBrain,
  type CandeBrainConfiguration,
  type CandeBrainState,
  type CandeConversationMessage,
  type CandeTravelFieldKey,
} from "../domain";

import {
  analyzeCandeV2,
} from "../services/candeV2AnalyzerService";

type SimulatorMessage = {
  id: string;
  author:
    | "passenger"
    | "cande";
  text: string;
  createdAt: string;
};

const DEFAULT_CONFIGURATION:
  CandeBrainConfiguration = {
    enabled: true,

    commercialHandoffThreshold:
      75,

    temperatureThresholds: {
      coldMinimum: 0,
      warmMinimum: 35,
      hotMinimum: 65,
    },

    immediateHandoff: {
      humanRequested: true,
      aiDetected: true,
      urgency: true,
      emergency: true,
      postSale: true,
    },

    priorityFields: [
      "passenger_name",
      "travel_motivation",
      "destination",
      "adult_count",
      "minor_count",
      "minor_ages",
      "travel_date",
      "trip_duration_days",
      "estimated_budget",
    ],

    allowResponseAfterHandoff:
      false,

    continueAnalyzingAfterHandoff:
      true,

    maximumPrimaryQuestionsPerResponse:
      1,
  };

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    Date.now().toString(36),
    Math.random()
      .toString(36)
      .slice(2),
  ].join("-");
}

function nowIso(): string {
  return new Date()
    .toISOString();
}

function toConversationMessages(
  messages:
    SimulatorMessage[],
): CandeConversationMessage[] {
  return messages.map(
    (message) => ({
      id:
        message.id,

      author:
        message.author,

      text:
        message.text,

      createdAt:
        message.createdAt,
    }),
  );
}

function getTemperatureLabel(
  temperature:
    CandeBrainState["commercialEvaluation"]["temperature"],
): string {
  if (
    temperature === "hot"
  ) {
    return "Caliente";
  }

  if (
    temperature === "warm"
  ) {
    return "Tibio";
  }

  return "Frío";
}

function getModeLabel(
  mode:
    CandeBrainState["operationalMode"],
): string {
  const labels:
    Record<
      CandeBrainState["operationalMode"],
      string
    > = {
      responding:
        "Respondiendo",

      observing:
        "Observando",

      handed_off:
        "Derivada",

      paused:
        "Pausada",

      disabled:
        "Desactivada",
    };

  return labels[mode];
}

function getObjectiveLabel(
  objective:
    CandeBrainState["responseDecision"]["responseObjective"],
): string {
  const labels:
    Record<
      CandeBrainState["responseDecision"]["responseObjective"],
      string
    > = {
      greet:
        "Iniciar conversación",

      discover_passenger:
        "Comprender al pasajero",

      discover_trip:
        "Descubrir el viaje",

      clarify_information:
        "Aclarar información",

      answer_travel_question:
        "Responder consulta turística",

      confirm_understanding:
        "Confirmar comprensión",

      handoff:
        "Derivar al equipo",

      remain_silent:
        "Permanecer en silencio",
    };

  return labels[objective];
}

function getHandoffReasonLabel(
  reason:
    CandeBrainState["responseDecision"]["handoffReason"],
): string {
  if (!reason) {
    return "—";
  }

  const labels = {
    score_threshold:
      "Umbral comercial",

    human_requested:
      "Pidió atención humana",

    ai_detected:
      "Detectó o rechazó la IA",

    urgency:
      "Urgencia",

    emergency:
      "Emergencia",

    post_sale:
      "Postventa",

    commercial_judgement:
      "Criterio comercial",
  };

  return labels[reason];
}

function getFieldLabel(
  key:
    CandeTravelFieldKey,
): string {
  const labels:
    Partial<
      Record<
        CandeTravelFieldKey,
        string
      >
    > = {
      passenger_name:
        "Nombre",

      destination:
        "Destino",

      probable_departure_city:
        "Origen probable",

      suggested_departure_airport:
        "Aeropuerto sugerido",

      travel_date:
        "Fecha probable",

      date_flexibility:
        "Flexibilidad",

      trip_duration_days:
        "Días en destino",

      adult_count:
        "Adultos",

      minor_count:
        "Menores",

      minor_ages:
        "Edades de menores",

      estimated_budget:
        "Presupuesto",

      budget_currency:
        "Moneda",

      trip_type:
        "Tipo de viaje",

      travel_motivation:
        "Motivación",

      desired_experience:
        "Experiencia buscada",

      hotel_preference:
        "Preferencia de hotel",

      meal_plan_preference:
        "Régimen",

      payment_preference:
        "Forma de pago",

      price_sensitivity:
        "Sensibilidad al precio",

      urgency:
        "Urgencia",

      concerns:
        "Preocupaciones",

      objections:
        "Objeciones",

      special_requirements:
        "Necesidades especiales",

      commercial_notes:
        "Notas comerciales",
    };

  return (
    labels[key] ||
    key.replace(
      /_/g,
      " ",
    )
  );
}

function formatValue(
  value: unknown,
): string {
  if (
    Array.isArray(value)
  ) {
    return value
      .map(String)
      .join(", ");
  }

  if (
    typeof value ===
      "object" &&
    value !== null
  ) {
    return JSON.stringify(
      value,
    );
  }

  return String(
    value ?? "—",
  );
}

function SimulatorMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-[12px] border border-black/10 bg-white px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#64748b]">
        {icon}
        {label}
      </div>

      <div className="mt-1 text-[16px] font-semibold text-[#172033]">
        {value}
      </div>
    </article>
  );
}

function TargetIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
      />

      <circle
        cx="12"
        cy="12"
        r="6"
      />

      <circle
        cx="12"
        cy="12"
        r="2"
      />
    </svg>
  );
}

export function CandeSimulator() {
  const [
    messages,
    setMessages,
  ] = useState<
    SimulatorMessage[]
  >([]);

  const [
    input,
    setInput,
  ] = useState("");

  const [
    brainState,
    setBrainState,
  ] = useState<
    CandeBrainState | null
  >(null);

  const [
    processing,
    setProcessing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    analyzerMetadata,
    setAnalyzerMetadata,
  ] = useState<{
    model:
      string | null;

    promptVersion:
      string | null;

    analyzedAt:
      string | null;
  }>({
    model:
      null,

    promptVersion:
      null,

    analyzedAt:
      null,
  });

  const knownFields =
    brainState?.knownFields ||
    [];

  const missingLabels =
    useMemo(
      () =>
        (
          brainState
            ?.missingRelevantFields ||
          []
        ).map(
          getFieldLabel,
        ),
      [brainState],
    );

  const temperature =
    brainState
      ?.commercialEvaluation
      .temperature ||
    "cold";

  const temperatureIcon =
    temperature === "hot"
      ? (
          <Flame size={13} />
        )
      : temperature === "warm"
        ? (
            <ThermometerSun
              size={13}
            />
          )
        : (
            <Snowflake
              size={13}
            />
          );

  function resetSimulator() {
    setMessages([]);
    setBrainState(null);
    setInput("");
    setError(null);
    setProcessing(false);

    setAnalyzerMetadata({
      model:
        null,

      promptVersion:
        null,

      analyzedAt:
        null,
    });
  }

  async function processPassengerMessage(
    passengerText: string,
  ) {
    const cleanMessage =
      passengerText.trim();

    if (
      !cleanMessage ||
      processing
    ) {
      return;
    }

    setProcessing(true);
    setError(null);

    const passengerMessage:
      SimulatorMessage = {
        id:
          createId(),

        author:
          "passenger",

        text:
          cleanMessage,

        createdAt:
          nowIso(),
      };

    const messagesWithPassenger = [
      ...messages,
      passengerMessage,
    ];

    setMessages(
      messagesWithPassenger,
    );

    setInput("");

    try {
      const conversation =
        toConversationMessages(
          messagesWithPassenger,
        );

      const analysisResult =
        await analyzeCandeV2({
          conversation,

          currentState:
            brainState,

          opportunityData:
            {},

          manualOpportunityData:
            {},

          phone:
            "+5493510000000",

          areaCodeInference: {
            phoneAreaCode:
              "351",

            probableCity:
              "Córdoba",

            probableProvince:
              "Córdoba",

            suggestedAirportCode:
              "COR",

            suggestedAirportName:
              "Aeropuerto Internacional Ingeniero Ambrosio Taravella",

            confidence:
              0.95,

            confirmed:
              false,
          },

          simulation:
            true,
        });

      const brainResult =
        runCandeBrain({
          input: {
            configuration:
              DEFAULT_CONFIGURATION,

            operationalMode:
              brainState
                ?.operationalMode ||
              "responding",

            conversation,

            currentState:
              brainState,

            phone:
              "+5493510000000",

            currentOpportunityData:
              {},

            manualOpportunityData:
              {},

            approvedKnowledge:
              [],

            approvedCorrections:
              [],
          },

          rawAnalysis:
            analysisResult.analysis,

          conversationId:
            "simulator-conversation",

          opportunityId:
            "simulator-opportunity",

          customerId:
            null,

          lastAnalyzedMessageId:
            passengerMessage.id,

          model:
            analysisResult
              .metadata
              .model,

          promptVersion:
            analysisResult
              .metadata
              .promptVersion,

          analyzedAt:
            analysisResult
              .metadata
              .analyzedAt,
        });

      const nextMessages = [
        ...messagesWithPassenger,
      ];

      const proposedResponse =
        brainResult
          .state
          .responseDecision
          .proposedResponse;

      if (
        brainResult
          .state
          .responseDecision
          .shouldRespond &&
        proposedResponse
      ) {
        nextMessages.push({
          id:
            createId(),

          author:
            "cande",

          text:
            proposedResponse,

          createdAt:
            nowIso(),
        });
      }

      setMessages(
        nextMessages,
      );

      setBrainState(
        brainResult.state,
      );

      setAnalyzerMetadata({
        model:
          analysisResult
            .metadata
            .model,

        promptVersion:
          analysisResult
            .metadata
            .promptVersion,

        analyzedAt:
          analysisResult
            .metadata
            .analyzedAt,
      });
    } catch (analysisError) {
      const message =
        analysisError instanceof
          Error
          ? analysisError.message
          : "No se pudo analizar la conversación.";

      setError(message);
    } finally {
      setProcessing(false);
    }
  }

  function submitMessage() {
    void processPassengerMessage(
      input,
    );
  }

  return (
    <section className="grid gap-3.5 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
      <div className="flex min-h-[620px] flex-col overflow-hidden rounded-[16px] border border-black/10 bg-white/70 shadow-sm">
        <header className="flex items-start justify-between gap-3 border-b border-black/10 bg-white/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#eef6f7] text-[#4f7c90]">
              <MessageCircle
                size={16}
              />
            </span>

            <div>
              <h2 className="text-[14px] font-semibold text-[#172033]">
                Conversación simulada
              </h2>

              <p className="text-[10.5px] text-[#64748b]">
                Análisis real con CANDE 2.0.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              resetSimulator
            }
            disabled={
              processing
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-white px-2.5 text-[11px] font-medium text-[#475569] ring-1 ring-black/10 transition hover:bg-[#f8fafc] disabled:opacity-50"
          >
            <RefreshCcw
              size={13}
            />
            Reiniciar
          </button>
        </header>

        {error ? (
          <div className="flex items-start gap-2 border-b border-red-200 bg-red-50 px-4 py-3 text-[11.5px] text-red-700">
            <AlertTriangle
              size={15}
              className="mt-0.5 shrink-0"
            />

            <div>
              <div className="font-semibold">
                No se pudo analizar la conversación
              </div>

              <div className="mt-0.5">
                {error}
              </div>
            </div>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto bg-[#f6f8fa] p-4">
          {messages.length ===
          0 ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white text-[#4f7c90] shadow-sm ring-1 ring-black/5">
                <Sparkles
                  size={22}
                />
              </span>

              <h3 className="mt-3 text-[15px] font-semibold text-[#172033]">
                Probemos a CANDE
              </h3>

              <p className="mt-1 max-w-sm text-[11.5px] leading-relaxed text-[#64748b]">
                CANDE analizará el contexto completo y decidirá qué responder sin usar una secuencia fija.
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[
                  "Hola",
                  "Soy Martín y quiero viajar con mi familia",
                  "Queremos Punta Cana en julio",
                  "¿En julio hay sargazo en Punta Cana?",
                  "Quiero hablar con una persona",
                ].map(
                  (example) => (
                    <button
                      key={
                        example
                      }
                      type="button"
                      onClick={() =>
                        void processPassengerMessage(
                          example,
                        )
                      }
                      disabled={
                        processing
                      }
                      className="rounded-[9px] bg-white px-3 py-2 text-[11px] font-medium text-[#475569] shadow-sm ring-1 ring-black/10 transition hover:text-[#172033] disabled:opacity-50"
                    >
                      {example}
                    </button>
                  ),
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(
                (message) => (
                  <div
                    key={
                      message.id
                    }
                    className={[
                      "flex",
                      message.author ===
                      "passenger"
                        ? "justify-end"
                        : "justify-start",
                    ].join(
                      " ",
                    )}
                  >
                    <article
                      className={[
                        "max-w-[82%] rounded-[14px] px-3.5 py-2.5 text-[12px] leading-relaxed shadow-sm",
                        message.author ===
                        "passenger"
                          ? "rounded-br-[4px] bg-[#4f7c90] text-white"
                          : "rounded-bl-[4px] bg-white text-[#172033] ring-1 ring-black/5",
                      ].join(
                        " ",
                      )}
                    >
                      <div className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.08em] opacity-70">
                        {message.author ===
                        "passenger" ? (
                          <UserRound
                            size={10}
                          />
                        ) : (
                          <Sparkles
                            size={10}
                          />
                        )}

                        {message.author ===
                        "passenger"
                          ? "Pasajero"
                          : "CANDE"}
                      </div>

                      {message.text}
                    </article>
                  </div>
                ),
              )}

              {processing ? (
                <div className="flex justify-start">
                  <article className="rounded-[14px] rounded-bl-[4px] bg-white px-3.5 py-2.5 text-[11px] text-[#64748b] shadow-sm ring-1 ring-black/5">
                    <div className="flex items-center gap-2">
                      <Loader2
                        size={13}
                        className="animate-spin"
                      />

                      CANDE está escuchando y analizando…
                    </div>
                  </article>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <footer className="border-t border-black/10 bg-white p-3">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(
                event,
              ) =>
                setInput(
                  event.target
                    .value,
                )
              }
              onKeyDown={(
                event,
              ) => {
                if (
                  event.key ===
                    "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  submitMessage();
                }
              }}
              rows={2}
              disabled={
                processing
              }
              placeholder="Escribí como pasajero…"
              className="min-h-[46px] flex-1 resize-none rounded-[12px] border border-black/10 bg-white px-3 py-2.5 text-[12px] text-[#172033] outline-none transition focus:border-[#4f7c90]/50 focus:ring-2 focus:ring-[#4f7c90]/10 disabled:bg-slate-100"
            />

            <button
              type="button"
              onClick={
                submitMessage
              }
              disabled={
                processing ||
                !input.trim()
              }
              className="flex w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#4f7c90] text-white shadow-sm transition hover:bg-[#456f82] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Send
                  size={16}
                />
              )}
            </button>
          </div>
        </footer>
      </div>

      <div className="space-y-3.5">
        <section className="rounded-[16px] border border-black/10 bg-white/70 p-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#eef6f7] text-[#4f7c90]">
              <BrainCircuit
                size={16}
              />
            </span>

            <div>
              <h2 className="text-[14px] font-semibold text-[#172033]">
                Estado mental de CANDE
              </h2>

              <p className="text-[10.5px] text-[#64748b]">
                Análisis estructurado del modelo.
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <SimulatorMetric
              label="Score"
              value={
                brainState
                  ?.commercialEvaluation
                  .commercialScore ??
                0
              }
              icon={
                <TargetIcon />
              }
            />

            <SimulatorMetric
              label="Temperatura"
              value={
                brainState
                  ? getTemperatureLabel(
                      brainState
                        .commercialEvaluation
                        .temperature,
                    )
                  : "Frío"
              }
              icon={
                temperatureIcon
              }
            />

            <SimulatorMetric
              label="Comprensión"
              value={`${
                brainState
                  ?.commercialEvaluation
                  .understandingScore ??
                0
              }%`}
              icon={
                <BrainCircuit
                  size={13}
                />
              }
            />

            <SimulatorMetric
              label="Modo"
              value={
                brainState
                  ? getModeLabel(
                      brainState
                        .operationalMode,
                    )
                  : "Respondiendo"
              }
              icon={
                <Sparkles
                  size={13}
                />
              }
            />
          </div>
        </section>

        <section className="rounded-[16px] border border-black/10 bg-white/70 p-3.5 shadow-sm">
          <h3 className="text-[12.5px] font-semibold text-[#172033]">
            Comprensión del pasajero
          </h3>

          <p className="mt-2 text-[11.5px] leading-relaxed text-[#64748b]">
            {brainState
              ?.passengerUnderstanding
              .summary ||
              "Todavía no comenzó la conversación."}
          </p>

          {brainState
            ?.passengerUnderstanding
            .travelMotivation ? (
            <div className="mt-2 rounded-[9px] bg-[#f8fafc] px-2.5 py-2">
              <div className="text-[9px] font-medium uppercase tracking-[0.08em] text-[#64748b]">
                Motivación detectada
              </div>

              <div className="mt-0.5 text-[11px] font-medium text-[#172033]">
                {
                  brainState
                    .passengerUnderstanding
                    .travelMotivation
                }
              </div>
            </div>
          ) : null}

          {brainState
            ?.passengerUnderstanding
            .mainConcern ? (
            <div className="mt-2 rounded-[9px] bg-amber-50 px-2.5 py-2">
              <div className="text-[9px] font-medium uppercase tracking-[0.08em] text-amber-700">
                Principal preocupación
              </div>

              <div className="mt-0.5 text-[11px] font-medium text-amber-800">
                {
                  brainState
                    .passengerUnderstanding
                    .mainConcern
                }
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-[16px] border border-black/10 bg-white/70 p-3.5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[12.5px] font-semibold text-[#172033]">
              Datos conocidos
            </h3>

            <span className="rounded-md bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] font-medium text-[#64748b]">
              {knownFields.length}
            </span>
          </div>

          {knownFields.length ===
          0 ? (
            <p className="mt-2 text-[11px] text-[#94a3b8]">
              Todavía no se detectaron datos.
            </p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {knownFields.map(
                (field) => (
                  <div
                    key={
                      field.key
                    }
                    className="flex items-start justify-between gap-3 rounded-[9px] bg-[#f8fafc] px-2.5 py-2"
                  >
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-[0.07em] text-[#64748b]">
                        {getFieldLabel(
                          field.key,
                        )}
                      </div>

                      <div className="mt-0.5 text-[11.5px] font-semibold text-[#172033]">
                        {formatValue(
                          field.value,
                        )}
                      </div>

                      <div className="mt-0.5 text-[9px] text-[#94a3b8]">
                        {field.source} · {field.status}
                      </div>
                    </div>

                    <span className="rounded-md bg-white px-1.5 py-0.5 text-[9px] font-medium text-[#64748b] ring-1 ring-black/5">
                      {Math.round(
                        field.confidence *
                          100,
                      )}
                      %
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        <section className="rounded-[16px] border border-black/10 bg-white/70 p-3.5 shadow-sm">
          <h3 className="text-[12.5px] font-semibold text-[#172033]">
            Información relevante pendiente
          </h3>

          {missingLabels.length ===
          0 ? (
            <p className="mt-2 text-[11px] text-emerald-700">
              No quedan campos prioritarios pendientes.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {missingLabels.map(
                (label) => (
                  <span
                    key={label}
                    className="rounded-[7px] bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700 ring-1 ring-amber-100"
                  >
                    {label}
                  </span>
                ),
              )}
            </div>
          )}
        </section>

        <section className="rounded-[16px] border border-black/10 bg-white/70 p-3.5 shadow-sm">
          <h3 className="text-[12.5px] font-semibold text-[#172033]">
            Decisión actual
          </h3>

          <div className="mt-2 space-y-2 text-[11px]">
            <div className="flex justify-between gap-3">
              <span className="text-[#64748b]">
                Objetivo
              </span>

              <span className="text-right font-medium text-[#172033]">
                {brainState
                  ? getObjectiveLabel(
                      brainState
                        .responseDecision
                        .responseObjective,
                    )
                  : "—"}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-[#64748b]">
                Derivar
              </span>

              <span className="font-medium text-[#172033]">
                {brainState
                  ?.responseDecision
                  .shouldHandoff
                  ? "Sí"
                  : "No"}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-[#64748b]">
                Motivo
              </span>

              <span className="text-right font-medium text-[#172033]">
                {getHandoffReasonLabel(
                  brainState
                    ?.responseDecision
                    .handoffReason ||
                    null,
                )}
              </span>
            </div>
          </div>

          {brainState
            ?.commercialEvaluation
            .scoreReasoning
            .length ? (
            <div className="mt-3 border-t border-black/5 pt-3">
              <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#64748b]">
                Motivos del score
              </div>

              <div className="mt-2 space-y-1">
                {brainState
                  .commercialEvaluation
                  .scoreReasoning
                  .map(
                    (
                      reason,
                      index,
                    ) => (
                      <p
                        key={`${reason}-${index}`}
                        className="text-[10.5px] leading-relaxed text-[#64748b]"
                      >
                        • {reason}
                      </p>
                    ),
                  )}
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-[16px] border border-black/10 bg-white/70 p-3.5 shadow-sm">
          <h3 className="text-[12.5px] font-semibold text-[#172033]">
            Señales para NIA
          </h3>

          {!brainState ||
          brainState.niaSignals
            .length === 0 ? (
            <p className="mt-2 text-[11px] text-[#94a3b8]">
              No hay señales activas.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {brainState.niaSignals.map(
                (
                  signal,
                  index,
                ) => (
                  <article
                    key={`${signal.type}-${index}`}
                    className="rounded-[10px] border border-amber-200 bg-amber-50 px-2.5 py-2"
                  >
                    <div className="text-[11px] font-semibold text-amber-800">
                      {signal.title}
                    </div>

                    <p className="mt-1 text-[10.5px] leading-relaxed text-amber-700">
                      {signal.summary}
                    </p>
                  </article>
                ),
              )}
            </div>
          )}
        </section>

        <section className="rounded-[16px] border border-black/10 bg-white/70 p-3.5 shadow-sm">
          <h3 className="text-[12.5px] font-semibold text-[#172033]">
            Motor utilizado
          </h3>

          <div className="mt-2 space-y-1 text-[10.5px] text-[#64748b]">
            <div>
              Modelo:{" "}
              <span className="font-medium text-[#172033]">
                {analyzerMetadata.model ||
                  "—"}
              </span>
            </div>

            <div>
              Prompt:{" "}
              <span className="font-medium text-[#172033]">
                {analyzerMetadata.promptVersion ||
                  "—"}
              </span>
            </div>

            <div>
              Último análisis:{" "}
              <span className="font-medium text-[#172033]">
                {analyzerMetadata.analyzedAt
                  ? new Date(
                      analyzerMetadata.analyzedAt,
                    ).toLocaleString(
                      "es-AR",
                    )
                  : "—"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

export default CandeSimulator;
