import {
  useEffect,
  type ComponentType,
  type ReactNode
} from "react";
import {
  AlertTriangle,
  X
} from "lucide-react";
import type {
  ProfileLite
} from "../../../store/carritosStore";
import type {
  ToastState,
  WizardStep
} from "../carritosModel";

type MetricTone =
  | "orange"
  | "blue"
  | "green"
  | "red";

type CardMetricProps = {
  label: string;
  value: string | number;
  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  tone?: MetricTone;
};

type SellerBadgeProps = {
  vendedorId?: string | null;
  vendedorNombre?: string | null;
  vendedores: ProfileLite[];
};

type ToastProps = {
  toast: ToastState;
  onClose: () => void;
};

type WizardErrorProps = {
  message: string | null;
  onClose: () => void;
};

type LineButtonProps = {
  children: ReactNode;
  onClick: () => void;
};

export function CardMetric({
  label,
  value,
  icon: Icon,
  tone = "orange"
}: CardMetricProps) {
  const toneClass: Record<
    MetricTone,
    string
  > = {
    orange:
      "bg-orange-50 text-nostur-orange ring-orange-100",
    blue:
      "bg-sky-50 text-sky-700 ring-sky-100",
    green:
      "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red:
      "bg-red-50 text-red-700 ring-red-100"
  };

  return (
    <div className="min-w-0 rounded-[14px] border border-black/10 bg-white/62 px-3 py-2.5 shadow-sm backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[10.5px] font-medium text-[#64748b]">
            {label}
          </div>

          <div className="mt-0.5 truncate text-[16px] font-semibold tracking-tight text-[#172033] sm:text-[18px]">
            {value}
          </div>
        </div>

        <div
          className={[
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1",
            toneClass[tone]
          ].join(" ")}
        >
          <Icon
            size={14}
            strokeWidth={1.8}
          />
        </div>
      </div>
    </div>
  );
}

export function SellerBadge({
  vendedorId,
  vendedorNombre,
  vendedores
}: SellerBadgeProps) {
  const vendedor = vendedores.find(
    (item) =>
      item.id === vendedorId
  );

  const label = vendedor
    ? `${vendedor.nombre || ""} ${
        vendedor.apellido || ""
      }`.trim()
    : vendedorNombre ||
      "Sin vendedor";

  const color =
    vendedor?.color ||
    "#64748b";

  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        borderColor: `${color}33`,
        backgroundColor: `${color}14`,
        color
      }}
      title={label}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{
          backgroundColor: color
        }}
      />

      <span className="truncate">
        {label}
      </span>
    </span>
  );
}

export function Toast({
  toast,
  onClose
}: ToastProps) {
  useEffect(() => {
    if (!toast) return;

    const timer =
      window.setTimeout(
        onClose,
        3200
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    toast,
    onClose
  ]);

  if (!toast) {
    return null;
  }

  return (
    <div className="fixed right-3 top-3 z-[260] w-[calc(100%-24px)] max-w-[300px] rounded-[14px] border border-black/10 bg-white px-3.5 py-3 text-[12px] shadow-2xl sm:right-5 sm:top-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={[
              "mb-0.5 font-semibold",
              toast.type ===
              "success"
                ? "text-emerald-700"
                : "text-red-700"
            ].join(" ")}
          >
            {toast.type ===
            "success"
              ? "Operación exitosa"
              : "Atención"}
          </div>

          <div className="font-normal leading-relaxed text-[#334155]">
            {toast.message}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#172033]"
          aria-label="Cerrar aviso"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export function WizardError({
  message,
  onClose
}: WizardErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="mb-3 flex items-start justify-between gap-3 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-medium text-red-700">
      <div className="flex items-start gap-2">
        <AlertTriangle
          size={14}
          className="mt-0.5 shrink-0"
        />

        <span>
          {message}
        </span>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="text-red-500 hover:text-red-700"
        aria-label="Cerrar error"
      >
        <X size={14} />
      </button>
    </div>
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
      className="h-8 rounded-[10px] border border-black/10 bg-white px-3 text-[11.5px] font-medium text-[#334155] hover:bg-[#f8fafc]"
    >
      {children}
    </button>
  );
}

export function WizardStepper({
  step
}: {
  step: WizardStep;
}) {
  const steps = [
    "Cliente",
    "Venta",
    "Pagos",
    "Confirmar"
  ];

  return (
    <div className="mb-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
      {steps.map(
        (
          label,
          index
        ) => {
          const number =
            index + 1;

          const active =
            step === number;

          const done =
            step > number;

          return (
            <div
              key={label}
              className={[
                "rounded-[12px] border px-2 py-1.5 text-center text-[10.5px] font-medium sm:text-[11px]",
                active
                  ? "border-[#4f7c90] bg-[#4f7c90] text-white"
                  : done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-black/10 bg-[#f8fafc] text-[#64748b]"
              ].join(" ")}
            >
              {number}.{" "}
              {label}
            </div>
          );
        }
      )}
    </div>
  );
}
