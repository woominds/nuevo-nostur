import {
  RefreshCcw,
  Sparkles,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type RemoteVersionInfo = {
  version: string;
  commit?: string;
  publishedAt?: string;
};

const CHECK_INTERVAL_MS =
  60_000;

const CURRENT_VERSION =
  String(
    import.meta.env.VITE_APP_VERSION ||
      "",
  ).trim();

function normalizeVersion(
  value: string,
): number[] {
  return String(value || "")
    .trim()
    .replace(/^v/i, "")
    .split(".")
    .map((part) => {
      const numericPart =
        Number.parseInt(
          part.replace(
            /[^0-9].*$/,
            "",
          ),
          10,
        );

      return Number.isFinite(
        numericPart,
      )
        ? numericPart
        : 0;
    });
}

function isNewerVersion(
  remoteVersion: string,
  currentVersion: string,
): boolean {
  if (
    !remoteVersion ||
    !currentVersion
  ) {
    return false;
  }

  const remote =
    normalizeVersion(
      remoteVersion,
    );

  const current =
    normalizeVersion(
      currentVersion,
    );

  const length =
    Math.max(
      remote.length,
      current.length,
    );

  for (
    let index = 0;
    index < length;
    index += 1
  ) {
    const remotePart =
      remote[index] ?? 0;

    const currentPart =
      current[index] ?? 0;

    if (
      remotePart >
      currentPart
    ) {
      return true;
    }

    if (
      remotePart <
      currentPart
    ) {
      return false;
    }
  }

  return false;
}

export function AppUpdateBanner() {
  const [
    remoteVersion,
    setRemoteVersion,
  ] = useState<string | null>(
    null,
  );

  const [
    updating,
    setUpdating,
  ] = useState(false);

  const [
    dismissedVersion,
    setDismissedVersion,
  ] = useState<string | null>(
    null,
  );

  const checkingRef =
    useRef(false);

  const checkVersion =
    useCallback(async () => {
      if (
        checkingRef.current ||
        !CURRENT_VERSION
      ) {
        return;
      }

      checkingRef.current = true;

      try {
        const response =
          await fetch(
            `/version.json?t=${Date.now()}`,
            {
              method: "GET",
              cache: "no-store",
              headers: {
                Accept:
                  "application/json",
              },
            },
          );

        if (!response.ok) {
          return;
        }

        const data =
          (await response.json()) as
            RemoteVersionInfo;

        const nextVersion =
          String(
            data.version || "",
          ).trim();

        if (
          isNewerVersion(
            nextVersion,
            CURRENT_VERSION,
          )
        ) {
          setRemoteVersion(
            nextVersion,
          );
          return;
        }

        setRemoteVersion(null);
      } catch {
        /*
         * Si version.json no existe
         * todavía o no hay conexión,
         * no interrumpimos NOSTUR.
         */
      } finally {
        checkingRef.current =
          false;
      }
    }, []);

  useEffect(() => {
    void checkVersion();

    const intervalId =
      window.setInterval(
        () => {
          void checkVersion();
        },
        CHECK_INTERVAL_MS,
      );

    const handleFocus = () => {
      void checkVersion();
    };

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void checkVersion();
        }
      };

    window.addEventListener(
      "focus",
      handleFocus,
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.clearInterval(
        intervalId,
      );

      window.removeEventListener(
        "focus",
        handleFocus,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [
    checkVersion,
  ]);

  if (
    !remoteVersion ||
    remoteVersion ===
      dismissedVersion
  ) {
    return null;
  }

  const handleUpdate = async () => {
    if (updating) {
      return;
    }

    setUpdating(true);

    try {
      if (
        "serviceWorker" in
        navigator
      ) {
        const registrations =
          await navigator.serviceWorker
            .getRegistrations();

        await Promise.all(
          registrations.map(
            async (
              registration,
            ) => {
              try {
                await registration.update();

                if (
                  registration.waiting
                ) {
                  registration.waiting
                    .postMessage({
                      type:
                        "nostur:skip-waiting",
                    });
                }
              } catch {
                // La actualización web
                // puede continuar igual.
              }
            },
          ),
        );
      }

      window.setTimeout(
        () => {
          window.location.reload();
        },
        350,
      );
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] flex justify-center px-3 pt-3">
      <div className="flex w-full max-w-[920px] items-center gap-3 rounded-lg border border-[#ff634a]/30 bg-white px-4 py-3 shadow-[0_14px_40px_rgba(15,23,42,0.18)]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fff1ed] text-[#ff634a]">
          <Sparkles
            size={19}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-[#172033]">
            Hay una nueva versión de NOSTUR
          </div>

          <div className="mt-0.5 text-[11px] font-medium text-[#64748b]">
            Versión{" "}
            <strong className="font-bold text-[#334155]">
              {remoteVersion}
            </strong>{" "}
            disponible. Estás usando{" "}
            <strong className="font-bold text-[#334155]">
              {CURRENT_VERSION}
            </strong>
            .
          </div>
        </div>

        <button
          type="button"
          disabled={updating}
          onClick={() =>
            void handleUpdate()
          }
          className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-[#ff634a] px-4 text-[12px] font-bold text-white transition hover:bg-[#f2553f] disabled:cursor-wait disabled:opacity-70"
        >
          <RefreshCcw
            size={15}
            className={
              updating
                ? "animate-spin"
                : ""
            }
          />

          {updating
            ? "Actualizando..."
            : "Actualizar NOSTUR"}
        </button>

        <button
          type="button"
          disabled={updating}
          onClick={() =>
            setDismissedVersion(
              remoteVersion,
            )
          }
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#94a3b8] transition hover:bg-[#f1f5f9] hover:text-[#475569]"
          aria-label="Cerrar aviso de actualización"
          title="Cerrar por ahora"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default AppUpdateBanner;
