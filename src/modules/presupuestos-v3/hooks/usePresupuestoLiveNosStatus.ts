import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  findLiveNosConversationsByPhone,
} from "../services/presupuestoLiveNosService";

import type {
  PresupuestoLiveNosResult,
} from "../services/presupuestoLiveNosService";

type UsePresupuestoLiveNosStatusOptions = {
  enabled?: boolean;
  refreshIntervalMs?: number;
};

type PresupuestoLiveNosStatus = {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  result: PresupuestoLiveNosResult | null;
  refresh: () => Promise<void>;
};

const DEFAULT_REFRESH_INTERVAL =
  60_000;

export function usePresupuestoLiveNosStatus(
  phone: string,
  options: UsePresupuestoLiveNosStatusOptions = {},
): PresupuestoLiveNosStatus {
  const {
    enabled = true,
    refreshIntervalMs =
      DEFAULT_REFRESH_INTERVAL,
  } = options;

  const mountedRef =
    useRef(true);

  const requestIdRef =
    useRef(0);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    result,
    setResult,
  ] = useState<PresupuestoLiveNosResult | null>(
    null,
  );

  const refresh =
    useCallback(async () => {
      const normalizedPhone =
        phone.trim();

      if (
        !enabled ||
        !normalizedPhone
      ) {
        setLoading(false);
        setRefreshing(false);
        setError(null);
        setResult(null);
        return;
      }

      const requestId =
        requestIdRef.current + 1;

      requestIdRef.current =
        requestId;

      const hasPreviousResult =
        result !== null;

      if (hasPreviousResult) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const nextResult =
          await findLiveNosConversationsByPhone(
            normalizedPhone,
          );

        if (
          !mountedRef.current ||
          requestId !==
            requestIdRef.current
        ) {
          return;
        }

        setResult(
          nextResult,
        );
      } catch (
        lookupError
      ) {
        if (
          !mountedRef.current ||
          requestId !==
            requestIdRef.current
        ) {
          return;
        }

        setError(
          lookupError instanceof Error
            ? lookupError.message
            : "No se pudo consultar LiveNos.",
        );
      } finally {
        if (
          mountedRef.current &&
          requestId ===
            requestIdRef.current
        ) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }, [
      enabled,
      phone,
      result,
    ]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void refresh();
      }, 250);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    phone,
    enabled,
  ]);

  useEffect(() => {
    if (
      !enabled ||
      !phone.trim() ||
      refreshIntervalMs <= 0
    ) {
      return;
    }

    const intervalId =
      window.setInterval(() => {
        void refresh();
      }, refreshIntervalMs);

    return () => {
      window.clearInterval(
        intervalId,
      );
    };
  }, [
    enabled,
    phone,
    refresh,
    refreshIntervalMs,
  ]);

  useEffect(() => {
    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void refresh();
        }
      };

    const handleWindowFocus =
      () => {
        void refresh();
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    window.addEventListener(
      "focus",
      handleWindowFocus,
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      window.removeEventListener(
        "focus",
        handleWindowFocus,
      );
    };
  }, [refresh]);

  return {
    loading,
    refreshing,
    error,
    result,
    refresh,
  };
}
