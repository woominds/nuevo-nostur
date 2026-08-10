// src/components/DashboardHome.tsx

import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  PlaneLanding,
  PlaneTakeoff,
  Pencil,
  RefreshCcw,
  Save,
  Target,
  TrendingUp,
  UsersRound,
  WalletCards
} from "lucide-react";

import {
  useTableroDeControlStore,
  type AdminHomeResumen,
  type MetaAlmundoResumen,
  type MetaSucursalResumen,
  type PaxMovimiento,
  type RankingSimple,
  type RankingVendedor
} from "../store/tableroDeControlStore";
import {
  formatMoneyAR
} from "../lib/formatters";
import {
  supabase
} from "../lib/supabase";

type TipoCambioDiarioRow = {
  id: string;
  fecha: string;
  valor_usd_ars: string | number;
};

function parseNumber(
  value: string | number | null | undefined
): number {
  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  const parsed = Number(
    String(value || "")
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "")
  );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function parseExchangeRateInput(
  value: string
): number {
  const clean = value.trim();

  if (!clean) {
    return 0;
  }

  let normalized = clean
    .replace(/\s/g, "")
    .replace(/\$/g, "");

  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (
    hasComma &&
    hasDot
  ) {
    const lastComma =
      normalized.lastIndexOf(",");

    const lastDot =
      normalized.lastIndexOf(".");

    if (
      lastComma > lastDot
    ) {
      normalized = normalized
        .replace(/\./g, "")
        .replace(",", ".");
    } else {
      normalized =
        normalized.replace(/,/g, "");
    }
  } else if (
    hasComma
  ) {
    normalized = normalized
      .replace(/\./g, "")
      .replace(",", ".");
  }

  normalized = normalized.replace(
    /[^\d.-]/g,
    ""
  );

  const parsed = Number(normalized);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function clampPercentage(
  value: string | number | null | undefined
): number {
  return Math.max(
    0,
    Math.min(
      parseNumber(value),
      100
    )
  );
}

function formatUsd(
  value: string | number | null | undefined
): string {
  return `US$ ${formatMoneyAR(parseNumber(value))}`;
}

function formatArs(
  value: string | number | null | undefined
): string {
  return `$ ${formatMoneyAR(parseNumber(value))}`;
}

function formatExchangeRate(
  value: string | number | null | undefined
): string {
  return `$ ${formatMoneyAR(parseNumber(value))}`;
}

function formatDate(
  value: string | null | undefined
): string {
  if (!value) {
    return "Sin fecha";
  }

  const clean = value.slice(0, 10);
  const [
    year,
    month,
    day
  ] = clean.split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return "Sin fecha";
  }

  return `${day}/${month}/${year}`;
}

function getArgentinaTodayISO(): string {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "America/Argentina/Cordoba",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(new Date());
}

function getFriendlyDate(): string {
  const value = new Intl.DateTimeFormat(
    "es-AR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone:
        "America/Argentina/Cordoba"
    }
  ).format(new Date());

  return value.charAt(0).toUpperCase() +
    value.slice(1);
}

function getMonthLabel(
  month: string,
  year: string
): string {
  const date = new Date(
    Number(year),
    Math.max(
      Number(month) - 1,
      0
    ),
    1
  );

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      month: "long",
      year: "numeric"
    }
  ).format(date);
}

function getDisplayName(
  profile:
    | {
        nombre?: string | null;
        apellido?: string | null;
      }
    | null
    | undefined
): string {
  const name = [
    profile?.nombre,
    profile?.apellido
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || "Equipo";
}

function getProgressClasses(
  percentage: number
): {
  bar: string;
  badge: string;
  label: string;
} {
  if (
    percentage >= 100
  ) {
    return {
      bar: "bg-emerald-500",
      badge:
        "bg-emerald-50 text-emerald-700 ring-emerald-100",
      label: "Cumplida"
    };
  }

  if (
    percentage >= 70
  ) {
    return {
      bar: "bg-[#ff7a63]",
      badge:
        "bg-[#fff2ef] text-[#c54d3a] ring-[#ffd9d1]",
      label: "En camino"
    };
  }

  if (
    percentage >= 40
  ) {
    return {
      bar: "bg-amber-400",
      badge:
        "bg-amber-50 text-amber-700 ring-amber-100",
      label: "A seguir"
    };
  }

  return {
    bar: "bg-slate-400",
    badge:
      "bg-slate-100 text-slate-600 ring-slate-200",
    label: "Pendiente"
  };
}

function DashboardCard({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-[8px] border border-[#e7eaf0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
        className
      ].join(" ")}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  action
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[62px] items-center justify-between gap-4 border-b border-[#eef0f4] px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-[#fff1ee] text-[#e85f49]">
          {icon}
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-[14px] font-semibold text-[#172033]">
            {title}
          </h2>

          {subtitle ? (
            <p className="mt-0.5 truncate text-[11px] font-normal text-[#778195]">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {action ? (
        <div className="shrink-0">
          {action}
        </div>
      ) : null}
    </div>
  );
}

function ExchangeRateCard({
  canManage,
  onDashboardRefresh
}: {
  canManage: boolean;
  onDashboardRefresh: () => Promise<void>;
}) {
  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [inputValue, setInputValue] =
    useState("");

  const [currentRate, setCurrentRate] =
    useState(0);

  const [
    currentRateDate,
    setCurrentRateDate
  ] = useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const today =
    getArgentinaTodayISO();

  const loadExchangeRate =
    async (): Promise<void> => {
      setLoading(true);
      setError(null);

      const latestRateRes =
        await supabase
          .from("tipos_cambio_diarios")
          .select(
            "id,fecha,valor_usd_ars"
          )
          .eq(
            "moneda_origen",
            "USD"
          )
          .eq(
            "moneda_destino",
            "ARS"
          )
          .lte(
            "fecha",
            today
          )
          .order(
            "fecha",
            {
              ascending: false
            }
          )
          .order(
            "created_at",
            {
              ascending: false
            }
          )
          .limit(1)
          .maybeSingle();

      if (latestRateRes.error) {
        setError(
          latestRateRes.error.message
        );
        setLoading(false);
        return;
      }

      const latestRate =
        latestRateRes.data as
          | TipoCambioDiarioRow
          | null;

      const latestValue =
        parseNumber(
          latestRate?.valor_usd_ars
        );

      setCurrentRate(
        latestValue
      );

      setCurrentRateDate(
        latestRate?.fecha || null
      );

      setInputValue(
        latestValue > 0
          ? String(latestValue)
          : ""
      );

      setLoading(false);
    };

  useEffect(() => {
    void loadExchangeRate();
  }, []);

  const handleSave =
    async (): Promise<void> => {
      if (
        !canManage ||
        saving
      ) {
        return;
      }

      const rate =
        parseExchangeRateInput(
          inputValue
        );

      if (rate <= 0) {
        setError(
          "Ingresá un valor mayor a cero."
        );
        return;
      }

      setSaving(true);
      setError(null);

      const {
        data: userData,
        error: userError
      } = await supabase.auth.getUser();

      if (
        userError ||
        !userData.user
      ) {
        setError(
          "No hay un usuario autenticado."
        );
        setSaving(false);
        return;
      }

      const existingRes =
        await supabase
          .from(
            "tipos_cambio_diarios"
          )
          .select("id")
          .eq(
            "fecha",
            today
          )
          .eq(
            "moneda_origen",
            "USD"
          )
          .eq(
            "moneda_destino",
            "ARS"
          )
          .order(
            "created_at",
            {
              ascending: false
            }
          )
          .limit(1)
          .maybeSingle();

      if (existingRes.error) {
        setError(
          existingRes.error.message
        );
        setSaving(false);
        return;
      }

      if (existingRes.data?.id) {
        const updateRes =
          await supabase
            .from(
              "tipos_cambio_diarios"
            )
            .update({
              valor_usd_ars: rate,
              fuente: "Manual NOSTUR",
              created_by:
                userData.user.id
            })
            .eq(
              "id",
              existingRes.data.id
            );

        if (updateRes.error) {
          setError(
            updateRes.error.message
          );
          setSaving(false);
          return;
        }
      } else {
        const insertRes =
          await supabase
            .from(
              "tipos_cambio_diarios"
            )
            .insert({
              fecha: today,
              moneda_origen: "USD",
              moneda_destino: "ARS",
              valor_usd_ars: rate,
              fuente: "Manual NOSTUR",
              created_by:
                userData.user.id
            });

        if (insertRes.error) {
          setError(
            insertRes.error.message
          );
          setSaving(false);
          return;
        }
      }

      await loadExchangeRate();
      await onDashboardRefresh();

      setEditing(false);
      setSaving(false);
    };

  if (editing) {
    return (
      <div className="relative">
        <div className="flex h-8 items-center gap-1.5 rounded-[7px] border border-[#dfe3e9] bg-white px-2 shadow-sm">
          <span className="text-[11px] font-semibold text-[#697386]">
            $
          </span>

          <input
            type="text"
            inputMode="decimal"
            autoFocus
            value={inputValue}
            onChange={(event) => {
              setInputValue(
                event.target.value
              );
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSave();
              }

              if (event.key === "Escape") {
                setEditing(false);
                setError(null);
              }
            }}
            disabled={saving}
            className="h-6 w-[74px] bg-transparent text-[11px] font-semibold tabular-nums text-[#263044] outline-none"
          />

          <button
            type="button"
            onClick={() =>
              void handleSave()
            }
            disabled={saving}
            title="Guardar tipo de cambio"
            className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[#ff634a] text-white transition hover:bg-[#eb5942] disabled:opacity-60"
          >
            {saving ? (
              <RefreshCcw
                size={12}
                className="animate-spin"
              />
            ) : (
              <Save size={12} />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setError(null);
              setInputValue(
                currentRate > 0
                  ? String(currentRate)
                  : ""
              );
            }}
            disabled={saving}
            title="Cancelar"
            className="flex h-6 w-6 items-center justify-center rounded-[5px] text-[#8791a2] transition hover:bg-[#f2f4f7] hover:text-[#263044]"
          >
            ×
          </button>
        </div>

        {error ? (
          <div className="absolute right-0 top-[38px] z-30 w-[220px] rounded-[7px] border border-rose-200 bg-white px-3 py-2 text-[10px] text-rose-600 shadow-lg">
            {error}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (canManage) {
          setEditing(true);
        }
      }}
      disabled={
        loading ||
        !canManage
      }
      title={
        canManage
          ? currentRateDate === today
            ? "Editar tipo de cambio de hoy"
            : currentRateDate
              ? `Último valor del ${formatDate(
                  currentRateDate
                )}. Cargar tipo de cambio de hoy`
              : "Cargar tipo de cambio de hoy"
          : "Tipo de cambio vigente"
      }
      className="flex h-8 items-center gap-2 rounded-[7px] border border-[#e0e4ea] bg-white px-3 text-[#354056] transition hover:border-[#ccd2db] disabled:cursor-default disabled:opacity-100"
    >
      <BadgeDollarSign
        size={14}
        className="text-[#e85f49]"
      />

      <span className="whitespace-nowrap text-[11px] font-semibold tabular-nums">
        {loading
          ? "Cargando TC..."
          : currentRate > 0
            ? `USD 1 = ${formatExchangeRate(
                currentRate
              )}`
            : "Sin tipo de cambio"}
      </span>

      {canManage ? (
        <Pencil
          size={12}
          className="text-[#8b95a5]"
        />
      ) : null}
    </button>
  );
}


function KpiCard({
  label,
  primary,
  secondary,
  icon,
  trend,
  highlight = false
}: {
  label: string;
  primary: string;
  secondary: string;
  icon: React.ReactNode;
  highlight?: boolean;
  trend?: {
    direction: "up" | "down";
    label: string;
  };
}) {
  return (
    <div className="min-w-0 px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-[11px] font-medium uppercase tracking-[0.08em] text-[#8590a3]">
          {label}
        </p>

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-[#f5f6f8] text-[#697487]">
          {icon}
        </div>
      </div>

      <p
        className={[
          "mt-3 truncate text-[19px] font-semibold tracking-[-0.02em] sm:text-[20px]",
          highlight
            ? "text-emerald-600"
            : "text-[#172033]"
        ].join(" ")}
      >
        {primary}
      </p>

      <div className="mt-1.5 flex min-h-[18px] items-center gap-1.5">
        {trend ? (
          <>
            {trend.direction ===
            "up" ? (
              <ArrowUpRight
                size={13}
                className="text-emerald-600"
              />
            ) : (
              <ArrowDownRight
                size={13}
                className="text-rose-500"
              />
            )}

            <span
              className={[
                "text-[11px] font-medium",
                trend.direction === "up"
                  ? "text-emerald-600"
                  : "text-rose-500"
              ].join(" ")}
            >
              {trend.label}
            </span>
          </>
        ) : (
          <span className="truncate text-[11px] font-normal text-[#7b8495]">
            {secondary}
          </span>
        )}
      </div>
    </div>
  );
}

function ProgressBar({
  percentage
}: {
  percentage: number;
}) {
  const classes =
    getProgressClasses(percentage);

  return (
    <div className="h-1 overflow-hidden rounded-full bg-[#edf0f4]">
      <div
        className={[
          "h-full rounded-full transition-[width] duration-500",
          classes.bar
        ].join(" ")}
        style={{
          width: `${clampPercentage(
            percentage
          )}%`
        }}
      />
    </div>
  );
}

function GoalCell({
  percentage,
  achieved,
  target,
  missing,
  targetLabel
}: {
  percentage: number;
  achieved: number;
  target: number;
  missing: number;
  targetLabel?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <ProgressBar
            percentage={percentage}
          />
        </div>

        <span className="w-[34px] shrink-0 text-right text-[11px] font-semibold tabular-nums text-[#172033]">
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="mt-1.5 flex min-w-0 items-center gap-1 text-[9.5px] leading-none">
        <span className="truncate font-medium text-[#687387]">
          {formatUsd(achieved)}
        </span>

        <span className="shrink-0 text-[#c0c6cf]">
          ·
        </span>

        {target > 0 ? (
          <span className="truncate text-[#929baa]">
            {missing > 0
              ? `Restan ${formatUsd(
                  missing
                )}`
              : "Meta cumplida"}
          </span>
        ) : (
          <span className="truncate text-[#a0a8b5]">
            Sin meta
          </span>
        )}

        {targetLabel ? (
          <>
            <span className="hidden shrink-0 text-[#c0c6cf] xl:inline">
              ·
            </span>

            <span className="hidden truncate text-[#a0a8b5] xl:inline">
              Próximo: {targetLabel}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function SellersGoals({
  sellers
}: {
  sellers: RankingVendedor[];
}) {
  const sortedSellers = useMemo(
    () =>
      [...sellers].sort(
        (a, b) =>
          String(
            a.vendedor || ""
          ).localeCompare(
            String(
              b.vendedor || ""
            ),
            "es"
          )
      ),
    [sellers]
  );

  return (
    <DashboardCard>
      <SectionHeader
        icon={
          <UsersRound size={16} />
        }
        title="Metas de vendedores"
        subtitle="Avance semanal y mensual de todo el equipo"
      />

      {sortedSellers.length ===
      0 ? (
        <div className="px-5 py-10 text-center">
          <Target
            size={28}
            className="mx-auto text-[#b5bdc9]"
          />

          <p className="mt-3 text-[13px] font-medium text-[#647084]">
            Todavía no hay metas disponibles
          </p>

          <p className="mt-1 text-[11px] text-[#929baa]">
            Configurá las metas para comenzar a visualizar el avance.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(120px,0.52fr)_minmax(200px,1fr)_minmax(200px,1fr)] gap-5 border-b border-[#eef0f4] bg-[#fafbfc] px-5 py-2 md:grid">
            <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8a94a5]">
              Vendedor
            </span>

            <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8a94a5]">
              Semana
            </span>

            <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8a94a5]">
              Mes
            </span>
          </div>

          <div className="divide-y divide-[#eef0f4]">
            {sortedSellers.map(
              (seller) => {
                const weeklyPercentage =
                  clampPercentage(
                    seller.avanceSemanalPct
                  );

                const monthlyPercentage =
                  clampPercentage(
                    seller.avanceMensualPct
                  );

                return (
                  <article
                    key={
                      seller.vendedorId ||
                      seller.vendedor
                    }
                    className="grid gap-3 px-4 py-3 sm:px-5 md:min-h-[58px] md:grid-cols-[minmax(120px,0.52fr)_minmax(200px,1fr)_minmax(200px,1fr)] md:items-center md:gap-5 md:py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold leading-tight text-[#172033]">
                        {seller.vendedor ||
                          "Sin vendedor"}
                      </p>

                      <p className="mt-0.5 truncate text-[9px] leading-tight text-[#919aaa]">
                        {seller.sucursal ||
                          "Sin sucursal"}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#98a1af] md:hidden">
                        Semana
                      </p>

                      <GoalCell
                        percentage={
                          weeklyPercentage
                        }
                        achieved={
                          seller.utilidadSemanalUsd
                        }
                        target={
                          seller.metaSemanalUsd
                        }
                        missing={
                          seller.faltaSemanalUsd
                        }
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#98a1af] md:hidden">
                        Mes
                      </p>

                      <GoalCell
                        percentage={
                          monthlyPercentage
                        }
                        achieved={
                          seller.utilidadUsd
                        }
                        target={
                          seller.metaLogradoUsd ||
                          seller.metaPisoUsd
                        }
                        missing={
                          seller.faltaMensualUsd
                        }
                        targetLabel={
                          seller.proximaMetaLabel
                        }
                      />
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </>
      )}
    </DashboardCard>
  );
}

function CompanyGoalCard({
  type,
  name,
  percentage,
  achieved,
  target,
  missing,
  nextTarget
}: {
  type: "almundo" | "branch";
  name: string;
  percentage: number;
  achieved: number;
  target: number;
  missing: number;
  nextTarget?: string;
}) {
  const classes =
    getProgressClasses(percentage);

  return (
    <DashboardCard className="overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-[#fff1ee] text-[#e85f49]">
            {type ===
            "almundo" ? (
              <Target size={16} />
            ) : (
              <Building2 size={16} />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8b95a6]">
              {type ===
              "almundo"
                ? "Meta ALMUNDO"
                : "Meta sucursal"}
            </p>

            <p className="mt-0.5 truncate text-[13px] font-semibold text-[#172033]">
              {name}
            </p>
          </div>
        </div>

        <span
          className={[
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset",
            classes.badge
          ].join(" ")}
        >
          {classes.label}
        </span>
      </div>

      <div className="px-4 pb-4 pt-5 sm:px-5 sm:pb-5">
        <div className="flex items-end justify-between gap-4">
          <p className="text-[24px] font-semibold tracking-[-0.03em] text-[#172033]">
            {Math.round(
              percentage
            )}
            %
          </p>

          <p className="text-right text-[10.5px] text-[#7c8697]">
            {target > 0
              ? missing > 0
                ? `Faltan ${formatUsd(
                    missing
                  )}`
                : "Objetivo alcanzado"
              : "Sin meta configurada"}
          </p>
        </div>

        <div className="mt-3">
          <ProgressBar
            percentage={percentage}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-4 text-[10.5px]">
          <span className="text-[#6e788a]">
            Logrado:{" "}
            {formatUsd(achieved)}
          </span>

          <span className="text-[#929baa]">
            Objetivo:{" "}
            {formatUsd(target)}
          </span>
        </div>

        {nextTarget ? (
          <p className="mt-2 text-[9.5px] text-[#9aa3b0]">
            Próximo nivel:{" "}
            {nextTarget}
          </p>
        ) : null}
      </div>
    </DashboardCard>
  );
}

function AdminSummary({
  summary
}: {
  summary: AdminHomeResumen;
}) {
  const items = [
    {
      label: "Saldo en cajas",
      primary: formatArs(
        summary.cajas.totalArs
      ),
      secondary: formatUsd(
        summary.cajas.totalUsd
      ),
      icon: (
        <WalletCards size={15} />
      )
    },
    {
      label: "Deuda operadores",
      primary: formatArs(
        summary.deudaOperadores
          .total.ars
      ),
      secondary: formatUsd(
        summary.deudaOperadores
          .total.usd
      ),
      icon: (
        <CircleDollarSign
          size={15}
        />
      )
    },
    {
      label: "Facturas a cobrar",
      primary: formatArs(
        summary.facturasCobrar
          .totalPendiente.ars
      ),
      secondary: `${summary.facturasCobrar.totalPendiente.cantidad} pendientes`,
      icon: (
        <TrendingUp size={15} />
      )
    },
    {
      label: "Facturas a pagar",
      primary: formatArs(
        summary.facturasPagar
          .proximos5Dias.ars
      ),
      secondary: `${summary.facturasPagar.proximos5Dias.cantidad} en próximos 5 días`,
      icon: <Clock3 size={15} />
    }
  ];

  return (
    <DashboardCard>
      <SectionHeader
        icon={
          <WalletCards size={16} />
        }
        title="Administración"
        subtitle="Situación financiera y próximos movimientos"
      />

      <div className="grid divide-y divide-[#eef0f4] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {items.map(
          (item) => (
            <div
              key={item.label}
              className="px-4 py-4 sm:px-5"
            >
              <div className="flex items-center gap-2 text-[#8791a2]">
                {item.icon}

                <span className="text-[10px] font-medium uppercase tracking-[0.06em]">
                  {item.label}
                </span>
              </div>

              <p className="mt-3 truncate text-[16px] font-semibold text-[#172033]">
                {item.primary}
              </p>

              <p className="mt-1 truncate text-[10.5px] text-[#8791a2]">
                {item.secondary}
              </p>
            </div>
          )
        )}
      </div>
    </DashboardCard>
  );
}

function RankingList({
  title,
  subtitle,
  icon,
  items
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: RankingSimple[];
}) {
  const visibleItems =
    items.slice(0, 6);

  const maximum = Math.max(
    ...visibleItems.map(
      (item) => item.valor
    ),
    1
  );

  return (
    <DashboardCard>
      <SectionHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
      />

      {visibleItems.length ===
      0 ? (
        <div className="px-5 py-9 text-center">
          <TrendingUp
            size={25}
            className="mx-auto text-[#bcc3ce]"
          />

          <p className="mt-3 text-[11px] text-[#8d96a5]">
            No hay información disponible para el período.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#eef0f4]">
          {visibleItems.map(
            (
              item,
              index
            ) => {
              const percentage =
                Math.max(
                  4,
                  Math.min(
                    (item.valor /
                      maximum) *
                      100,
                    100
                  )
                );

              return (
                <div
                  key={`${item.nombre}-${index}`}
                  className="px-4 py-3 sm:px-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] bg-[#f1f4f7] text-[9px] font-semibold text-[#64748b]">
                        {index + 1}
                      </span>

                      <span className="truncate text-[11.5px] font-semibold text-[#263044]">
                        {item.nombre}
                      </span>
                    </div>

                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[#4f7c90]">
                      {item.valor}
                    </span>
                  </div>

                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#edf0f4]">
                    <div
                      className="h-full rounded-full bg-[#4f7c90]"
                      style={{
                        width: `${percentage}%`
                      }}
                    />
                  </div>

                  {item.subtitulo ? (
                    <p className="mt-1 truncate text-[9.5px] text-[#929baa]">
                      {item.subtitulo}
                    </p>
                  ) : null}
                </div>
              );
            }
          )}
        </div>
      )}
    </DashboardCard>
  );
}

function TravelList({
  title,
  icon,
  items,
  emptyText,
  tone
}: {
  title: string;
  icon: React.ReactNode;
  items: PaxMovimiento[];
  emptyText: string;
  tone: "departure" | "return";
}) {
  const visibleItems =
    items.slice(0, 5);

  const toneClasses =
    tone === "departure"
      ? {
          header:
            "bg-emerald-50 text-emerald-700",
          row:
            "hover:bg-emerald-50/55",
          date:
            "bg-emerald-50 text-emerald-700 ring-emerald-100"
        }
      : {
          header:
            "bg-orange-50 text-orange-700",
          row:
            "hover:bg-orange-50/60",
          date:
            "bg-orange-50 text-orange-700 ring-orange-100"
        };

  return (
    <DashboardCard>
      <div className="flex min-h-[62px] items-center justify-between gap-4 border-b border-[#eef0f4] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={[
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px]",
              toneClasses.header
            ].join(" ")}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-[14px] font-semibold text-[#172033]">
              {title}
            </h2>

            <p className="mt-0.5 truncate text-[11px] font-normal text-[#778195]">
              Próximos 30 días
            </p>
          </div>
        </div>
      </div>

      {visibleItems.length ===
      0 ? (
        <div className="px-5 py-9 text-center">
          <CalendarDays
            size={25}
            className="mx-auto text-[#bcc3ce]"
          />

          <p className="mt-3 text-[11px] text-[#8d96a5]">
            {emptyText}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#eef0f4]">
          {visibleItems.map(
            (item) => (
              <div
                key={item.id}
                className={[
                  "flex items-center justify-between gap-4 px-4 py-3 transition sm:px-5",
                  toneClasses.row
                ].join(" ")}
              >
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-[#263044]">
                    {item.pasajero ||
                      "Pasajero"}
                  </p>

                  <p className="mt-0.5 truncate text-[10.5px] text-[#828c9e]">
                    {item.destino ||
                      "Sin destino"}{" "}
                    ·{" "}
                    {item.vendedor ||
                      "Sin vendedor"}
                  </p>
                </div>

                <span
                  className={[
                    "shrink-0 rounded-[6px] px-2 py-1 text-[10px] font-medium ring-1 ring-inset",
                    toneClasses.date
                  ].join(" ")}
                >
                  {formatDate(
                    item.fecha
                  )}
                </span>
              </div>
            )
          )}
        </div>
      )}
    </DashboardCard>
  );
}

export function DashboardHome() {
  const loadTablero =
    useTableroDeControlStore(
      (state) =>
        state.loadTablero
    );

  const goToPreviousMonth =
    useTableroDeControlStore(
      (state) =>
        state.goToPreviousMonth
    );

  const goToNextMonth =
    useTableroDeControlStore(
      (state) =>
        state.goToNextMonth
    );

  const loading =
    useTableroDeControlStore(
      (state) => state.loading
    );

  const error =
    useTableroDeControlStore(
      (state) => state.error
    );

  const filters =
    useTableroDeControlStore(
      (state) => state.filters
    );

  const currentProfile =
    useTableroDeControlStore(
      (state) =>
        state.currentProfile
    );

  const canManageDashboard =
    useTableroDeControlStore(
      (state) =>
        state.canManageDashboard
    );

  const kpis =
    useTableroDeControlStore(
      (state) => state.kpis
    );

  const rankingVendedores =
    useTableroDeControlStore(
      (state) =>
        state.rankingVendedores
    );

  const metasAlmundo =
    useTableroDeControlStore(
      (state) =>
        state.metasAlmundo
    );

  const metasSucursal =
    useTableroDeControlStore(
      (state) =>
        state.metasSucursal
    );

  const adminResumen =
    useTableroDeControlStore(
      (state) =>
        state.adminResumen
    );

  const destinosMensual =
    useTableroDeControlStore(
      (state) =>
        state.destinosMensual
    );

  const serviciosMensual =
    useTableroDeControlStore(
      (state) =>
        state.serviciosMensual
    );

  const paxSaliendo =
    useTableroDeControlStore(
      (state) =>
        state.paxSaliendo
    );

  const paxRegresando =
    useTableroDeControlStore(
      (state) =>
        state.paxRegresando
    );

  useEffect(() => {
    void loadTablero();
  }, [loadTablero]);

  const almundoGoals =
    useMemo(
      () =>
        [...metasAlmundo].sort(
          (a, b) =>
            String(
              a.sucursal
            ).localeCompare(
              String(
                b.sucursal
              ),
              "es"
            )
        ),
      [metasAlmundo]
    );

  const branchGoals =
    useMemo(
      () =>
        [...metasSucursal].sort(
          (a, b) =>
            String(
              a.sucursal
            ).localeCompare(
              String(
                b.sucursal
              ),
              "es"
            )
        ),
      [metasSucursal]
    );

  const monthLabel =
    getMonthLabel(
      filters.mes,
      filters.anio
    );

  const kpiItems = [
    {
      label:
        "Facturación histórica",
      primary: formatUsd(
        kpis.facturacionHistoricaUsd
      ),
      secondary: formatArs(
        kpis.facturacionHistoricaArs
      ),
      icon: (
        <TrendingUp size={14} />
      )
    },
    {
      label:
        "Facturación del mes",
      primary: formatUsd(
        kpis.facturacionMesUsd
      ),
      secondary: formatArs(
        kpis.facturacionMesArs
      ),
      icon: (
        <CalendarDays size={14} />
      )
    },
    {
      label:
        "Utilidad mensual",
      primary: formatUsd(
        kpis.utilidadTotalUsd
      ),
      secondary: formatArs(
        kpis.utilidadTotalArs
      ),
      icon: (
        <CircleDollarSign
          size={14}
        />
      )
    },
    {
      label:
        "Ventas confirmadas",
      primary: String(
        kpis.ventasConfirmadas
      ),
      secondary:
        kpis.ventasNuevas > 0
          ? `${kpis.ventasNuevas} venta${kpis.ventasNuevas === 1 ? "" : "s"} nueva${kpis.ventasNuevas === 1 ? "" : "s"} sin controlar`
          : `${kpis.carritosConfirmados} carritos · ${kpis.filesConfirmados} files`,
      icon: (
        <CheckCircle2 size={14} />
      ),
      highlight:
        kpis.ventasNuevas > 0
    },
    {
      label: "Ticket promedio",
      primary: formatUsd(
        kpis.ticketPromedioUsd
      ),
      secondary: formatArs(
        kpis.ticketPromedioArs
      ),
      icon: (
        <WalletCards size={14} />
      )
    }
  ];

  return (
    <div className="min-h-full bg-[#f5f6f8]">
      <div className="mx-auto w-full max-w-[1540px] px-3 pb-24 pt-4 sm:px-5 sm:pt-5 lg:px-6 lg:pb-8">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[#8b95a5]">
              {getFriendlyDate()}
            </p>

            <h1 className="mt-1 truncate text-[22px] font-semibold tracking-[-0.025em] text-[#172033] sm:text-[24px]">
              Buen día,{" "}
              {getDisplayName(
                currentProfile
              )}
            </h1>

            <p className="mt-1 text-[11.5px] text-[#7b8596]">
              Resumen general de ventas, metas y administración.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ExchangeRateCard
              canManage={
                canManageDashboard
              }
              onDashboardRefresh={
                loadTablero
              }
            />

            <button
              type="button"
              onClick={
                goToPreviousMonth
              }
              className="flex h-8 items-center rounded-[7px] border border-[#e0e4ea] bg-white px-3 text-[11px] font-medium text-[#697386] transition hover:border-[#ccd2db] hover:text-[#263044]"
            >
              Anterior
            </button>

            <div className="flex h-8 min-w-[150px] items-center justify-center rounded-[7px] border border-[#e0e4ea] bg-white px-3 text-[11px] font-semibold capitalize text-[#354056]">
              {monthLabel}
            </div>

            <button
              type="button"
              onClick={
                goToNextMonth
              }
              className="flex h-8 items-center rounded-[7px] border border-[#e0e4ea] bg-white px-3 text-[11px] font-medium text-[#697386] transition hover:border-[#ccd2db] hover:text-[#263044]"
            >
              Siguiente
            </button>

            <button
              type="button"
              onClick={() =>
                void loadTablero()
              }
              disabled={loading}
              title="Actualizar dashboard"
              className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-[#e0e4ea] bg-white text-[#697386] transition hover:border-[#ccd2db] hover:text-[#263044] disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCcw
                size={14}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
            </button>
          </div>
        </header>

        {error ? (
          <div className="mb-4 rounded-[8px] border border-rose-200 bg-rose-50 px-4 py-3 text-[11.5px] text-rose-700">
            {error}
          </div>
        ) : null}

        <DashboardCard className="mb-4 overflow-hidden">
          <div className="grid divide-y divide-[#eef0f4] sm:grid-cols-2 xl:grid-cols-5 xl:divide-x xl:divide-y-0">
            {kpiItems.map(
              (item) => (
                <KpiCard
                  key={item.label}
                  {...item}
                />
              )
            )}
          </div>
        </DashboardCard>

        <div className="grid gap-4">
          <SellersGoals
            sellers={
              rankingVendedores
            }
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-4">
              {almundoGoals.length ===
              0 ? (
                <CompanyGoalCard
                  type="almundo"
                  name="Sin sucursal"
                  percentage={0}
                  achieved={0}
                  target={0}
                  missing={0}
                />
              ) : (
                almundoGoals.map(
                  (
                    goal:
                      MetaAlmundoResumen
                  ) => (
                    <CompanyGoalCard
                      key={
                        goal.sucursalId ||
                        goal.sucursal
                      }
                      type="almundo"
                      name={
                        goal.sucursal ||
                        "Sucursal"
                      }
                      percentage={
                        clampPercentage(
                          goal.avancePct
                        )
                      }
                      achieved={
                        goal.actualUsd
                      }
                      target={
                        goal.objetivoUsd
                      }
                      missing={
                        goal.faltaUsd
                      }
                    />
                  )
                )
              )}
            </div>

            <div className="grid gap-4">
              {branchGoals.length ===
              0 ? (
                <CompanyGoalCard
                  type="branch"
                  name="Sin sucursal"
                  percentage={0}
                  achieved={0}
                  target={0}
                  missing={0}
                />
              ) : (
                branchGoals.map(
                  (
                    goal:
                      MetaSucursalResumen
                  ) => (
                    <CompanyGoalCard
                      key={
                        goal.sucursalId ||
                        goal.sucursal
                      }
                      type="branch"
                      name={
                        goal.sucursal ||
                        "Sucursal"
                      }
                      percentage={
                        clampPercentage(
                          goal.avancePct
                        )
                      }
                      achieved={
                        goal.actualUsd
                      }
                      target={
                        goal.metaLogradoUsd ||
                        goal.metaPisoUsd
                      }
                      missing={
                        goal.faltaUsd
                      }
                      nextTarget={
                        goal.proximaMetaLabel
                      }
                    />
                  )
                )
              )}
            </div>
          </div>

          <AdminSummary
            summary={adminResumen}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <RankingList
              title="Destinos más vendidos"
              subtitle="Ranking mensual por cantidad de carritos"
              icon={
                <PlaneTakeoff
                  size={16}
                />
              }
              items={
                destinosMensual
              }
            />

            <RankingList
              title="Servicios más vendidos"
              subtitle="Ranking mensual por cantidad de carritos"
              icon={
                <TrendingUp
                  size={16}
                />
              }
              items={
                serviciosMensual
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TravelList
              title="Próximas salidas"
              icon={
                <PlaneTakeoff
                  size={16}
                />
              }
              items={paxSaliendo}
              emptyText="No hay pasajeros próximos a salir."
              tone="departure"
            />

            <TravelList
              title="Próximos regresos"
              icon={
                <PlaneLanding
                  size={16}
                />
              }
              items={
                paxRegresando
              }
              emptyText="No hay pasajeros próximos a regresar."
              tone="return"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
