import {
  useMemo,
  useState
} from "react";
import {
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  X
} from "lucide-react";
import {
  normalizeText,
  type SelectOption
} from "../carritosModel";

type DestinosMultiSelectProps = {
  values: string[];
  onChange: (values: string[]) => void;
  options: SelectOption[];
  onCreate: (
    name: string,
    pais?: string
  ) => Promise<string | null>;
};

type BooleanChipProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
};

export function DestinosMultiSelect({
  values,
  onChange,
  options,
  onCreate
}: DestinosMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pais, setPais] = useState(
    "Sin especificar"
  );
  const [creating, setCreating] =
    useState(false);

  const filteredOptions = useMemo(() => {
    const normalizedQuery =
      normalizeText(query);

    return options
      .filter((option) => {
        const alreadySelected =
          values.some(
            (value) =>
              normalizeText(value) ===
              normalizeText(option.value)
          );

        if (alreadySelected) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return normalizeText(
          `${option.label} ${option.value}`
        ).includes(normalizedQuery);
      })
      .slice(0, 80);
  }, [
    options,
    query,
    values
  ]);

  function addValue(value: string) {
    const cleanValue =
      value.trim();

    if (!cleanValue) {
      return;
    }

    const exists =
      values.some(
        (item) =>
          normalizeText(item) ===
          normalizeText(cleanValue)
      );

    if (exists) {
      setQuery("");
      return;
    }

    onChange([
      ...values,
      cleanValue
    ]);

    setQuery("");
  }

  function removeValue(
    value: string
  ) {
    onChange(
      values.filter(
        (item) =>
          normalizeText(item) !==
          normalizeText(value)
      )
    );
  }

  async function handleCreate() {
    const cleanName =
      query.trim();

    if (
      !cleanName ||
      creating
    ) {
      return;
    }

    setCreating(true);

    try {
      const createdName =
        await onCreate(
          cleanName,
          pais ||
            "Sin especificar"
        );

      if (createdName) {
        addValue(createdName);

        setPais(
          "Sin especificar"
        );

        setOpen(false);
      }
    } finally {
      setCreating(false);
    }
  }

  const canCreate =
    query.trim().length >= 2 &&
    !options.some(
      (option) =>
        normalizeText(
          option.value
        ) ===
        normalizeText(query)
    ) &&
    !values.some(
      (value) =>
        normalizeText(value) ===
        normalizeText(query)
    );

  return (
    <div
      className={[
        "relative",
        open
          ? "z-[140]"
          : "z-0"
      ].join(" ")}
    >
      <div className="min-h-8 rounded-[10px] border border-black/10 bg-white px-2 py-1 focus-within:border-[#4f7c90]">
        <div className="flex flex-wrap items-center gap-1">
          {values.map(
            (value) => (
              <span
                key={value}
                className="flex h-6 max-w-full items-center gap-1 rounded-md bg-[#eef6f7] px-1.5 text-[11px] font-medium text-[#334155]"
              >
                <span className="truncate">
                  {value}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    removeValue(
                      value
                    )
                  }
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[#64748b] hover:bg-white hover:text-red-600"
                  aria-label={`Quitar ${value}`}
                >
                  <X size={10} />
                </button>
              </span>
            )
          )}

          <input
            value={query}
            onFocus={() =>
              setOpen(true)
            }
            onChange={(event) => {
              setQuery(
                event.target.value
              );

              setOpen(true);
            }}
            placeholder={
              values.length === 0
                ? "Buscar o crear destinos"
                : "Agregar destino"
            }
            className="h-6 min-w-[150px] flex-1 bg-transparent px-1 text-[12px] font-normal text-[#172033] outline-none placeholder:text-[#94a3b8]"
          />

          <button
            type="button"
            onClick={() =>
              setOpen(
                (current) =>
                  !current
              )
            }
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] text-[#64748b] hover:bg-[#f8fafc]"
            aria-label="Abrir selector de destinos"
          >
            <ChevronDown
              size={13}
              strokeWidth={1.8}
              className={[
                "transition",
                open
                  ? "rotate-180"
                  : ""
              ].join(" ")}
            />
          </button>
        </div>
      </div>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={() =>
              setOpen(false)
            }
            tabIndex={-1}
            aria-label="Cerrar destinos"
          />

          <div className="absolute left-0 right-0 top-[36px] z-[150] rounded-[14px] border border-black/10 bg-white p-2 shadow-xl">
            <div className="max-h-56 overflow-auto">
              {filteredOptions.length ===
              0 ? (
                <div className="px-3 py-2 text-[12px] font-normal text-[#94a3b8]">
                  No encontramos ese destino.
                </div>
              ) : (
                filteredOptions.map(
                  (option) => (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      onClick={() => {
                        addValue(
                          option.value
                        );

                        setOpen(false);
                      }}
                      className="flex h-8 w-full items-center rounded-[10px] px-3 text-left text-[12px] font-medium text-[#334155] transition hover:bg-[#f1f5f9]"
                    >
                      <span className="truncate">
                        {
                          option.label
                        }
                      </span>
                    </button>
                  )
                )
              )}
            </div>

            {canCreate ? (
              <div className="mt-2 rounded-[14px] border border-[#4f7c90]/20 bg-[#eef6f7] p-2.5">
                <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#64748b]">
                  Crear destino nuevo
                </div>

                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
                  <div className="flex h-8 min-w-0 items-center rounded-[10px] bg-white px-3 text-[12px] font-medium text-[#172033]">
                    <span className="truncate">
                      {query.trim()}
                    </span>
                  </div>

                  <input
                    value={pais}
                    onChange={(event) =>
                      setPais(
                        event.target.value
                      )
                    }
                    placeholder="País"
                    className="h-8 rounded-[10px] border border-black/10 bg-white px-3 text-[12px] font-normal outline-none focus:border-[#4f7c90]"
                  />

                  <button
                    type="button"
                    onClick={
                      handleCreate
                    }
                    disabled={
                      creating
                    }
                    className="h-8 rounded-[10px] bg-[#4f7c90] px-3 text-[12px] font-medium text-white hover:bg-[#406b7d] disabled:opacity-50"
                  >
                    {creating
                      ? "Creando..."
                      : "Crear"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function BooleanChip({
  checked,
  onChange,
  label
}: BooleanChipProps) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(!checked)
      }
      className={[
        "flex h-8 items-center justify-center gap-1.5 rounded-[10px] border px-3 text-[12px] font-medium transition",
        checked
          ? "border-[#4f7c90]/30 bg-[#eef6f7] text-[#172033]"
          : "border-black/10 bg-white text-[#64748b] hover:bg-[#f8fafc]"
      ].join(" ")}
    >
      {checked ? (
        <ToggleRight
          size={15}
        />
      ) : (
        <ToggleLeft
          size={15}
        />
      )}

      <span className="truncate">
        {label}
      </span>
    </button>
  );
}
