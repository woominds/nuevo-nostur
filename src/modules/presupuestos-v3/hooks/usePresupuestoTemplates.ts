import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  deletePresupuestoTemplate,
  getPresupuestoTemplates,
  renamePresupuestoTemplate,
  savePageAsPresupuestoTemplate,
} from "../services/presupuestoTemplatesService";

import {
  templateRegistry,
} from "../templates/templateRegistry";

import type {
  PresupuestoPage,
  PresupuestoTemplate,
  PresupuestoTemplateCategory,
} from "../types/editor.types";

import type {
  PresupuestoTemplateVisibility,
} from "../services/presupuestoTemplatesService";

type SaveTemplateInput = {
  page: PresupuestoPage;
  nombre: string;
  descripcion?: string;
  categoria?: PresupuestoTemplateCategory;
  visibilidad?: PresupuestoTemplateVisibility;
  thumbnailUrl?: string | null;
};

type UsePresupuestoTemplatesResult = {
  templates: PresupuestoTemplate[];
  systemTemplates: PresupuestoTemplate[];
  userTemplates: PresupuestoTemplate[];

  loading: boolean;
  saving: boolean;
  error: string | null;

  refresh: () => Promise<void>;

  saveTemplate: (
    input: SaveTemplateInput,
  ) => Promise<PresupuestoTemplate | null>;

  renameTemplate: (
    templateId: string,
    nombre: string,
  ) => Promise<boolean>;

  deleteTemplate: (
    templateId: string,
  ) => Promise<boolean>;

  clearError: () => void;
};

export function usePresupuestoTemplates(): UsePresupuestoTemplatesResult {
  const systemTemplates =
    useMemo(
      () =>
        templateRegistry.getSystemTemplates(),
      [],
    );

  const [
    remoteTemplates,
    setRemoteTemplates,
  ] = useState<
    PresupuestoTemplate[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

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
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const templates =
          await getPresupuestoTemplates();

        setRemoteTemplates(
          templates,
        );
      } catch (
        loadError
      ) {
        setRemoteTemplates([]);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar los templates.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveTemplate =
    useCallback(
      async (
        input: SaveTemplateInput,
      ): Promise<PresupuestoTemplate | null> => {
        setSaving(true);
        setError(null);

        try {
          const template =
            await savePageAsPresupuestoTemplate(
              input,
            );

          setRemoteTemplates(
            (current) => [
              template,
              ...current,
            ],
          );

          return template;
        } catch (
          saveError
        ) {
          setError(
            saveError instanceof Error
              ? saveError.message
              : "No se pudo guardar el template.",
          );

          return null;
        } finally {
          setSaving(false);
        }
      },
      [],
    );

  const renameTemplate =
    useCallback(
      async (
        templateId: string,
        nombre: string,
      ): Promise<boolean> => {
        setSaving(true);
        setError(null);

        try {
          await renamePresupuestoTemplate(
            templateId,
            nombre,
          );

          setRemoteTemplates(
            (current) =>
              current.map(
                (template) =>
                  template.id ===
                  templateId
                    ? {
                        ...template,
                        name:
                          nombre.trim(),
                      }
                    : template,
              ),
          );

          return true;
        } catch (
          renameError
        ) {
          setError(
            renameError instanceof Error
              ? renameError.message
              : "No se pudo renombrar el template.",
          );

          return false;
        } finally {
          setSaving(false);
        }
      },
      [],
    );

  const deleteTemplate =
    useCallback(
      async (
        templateId: string,
      ): Promise<boolean> => {
        setSaving(true);
        setError(null);

        try {
          await deletePresupuestoTemplate(
            templateId,
          );

          setRemoteTemplates(
            (current) =>
              current.filter(
                (template) =>
                  template.id !==
                  templateId,
              ),
          );

          return true;
        } catch (
          deleteError
        ) {
          setError(
            deleteError instanceof Error
              ? deleteError.message
              : "No se pudo eliminar el template.",
          );

          return false;
        } finally {
          setSaving(false);
        }
      },
      [],
    );

  const clearError =
    useCallback(() => {
      setError(null);
    }, []);

  return {
    templates: [
      ...systemTemplates,
      ...remoteTemplates,
    ],

    systemTemplates,

    userTemplates:
      remoteTemplates,

    loading,
    saving,
    error,

    refresh,
    saveTemplate,
    renameTemplate,
    deleteTemplate,
    clearError,
  };
}
