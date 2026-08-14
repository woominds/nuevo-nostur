import {
  Check,
  ChevronDown,
  Download,
  Hotel,
  Loader2,
  Plane,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  parsePresupuestoConIa,
} from "../../services/presupuestoAiService";

import {
  PresupuestoRapidoPdfRenderer,
} from "../PresupuestoRapidoPdfRenderer/PresupuestoRapidoPdfRenderer";

import {
  exportPresupuestoRapidoPdf,
} from "../../utils/presupuestoRapidoPdf";

import type {
  AiParsedBudget,
} from "../../services/presupuestoAiService";

import {
  getVendedoresParaPresupuesto,
} from "../../services/presupuestoVendedoresService";

import type {
  PresupuestoContacto,
  PresupuestoVendedor,
} from "../../types/editor.types";

type PresupuestoRapidoIAModalProps = {
  open: boolean;

  contacto: PresupuestoContacto | null;

  onClose: () => void;
};

const formatPrice = (
  parsed: AiParsedBudget,
): string => {
  const option =
    parsed.opciones_comerciales?.[0];

  if (
    !option ||
    option.precio_total == null
  ) {
    return "Sin precio detectado";
  }

  const suffix =
    option.tipo_precio ===
    "POR_PASAJERO"
      ? " por pasajero"
      : option.tipo_precio ===
          "POR_HABITACION"
        ? " por habitación"
        : "";

  return `${
    option.moneda || "USD"
  } ${option.precio_total.toLocaleString(
    "es-AR",
    {
      maximumFractionDigits: 2,
    },
  )}${suffix}`;
};

export function PresupuestoRapidoIAModal({
  open,
  contacto,
  onClose,
}: PresupuestoRapidoIAModalProps) {
  const [
    vendedores,
    setVendedores,
  ] = useState<
    PresupuestoVendedor[]
  >([]);

  const [
    selectedVendedorId,
    setSelectedVendedorId,
  ] = useState<string | null>(
    null,
  );

  const [
    vendedorOpen,
    setVendedorOpen,
  ] = useState(false);

  const exportContainerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    exporting,
    setExporting,
  ] = useState(false);

  const [
    text,
    setText,
  ] = useState("");

  const [
    parsed,
    setParsed,
  ] = useState<AiParsedBudget | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    loadingVendedores,
    setLoadingVendedores,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!open) {
      setVendedorOpen(false);
      setParsed(null);
      setError(null);
      setText("");
      return;
    }

    let cancelled = false;

    const load =
      async () => {
        setLoadingVendedores(
          true,
        );

        try {
          const result =
            await getVendedoresParaPresupuesto();

          if (cancelled) {
            return;
          }

          setVendedores(
            result,
          );

          setSelectedVendedorId(
            (
              current
            ) =>
              current &&
              result.some(
                (item) =>
                  item.id ===
                  current,
              )
                ? current
                : result[0]?.id ??
                  null,
          );
        } catch (
          loadError
        ) {
          if (cancelled) {
            return;
          }

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "No se pudieron cargar los vendedores.",
          );
        } finally {
          if (!cancelled) {
            setLoadingVendedores(
              false,
            );
          }
        }
      };

    void load();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedVendedor =
    useMemo(
      () =>
        vendedores.find(
          (vendedor) =>
            vendedor.id ===
            selectedVendedorId,
        ) ?? null,
      [
        vendedores,
        selectedVendedorId,
      ],
    );

  const canAnalyze =
    Boolean(
      contacto &&
      selectedVendedor &&
      text.trim().length >
        10 &&
      !loading,
    );

  const handleAnalyze =
    async () => {
      if (!canAnalyze) {
        return;
      }

      setLoading(true);
      setError(null);
      setParsed(null);

      try {
        const result =
          await parsePresupuestoConIa(
            text,
          );

        setParsed(result);
      } catch (
        analyzeError
      ) {
        setError(
          analyzeError instanceof
            Error
            ? analyzeError.message
            : "No se pudo analizar el presupuesto.",
        );
      } finally {
        setLoading(false);
      }
    };

  const handleDownloadPdf =
    async () => {
      if (
        !parsed ||
        !contacto ||
        !selectedVendedor ||
        !exportContainerRef.current ||
        exporting
      ) {
        return;
      }

      setExporting(true);
      setError(null);

      try {
        const destination =
          parsed.hoteles
            .map(
              (hotel) =>
                hotel.destino,
            )
            .filter(Boolean)
            .join("-") ||
          parsed.vuelos.find(
            (flight) =>
              flight.tipo_tramo ===
              "IDA",
          )?.destino_ciudad ||
          "Viaje";

        await exportPresupuestoRapidoPdf(
          exportContainerRef.current,
          `Presupuesto-${destination}-${contacto.nombre}`,
        );
      } catch (
        exportError
      ) {
        setError(
          exportError instanceof
            Error
            ? exportError.message
            : "No se pudo generar el PDF.",
        );
      } finally {
        setExporting(false);
      }
    };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[360] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[3px] sm:p-6">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF4F1] text-[#FF634A]">
                <Sparkles
                  size={18}
                />
              </span>

              <div>
                <h2 className="text-base font-bold text-[#172033]">
                  Presupuesto rápido con IA
                </h2>

                <p className="text-xs text-slate-500">
                  Pegá la información del operador y NOSTUR la convierte en un presupuesto editable.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Cliente
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <UserRound
                    size={16}
                    className="text-[#FF634A]"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {contacto?.nombre ||
                        "Sin cliente"}
                    </p>

                    <p className="text-xs text-slate-500">
                      {contacto?.telefono ||
                        "Sin teléfono"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Vendedor
                </label>

                <div className="relative">
                  <button
                    type="button"
                    disabled={
                      loadingVendedores
                    }
                    onClick={() => {
                      setVendedorOpen(
                        (
                          current
                        ) =>
                          !current,
                      );

                    }}
                    className="flex h-11 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm transition hover:border-slate-300 disabled:opacity-60"
                  >
                    <span className="truncate font-medium text-slate-800">
                      {loadingVendedores
                        ? "Cargando vendedores..."
                        : selectedVendedor
                          ?.nombre ||
                          "Seleccionar vendedor"}
                    </span>

                    {loadingVendedores ? (
                      <Loader2
                        size={15}
                        className="animate-spin text-slate-400"
                      />
                    ) : (
                      <ChevronDown
                        size={15}
                        className="text-slate-400"
                      />
                    )}
                  </button>

                  {vendedorOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                      {vendedores.map(
                        (
                          vendedor,
                        ) => (
                          <button
                            key={
                              vendedor.id
                            }
                            type="button"
                            onClick={() => {
                              setSelectedVendedorId(
                                vendedor.id,
                              );

                              setVendedorOpen(
                                false,
                              );
                            }}
                            className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-slate-50"
                          >
                            <span>
                              <span className="block text-sm font-semibold text-slate-800">
                                {
                                  vendedor.nombre
                                }
                              </span>

                              <span className="block text-xs text-slate-500">
                                {
                                  vendedor.email
                                }
                              </span>
                            </span>

                            {selectedVendedorId ===
                            vendedor.id ? (
                              <Check
                                size={15}
                                className="text-[#FF634A]"
                              />
                            ) : null}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Información del presupuesto
                </label>

                <textarea
                  value={text}
                  onChange={(
                    event,
                  ) => {
                    setText(
                      event.target
                        .value,
                    );

                    setParsed(
                      null,
                    );
                  }}
                  placeholder="Pegá acá el texto completo del vuelo, hoteles, traslados, precio, formas de pago, equipaje, etc."
                  className="min-h-[300px] w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FF634A]"
                />

                <p className="mt-1 text-[11px] text-slate-400">
                  No hace falta ordenar ni limpiar el texto. Pegalo como viene del operador.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  !canAnalyze
                }
                onClick={() =>
                  void handleAnalyze()
                }
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#172033] px-4 text-sm font-semibold text-white transition hover:bg-[#253149] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Sparkles
                    size={17}
                  />
                )}

                {loading
                  ? "Analizando presupuesto..."
                  : "Analizar con IA"}
              </button>

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border border-slate-200 bg-[#f8fafc] p-4">
              {!parsed ? (
                <div className="flex min-h-[440px] items-center justify-center text-center">
                  <div className="max-w-sm">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                      <Sparkles
                        size={21}
                      />
                    </span>

                    <h3 className="mt-3 text-sm font-semibold text-slate-800">
                      Revisión de la IA
                    </h3>

                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Después de analizar el texto vas a poder revisar vuelos, hoteles, servicios y valores antes de generar el canvas.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">
                        Análisis completado
                      </p>

                      <h3 className="mt-1 text-base font-bold text-[#172033]">
                        {parsed
                          .resumen_humano
                          ?.titulo ||
                          "Contenido detectado"}
                      </h3>
                    </div>

                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                      {Math.round(
                        (parsed.confianza ||
                          0) *
                          100,
                      )}
                      % confianza
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <Plane
                        size={16}
                        className="text-[#FF634A]"
                      />

                      <p className="mt-2 text-lg font-bold text-slate-900">
                        {
                          parsed.vuelos
                            .length
                        }
                      </p>

                      <p className="text-xs text-slate-500">
                        vuelos
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <Hotel
                        size={16}
                        className="text-[#FF634A]"
                      />

                      <p className="mt-2 text-lg font-bold text-slate-900">
                        {
                          parsed.hoteles
                            .length
                        }
                      </p>

                      <p className="text-xs text-slate-500">
                        hoteles
                      </p>
                    </div>
                  </div>

                  {parsed.vuelos.map(
                    (
                      vuelo,
                      index,
                    ) => (
                      <div
                        key={`${vuelo.tipo_tramo}-${index}`}
                        className="mt-3 rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <p className="text-xs font-bold text-[#FF634A]">
                          {vuelo.tipo_tramo ||
                            `Vuelo ${index + 1}`}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {vuelo.ruta_resumen ||
                            `${vuelo.origen_iata || ""} → ${vuelo.destino_iata || ""}`}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {[
                            vuelo.aerolinea,
                            vuelo.hora_salida
                              ? `Salida ${vuelo.hora_salida}`
                              : "",
                            vuelo.hora_llegada
                              ? `Llegada ${vuelo.hora_llegada}${vuelo.llega_dia_siguiente ? " (+1)" : ""}`
                              : "",
                            vuelo.duracion_total
                              ? `Duración ${vuelo.duracion_total}`
                              : "",
                          ]
                            .filter(
                              Boolean,
                            )
                            .join(
                              " · ",
                            )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {vuelo.cantidad_escalas ===
                          0
                            ? "Directo"
                            : `${vuelo.cantidad_escalas || 0} escala(s)`}
                        </p>
                      </div>
                    ),
                  )}

                  {parsed.hoteles.map(
                    (
                      hotel,
                      index,
                    ) => (
                      <div
                        key={`${hotel.nombre}-${index}`}
                        className="mt-3 rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <p className="text-xs font-bold text-[#FF634A]">
                          Alojamiento
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {hotel.nombre ||
                            hotel.titulo ||
                            "Hotel"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {[
                            hotel.destino,
                            hotel.habitacion,
                            hotel.ocupacion,
                            hotel.regimen,
                          ]
                            .filter(
                              Boolean,
                            )
                            .join(
                              " · ",
                            )}
                        </p>
                      </div>
                    ),
                  )}

                  {parsed.servicios
                    .length > 0 ? (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-bold text-[#FF634A]">
                        Servicios
                      </p>

                      <div className="mt-2 space-y-1">
                        {parsed.servicios.map(
                          (
                            servicio,
                            index,
                          ) => (
                            <p
                              key={`${servicio.tipo}-${index}`}
                              className="text-xs text-slate-600"
                            >
                              ✓{" "}
                              {servicio.nombre ||
                                servicio.tipo}
                            </p>
                          ),
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-3 rounded-lg border border-[#FF634A]/20 bg-[#FFF4F1] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#FF634A]">
                      Valor detectado
                    </p>

                    <p className="mt-1 text-xl font-extrabold text-[#172033]">
                      {formatPrice(
                        parsed,
                      )}
                    </p>

                    {parsed
                      .opciones_comerciales?.[0]
                      ?.forma_pago_resumen ? (
                      <p className="mt-1 text-xs font-medium text-slate-600">
                        {
                          parsed
                            .opciones_comerciales[0]
                            .forma_pago_resumen
                        }
                      </p>
                    ) : null}
                  </div>

                  {parsed
                    .resumen_humano
                    ?.advertencias
                    ?.length ? (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-bold text-amber-800">
                        Revisar
                      </p>

                      {parsed.resumen_humano.advertencias.map(
                        (
                          warning,
                        ) => (
                          <p
                            key={
                              warning
                            }
                            className="mt-1 text-xs text-amber-700"
                          >
                            • {warning}
                          </p>
                        ),
                      )}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    disabled={exporting}
                    onClick={() =>
                      void handleDownloadPdf()
                    }
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#FF634A] px-4 text-sm font-bold text-white transition hover:bg-[#f0543d] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {exporting ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Download
                        size={17}
                      />
                    )}

                    {exporting
                      ? "Generando PDF..."
                      : "Generar presupuesto PDF"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {parsed &&
      contacto &&
      selectedVendedor ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-[-100000px] top-0 z-[-1]"
        >
          <div
            ref={
              exportContainerRef
            }
            className="bg-white"
          >
            <PresupuestoRapidoPdfRenderer
              parsed={parsed}
              contacto={contacto}
              vendedor={
                selectedVendedor
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
