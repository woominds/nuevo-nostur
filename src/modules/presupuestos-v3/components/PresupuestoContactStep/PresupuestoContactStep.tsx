import {
  Check,
  ChevronDown,
  Loader2,
  Search,
  UserRound,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getClientesParaPresupuesto,
} from "../../services/presupuestoClientesService";

import type {
  PresupuestoClienteOption,
} from "../../services/presupuestoClientesService";

import type {
  PresupuestoContacto,
} from "../../types/editor.types";

type PresupuestoContactStepProps = {
  open: boolean;
  onClose: () => void;
  onContinue: (
    contacto: PresupuestoContacto,
  ) => void;
};

type ContactMode =
  | "cliente"
  | "manual";

const normalizeText = (
  value: string,
): string => {
  return value
    .toLocaleLowerCase("es-AR")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .trim();
};

const getInitials = (
  value: string,
): string => {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "CL";
  }

  return parts
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join("");
};

export function PresupuestoContactStep({
  open,
  onClose,
  onContinue,
}: PresupuestoContactStepProps) {
  const [
    clientes,
    setClientes,
  ] = useState<
    PresupuestoClienteOption[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    mode,
    setMode,
  ] = useState<ContactMode>(
    "cliente",
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    selectorOpen,
    setSelectorOpen,
  ] = useState(false);

  const [
    selectedClienteId,
    setSelectedClienteId,
  ] = useState<string | null>(
    null,
  );

  const [
    nombre,
    setNombre,
  ] = useState("");

  const [
    telefono,
    setTelefono,
  ] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const loadClientes =
      async () => {
        setLoading(true);
        setError(null);

        try {
          const result =
            await getClientesParaPresupuesto();

          if (cancelled) {
            return;
          }

          setClientes(result);
        } catch (
          loadError
        ) {
          if (cancelled) {
            return;
          }

          setClientes([]);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudieron cargar los clientes.",
          );
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    void loadClientes();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      return;
    }

    setMode("cliente");
    setSearch("");
    setSelectorOpen(false);
    setSelectedClienteId(null);
    setNombre("");
    setTelefono("");
    setError(null);
  }, [open]);

  const filteredClientes =
    useMemo(() => {
      const normalizedSearch =
        normalizeText(search);

      if (!normalizedSearch) {
        return clientes;
      }

      return clientes.filter(
        (cliente) =>
          normalizeText(
            [
              cliente.nombre_completo,
              cliente.telefono,
              cliente.email,
            ].join(" "),
          ).includes(
            normalizedSearch,
          ),
      );
    }, [
      clientes,
      search,
    ]);

  const selectedCliente =
    useMemo(
      () =>
        clientes.find(
          (cliente) =>
            cliente.id ===
            selectedClienteId,
        ) ?? null,
      [
        clientes,
        selectedClienteId,
      ],
    );

  const handleSelectCliente = (
    cliente: PresupuestoClienteOption,
  ) => {
    setSelectedClienteId(
      cliente.id,
    );

    setNombre(
      cliente.nombre_completo,
    );

    setTelefono(
      cliente.telefono,
    );

    setSearch(
      cliente.nombre_completo,
    );

    setSelectorOpen(false);
  };

  const handleModeChange = (
    nextMode: ContactMode,
  ) => {
    setMode(nextMode);
    setSelectorOpen(false);
    setSearch("");
    setSelectedClienteId(null);
    setNombre("");
    setTelefono("");
  };

  const canContinue =
    nombre.trim().length > 0 &&
    telefono.trim().length > 0 &&
    (
      mode === "manual" ||
      selectedClienteId !== null
    );

  const handleContinue = () => {
    if (!canContinue) {
      return;
    }

    onContinue({
      clienteId:
        mode === "cliente"
          ? selectedClienteId
          : null,

      nombre:
        nombre.trim(),

      telefono:
        telefono.trim(),
    });
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[320] flex items-center justify-center bg-slate-950/40 p-3 backdrop-blur-[3px] sm:p-6"
      onMouseDown={onClose}
    >
      <section
        className="flex h-[min(760px,92dvh)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_32px_100px_rgba(15,23,42,0.32)]"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="flex shrink-0 items-start justify-between gap-5 border-b border-slate-200 px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-[#172033]">
              Datos del presupuesto
            </h2>

            <p className="mt-1.5 text-sm leading-5 text-slate-500">
              Vinculalo con un cliente existente o cargá solamente los datos del contacto.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() =>
                handleModeChange(
                  "cliente",
                )
              }
              className={[
                "h-11 rounded-lg px-3 text-sm font-semibold transition",
                mode === "cliente"
                  ? "bg-white text-[#172033] shadow-sm"
                  : "text-slate-500 hover:text-slate-800",
              ].join(" ")}
            >
              Cliente existente
            </button>

            <button
              type="button"
              onClick={() =>
                handleModeChange(
                  "manual",
                )
              }
              className={[
                "h-11 rounded-lg px-3 text-sm font-semibold transition",
                mode === "manual"
                  ? "bg-white text-[#172033] shadow-sm"
                  : "text-slate-500 hover:text-slate-800",
              ].join(" ")}
            >
              Contacto no registrado
            </button>
          </div>

          {mode === "cliente" ? (
            <div className="mt-6">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Buscar cliente
                </span>

                <div className="relative">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onFocus={() =>
                      setSelectorOpen(true)
                    }
                    onChange={(event) => {
                      setSearch(
                        event.target.value,
                      );

                      setSelectedClienteId(
                        null,
                      );

                      setNombre("");
                      setTelefono("");
                      setSelectorOpen(true);
                    }}
                    placeholder="Nombre, teléfono o email..."
                    autoComplete="off"
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-12 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FF634A] focus:ring-2 focus:ring-[#FF634A]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setSelectorOpen(
                        (current) =>
                          !current,
                      )
                    }
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Mostrar clientes"
                  >
                    {loading ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <ChevronDown
                        size={17}
                        className={
                          selectorOpen
                            ? "rotate-180 transition"
                            : "transition"
                        }
                      />
                    )}
                  </button>
                </div>
              </label>

              {selectorOpen ? (
                <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.12)]">
                  <div className="max-h-[330px] overflow-y-auto p-1.5">
                    {loading ? (
                      <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-500">
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />

                        Cargando clientes...
                      </div>
                    ) : error ? (
                      <div className="flex min-h-40 items-center justify-center px-4 text-center text-sm text-red-600">
                        {error}
                      </div>
                    ) : filteredClientes.length ===
                      0 ? (
                      <div className="flex min-h-40 flex-col items-center justify-center px-4 text-center">
                        <UserRound
                          size={26}
                          className="text-slate-300"
                        />

                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          No encontramos clientes
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Podés continuar desde “Contacto no registrado”.
                        </p>
                      </div>
                    ) : (
                      filteredClientes.map(
                        (cliente) => {
                          const selected =
                            cliente.id ===
                            selectedClienteId;

                          return (
                            <button
                              key={
                                cliente.id
                              }
                              type="button"
                              onClick={() =>
                                handleSelectCliente(
                                  cliente,
                                )
                              }
                              className={[
                                "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition",
                                selected
                                  ? "bg-[#FFF4F1]"
                                  : "hover:bg-slate-50",
                              ].join(" ")}
                            >
                              <span
                                className={[
                                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                  selected
                                    ? "bg-[#FF634A] text-white"
                                    : "bg-slate-100 text-slate-500",
                                ].join(" ")}
                              >
                                {getInitials(
                                  cliente.nombre_completo,
                                )}
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-slate-900">
                                  {
                                    cliente.nombre_completo
                                  }
                                </span>

                                <span className="mt-0.5 block truncate text-xs text-slate-500">
                                  {
                                    cliente.telefono
                                  }

                                  {cliente.email
                                    ? ` · ${cliente.email}`
                                    : ""}
                                </span>
                              </span>

                              {selected ? (
                                <Check
                                  size={18}
                                  className="shrink-0 text-[#FF634A]"
                                />
                              ) : null}
                            </button>
                          );
                        },
                      )
                    )}
                  </div>

                  {!loading &&
                  !error &&
                  filteredClientes.length >
                    0 ? (
                    <div className="border-t border-slate-100 px-4 py-2.5 text-xs font-medium text-slate-500">
                      {
                        filteredClientes.length
                      }{" "}
                      {filteredClientes.length ===
                      1
                        ? "cliente encontrado"
                        : "clientes encontrados"}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {selectedCliente ? (
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-[#FF634A]/25 bg-[#FFF4F1] p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FF634A] text-xs font-bold text-white">
                    {getInitials(
                      selectedCliente.nombre_completo,
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#FF634A]">
                      Cliente vinculado
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                      {
                        selectedCliente.nombre_completo
                      }
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-600">
                      {
                        selectedCliente.telefono
                      }
                    </p>
                  </div>

                  <Check
                    size={20}
                    className="shrink-0 text-[#FF634A]"
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Estos datos se guardarán solamente dentro del presupuesto. No se creará un cliente nuevo en el sistema.
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Nombre completo
                  </span>

                  <input
                    type="text"
                    value={nombre}
                    onChange={(event) =>
                      setNombre(
                        event.target.value,
                      )
                    }
                    placeholder="Nombre del contacto"
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A] focus:ring-2 focus:ring-[#FF634A]/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Teléfono
                  </span>

                  <input
                    type="tel"
                    value={telefono}
                    onChange={(event) =>
                      setTelefono(
                        event.target.value,
                      )
                    }
                    placeholder="+54 9..."
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A] focus:ring-2 focus:ring-[#FF634A]/10"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={!canContinue}
            onClick={handleContinue}
            className="h-10 rounded-lg bg-[#FF634A] px-5 text-sm font-semibold text-white transition hover:bg-[#f0543d] disabled:cursor-not-allowed disabled:bg-[#FFB7AB] disabled:text-white"
          >
            Elegir template
          </button>
        </footer>
      </section>
    </div>
  );
}
