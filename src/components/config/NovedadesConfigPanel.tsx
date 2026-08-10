// src/components/config/NovedadesConfigPanel.tsx

import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  CalendarClock,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Megaphone,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  X
} from "lucide-react";

import {
  useAuthStore
} from "../../store/authStore";

import {
  useNovedadesStore,
  type Novedad,
  type NovedadTipoLink
} from "../../store/novedadesStore";

type FormState = {
  titulo: string;
  mensaje: string;
  tipo_link: NovedadTipoLink;
  link: string;
  fecha_desde: string;
  fecha_hasta: string;
  prioridad: string;
  activo: boolean;
};

function pad(
  value: number
) {
  return String(
    value
  ).padStart(
    2,
    "0"
  );
}

function toLocalDateValue(
  iso?: string | null
) {
  if (!iso) {
    return "";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return [
    pad(date.getDate()),
    pad(date.getMonth() + 1),
    date.getFullYear()
  ].join("/");
}

function formatDateValue(
  date: Date
) {
  return [
    pad(date.getDate()),
    pad(date.getMonth() + 1),
    date.getFullYear()
  ].join("/");
}

function parseDateOnly(
  value: string,
  endOfDay = false
) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date.toISOString();
}

function valueToDate(
  value: string
) {
  const match = value.trim().match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (!match) {
    return null;
  }

  const date = new Date(
    Number(match[3]),
    Number(match[2]) - 1,
    Number(match[1])
  );

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function getInitialForm(): FormState {
  return {
    titulo: "",
    mensaje: "",
    tipo_link:
      "interno",
    link: "",
    fecha_desde:
      toLocalDateValue(
        new Date().toISOString()
      ),
    fecha_hasta: "",
    prioridad: "0",
    activo: true
  };
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Sin vencimiento";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
}

type NosturDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
};

function NosturDatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  allowClear = false
}: NosturDatePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = valueToDate(value);

  const [viewDate, setViewDate] = useState<Date>(
    selectedDate || new Date()
  );

  useEffect(() => {
    if (selectedDate) {
      setViewDate(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        )
      );
    }
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthLabel = new Intl.DateTimeFormat(
    "es-AR",
    {
      month: "long",
      year: "numeric"
    }
  ).format(viewDate);

  const firstDay = new Date(
    year,
    month,
    1
  );

  const lastDay = new Date(
    year,
    month + 1,
    0
  );

  // lunes = 0 ... domingo = 6
  const leadingDays =
    (firstDay.getDay() + 6) % 7;

  const days: Array<Date | null> = [];

  for (
    let i = 0;
    i < leadingDays;
    i += 1
  ) {
    days.push(null);
  }

  for (
    let day = 1;
    day <= lastDay.getDate();
    day += 1
  ) {
    days.push(
      new Date(year, month, day)
    );
  }

  function isSameDay(
    a: Date | null,
    b: Date | null
  ) {
    if (!a || !b) {
      return false;
    }

    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  const today = new Date();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setOpen((current) => !current)
        }
        className={[
          "flex h-9 w-full items-center justify-between gap-2 rounded-[10px] border bg-[#f8fafc] px-3 text-left transition",
          open
            ? "border-nostur-orange"
            : "border-black/10 hover:border-black/20"
        ].join(" ")}
      >
        <span
          className={[
            "truncate text-[11.5px] font-medium",
            value
              ? "text-[#172033]"
              : "text-[#94a3b8]"
          ].join(" ")}
        >
          {value || placeholder}
        </span>

        <CalendarDays
          size={14}
          className="shrink-0 text-[#64748b]"
        />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Cerrar calendario"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[450] cursor-default"
          />

          <div className="absolute right-0 top-[42px] z-[460] w-[250px] rounded-[12px] border border-black/10 bg-white p-2.5 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setViewDate(
                    new Date(
                      year,
                      month - 1,
                      1
                    )
                  )
                }
                className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#172033]"
              >
                <ChevronLeft size={15} />
              </button>

              <div className="text-[12px] font-semibold capitalize text-[#172033]">
                {monthLabel}
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewDate(
                    new Date(
                      year,
                      month + 1,
                      1
                    )
                  )
                }
                className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#172033]"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7">
              {[
                "L",
                "M",
                "M",
                "J",
                "V",
                "S",
                "D"
              ].map((day, index) => (
                <div
                  key={`${day}-${index}`}
                  className="flex h-6 items-center justify-center text-[9px] font-bold uppercase text-[#94a3b8]"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {days.map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="h-7"
                    />
                  );
                }

                const selected = isSameDay(
                  day,
                  selectedDate
                );

                const isToday = isSameDay(
                  day,
                  today
                );

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => {
                      onChange(
                        formatDateValue(day)
                      );
                      setOpen(false);
                    }}
                    className={[
                      "flex h-7 items-center justify-center rounded-[7px] text-[10.5px] font-medium transition",
                      selected
                        ? "bg-[#4f7c90] text-white shadow-sm"
                        : isToday
                        ? "bg-orange-50 text-nostur-orange ring-1 ring-orange-100"
                        : "text-[#334155] hover:bg-[#f1f5f9]"
                    ].join(" ")}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-black/8 pt-2">
              {allowClear ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="h-7 rounded-[8px] px-2 text-[10.5px] font-medium text-[#64748b] hover:bg-[#f1f5f9]"
                >
                  Sin vencimiento
                </button>
              ) : (
                <span />
              )}

              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  onChange(
                    formatDateValue(now)
                  );
                  setViewDate(now);
                  setOpen(false);
                }}
                className="h-7 rounded-[8px] px-2 text-[10.5px] font-semibold text-[#4f7c90] hover:bg-[#eef6f7]"
              >
                Hoy
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function getStatus(
  novedad: Novedad
) {
  if (!novedad.activo) {
    return {
      label: "Inactiva",
      className:
        "bg-slate-100 text-slate-600 ring-slate-200"
    };
  }

  const now =
    Date.now();

  const desde =
    new Date(
      novedad.fecha_desde
    ).getTime();

  const hasta =
    novedad.fecha_hasta
      ? new Date(
          novedad.fecha_hasta
        ).getTime()
      : null;

  if (desde > now) {
    return {
      label: "Programada",
      className:
        "bg-blue-50 text-blue-700 ring-blue-100"
    };
  }

  if (
    hasta !== null &&
    hasta < now
  ) {
    return {
      label: "Vencida",
      className:
        "bg-amber-50 text-amber-700 ring-amber-100"
    };
  }

  return {
    label: "Publicada",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-100"
  };
}

export function NovedadesConfigPanel() {
  const currentProfile =
    useAuthStore(
      (state) =>
        state.currentProfile ||
        state.profile
    );

  const novedades =
    useNovedadesStore(
      (state) =>
        state.novedadesAdmin
    );

  const loading =
    useNovedadesStore(
      (state) =>
        state.loadingAdmin
    );

  const saving =
    useNovedadesStore(
      (state) =>
        state.saving
    );

  const storeError =
    useNovedadesStore(
      (state) =>
        state.error
    );

  const clearError =
    useNovedadesStore(
      (state) =>
        state.clearError
    );

  const loadAdminNovedades =
    useNovedadesStore(
      (state) =>
        state.loadAdminNovedades
    );

  const createNovedad =
    useNovedadesStore(
      (state) =>
        state.createNovedad
    );

  const updateNovedad =
    useNovedadesStore(
      (state) =>
        state.updateNovedad
    );

  const deleteNovedad =
    useNovedadesStore(
      (state) =>
        state.deleteNovedad
    );

  const [
    editingId,
    setEditingId
  ] = useState<
    string | null
  >(null);

  const [
    form,
    setForm
  ] =
    useState<FormState>(
      getInitialForm
    );

  const [
    localError,
    setLocalError
  ] = useState<
    string | null
  >(null);

  const canManage =
    Boolean(
      currentProfile?.activo
    ) &&
    [
      "gerencia",
      "admin_general"
    ].includes(
      String(
        currentProfile?.rol ||
          ""
      ).toLowerCase()
    );

  useEffect(() => {
    if (!canManage) {
      return;
    }

    void loadAdminNovedades();
  }, [
    canManage,
    loadAdminNovedades
  ]);

  const metrics =
    useMemo(() => {
      const now =
        Date.now();

      let publicadas = 0;
      let programadas = 0;
      let inactivas = 0;

      novedades.forEach(
        (item) => {
          if (!item.activo) {
            inactivas += 1;
            return;
          }

          if (
            new Date(
              item.fecha_desde
            ).getTime() >
            now
          ) {
            programadas += 1;
            return;
          }

          const hasta =
            item.fecha_hasta
              ? new Date(
                  item.fecha_hasta
                ).getTime()
              : null;

          if (
            hasta === null ||
            hasta >= now
          ) {
            publicadas += 1;
          }
        }
      );

      return {
        total:
          novedades.length,
        publicadas,
        programadas,
        inactivas
      };
    }, [novedades]);

  function resetForm() {
    setEditingId(null);
    setForm(
      getInitialForm()
    );
    setLocalError(null);
    clearError();
  }

  function startEdit(
    item: Novedad
  ) {
    setEditingId(
      item.id
    );

    setForm({
      titulo: item.titulo,
      mensaje:
        item.mensaje,
      tipo_link:
        item.tipo_link,
      link:
        item.link || "",
      fecha_desde:
        toLocalDateValue(
          item.fecha_desde
        ),
      fecha_hasta:
        toLocalDateValue(
          item.fecha_hasta
        ),
      prioridad:
        String(
          item.prioridad
        ),
      activo:
        item.activo
    });

    setLocalError(null);
    clearError();
  }

  async function handleSave() {
    setLocalError(null);
    clearError();

    const titulo =
      form.titulo.trim();

    const mensaje =
      form.mensaje.trim();

    if (!titulo) {
      setLocalError(
        "Ingresá un título."
      );
      return;
    }

    if (!mensaje) {
      setLocalError(
        "Ingresá el texto de la novedad."
      );
      return;
    }

    const fechaDesde =
      parseDateOnly(
        form.fecha_desde,
        false
      );

    if (!fechaDesde) {
      setLocalError(
        "Seleccioná una fecha de publicación válida."
      );
      return;
    }

    let fechaHasta:
      | string
      | null = null;

    if (
      form.fecha_hasta.trim()
    ) {
      fechaHasta =
        parseDateOnly(
          form.fecha_hasta,
          true
        );

      if (!fechaHasta) {
        setLocalError(
          "Seleccioná una fecha de vencimiento válida."
        );
        return;
      }

      if (
        new Date(
          fechaHasta
        ).getTime() <=
        new Date(
          fechaDesde
        ).getTime()
      ) {
        setLocalError(
          "La fecha de vencimiento debe ser posterior a la publicación."
        );
        return;
      }
    }

    const prioridad =
      Number.parseInt(
        form.prioridad ||
          "0",
        10
      );

    const input = {
      titulo,
      mensaje,
      tipo_link:
        form.tipo_link,
      link:
        form.link.trim() ||
        null,
      fecha_desde:
        fechaDesde,
      fecha_hasta:
        fechaHasta,
      prioridad:
        Number.isFinite(
          prioridad
        )
          ? prioridad
          : 0,
      activo:
        form.activo,
      creado_por:
        currentProfile?.id ||
        null
    };

    const ok =
      editingId
        ? await updateNovedad(
            editingId,
            input
          )
        : await createNovedad(
            input
          );

    if (ok) {
      resetForm();
    }
  }

  async function handleDelete(
    item: Novedad
  ) {
    const confirmed =
      window.confirm(
        `¿Eliminar la novedad "${item.titulo}"?`
      );

    if (!confirmed) {
      return;
    }

    const ok =
      await deleteNovedad(
        item.id
      );

    if (
      ok &&
      editingId ===
        item.id
    ) {
      resetForm();
    }
  }

  if (!canManage) {
    return (
      <div className="rounded-[16px] border border-black/10 bg-white/68 p-5 text-[12px] font-medium text-[#64748b] shadow-sm">
        Esta sección está disponible únicamente para Gerencia y Admin general.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label:
              "Novedades",
            value:
              metrics.total
          },
          {
            label:
              "Publicadas",
            value:
              metrics.publicadas
          },
          {
            label:
              "Programadas",
            value:
              metrics.programadas
          },
          {
            label:
              "Inactivas",
            value:
              metrics.inactivas
          }
        ].map(
          (metric) => (
            <div
              key={
                metric.label
              }
              className="rounded-[14px] border border-black/10 bg-white/68 px-3 py-3 shadow-sm backdrop-blur-xl"
            >
              <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#94a3b8]">
                {
                  metric.label
                }
              </div>

              <div className="mt-1 text-[20px] font-semibold tracking-tight text-[#172033]">
                {
                  metric.value
                }
              </div>
            </div>
          )
        )}
      </section>

      {(localError ||
        storeError) ? (
        <div className="flex items-start justify-between gap-3 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2.5 text-[11.5px] font-medium text-red-700">
          <span>
            {localError ||
              storeError}
          </span>

          <button
            type="button"
            onClick={() => {
              setLocalError(
                null
              );
              clearError();
            }}
            className="shrink-0 text-red-500 hover:text-red-700"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[410px_minmax(0,1fr)]">
        <section className="relative z-[30] rounded-[16px] border border-black/10 bg-white/68 p-3 shadow-sm backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-orange-50 text-nostur-orange ring-1 ring-orange-100">
                {editingId ? (
                  <Pencil
                    size={16}
                  />
                ) : (
                  <Plus
                    size={16}
                  />
                )}
              </div>

              <div>
                <h3 className="text-[14px] font-semibold text-[#172033]">
                  {editingId
                    ? "Editar novedad"
                    : "Nueva novedad"}
                </h3>

                <p className="text-[11px] text-[#64748b]">
                  Barra global de NOSTUR
                </p>
              </div>
            </div>

            {editingId ? (
              <button
                type="button"
                onClick={
                  resetForm
                }
                className="flex h-8 w-8 items-center justify-center rounded-[9px] text-[#64748b] hover:bg-[#f1f5f9]"
              >
                <X
                  size={15}
                />
              </button>
            ) : null}
          </div>

          <div className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-[10.5px] font-semibold text-[#475569]">
                Título
              </span>

              <input
                value={
                  form.titulo
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,
                      titulo:
                        event
                          .target
                          .value
                    })
                  )
                }
                placeholder="Ej. Nueva promoción Special Tours"
                className="h-9 rounded-[10px] border border-black/10 bg-[#f8fafc] px-3 text-[12px] font-medium text-[#172033] outline-none transition placeholder:text-[#94a3b8] focus:border-nostur-orange"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-[10.5px] font-semibold text-[#475569]">
                Mensaje
              </span>

              <textarea
                value={
                  form.mensaje
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,
                      mensaje:
                        event
                          .target
                          .value
                    })
                  )
                }
                rows={3}
                placeholder="Texto corto que recorrerá la barra."
                className="resize-none rounded-[10px] border border-black/10 bg-[#f8fafc] px-3 py-2.5 text-[12px] font-medium leading-relaxed text-[#172033] outline-none transition placeholder:text-[#94a3b8] focus:border-nostur-orange"
              />
            </label>

            <div>
              <span className="mb-1 block text-[10.5px] font-semibold text-[#475569]">
                Destino
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        tipo_link:
                          "interno"
                      })
                    )
                  }
                  className={[
                    "flex h-9 items-center justify-center gap-2 rounded-[10px] text-[11.5px] font-medium transition",
                    form.tipo_link ===
                    "interno"
                      ? "bg-[#4f7c90] text-white"
                      : "bg-[#f8fafc] text-[#475569] ring-1 ring-black/10"
                  ].join(" ")}
                >
                  <ChevronRight
                    size={14}
                  />
                  NOSTUR
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        tipo_link:
                          "externo"
                      })
                    )
                  }
                  className={[
                    "flex h-9 items-center justify-center gap-2 rounded-[10px] text-[11.5px] font-medium transition",
                    form.tipo_link ===
                    "externo"
                      ? "bg-[#4f7c90] text-white"
                      : "bg-[#f8fafc] text-[#475569] ring-1 ring-black/10"
                  ].join(" ")}
                >
                  <ExternalLink
                    size={13}
                  />
                  Web externa
                </button>
              </div>
            </div>

            <label className="grid gap-1">
              <span className="text-[10.5px] font-semibold text-[#475569]">
                Enlace
              </span>

              <input
                value={
                  form.link
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,
                      link:
                        event
                          .target
                          .value
                    })
                  )
                }
                placeholder={
                  form.tipo_link ===
                  "interno"
                    ? "Ej. presupuestos-v3"
                    : "Ej. https://specialtours.es/..."
                }
                className="h-9 rounded-[10px] border border-black/10 bg-[#f8fafc] px-3 text-[12px] font-medium text-[#172033] outline-none transition placeholder:text-[#94a3b8] focus:border-nostur-orange"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <span className="text-[10.5px] font-semibold text-[#475569]">
                  Publicar desde
                </span>

                <NosturDatePicker
                  value={form.fecha_desde}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      fecha_desde: value
                    }))
                  }
                />
              </div>

              <div className="grid gap-1">
                <span className="text-[10.5px] font-semibold text-[#475569]">
                  Hasta
                </span>

                <NosturDatePicker
                  value={form.fecha_hasta}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      fecha_hasta: value
                    }))
                  }
                  placeholder="Sin vencimiento"
                  allowClear
                />
              </div>
            </div>

            <label className="grid gap-1">
              <span className="text-[10.5px] font-semibold text-[#475569]">
                Prioridad
              </span>

              <input
                value={
                  form.prioridad
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,
                      prioridad:
                        event
                          .target
                          .value.replace(
                            /[^\d-]/g,
                            ""
                          )
                    })
                  )
                }
                placeholder="0"
                className="h-9 rounded-[10px] border border-black/10 bg-[#f8fafc] px-3 text-[12px] font-medium text-[#172033] outline-none focus:border-nostur-orange"
              />
            </label>

            <button
              type="button"
              onClick={() =>
                setForm(
                  (
                    current
                  ) => ({
                    ...current,
                    activo:
                      !current.activo
                  })
                )
              }
              className={[
                "flex h-9 items-center justify-between rounded-[10px] border px-3 text-[11.5px] font-medium transition",
                form.activo
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-black/10 bg-[#f8fafc] text-[#64748b]"
              ].join(" ")}
            >
              <span>
                {form.activo
                  ? "Novedad activa"
                  : "Novedad inactiva"}
              </span>

              {form.activo ? (
                <Check
                  size={15}
                />
              ) : null}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => {
                void handleSave();
              }}
              className="mt-1 flex h-9 items-center justify-center gap-2 rounded-[10px] bg-[#4f7c90] text-[12px] font-medium text-white shadow-sm transition hover:bg-[#406b7d] disabled:opacity-50"
            >
              <Save
                size={14}
              />

              {saving
                ? "Guardando..."
                : editingId
                ? "Guardar cambios"
                : "Publicar novedad"}
            </button>
          </div>
        </section>

        <section className="relative z-0 min-w-0 rounded-[16px] border border-black/10 bg-white/68 p-3 shadow-sm backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px] font-semibold text-[#172033]">
                Novedades publicadas
              </h3>

              <p className="text-[11.5px] text-[#64748b]">
                {
                  novedades.length
                } registros
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                void loadAdminNovedades();
              }}
              disabled={
                loading
              }
              className="flex h-8 items-center gap-1.5 rounded-[9px] bg-white px-2.5 text-[11px] font-medium text-[#475569] ring-1 ring-black/10 hover:bg-[#f8fafc] disabled:opacity-50"
            >
              <RefreshCcw
                size={13}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              Actualizar
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-[180px] items-center justify-center text-[12px] font-medium text-[#94a3b8]">
              Cargando novedades...
            </div>
          ) : novedades.length ===
            0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-[14px] border border-dashed border-black/10 bg-[#f8fafc] p-6 text-center">
              <Megaphone
                size={24}
                className="mb-2 text-[#94a3b8]"
              />

              <div className="text-[12px] font-semibold text-[#475569]">
                Todavía no hay novedades
              </div>

              <div className="mt-1 text-[11px] text-[#94a3b8]">
                Creá la primera desde el formulario.
              </div>
            </div>
          ) : (
            <div className="grid max-h-[calc(100vh-360px)] gap-2 overflow-auto pr-1">
              {novedades.map(
                (item) => {
                  const status =
                    getStatus(
                      item
                    );

                  return (
                    <article
                      key={
                        item.id
                      }
                      className={[
                        "rounded-[14px] border p-3 transition",
                        editingId ===
                        item.id
                          ? "border-[#4f7c90]/50 bg-[#eef6f7]"
                          : "border-black/10 bg-[#f8fafc] hover:bg-white"
                      ].join(
                        " "
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="truncate text-[12.5px] font-semibold text-[#172033]">
                              {
                                item.titulo
                              }
                            </h4>

                            <span
                              className={[
                                "rounded-md px-1.5 py-0.5 text-[9px] font-medium ring-1",
                                status.className
                              ].join(
                                " "
                              )}
                            >
                              {
                                status.label
                              }
                            </span>

                            {item.prioridad !==
                            0 ? (
                              <span className="rounded-md bg-orange-50 px-1.5 py-0.5 text-[9px] font-medium text-nostur-orange ring-1 ring-orange-100">
                                Prioridad{" "}
                                {
                                  item.prioridad
                                }
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-[#64748b]">
                            {
                              item.mensaje
                            }
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-[#94a3b8]">
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock
                                size={11}
                              />
                              Desde{" "}
                              {formatDate(
                                item.fecha_desde
                              )}
                            </span>

                            <span>
                              Hasta{" "}
                              {formatDate(
                                item.fecha_hasta
                              )}
                            </span>

                            {item.link ? (
                              <span className="max-w-[300px] truncate">
                                {
                                  item.tipo_link ===
                                  "interno"
                                    ? "NOSTUR"
                                    : "Web"
                                }
                                {" · "}
                                {
                                  item.link
                                }
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              startEdit(
                                item
                              )
                            }
                            title="Editar"
                            className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white text-[#64748b] ring-1 ring-black/10 hover:text-[#172033]"
                          >
                            <Pencil
                              size={13}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              void handleDelete(
                                item
                              );
                            }}
                            title="Eliminar"
                            className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white text-[#94a3b8] ring-1 ring-black/10 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2
                              size={13}
                            />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
