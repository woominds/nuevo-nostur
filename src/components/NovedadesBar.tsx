// src/components/NovedadesBar.tsx

import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  ChevronRight,
  Megaphone,
  X
} from "lucide-react";

import {
  useAuthStore
} from "../store/authStore";

import {
  useNovedadesStore,
  type Novedad
} from "../store/novedadesStore";

const ROTATION_MS = 8000;

function cleanInternalRoute(
  value: string
) {
  return value
    .replace(
      /^internal:\/\//i,
      ""
    )
    .replace(
      /^\//,
      ""
    )
    .trim();
}

function openNovedad(
  novedad: Novedad
) {
  const rawLink =
    String(
      novedad.link ||
        ""
    ).trim();

  if (!rawLink) {
    return;
  }

  if (
    novedad.tipo_link ===
    "interno"
  ) {
    const route =
      cleanInternalRoute(
        rawLink
      );

    if (!route) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(
        "nostur:open-internal",
        {
          detail: {
            route
          }
        }
      )
    );

    return;
  }

  let href = rawLink;

  if (
    !/^https?:\/\//i.test(
      href
    )
  ) {
    href = `https://${href}`;
  }

  window.open(
    href,
    "_blank",
    "noopener,noreferrer"
  );
}

export function NovedadesBar() {
  const currentProfile =
    useAuthStore(
      (state) =>
        state.currentProfile ||
        state.profile
    );

  const novedades =
    useNovedadesStore(
      (state) =>
        state.novedades
    );

  const loading =
    useNovedadesStore(
      (state) =>
        state.loading
    );

  const loadVisibleNovedades =
    useNovedadesStore(
      (state) =>
        state.loadVisibleNovedades
    );

  const dismissNovedad =
    useNovedadesStore(
      (state) =>
        state.dismissNovedad
    );

  const [
    currentIndex,
    setCurrentIndex
  ] = useState(0);

  useEffect(() => {
    if (
      !currentProfile?.id
    ) {
      return;
    }

    void loadVisibleNovedades(
      currentProfile.id
    );
  }, [
    currentProfile?.id,
    loadVisibleNovedades
  ]);

  useEffect(() => {
    if (
      novedades.length <= 1
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setCurrentIndex(
            (current) =>
              (current + 1) %
              novedades.length
          );
        },
        ROTATION_MS
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    novedades.length
  ]);

  useEffect(() => {
    if (
      currentIndex >=
      novedades.length
    ) {
      setCurrentIndex(0);
    }
  }, [
    currentIndex,
    novedades.length
  ]);

  const currentNovedad =
    useMemo(() => {
      if (
        novedades.length ===
        0
      ) {
        return null;
      }

      return (
        novedades[
          currentIndex
        ] || novedades[0]
      );
    }, [
      novedades,
      currentIndex
    ]);

  if (
    loading ||
    !currentProfile?.id ||
    !currentNovedad
  ) {
    return null;
  }

  const hasLink =
    Boolean(
      String(
        currentNovedad.link ||
          ""
      ).trim()
    );

  async function handleDismiss() {
    if (
      !currentNovedad ||
      !currentProfile?.id
    ) {
      return;
    }

    await dismissNovedad(
      currentNovedad.id,
      currentProfile.id
    );

    setCurrentIndex(0);
  }

  return (
    <div className="pointer-events-none fixed bottom-[72px] left-2 right-2 z-[190] pb-2 md:bottom-0 md:left-[255px] md:right-4 md:px-0">
      <div className="pointer-events-auto flex h-[44px] w-full overflow-hidden rounded-[8px] border border-black/10 bg-[#172033] shadow-[0_10px_30px_rgba(15,23,42,0.20)]">
        <div className="flex h-full shrink-0 items-center gap-2 bg-nostur-orange px-3 text-white">
          <Megaphone
            size={14}
            strokeWidth={2}
          />

          <span className="hidden text-[10px] font-bold uppercase tracking-[0.12em] sm:inline">
            Novedades
          </span>
        </div>

        <button
          type="button"
          disabled={!hasLink}
          onClick={() =>
            openNovedad(
              currentNovedad
            )
          }
          className={[
            "group relative flex min-w-0 flex-1 items-center overflow-hidden text-left",
            hasLink
              ? "cursor-pointer"
              : "cursor-default"
          ].join(" ")}
        >
          <div
            key={currentNovedad.id}
            className="nostur-news-ticker-item absolute flex min-w-max items-center whitespace-nowrap"
          >
            <span className="mr-2 text-[11.5px] font-semibold text-white">
              {currentNovedad.titulo}
            </span>

            <span className="text-[11.5px] font-normal text-white/75">
              {currentNovedad.mensaje}
            </span>

            {hasLink ? (
              <span className="ml-2 inline-flex items-center gap-0.5 text-[11px] font-semibold text-white/90">
                Ver
                <ChevronRight size={13} />
              </span>
            ) : null}
          </div>
        </button>

        {novedades.length >
        1 ? (
          <div className="hidden shrink-0 items-center px-1.5 text-[9px] font-medium tabular-nums text-white/45 sm:flex">
            {currentIndex +
              1}
            /
            {novedades.length}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            void handleDismiss();
          }}
          title="Cerrar novedad"
          className="flex h-full w-10 shrink-0 items-center justify-center text-white/55 transition hover:bg-white/10 hover:text-white"
        >
          <X
            size={15}
            strokeWidth={1.8}
          />
        </button>
      </div>
    </div>
  );
}
