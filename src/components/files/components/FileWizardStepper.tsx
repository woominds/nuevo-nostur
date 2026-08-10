import type {
  FileWizardStep,
} from "../filesModel";

type FileWizardStepperProps = {
  step: FileWizardStep;
};

const STEPS = [
  {
    id: 1,
    title: "Cliente",
    subtitle: "Datos del pasajero",
  },
  {
    id: 2,
    title: "Venta",
    subtitle: "Operador y File",
  },
  {
    id: 3,
    title: "Cobro",
    subtitle: "Comercial y Tesorería",
  },
  {
    id: 4,
    title: "Confirmar",
    subtitle: "Revisión final",
  },
] as const;

export function FileWizardStepper({
  step,
}: FileWizardStepperProps) {
  return (
    <div className="mb-5">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {STEPS.map((item) => {
          const active =
            step === item.id;

          const completed =
            step > item.id;

          return (
            <div
              key={item.id}
              className={[
                "relative overflow-hidden rounded-2xl border px-4 py-3 transition-all",
                active
                  ? "border-[#4f7c90] bg-[#4f7c90] text-white shadow-lg"
                  : completed
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-black/10 bg-[#f8fafc]",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <div
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold",
                    active
                      ? "bg-white text-[#4f7c90]"
                      : completed
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-slate-500 border border-black/10",
                  ].join(" ")}
                >
                  {completed
                    ? "✓"
                    : item.id}
                </div>

                <div className="min-w-0">
                  <div
                    className={[
                      "text-[12px] font-semibold",
                      active
                        ? "text-white"
                        : completed
                          ? "text-emerald-700"
                          : "text-[#172033]",
                    ].join(" ")}
                  >
                    {item.title}
                  </div>

                  <div
                    className={[
                      "mt-0.5 text-[10.5px]",
                      active
                        ? "text-white/80"
                        : "text-slate-500",
                    ].join(" ")}
                  >
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {active ? (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/30" />
              ) : completed ? (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
