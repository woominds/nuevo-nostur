import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createPresupuestoComponente,
  deletePresupuestoComponente,
  getPresupuestoComponentes,
  incrementPresupuestoComponenteUsage,
  updatePresupuestoComponente,
} from "../services/presupuestoComponentesService";

import type {
  ActualizarPresupuestoComponenteInput,
  BuscarPresupuestoComponentesInput,
  CrearPresupuestoComponenteInput,
} from "../services/presupuestoComponentesService";

import type {
  PresupuestoComponente,
} from "../types/editor.types";

type UsePresupuestoComponentesResult = {
  componentes: PresupuestoComponente[];

  loading: boolean;
  saving: boolean;
  error: string | null;

  refresh: (
    filters?: BuscarPresupuestoComponentesInput,
  ) => Promise<void>;

  createComponent: (
    input: CrearPresupuestoComponenteInput,
  ) => Promise<PresupuestoComponente | null>;

  updateComponent: (
    componenteId: string,
    input: ActualizarPresupuestoComponenteInput,
  ) => Promise<PresupuestoComponente | null>;

  deleteComponent: (
    componenteId: string,
  ) => Promise<boolean>;

  registerUsage: (
    componenteId: string,
  ) => Promise<void>;

  clearError: () => void;
};

export function usePresupuestoComponentes(): UsePresupuestoComponentesResult {
  const [
    componentes,
    setComponentes,
  ] = useState<PresupuestoComponente[]>(
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const refresh =
    useCallback(
      async (
        filters: BuscarPresupuestoComponentesInput = {},
      ) => {
        setLoading(true);
        setError(null);

        try {
          const result =
            await getPresupuestoComponentes(
              filters,
            );

          setComponentes(result);
        } catch (
          loadError
        ) {
          setComponentes([]);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudieron cargar los componentes.",
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createComponent =
    useCallback(
      async (
        input: CrearPresupuestoComponenteInput,
      ): Promise<PresupuestoComponente | null> => {
        setSaving(true);
        setError(null);

        try {
          const created =
            await createPresupuestoComponente(
              input,
            );

          setComponentes(
            (current) => [
              created,
              ...current.filter(
                (component) =>
                  component.id !==
                  created.id,
              ),
            ],
          );

          return created;
        } catch (
          createError
        ) {
          setError(
            createError instanceof Error
              ? createError.message
              : "No se pudo guardar el componente.",
          );

          return null;
        } finally {
          setSaving(false);
        }
      },
      [],
    );

  const updateComponent =
    useCallback(
      async (
        componenteId: string,
        input: ActualizarPresupuestoComponenteInput,
      ): Promise<PresupuestoComponente | null> => {
        setSaving(true);
        setError(null);

        try {
          const updated =
            await updatePresupuestoComponente(
              componenteId,
              input,
            );

          setComponentes(
            (current) =>
              current.map(
                (component) =>
                  component.id ===
                  componenteId
                    ? updated
                    : component,
              ),
          );

          return updated;
        } catch (
          updateError
        ) {
          setError(
            updateError instanceof Error
              ? updateError.message
              : "No se pudo actualizar el componente.",
          );

          return null;
        } finally {
          setSaving(false);
        }
      },
      [],
    );

  const deleteComponent =
    useCallback(
      async (
        componenteId: string,
      ): Promise<boolean> => {
        setSaving(true);
        setError(null);

        try {
          await deletePresupuestoComponente(
            componenteId,
          );

          setComponentes(
            (current) =>
              current.filter(
                (component) =>
                  component.id !==
                  componenteId,
              ),
          );

          return true;
        } catch (
          deleteError
        ) {
          setError(
            deleteError instanceof Error
              ? deleteError.message
              : "No se pudo eliminar el componente.",
          );

          return false;
        } finally {
          setSaving(false);
        }
      },
      [],
    );

  const registerUsage =
    useCallback(
      async (
        componenteId: string,
      ) => {
        await incrementPresupuestoComponenteUsage(
          componenteId,
        );

        setComponentes(
          (current) =>
            current.map(
              (component) =>
                component.id ===
                componenteId
                  ? {
                      ...component,
                      usageCount:
                        component.usageCount +
                        1,
                    }
                  : component,
            ),
        );
      },
      [],
    );

  const clearError =
    useCallback(() => {
      setError(null);
    }, []);

  return {
    componentes,

    loading,
    saving,
    error,

    refresh,
    createComponent,
    updateComponent,
    deleteComponent,
    registerUsage,
    clearError,
  };
}
