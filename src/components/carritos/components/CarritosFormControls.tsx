import {
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  ChevronDown,
  Search
} from "lucide-react";
import {
  normalizeText,
  type SelectOption
} from "../carritosModel";

type TextInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
};

type TextAreaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

type NosturSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
};

export function FieldLabel({
  children
}: {
  children: ReactNode;
}) {
  return (
    <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#64748b]">
      {children}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  inputMode = "text"
}: TextInputProps) {
  return (
    <input
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
      placeholder={placeholder}
      inputMode={inputMode}
      className="h-8 w-full rounded-[10px] border border-black/10 bg-white px-3 text-[12px] font-normal text-[#172033] outline-none transition placeholder:text-[#94a3b8] focus:border-[#4f7c90]"
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder
}: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
      placeholder={placeholder}
      className="min-h-[78px] w-full resize-none rounded-[10px] border border-black/10 bg-white px-3 py-2 text-[12px] font-normal leading-relaxed text-[#172033] outline-none transition placeholder:text-[#94a3b8] focus:border-[#4f7c90]"
    />
  );
}

export function NosturSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar"
}: NosturSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find(
    (option) =>
      option.value === value
  );

  const filteredOptions = useMemo(() => {
    const query =
      normalizeText(search);

    if (!query) {
      return options;
    }

    return options.filter((option) =>
      normalizeText(
        `${option.label} ${option.value}`
      ).includes(query)
    );
  }, [
    options,
    search
  ]);

  function closeSelect() {
    setOpen(false);
    setSearch("");
  }

  return (
    <div
      className={[
        "relative",
        open
          ? "z-[140]"
          : "z-0"
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        className="flex h-8 w-full items-center justify-between gap-2 rounded-[10px] border border-black/10 bg-white px-3 text-left text-[12px] font-normal text-[#172033] outline-none transition hover:bg-[#f8fafc]"
      >
        <span
          className={
            selected
              ? "truncate"
              : "truncate text-[#94a3b8]"
          }
        >
          {selected?.label ||
            placeholder}
        </span>

        <ChevronDown
          size={13}
          strokeWidth={1.8}
          className={[
            "shrink-0 text-[#64748b] transition",
            open
              ? "rotate-180"
              : ""
          ].join(" ")}
        />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={closeSelect}
            tabIndex={-1}
            aria-label="Cerrar selector"
          />

          <div className="absolute left-0 right-0 top-[36px] z-[150] rounded-[14px] border border-black/10 bg-white p-2 shadow-xl">
            <div className="mb-2 flex h-8 items-center gap-2 rounded-[10px] border border-black/10 bg-[#f8fafc] px-2">
              <Search
                size={13}
                className="text-[#94a3b8]"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Buscar..."
                autoFocus
                className="h-full min-w-0 flex-1 bg-transparent text-[12px] font-normal outline-none placeholder:text-[#94a3b8]"
              />
            </div>

            <div className="max-h-56 overflow-auto">
              {filteredOptions.length ===
              0 ? (
                <div className="px-3 py-2 text-[12px] font-normal text-[#94a3b8]">
                  Sin opciones
                </div>
              ) : (
                filteredOptions.map(
                  (option) => {
                    const active =
                      option.value ===
                      value;

                    return (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        onClick={() => {
                          onChange(
                            option.value
                          );

                          closeSelect();
                        }}
                        className={[
                          "flex h-8 w-full items-center rounded-[10px] px-3 text-left text-[12px] font-medium transition",
                          active
                            ? "bg-[#4f7c90] text-white"
                            : "text-[#334155] hover:bg-[#f1f5f9]"
                        ].join(" ")}
                      >
                        <span className="truncate">
                          {
                            option.label
                          }
                        </span>
                      </button>
                    );
                  }
                )
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
