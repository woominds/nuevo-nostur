// src/store/novedadesStore.ts

import { create } from "zustand";
import { supabase } from "../lib/supabase";

export type NovedadTipoLink = "interno" | "externo";

export type Novedad = {
  id: string;
  titulo: string;
  mensaje: string;
  tipo_link: NovedadTipoLink;
  link: string | null;
  fecha_desde: string;
  fecha_hasta: string | null;
  prioridad: number;
  activo: boolean;
  creado_por: string | null;
  created_at: string;
  updated_at: string;
};

export type NovedadInput = {
  titulo: string;
  mensaje: string;
  tipo_link: NovedadTipoLink;
  link?: string | null;
  fecha_desde: string;
  fecha_hasta?: string | null;
  prioridad?: number;
  activo?: boolean;
  creado_por?: string | null;
};

type NovedadesState = {
  novedades: Novedad[];
  novedadesAdmin: Novedad[];

  loading: boolean;
  loadingAdmin: boolean;
  saving: boolean;

  error: string | null;

  loadVisibleNovedades: (
    usuarioId: string
  ) => Promise<void>;

  loadAdminNovedades: () => Promise<void>;

  dismissNovedad: (
    novedadId: string,
    usuarioId: string
  ) => Promise<boolean>;

  createNovedad: (
    input: NovedadInput
  ) => Promise<boolean>;

  updateNovedad: (
    id: string,
    input: Partial<NovedadInput>
  ) => Promise<boolean>;

  deleteNovedad: (
    id: string
  ) => Promise<boolean>;

  clearError: () => void;
};

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (
      error as {
        message?: unknown;
      }
    ).message === "string"
  ) {
    return (
      error as {
        message: string;
      }
    ).message;
  }

  return fallback;
}

function sortNovedades(
  novedades: Novedad[]
) {
  return [...novedades].sort(
    (a, b) => {
      if (
        b.prioridad !==
        a.prioridad
      ) {
        return (
          b.prioridad -
          a.prioridad
        );
      }

      return (
        new Date(
          b.fecha_desde
        ).getTime() -
        new Date(
          a.fecha_desde
        ).getTime()
      );
    }
  );
}

export const useNovedadesStore =
  create<NovedadesState>(
    (set, get) => ({
      novedades: [],
      novedadesAdmin: [],

      loading: false,
      loadingAdmin: false,
      saving: false,

      error: null,

      clearError: () => {
        set({
          error: null
        });
      },

      loadVisibleNovedades:
        async (
          usuarioId
        ) => {
          if (!usuarioId) {
            set({
              novedades: [],
              loading: false
            });
            return;
          }

          set({
            loading: true,
            error: null
          });

          try {
            const now =
              new Date().toISOString();

            const {
              data:
                novedadesData,
              error:
                novedadesError
            } =
              await supabase
                .from(
                  "novedades"
                )
                .select("*")
                .eq(
                  "activo",
                  true
                )
                .lte(
                  "fecha_desde",
                  now
                )
                .or(
                  `fecha_hasta.is.null,fecha_hasta.gte.${now}`
                )
                .order(
                  "prioridad",
                  {
                    ascending:
                      false
                  }
                )
                .order(
                  "fecha_desde",
                  {
                    ascending:
                      false
                  }
                );

            if (
              novedadesError
            ) {
              throw novedadesError;
            }

            const {
              data:
                cerradasData,
              error:
                cerradasError
            } =
              await supabase
                .from(
                  "novedades_usuario"
                )
                .select(
                  "novedad_id"
                )
                .eq(
                  "usuario_id",
                  usuarioId
                );

            if (cerradasError) {
              throw cerradasError;
            }

            const cerradas =
              new Set(
                (
                  cerradasData ||
                  []
                ).map(
                  (
                    row: {
                      novedad_id: string;
                    }
                  ) =>
                    row.novedad_id
                )
              );

            const visibles =
              (
                novedadesData ||
                []
              ).filter(
                (
                  item
                ) =>
                  !cerradas.has(
                    String(
                      item.id
                    )
                  )
              ) as Novedad[];

            set({
              novedades:
                sortNovedades(
                  visibles
                ),
              loading: false
            });
          } catch (error) {
            set({
              novedades: [],
              loading: false,
              error:
                getErrorMessage(
                  error,
                  "No se pudieron cargar las novedades."
                )
            });
          }
        },

      loadAdminNovedades:
        async () => {
          set({
            loadingAdmin:
              true,
            error: null
          });

          try {
            const {
              data,
              error
            } =
              await supabase
                .from(
                  "novedades"
                )
                .select("*")
                .order(
                  "prioridad",
                  {
                    ascending:
                      false
                  }
                )
                .order(
                  "fecha_desde",
                  {
                    ascending:
                      false
                  }
                );

            if (error) {
              throw error;
            }

            set({
              novedadesAdmin:
                sortNovedades(
                  (data ||
                    []) as Novedad[]
                ),
              loadingAdmin:
                false
            });
          } catch (error) {
            set({
              novedadesAdmin:
                [],
              loadingAdmin:
                false,
              error:
                getErrorMessage(
                  error,
                  "No se pudieron cargar las novedades."
                )
            });
          }
        },

      dismissNovedad:
        async (
          novedadId,
          usuarioId
        ) => {
          if (
            !novedadId ||
            !usuarioId
          ) {
            return false;
          }

          const anteriores =
            get().novedades;

          set({
            novedades:
              anteriores.filter(
                (item) =>
                  item.id !==
                  novedadId
              )
          });

          try {
            const {
              error
            } =
              await supabase
                .from(
                  "novedades_usuario"
                )
                .upsert(
                  {
                    novedad_id:
                      novedadId,
                    usuario_id:
                      usuarioId,
                    cerrado_at:
                      new Date().toISOString()
                  },
                  {
                    onConflict:
                      "novedad_id,usuario_id"
                  }
                );

            if (error) {
              throw error;
            }

            return true;
          } catch (error) {
            set({
              novedades:
                anteriores,
              error:
                getErrorMessage(
                  error,
                  "No se pudo cerrar la novedad."
                )
            });

            return false;
          }
        },

      createNovedad:
        async (input) => {
          set({
            saving: true,
            error: null
          });

          try {
            const {
              error
            } =
              await supabase
                .from(
                  "novedades"
                )
                .insert({
                  titulo:
                    input.titulo.trim(),
                  mensaje:
                    input.mensaje.trim(),
                  tipo_link:
                    input.tipo_link,
                  link:
                    input.link?.trim() ||
                    null,
                  fecha_desde:
                    input.fecha_desde,
                  fecha_hasta:
                    input.fecha_hasta ||
                    null,
                  prioridad:
                    input.prioridad ??
                    0,
                  activo:
                    input.activo ??
                    true,
                  creado_por:
                    input.creado_por ||
                    null
                });

            if (error) {
              throw error;
            }

            await get().loadAdminNovedades();

            set({
              saving: false
            });

            return true;
          } catch (error) {
            set({
              saving: false,
              error:
                getErrorMessage(
                  error,
                  "No se pudo crear la novedad."
                )
            });

            return false;
          }
        },

      updateNovedad:
        async (
          id,
          input
        ) => {
          set({
            saving: true,
            error: null
          });

          try {
            const payload: Record<
              string,
              unknown
            > = {};

            if (
              input.titulo !==
              undefined
            ) {
              payload.titulo =
                input.titulo.trim();
            }

            if (
              input.mensaje !==
              undefined
            ) {
              payload.mensaje =
                input.mensaje.trim();
            }

            if (
              input.tipo_link !==
              undefined
            ) {
              payload.tipo_link =
                input.tipo_link;
            }

            if (
              input.link !==
              undefined
            ) {
              payload.link =
                input.link?.trim() ||
                null;
            }

            if (
              input.fecha_desde !==
              undefined
            ) {
              payload.fecha_desde =
                input.fecha_desde;
            }

            if (
              input.fecha_hasta !==
              undefined
            ) {
              payload.fecha_hasta =
                input.fecha_hasta ||
                null;
            }

            if (
              input.prioridad !==
              undefined
            ) {
              payload.prioridad =
                input.prioridad;
            }

            if (
              input.activo !==
              undefined
            ) {
              payload.activo =
                input.activo;
            }

            const {
              error
            } =
              await supabase
                .from(
                  "novedades"
                )
                .update(
                  payload
                )
                .eq(
                  "id",
                  id
                );

            if (error) {
              throw error;
            }

            await get().loadAdminNovedades();

            set({
              saving: false
            });

            return true;
          } catch (error) {
            set({
              saving: false,
              error:
                getErrorMessage(
                  error,
                  "No se pudo actualizar la novedad."
                )
            });

            return false;
          }
        },

      deleteNovedad:
        async (id) => {
          set({
            saving: true,
            error: null
          });

          try {
            const {
              error
            } =
              await supabase
                .from(
                  "novedades"
                )
                .delete()
                .eq(
                  "id",
                  id
                );

            if (error) {
              throw error;
            }

            set({
              novedadesAdmin:
                get().novedadesAdmin.filter(
                  (item) =>
                    item.id !==
                    id
                ),
              novedades:
                get().novedades.filter(
                  (item) =>
                    item.id !==
                    id
                ),
              saving: false
            });

            return true;
          } catch (error) {
            set({
              saving: false,
              error:
                getErrorMessage(
                  error,
                  "No se pudo eliminar la novedad."
                )
            });

            return false;
          }
        }
    })
  );
