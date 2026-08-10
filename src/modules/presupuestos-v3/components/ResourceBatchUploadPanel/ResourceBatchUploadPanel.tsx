import {
  CheckCircle2,
  FileImage,
  Images,
  Loader2,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  EditorSelect,
} from "../ui/EditorSelect";

import {
  createPresupuestoRecurso,
} from "../../services/presupuestoRecursosService";

import type {
  PresupuestoRecursoCategoria,
  PresupuestoRecursoVisibilidad,
} from "../../services/presupuestoRecursosService";

type ResourceBatchUploadPanelProps = {
  onCompleted: (
    uploadedCount: number,
  ) => void;
};

type UploadStatus =
  | "pending"
  | "uploading"
  | "success"
  | "error";

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  nombre: string;
  status: UploadStatus;
  error: string | null;
};

const CATEGORY_OPTIONS: Array<{
  value: PresupuestoRecursoCategoria;
  label: string;
}> = [
  {
    value: "logos",
    label: "Logos",
  },
  {
    value: "fondos",
    label: "Fondos",
  },
  {
    value: "destinos",
    label: "Destinos",
  },
  {
    value: "operadores",
    label: "Operadores",
  },
  {
    value: "sellos",
    label: "Sellos",
  },
  {
    value: "iconos",
    label: "Íconos",
  },
  {
    value: "banners",
    label: "Banners",
  },
  {
    value: "otros",
    label: "Otros",
  },
];

const VISIBILITY_OPTIONS: Array<{
  value: PresupuestoRecursoVisibilidad;
  label: string;
}> = [
  {
    value: "personal",
    label: "Solo para mí",
  },
  {
    value: "empresa",
    label: "Todo el equipo",
  },
];

const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

function getDefaultName(
  file: File,
): string {
  return file.name
    .replace(
      /\.[^.]+$/,
      "",
    )
    .trim();
}

function formatBytes(
  value: number,
): string {
  if (value < 1024) {
    return `${value} B`;
  }

  if (
    value <
    1024 * 1024
  ) {
    return `${(
      value / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    value /
    1024 /
    1024
  ).toFixed(1)} MB`;
}

function createUploadItem(
  file: File,
): UploadItem {
  return {
    id:
      crypto.randomUUID(),

    file,

    previewUrl:
      URL.createObjectURL(
        file,
      ),

    nombre:
      getDefaultName(
        file,
      ),

    status:
      "pending",

    error:
      null,
  };
}

export function ResourceBatchUploadPanel({
  onCompleted,
}: ResourceBatchUploadPanelProps) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const itemsRef =
    useRef<UploadItem[]>(
      [],
    );

  const [
    items,
    setItems,
  ] = useState<UploadItem[]>(
    [],
  );

  const [
    categoria,
    setCategoria,
  ] = useState<PresupuestoRecursoCategoria>(
    "otros",
  );

  const [
    visibilidad,
    setVisibilidad,
  ] = useState<PresupuestoRecursoVisibilidad>(
    "personal",
  );

  const [
    etiquetas,
    setEtiquetas,
  ] = useState("");

  const [
    descripcion,
    setDescripcion,
  ] = useState("");

  const [
    dragging,
    setDragging,
  ] = useState(false);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    generalError,
    setGeneralError,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    itemsRef.current =
      items;
  }, [
    items,
  ]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach(
        (item) => {
          URL.revokeObjectURL(
            item.previewUrl,
          );
        },
      );
    };
  }, []);

  const pendingItems =
    useMemo(
      () =>
        items.filter(
          (item) =>
            item.status ===
              "pending" ||
            item.status ===
              "error",
        ),
      [
        items,
      ],
    );

  const successCount =
    items.filter(
      (item) =>
        item.status ===
        "success",
    ).length;

  const completedCount =
    items.filter(
      (item) =>
        item.status ===
          "success" ||
        item.status ===
          "error",
    ).length;

  const progress =
    items.length > 0
      ? Math.round(
          (
            completedCount /
            items.length
          ) * 100,
        )
      : 0;

  const addFiles = (
    files: File[],
  ) => {
    if (
      uploading ||
      files.length === 0
    ) {
      return;
    }

    setGeneralError(null);

    const validFiles =
      files.filter(
        (file) =>
          ACCEPTED_MIME_TYPES.includes(
            file.type,
          ),
      );

    const invalidCount =
      files.length -
      validFiles.length;

    if (
      invalidCount > 0
    ) {
      setGeneralError(
        `${invalidCount} archivo${
          invalidCount === 1
            ? ""
            : "s"
        } no se agregó porque no era una imagen compatible.`,
      );
    }

    if (
      validFiles.length === 0
    ) {
      return;
    }

    setItems(
      (current) => {
        const existingKeys =
          new Set(
            current.map(
              (item) =>
                `${item.file.name}-${item.file.size}-${item.file.lastModified}`,
            ),
          );

        const newItems =
          validFiles
            .filter(
              (file) =>
                !existingKeys.has(
                  `${file.name}-${file.size}-${file.lastModified}`,
                ),
            )
            .map(
              createUploadItem,
            );

        return [
          ...current,
          ...newItems,
        ];
      },
    );
  };

  const removeItem = (
    itemId: string,
  ) => {
    if (uploading) {
      return;
    }

    setItems(
      (current) => {
        const target =
          current.find(
            (item) =>
              item.id ===
              itemId,
          );

        if (target) {
          URL.revokeObjectURL(
            target.previewUrl,
          );
        }

        return current.filter(
          (item) =>
            item.id !==
            itemId,
        );
      },
    );
  };

  const updateItemName = (
    itemId: string,
    nombre: string,
  ) => {
    setItems(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            itemId
              ? {
                  ...item,
                  nombre,
                }
              : item,
        ),
    );
  };

  const clearCompleted = () => {
    if (uploading) {
      return;
    }

    setItems(
      (current) => {
        const completed =
          current.filter(
            (item) =>
              item.status ===
              "success",
          );

        completed.forEach(
          (item) => {
            URL.revokeObjectURL(
              item.previewUrl,
            );
          },
        );

        return current.filter(
          (item) =>
            item.status !==
            "success",
        );
      },
    );
  };

  const clearAll = () => {
    if (uploading) {
      return;
    }

    items.forEach(
      (item) => {
        URL.revokeObjectURL(
          item.previewUrl,
        );
      },
    );

    setItems([]);
    setGeneralError(null);

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
    }
  };

  const handleUploadAll =
    async () => {
      const itemsToUpload =
        pendingItems.filter(
          (item) =>
            item.nombre.trim(),
        );

      if (
        uploading ||
        itemsToUpload.length ===
          0
      ) {
        return;
      }

      setUploading(true);
      setGeneralError(null);

      const normalizedTags =
        etiquetas
          .split(",")
          .map((tag) =>
            tag.trim(),
          )
          .filter(Boolean);

      let uploadedCount = 0;

      for (
        const item
        of itemsToUpload
      ) {
        setItems(
          (current) =>
            current.map(
              (currentItem) =>
                currentItem.id ===
                item.id
                  ? {
                      ...currentItem,
                      status:
                        "uploading",
                      error:
                        null,
                    }
                  : currentItem,
            ),
        );

        try {
          await createPresupuestoRecurso({
            file:
              item.file,

            nombre:
              item.nombre,

            descripcion,

            categoria,

            etiquetas:
              normalizedTags,

            visibilidad,
          });

          uploadedCount += 1;

          setItems(
            (current) =>
              current.map(
                (currentItem) =>
                  currentItem.id ===
                  item.id
                    ? {
                        ...currentItem,
                        status:
                          "success",
                        error:
                          null,
                      }
                    : currentItem,
              ),
          );
        } catch (
          uploadError
        ) {
          setItems(
            (current) =>
              current.map(
                (currentItem) =>
                  currentItem.id ===
                  item.id
                    ? {
                        ...currentItem,
                        status:
                          "error",
                        error:
                          uploadError instanceof Error
                            ? uploadError.message
                            : "No se pudo subir este recurso.",
                      }
                    : currentItem,
              ),
          );
        }
      }

      setUploading(false);

      if (
        uploadedCount > 0
      ) {
        onCompleted(
          uploadedCount,
        );
      }
    };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={(event) => {
          addFiles(
            Array.from(
              event.currentTarget.files ??
                [],
            ),
          );

          event.currentTarget.value =
            "";
        }}
        className="hidden"
      />

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] px-5 py-5 sm:px-7">
        <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#172033]">
                  Archivos
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Seleccioná o arrastrá varias imágenes al mismo tiempo.
                </p>
              </div>

              <div className="flex gap-2">
                {successCount >
                0 ? (
                  <button
                    type="button"
                    disabled={
                      uploading
                    }
                    onClick={
                      clearCompleted
                    }
                    className="h-9 rounded-lg px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                  >
                    Quitar completados
                  </button>
                ) : null}

                {items.length >
                0 ? (
                  <button
                    type="button"
                    disabled={
                      uploading
                    }
                    onClick={
                      clearAll
                    }
                    className="h-9 rounded-lg px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                  >
                    Limpiar todo
                  </button>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              disabled={uploading}
              onClick={() =>
                fileInputRef.current?.click()
              }
              onDragEnter={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();

                setDragging(false);

                addFiles(
                  Array.from(
                    event.dataTransfer.files,
                  ),
                );
              }}
              className={[
                "mt-5 flex min-h-[150px] w-full items-center justify-center rounded-lg border border-dashed p-6 text-center transition",
                dragging
                  ? "border-[#FF634A] bg-[#FFF4F1]"
                  : "border-slate-300 bg-slate-50 hover:border-[#FF634A] hover:bg-[#FFF8F6]",
                uploading
                  ? "cursor-not-allowed opacity-60"
                  : "",
              ].join(" ")}
            >
              <div>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white text-[#FF634A] shadow-sm">
                  <UploadCloud
                    size={24}
                  />
                </span>

                <p className="mt-4 text-sm font-semibold text-slate-800">
                  Arrastrá imágenes acá
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  o hacé clic para elegir varias desde tu equipo
                </p>

                <p className="mt-2 text-[11px] text-slate-400">
                  JPG, PNG, WEBP, GIF o SVG · máximo 15 MB por archivo
                </p>
              </div>
            </button>

            {generalError ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
                {generalError}
              </div>
            ) : null}

            {items.length ===
            0 ? (
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                <Images
                  size={28}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Todavía no agregaste imágenes
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Podés seleccionar todas juntas desde una carpeta.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(
                  (item) => (
                    <article
                      key={
                        item.id
                      }
                      className={[
                        "overflow-hidden rounded-lg border bg-white",
                        item.status ===
                        "success"
                          ? "border-emerald-200"
                          : item.status ===
                              "error"
                            ? "border-red-200"
                            : "border-slate-200",
                      ].join(" ")}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        <img
                          src={
                            item.previewUrl
                          }
                          alt={
                            item.nombre
                          }
                          className="h-full w-full object-contain"
                        />

                        <div className="absolute right-2 top-2 flex gap-1">
                          {item.status ===
                          "uploading" ? (
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#FF634A] shadow">
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            </span>
                          ) : null}

                          {item.status ===
                          "success" ? (
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                              <CheckCircle2
                                size={17}
                              />
                            </span>
                          ) : null}

                          {item.status ===
                          "error" ? (
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow">
                              <XCircle
                                size={17}
                              />
                            </span>
                          ) : null}

                          {item.status !==
                          "uploading" ? (
                            <button
                              type="button"
                              disabled={
                                uploading
                              }
                              onClick={() =>
                                removeItem(
                                  item.id,
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow transition hover:text-red-600 disabled:opacity-40"
                              aria-label="Quitar archivo"
                            >
                              <Trash2
                                size={15}
                              />
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="p-3">
                        <label className="block">
                          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                            Nombre
                          </span>

                          <input
                            type="text"
                            value={
                              item.nombre
                            }
                            disabled={
                              uploading ||
                              item.status ===
                                "success"
                            }
                            onChange={(event) =>
                              updateItemName(
                                item.id,
                                event.target.value,
                              )
                            }
                            className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-[#FF634A] disabled:bg-slate-100"
                          />
                        </label>

                        <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                          <span className="truncate">
                            {
                              item.file.name
                            }
                          </span>

                          <span className="shrink-0">
                            {formatBytes(
                              item.file.size,
                            )}
                          </span>
                        </div>

                        {item.error ? (
                          <p className="mt-2 text-[11px] leading-4 text-red-600">
                            {
                              item.error
                            }
                          </p>
                        ) : null}
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>

          <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 xl:sticky xl:top-0">
            <div className="flex items-center gap-2">
              <FileImage
                size={18}
                className="text-[#FF634A]"
              />

              <h3 className="text-base font-semibold text-[#172033]">
                Datos comunes
              </h3>
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Esta configuración se aplicará a todas las imágenes de la carga.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-slate-600">
                  Categoría
                </span>

                <EditorSelect
                  value={
                    categoria
                  }
                  options={
                    CATEGORY_OPTIONS
                  }
                  onChange={
                    setCategoria
                  }
                  disabled={
                    uploading
                  }
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-slate-600">
                  Visibilidad
                </span>

                <EditorSelect
                  value={
                    visibilidad
                  }
                  options={
                    VISIBILITY_OPTIONS
                  }
                  onChange={
                    setVisibilidad
                  }
                  disabled={
                    uploading
                  }
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-slate-600">
                  Etiquetas
                </span>

                <input
                  type="text"
                  value={
                    etiquetas
                  }
                  disabled={
                    uploading
                  }
                  onChange={(event) =>
                    setEtiquetas(
                      event.target.value,
                    )
                  }
                  placeholder="caribe, playa, verano"
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A] disabled:bg-slate-100"
                />

                <p className="mt-1 text-[11px] text-slate-400">
                  Separadas por comas.
                </p>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-slate-600">
                  Descripción común
                </span>

                <textarea
                  value={
                    descripcion
                  }
                  disabled={
                    uploading
                  }
                  onChange={(event) =>
                    setDescripcion(
                      event.target.value,
                    )
                  }
                  placeholder="Opcional..."
                  className="min-h-[90px] w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#FF634A] disabled:bg-slate-100"
                />
              </label>
            </div>

            {items.length >
            0 ? (
              <div className="mt-5 rounded-lg bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">
                    Progreso
                  </span>

                  <span className="font-semibold text-[#FF634A]">
                    {progress}%
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#FF634A] transition-all"
                    style={{
                      width:
                        `${progress}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                  <span>
                    {successCount} cargados
                  </span>

                  <span>
                    {items.length} totales
                  </span>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              disabled={
                uploading ||
                pendingItems.length ===
                  0 ||
                pendingItems.some(
                  (item) =>
                    !item.nombre.trim(),
                )
              }
              onClick={() =>
                void handleUploadAll()
              }
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#FF634A] px-4 text-sm font-semibold text-white transition hover:bg-[#f0543d] disabled:cursor-not-allowed disabled:bg-[#FFB7AB]"
            >
              {uploading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <UploadCloud
                  size={17}
                />
              )}

              {uploading
                ? "Subiendo recursos..."
                : `Subir ${
                    pendingItems.length
                  } recurso${
                    pendingItems.length ===
                    1
                      ? ""
                      : "s"
                  }`}
            </button>
          </aside>
        </div>
      </div>
    </>
  );
}
