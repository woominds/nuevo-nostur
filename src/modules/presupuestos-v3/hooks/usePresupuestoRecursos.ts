import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createPresupuestoRecurso,
  deletePresupuestoRecurso,
  getPresupuestoRecursos,
  incrementPresupuestoRecursoUsage,
  updatePresupuestoRecurso,
} from "../services/presupuestoRecursosService";

import type {
  ActualizarPresupuestoRecursoInput,
  BuscarPresupuestoRecursosInput,
  CrearPresupuestoRecursoInput,
  PresupuestoRecurso,
} from "../services/presupuestoRecursosService";

type UsePresupuestoRecursosResult = {
  recursos: PresupuestoRecurso[];

  loading: boolean;
  saving: boolean;
  error: string | null;

  refresh: (
    filters?: BuscarPresupuestoRecursosInput,
  ) => Promise<void>;

  createResource: (
    input: CrearPresupuestoRecursoInput,
  ) => Promise<PresupuestoRecurso | null>;

  updateResource: (
    recursoId: string,
    input: ActualizarPresupuestoRecursoInput,
  ) => Promise<PresupuestoRecurso | null>;

  deleteResource: (
    recursoId: string,
  ) => Promise<boolean>;

  registerUsage: (
    recursoId: string,
  ) => Promise<void>;

  clearError: () => void;
};

export function usePresupuestoRecursos(
  initialFilters: BuscarPresupuestoRecursosInput = {},
): UsePresupuestoRecursosResult {
  const [
    recursos,
    setRecursos,
  ] = useState<PresupuestoRecurso[]>(
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
        filters: BuscarPresupuestoRecursosInput = initialFilters,
      ) => {
        setLoading(true);
        setError(null);

        try {
          const result =
            await getPresupuestoRecursos(
              filters,
            );

          setRecursos(result);
        } catch (
          loadError
        ) {
          setRecursos([]);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudieron cargar los recursos.",
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    void refresh(
      initialFilters,
    );
  }, []);

  const createResource =
    useCallback(
      async (
        input: CrearPresupuestoRecursoInput,
      ): Promise<PresupuestoRecurso | null> => {
        setSaving(true);
        setError(null);

        try {
          const recurso =
            await createPresupuestoRecurso(
              input,
            );

          setRecursos(
            (current) => [
              recurso,
              ...current.filter(
                (item) =>
                  item.id !==
                  recurso.id,
              ),
            ],
          );

          return recurso;
        } catch (
          createError
        ) {
          setError(
            createError instanceof Error
              ? createError.message
              : "No se pudo guardar el recurso.",
          );

          return null;
        } finally {
          setSaving(false);
        }
      },
      [],
    );

  const updateResource =
    useCallback(
      async (
        recursoId: string,
        input: ActualizarPresupuestoRecursoInput,
      ): Promise<PresupuestoRecurso | null> => {
        setSaving(true);
        setError(null);

        try {
          const updated =
            await updatePresupuestoRecurso(
              recursoId,
              input,
            );

          setRecursos(
            (current) =>
              current.map(
                (recurso) =>
                  recurso.id ===
                  recursoId
                    ? updated
                    : recurso,
              ),
          );

          return updated;
        } catch (
          updateError
        ) {
          setError(
            updateError instanceof Error
              ? updateError.message
              : "No se pudo actualizar el recurso.",
          );

          return null;
        } finally {
          setSaving(false);
        }
      },
      [],
    );

  const deleteResource =
    useCallback(
      async (
        recursoId: string,
      ): Promise<boolean> => {
        setSaving(true);
        setError(null);

        try {
          await deletePresupuestoRecurso(
            recursoId,
          );

          setRecursos(
            (current) =>
              current.filter(
                (recurso) =>
                  recurso.id !==
                  recursoId,
              ),
          );

          return true;
        } catch (
          deleteError
        ) {
          setError(
            deleteError instanceof Error
              ? deleteError.message
              : "No se pudo eliminar el recurso.",
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
        recursoId: string,
      ) => {
        await incrementPresupuestoRecursoUsage(
          recursoId,
        );

        setRecursos(
          (current) =>
            current.map(
              (recurso) =>
                recurso.id ===
                recursoId
                  ? {
                      ...recurso,
                      usos:
                        recurso.usos +
                        1,
                    }
                  : recurso,
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
    recursos,

    loading,
    saving,
    error,

    refresh,
    createResource,
    updateResource,
    deleteResource,
    registerUsage,
    clearError,
  };
}
