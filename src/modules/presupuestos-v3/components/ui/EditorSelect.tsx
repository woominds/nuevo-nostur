import {
  Check,
  ChevronDown,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

export type EditorSelectOption<
  TValue extends string,
> = {
  value: TValue;
  label: string;
};

type EditorSelectProps<
  TValue extends string,
> = {
  value: TValue;
  options: EditorSelectOption<TValue>[];

  onChange: (
    value: TValue,
  ) => void;

  placeholder?: string;
  disabled?: boolean;
};

export function EditorSelect<
  TValue extends string,
>({
  value,
  options,
  onChange,
  placeholder = "Seleccionar",
  disabled = false,
}: EditorSelectProps<TValue>) {
  const containerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    open,
    setOpen,
  ] = useState(false);

  const selectedOption =
    options.find(
      (option) =>
        option.value === value,
    ) ?? null;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleMouseDown = (
      event: MouseEvent,
    ) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleMouseDown,
    );

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleMouseDown,
      );

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  return (
    <div
      ref={containerRef}
      className={[
        "relative",
        open
          ? "z-[120]"
          : "z-0",
      ].join(" ")}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          setOpen(
            (current) =>
              !current,
          )
        }
        className={[
          "flex h-10 w-full items-center justify-between gap-3 rounded-lg border bg-white px-3 text-left text-sm outline-none transition",
          open
            ? "border-[#FF634A] ring-2 ring-[#FF634A]/10"
            : "border-slate-200 hover:border-slate-300",
          disabled
            ? "cursor-not-allowed bg-slate-100 text-slate-400"
            : "text-slate-800",
        ].join(" ")}
      >
        <span
          className={[
            "min-w-0 flex-1 truncate",
            selectedOption
              ? ""
              : "text-slate-400",
          ].join(" ")}
        >
          {selectedOption?.label ??
            placeholder}
        </span>

        <ChevronDown
          size={16}
          className={[
            "shrink-0 text-slate-400 transition",
            open
              ? "rotate-180"
              : "",
          ].join(" ")}
        />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[44px] z-[130] max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-[0_16px_45px_rgba(15,23,42,0.16)]">
          {options.map(
            (option) => {
              const selected =
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
                      option.value,
                    );

                    setOpen(false);
                  }}
                  className={[
                    "flex min-h-9 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition",
                    selected
                      ? "bg-[#FFF4F1] font-semibold text-[#FF634A]"
                      : "text-slate-700 hover:bg-slate-100",
                  ].join(" ")}
                >
                  <span className="truncate">
                    {option.label}
                  </span>

                  {selected ? (
                    <Check
                      size={15}
                      className="shrink-0"
                    />
                  ) : null}
                </button>
              );
            },
          )}
        </div>
      ) : null}
    </div>
  );
}
