import {
  useMemo,
  useState,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode
} from "react";

import {
  Check,
  ChevronDown,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

import {
  normalizeText,
  type SelectOption
} from "../filesModel";

type TextInputProps = {
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
};

type TextAreaProps = {
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
};

type MoneyInputProps = {
  value: number | string;
  onChange: (value: string) => void;
  placeholder?: string;
};

type BooleanChipProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
};

type LineButtonProps = {
  children: ReactNode;
  onClick: () => void;
};

type NosturSelectProps = {
  value: string | string[];
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  multiple?: boolean;
  creatable?: boolean;
  onCreateOption?: (name: string) => Promise<void>;
};

export function FieldLabel({
  children
}: {
  children: ReactNode;
}) {
  return (
    <label className="mb-1 block text-[10px] font-medium uppercase tracking-[.12em] text-slate-500">
      {children}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  inputMode = "text",
  type = "text"
}: TextInputProps) {
  return (
    <input
      type={type}
      value={value ?? ""}
      inputMode={inputMode}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-sky-500"
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4
}: TextAreaProps) {
  return (
    <textarea
      rows={rows}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs outline-none focus:border-sky-500"
    />
  );
}

export function MoneyInput({
  value,
  onChange,
  placeholder
}: MoneyInputProps) {
  return (
    <input
      value={String(value ?? "")}
      placeholder={placeholder}
      inputMode="decimal"
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-sky-500"
    />
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
      onClick={() => onChange(!checked)}
      className={[
        "inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs font-medium transition",
        checked
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      ].join(" ")}
    >
      {checked ? (
        <ToggleRight size={15} />
      ) : (
        <ToggleLeft size={15} />
      )}

      {label}
    </button>
  );
}

export function LineButton({
  children,
  onClick
}: LineButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 text-xs font-medium text-sky-700 hover:underline"
    >
      <Plus size={14} />
      {children}
    </button>
  );
}

export function NosturSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar",
  multiple = false,
  creatable = false,
  onCreateOption
}: NosturSelectProps) {

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = Array.isArray(value)
    ? value
    : value
      ? [value]
      : [];

  const selectedLabels = selected.map(
    (selectedValue) =>
      options.find(
        (option) =>
          option.value === selectedValue
      )?.label ||
      selectedValue
  );

  const filtered = useMemo(() => {
    const q = normalizeText(search);

    if (!q) return options;

    return options.filter((o) =>
      normalizeText(o.label).includes(q)
    );
  }, [options, search]);

  async function createOption() {
    if (!creatable || !onCreateOption) return;

    const name = search.trim();

    if (!name) return;

    await onCreateOption(name);

    if (multiple) {
      onChange([...selected, name]);
      setOpen(false);
    } else {
      onChange(name);
      setOpen(false);
    }

    setSearch("");
  }

  return (
    <div className="relative">

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-xs"
      >
        <span className="truncate">
          {selectedLabels.length
            ? selectedLabels.join(", ")
            : placeholder}
        </span>

        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl">

          <div className="flex items-center gap-2 border-b p-2">
            <Search size={14} />

            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-xs outline-none"
            />
          </div>

          <div className="max-h-60 overflow-auto">

            {filtered.map((option) => {

              const active = selected.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {

                    if (multiple) {

                      if (active) {
                        onChange(
                          selected.filter(
                            (v) => v !== option.value
                          )
                        );
                      } else {
                        onChange([
                          ...selected,
                          option.value
                        ]);
                      }

                      setSearch("");
                      setOpen(false);

                    } else {

                      onChange(option.value);
                      setOpen(false);

                    }

                  }}
                  className={[
                    "flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-slate-50",
                    active && "bg-sky-50 text-sky-700"
                  ].join(" ")}
                >
                  {option.label}
                  {active && <Check size={14} />}
                </button>
              );

            })}

            {creatable &&
              search.trim() &&
              !filtered.length && (
                <button
                  type="button"
                  onClick={createOption}
                  className="flex w-full items-center gap-2 border-t px-3 py-2 text-xs font-medium text-sky-700 hover:bg-slate-50"
                >
                  <Plus size={14} />
                  Crear "{search}"
                </button>
              )}

          </div>

        </div>
      )}

    </div>
  );
}
