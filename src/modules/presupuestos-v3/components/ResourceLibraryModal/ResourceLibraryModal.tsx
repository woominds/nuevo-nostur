import {
  Building2,
  Check,
  Edit3,
  FileImage,
  Files,
  ImagePlus,
  Loader2,
  MoreVertical,
  Search,
  Star,
  Trash2,
  Upload,
  UserRound,
  X,
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
  ResourceBatchUploadPanel,
} from "../ResourceBatchUploadPanel/ResourceBatchUploadPanel";

import {
  usePresupuestoRecursos,
} from "../../hooks/usePresupuestoRecursos";

import type {
  PresupuestoRecurso,
  PresupuestoRecursoCategoria,
  PresupuestoRecursoVisibilidad,
} from "../../services/presupuestoRecursosService";

type ResourceLibraryModalProps = {
  open: boolean;

  onClose: () => void;

  onInsert: (
    recurso: PresupuestoRecurso,
  ) => void;
};

type LibraryTab =
  | "library"
  | "upload"
  | "bulk";

type ResourceScope =
  | "todos"
  | "personales"
  | "empresa";

type ResourceOrder =
  | "recent"
  | "used"
  | "name";

type CategoryFilter =
  | PresupuestoRecursoCategoria
  | "todos";

type ResourceDraft = {
  nombre: string;
  descripcion: string;
  categoria: PresupuestoRecursoCategoria;
  etiquetas: string;
  visibilidad: PresupuestoRecursoVisibilidad;
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

const CATEGORY_FILTER_OPTIONS: Array<{
  value: CategoryFilter;
  label: string;
}> = [
  {
    value: "todos",
    label: "Todas las categorías",
  },
  ...CATEGORY_OPTIONS,
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

const ORDER_OPTIONS: Array<{
  value: ResourceOrder;
  label: string;
}> = [
  {
    value: "recent",
    label: "Más recientes",
  },
  {
    value: "used",
    label: "Más utilizados",
  },
  {
    value: "name",
    label: "Nombre A–Z",
  },
];

const formatBytes = (
  value: number,
): string => {
  if (value <= 0) {
    return "—";
  }

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
};

const getDefaultResourceName = (
  file: File,
): string => {
  return file.name
    .replace(
      /\.[^.]+$/,
      "",
    )
    .trim();
};

const createResourceDraft = (
  recurso: PresupuestoRecurso,
): ResourceDraft => {
  return {
    nombre:
      recurso.nombre,

    descripcion:
      recurso.descripcion ??
      "",

    categoria:
      recurso.categoria,

    etiquetas:
      recurso.etiquetas.join(
        ", ",
      ),

    visibilidad:
      recurso.visibilidad,
  };
};

export function ResourceLibraryModal({
  open,
  onClose,
  onInsert,
}: ResourceLibraryModalProps) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [
    tab,
    setTab,
  ] = useState<LibraryTab>(
    "library",
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState<CategoryFilter>(
    "todos",
  );

  const [
    scope,
    setScope,
  ] = useState<ResourceScope>(
    "todos",
  );

  const [
    order,
    setOrder,
  ] = useState<ResourceOrder>(
    "recent",
  );

  const [
    favoritesOnly,
    setFavoritesOnly,
  ] = useState(false);

  const [
    selectedResourceId,
    setSelectedResourceId,
  ] = useState<string | null>(
    null,
  );

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState<string | null>(
    null,
  );

  const [
    editingResource,
    setEditingResource,
  ] = useState<PresupuestoRecurso | null>(
    null,
  );

  const [
    deletingResource,
    setDeletingResource,
  ] = useState<PresupuestoRecurso | null>(
    null,
  );

  const [
    resourceDraft,
    setResourceDraft,
  ] = useState<ResourceDraft>({
    nombre: "",
    descripcion: "",
    categoria: "otros",
    etiquetas: "",
    visibilidad: "personal",
  });

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(
    null,
  );

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(
    null,
  );

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState<string | null>(
    null,
  );

  const [
    resourceName,
    setResourceName,
  ] = useState("");

  const [
    resourceDescription,
    setResourceDescription,
  ] = useState("");

  const [
    uploadCategory,
    setUploadCategory,
  ] = useState<PresupuestoRecursoCategoria>(
    "otros",
  );

  const [
    visibility,
    setVisibility,
  ] = useState<PresupuestoRecursoVisibilidad>(
    "personal",
  );

  const [
    tagsDraft,
    setTagsDraft,
  ] = useState("");

  const {
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
  } = usePresupuestoRecursos();

  const selectedResource =
    useMemo(
      () =>
        recursos.find(
          (recurso) =>
            recurso.id ===
            selectedResourceId,
        ) ?? null,
      [
        recursos,
        selectedResourceId,
      ],
    );

  const visibleResources =
    useMemo(() => {
      const result =
        favoritesOnly
          ? recursos.filter(
              (recurso) =>
                recurso.favorito,
            )
          : [...recursos];

      if (order === "used") {
        return result.sort(
          (
            firstResource,
            secondResource,
          ) =>
            secondResource.usos -
            firstResource.usos,
        );
      }

      if (order === "name") {
        return result.sort(
          (
            firstResource,
            secondResource,
          ) =>
            firstResource.nombre.localeCompare(
              secondResource.nombre,
              "es-AR",
            ),
        );
      }

      return result.sort(
        (
          firstResource,
          secondResource,
        ) =>
          new Date(
            secondResource.updatedAt,
          ).getTime() -
          new Date(
            firstResource.updatedAt,
          ).getTime(),
      );
    }, [
      favoritesOnly,
      order,
      recursos,
    ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    clearError();

    void refresh({
      search,
      categoria:
        category,
      scope,
    });
  }, [
    clearError,
    open,
    refresh,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        void refresh({
          search,
          categoria:
            category,
          scope,
        });
      }, 250);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    category,
    open,
    refresh,
    scope,
    search,
  ]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl,
        );
      }
    };
  }, [
    previewUrl,
  ]);

  useEffect(() => {
    if (open) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl,
      );
    }

    setTab("library");
    setSearch("");
    setCategory("todos");
    setScope("todos");
    setOrder("recent");
    setFavoritesOnly(false);
    setSelectedResourceId(null);
    setOpenMenuId(null);
    setEditingResource(null);
    setDeletingResource(null);
    setActionError(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setResourceName("");
    setResourceDescription("");
    setUploadCategory("otros");
    setVisibility("personal");
    setTagsDraft("");
    clearError();
  }, [
    clearError,
    open,
    previewUrl,
  ]);

  const handleFileSelected = (
    file: File | null,
  ) => {
    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/",
      )
    ) {
      setActionError(
        "Seleccioná un archivo de imagen válido.",
      );

      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl,
      );
    }

    setSelectedFile(file);

    setPreviewUrl(
      URL.createObjectURL(
        file,
      ),
    );

    setResourceName(
      getDefaultResourceName(
        file,
      ),
    );

    setActionError(null);
    clearError();
  };

  const handleUpload =
    async () => {
      if (
        !selectedFile ||
        !resourceName.trim() ||
        saving
      ) {
        return;
      }

      const recurso =
        await createResource({
          file:
            selectedFile,

          nombre:
            resourceName,

          descripcion:
            resourceDescription,

          categoria:
            uploadCategory,

          etiquetas:
            tagsDraft
              .split(",")
              .map((tag) =>
                tag.trim(),
              )
              .filter(Boolean),

          visibilidad:
            visibility,
        });

      if (!recurso) {
        return;
      }

      await registerUsage(
        recurso.id,
      );

      onInsert(recurso);
      onClose();
    };

  const handleInsert =
    async () => {
      if (!selectedResource) {
        return;
      }

      await registerUsage(
        selectedResource.id,
      );

      onInsert(
        selectedResource,
      );

      onClose();
    };

  const handleToggleFavorite =
    async (
      recurso: PresupuestoRecurso,
    ) => {
      if (
        !recurso.canManage ||
        saving
      ) {
        return;
      }

      setOpenMenuId(null);
      setActionError(null);

      const updated =
        await updateResource(
          recurso.id,
          {
            favorito:
              !recurso.favorito,
          },
        );

      if (!updated) {
        setActionError(
          "No se pudo actualizar el favorito.",
        );
      }
    };

  const handleEditRequest = (
    recurso: PresupuestoRecurso,
  ) => {
    if (!recurso.canManage) {
      return;
    }

    setOpenMenuId(null);
    setActionError(null);
    setEditingResource(recurso);
    setResourceDraft(
      createResourceDraft(
        recurso,
      ),
    );
  };

  const handleEditSave =
    async () => {
      if (
        !editingResource ||
        !resourceDraft.nombre.trim() ||
        saving
      ) {
        return;
      }

      setActionError(null);

      const updated =
        await updateResource(
          editingResource.id,
          {
            nombre:
              resourceDraft.nombre,

            descripcion:
              resourceDraft.descripcion,

            categoria:
              resourceDraft.categoria,

            etiquetas:
              resourceDraft.etiquetas
                .split(",")
                .map((tag) =>
                  tag.trim(),
                )
                .filter(Boolean),

            visibilidad:
              resourceDraft.visibilidad,
          },
        );

      if (!updated) {
        setActionError(
          "No se pudo guardar el recurso.",
        );

        return;
      }

      setEditingResource(null);
      setActionError(null);
    };

  const handleDeleteRequest = (
    recurso: PresupuestoRecurso,
  ) => {
    if (!recurso.canManage) {
      return;
    }

    setOpenMenuId(null);
    setActionError(null);
    setDeletingResource(recurso);
  };

  const handleDeleteConfirm =
    async () => {
      if (
        !deletingResource ||
        saving
      ) {
        return;
      }

      setActionError(null);

      const deleted =
        await deleteResource(
          deletingResource.id,
        );

      if (!deleted) {
        setActionError(
          "No se pudo eliminar el recurso.",
        );

        return;
      }

      if (
        selectedResourceId ===
        deletingResource.id
      ) {
        setSelectedResourceId(
          null,
        );
      }

      setDeletingResource(null);
      setActionError(null);
    };

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[420] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[3px] sm:p-6"
        onMouseDown={onClose}
      >
        <section
          className="flex h-[min(900px,94dvh)] w-full max-w-7xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_32px_110px_rgba(15,23,42,0.34)]"
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          <header className="flex shrink-0 items-start justify-between gap-5 border-b border-slate-200 px-5 py-5 sm:px-7">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-[#172033]">
                Biblioteca de recursos
              </h2>

              <p className="mt-1.5 text-sm leading-5 text-slate-500">
                Reutilizá y administrá imágenes compartidas entre presupuestos y templates.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </header>

          <div className="flex shrink-0 border-b border-slate-200 px-5 pt-3 sm:px-7">
            <button
              type="button"
              onClick={() =>
                setTab(
                  "library",
                )
              }
              className={[
                "flex h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition",
                tab ===
                "library"
                  ? "border-[#FF634A] text-[#FF634A]"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              ].join(" ")}
            >
              <FileImage
                size={17}
              />

              Biblioteca
            </button>

            <button
              type="button"
              onClick={() =>
                setTab(
                  "upload",
                )
              }
              className={[
                "flex h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition",
                tab === "upload"
                  ? "border-[#FF634A] text-[#FF634A]"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              ].join(" ")}
            >
              <Upload
                size={17}
              />

              Subir uno
            </button>

            <button
              type="button"
              onClick={() =>
                setTab(
                  "bulk",
                )
              }
              className={[
                "flex h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition",
                tab === "bulk"
                  ? "border-[#FF634A] text-[#FF634A]"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              ].join(" ")}
            >
              <Files
                size={17}
              />

              Subir varios
            </button>
          </div>

          {tab ===
          "library" ? (
            <>
              <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-4 sm:px-7">
                <div className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_190px_180px_auto_auto]">
                  <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-[#FF634A] focus-within:ring-2 focus-within:ring-[#FF634A]/10">
                    <Search
                      size={16}
                      className="shrink-0 text-slate-400"
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value,
                        )
                      }
                      placeholder="Buscar recurso..."
                      className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <EditorSelect
                    value={category}
                    options={
                      CATEGORY_FILTER_OPTIONS
                    }
                    onChange={
                      setCategory
                    }
                  />

                  <EditorSelect
                    value={order}
                    options={
                      ORDER_OPTIONS
                    }
                    onChange={
                      setOrder
                    }
                  />

                  <div className="inline-flex w-fit rounded-lg bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() =>
                        setScope(
                          "todos",
                        )
                      }
                      className={[
                        "h-8 rounded-lg px-3 text-xs font-semibold transition",
                        scope ===
                        "todos"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800",
                      ].join(" ")}
                    >
                      Todos
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setScope(
                          "personales",
                        )
                      }
                      className={[
                        "h-8 rounded-lg px-3 text-xs font-semibold transition",
                        scope ===
                        "personales"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800",
                      ].join(" ")}
                    >
                      Míos
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setScope(
                          "empresa",
                        )
                      }
                      className={[
                        "h-8 rounded-lg px-3 text-xs font-semibold transition",
                        scope ===
                        "empresa"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800",
                      ].join(" ")}
                    >
                      Empresa
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setFavoritesOnly(
                        (current) =>
                          !current,
                      )
                    }
                    className={[
                      "flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold transition",
                      favoritesOnly
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <Star
                      size={15}
                      fill={
                        favoritesOnly
                          ? "currentColor"
                          : "none"
                      }
                    />

                    Favoritos
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] px-5 py-5 sm:px-7">
                {loading ? (
                  <div className="flex min-h-full items-center justify-center gap-2 text-sm text-slate-500">
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Cargando recursos...
                  </div>
                ) : error ? (
                  <div className="flex min-h-full items-center justify-center">
                    <div className="max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                      {error}
                    </div>
                  </div>
                ) : visibleResources.length ===
                  0 ? (
                  <div className="flex min-h-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                    <div>
                      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                        {favoritesOnly ? (
                          <Star
                            size={24}
                          />
                        ) : (
                          <ImagePlus
                            size={24}
                          />
                        )}
                      </span>

                      <p className="mt-4 text-sm font-semibold text-slate-800">
                        {favoritesOnly
                          ? "No hay favoritos"
                          : "No hay recursos disponibles"}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {favoritesOnly
                          ? "Marcá recursos propios como favoritos para encontrarlos rápidamente."
                          : "Subí la primera imagen para comenzar la biblioteca."}
                      </p>

                      {!favoritesOnly ? (
                        <button
                          type="button"
                          onClick={() =>
                            setTab(
                              "upload",
                            )
                          }
                          className="mt-4 h-9 rounded-lg bg-[#FF634A] px-4 text-sm font-semibold text-white transition hover:bg-[#f0543d]"
                        >
                          Subir recurso
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {visibleResources.map(
                      (recurso) => {
                        const selected =
                          recurso.id ===
                          selectedResourceId;

                        const menuOpen =
                          openMenuId ===
                          recurso.id;

                        return (
                          <article
                            key={
                              recurso.id
                            }
                            className={[
                              "relative overflow-hidden rounded-lg border bg-white transition",
                              selected
                                ? "border-[#FF634A] shadow-[0_12px_35px_rgba(255,99,74,0.14)] ring-2 ring-[#FF634A]/15"
                                : "border-slate-200 hover:border-slate-300 hover:shadow-md",
                            ].join(" ")}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedResourceId(
                                  recurso.id,
                                )
                              }
                              className="block w-full text-left"
                            >
                              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                                <img
                                  src={
                                    recurso.archivoUrl
                                  }
                                  alt={
                                    recurso.nombre
                                  }
                                  draggable={
                                    false
                                  }
                                  className="h-full w-full object-contain"
                                />

                                <span className="absolute left-2 top-2 inline-flex h-7 items-center gap-1 rounded-lg bg-white/95 px-2 text-[10px] font-semibold text-slate-600 shadow-sm backdrop-blur">
                                  {recurso.visibilidad ===
                                  "empresa" ? (
                                    <Building2
                                      size={12}
                                    />
                                  ) : (
                                    <UserRound
                                      size={12}
                                    />
                                  )}

                                  {recurso.visibilidad ===
                                  "empresa"
                                    ? "Empresa"
                                    : "Personal"}
                                </span>

                                {recurso.favorito ? (
                                  <span className="absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600 shadow-sm">
                                    <Star
                                      size={14}
                                      fill="currentColor"
                                    />
                                  </span>
                                ) : null}

                                {selected ? (
                                  <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#FF634A] text-white shadow-md">
                                    <Check
                                      size={18}
                                    />
                                  </span>
                                ) : null}
                              </div>

                              <div className="min-h-[94px] p-3">
                                <p className="truncate pr-7 text-sm font-semibold text-slate-900">
                                  {
                                    recurso.nombre
                                  }
                                </p>

                                <p className="mt-1 truncate text-xs text-slate-500">
                                  {
                                    recurso.categoria
                                  }
                                  {" · "}
                                  {recurso.ancho &&
                                  recurso.alto
                                    ? `${recurso.ancho} × ${recurso.alto}`
                                    : "Sin dimensiones"}
                                </p>

                                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">
                                  {formatBytes(
                                    recurso.pesoBytes,
                                  )}
                                  {" · "}
                                  {recurso.usos}{" "}
                                  {recurso.usos ===
                                  1
                                    ? "uso"
                                    : "usos"}
                                </p>
                              </div>
                            </button>

                            {recurso.canManage ? (
                              <div className="absolute bottom-3 right-3">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();

                                    setOpenMenuId(
                                      menuOpen
                                        ? null
                                        : recurso.id,
                                    );
                                  }}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-black/10 transition hover:bg-slate-50 hover:text-slate-900"
                                  aria-label="Administrar recurso"
                                >
                                  <MoreVertical
                                    size={16}
                                  />
                                </button>

                                {menuOpen ? (
                                  <>
                                    <button
                                      type="button"
                                      className="fixed inset-0 z-20 cursor-default bg-transparent"
                                      onClick={() =>
                                        setOpenMenuId(
                                          null,
                                        )
                                      }
                                      aria-label="Cerrar menú"
                                    />

                                    <div className="absolute bottom-10 right-0 z-30 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                                      <button
                                        type="button"
                                        disabled={saving}
                                        onClick={() =>
                                          void handleToggleFavorite(
                                            recurso,
                                          )
                                        }
                                        className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
                                      >
                                        <Star
                                          size={14}
                                          fill={
                                            recurso.favorito
                                              ? "currentColor"
                                              : "none"
                                          }
                                        />

                                        {recurso.favorito
                                          ? "Quitar de favoritos"
                                          : "Agregar a favoritos"}
                                      </button>

                                      <button
                                        type="button"
                                        disabled={saving}
                                        onClick={() =>
                                          handleEditRequest(
                                            recurso,
                                          )
                                        }
                                        className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
                                      >
                                        <Edit3
                                          size={14}
                                        />

                                        Editar datos
                                      </button>

                                      <button
                                        type="button"
                                        disabled={saving}
                                        onClick={() =>
                                          handleDeleteRequest(
                                            recurso,
                                          )
                                        }
                                        className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                                      >
                                        <Trash2
                                          size={14}
                                        />

                                        Eliminar
                                      </button>
                                    </div>
                                  </>
                                ) : null}
                              </div>
                            ) : null}
                          </article>
                        );
                      },
                    )}
                  </div>
                )}
              </div>

              <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div className="min-w-0">
                  {selectedResource ? (
                    <>
                      <p className="text-xs font-semibold text-slate-500">
                        Recurso seleccionado
                      </p>

                      <p className="mt-0.5 truncate text-sm font-semibold text-[#172033]">
                        {
                          selectedResource.nombre
                        }
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Seleccioná una imagen para insertarla.
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    disabled={
                      !selectedResource
                    }
                    onClick={() =>
                      void handleInsert()
                    }
                    className="h-10 rounded-lg bg-[#FF634A] px-5 text-sm font-semibold text-white transition hover:bg-[#f0543d] disabled:cursor-not-allowed disabled:bg-[#FFB7AB]"
                  >
                    Insertar recurso
                  </button>
                </div>
              </footer>
            </>
          ) : tab ===
          "bulk" ? (
            <ResourceBatchUploadPanel
              onCompleted={async () => {
                await refresh({
                  search: "",
                  categoria:
                    "todos",
                  scope:
                    "todos",
                });
              }}
            />
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] px-5 py-5 sm:px-7 sm:py-6">
                <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                  <section className="rounded-lg border border-slate-200 bg-white p-5">
                    <h3 className="text-base font-semibold text-[#172033]">
                      Archivo
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      JPG, PNG, WEBP, GIF o SVG de hasta 15 MB.
                    </p>

                    <input
                      ref={
                        fileInputRef
                      }
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                      onChange={(event) =>
                        handleFileSelected(
                          event
                            .currentTarget
                            .files?.[0] ??
                            null,
                        )
                      }
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="mt-5 flex min-h-[300px] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 transition hover:border-[#FF634A] hover:bg-[#FFF8F6]"
                    >
                      {previewUrl ? (
                        <img
                          src={
                            previewUrl
                          }
                          alt="Vista previa"
                          className="max-h-[380px] w-full object-contain"
                        />
                      ) : (
                        <div className="p-8 text-center">
                          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                            <Upload
                              size={23}
                            />
                          </span>

                          <p className="mt-4 text-sm font-semibold text-slate-800">
                            Elegir imagen
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            La imagen quedará disponible para futuros presupuestos.
                          </p>
                        </div>
                      )}
                    </button>

                    {selectedFile ? (
                      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        {selectedFile.name}
                        {" · "}
                        {formatBytes(
                          selectedFile.size,
                        )}
                      </div>
                    ) : null}
                  </section>

                  <section className="rounded-lg border border-slate-200 bg-white p-5">
                    <h3 className="text-base font-semibold text-[#172033]">
                      Datos del recurso
                    </h3>

                    <div className="mt-5 space-y-4">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-600">
                          Nombre
                        </span>

                        <input
                          type="text"
                          value={
                            resourceName
                          }
                          onChange={(event) =>
                            setResourceName(
                              event.target.value,
                            )
                          }
                          placeholder="Ej. Logo NOSTUR blanco"
                          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-600">
                          Categoría
                        </span>

                        <EditorSelect
                          value={
                            uploadCategory
                          }
                          options={
                            CATEGORY_OPTIONS
                          }
                          onChange={
                            setUploadCategory
                          }
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-600">
                          Visibilidad
                        </span>

                        <EditorSelect
                          value={
                            visibility
                          }
                          options={
                            VISIBILITY_OPTIONS
                          }
                          onChange={
                            setVisibility
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
                            tagsDraft
                          }
                          onChange={(event) =>
                            setTagsDraft(
                              event.target.value,
                            )
                          }
                          placeholder="caribe, playa, verano"
                          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
                        />

                        <p className="mt-1 text-[11px] text-slate-400">
                          Separadas por comas.
                        </p>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-600">
                          Descripción
                        </span>

                        <textarea
                          value={
                            resourceDescription
                          }
                          onChange={(event) =>
                            setResourceDescription(
                              event.target.value,
                            )
                          }
                          placeholder="Descripción opcional..."
                          className="min-h-[90px] w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
                        />
                      </label>
                    </div>

                    {error ||
                    actionError ? (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                        {error ||
                          actionError}
                      </div>
                    ) : null}
                  </section>
                </div>
              </div>

              <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
                <button
                  type="button"
                  disabled={saving}
                  onClick={onClose}
                  className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={
                    !selectedFile ||
                    !resourceName.trim() ||
                    saving
                  }
                  onClick={() =>
                    void handleUpload()
                  }
                  className="flex h-10 items-center gap-2 rounded-lg bg-[#FF634A] px-5 text-sm font-semibold text-white transition hover:bg-[#f0543d] disabled:cursor-not-allowed disabled:bg-[#FFB7AB]"
                >
                  {saving ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <ImagePlus
                      size={16}
                    />
                  )}

                  {saving
                    ? "Guardando..."
                    : "Guardar e insertar"}
                </button>
              </footer>
            </>
          )}
        </section>
      </div>

      {editingResource ? (
        <div
          className="fixed inset-0 z-[460] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]"
          onMouseDown={() => {
            if (!saving) {
              setEditingResource(
                null,
              );

              setActionError(null);
            }
          }}
        >
          <section
            className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.3)]"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Editar recurso
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  La imagen original no será modificada.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setEditingResource(
                    null,
                  );

                  setActionError(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  <div className="aspect-square">
                    <img
                      src={
                        editingResource.archivoUrl
                      }
                      alt={
                        editingResource.nombre
                      }
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-slate-600">
                      Nombre
                    </span>

                    <input
                      type="text"
                      value={
                        resourceDraft.nombre
                      }
                      onChange={(event) =>
                        setResourceDraft(
                          (current) => ({
                            ...current,
                            nombre:
                              event.target.value,
                          }),
                        )
                      }
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold text-slate-600">
                        Categoría
                      </span>

                      <EditorSelect
                        value={
                          resourceDraft.categoria
                        }
                        options={
                          CATEGORY_OPTIONS
                        }
                        onChange={(value) =>
                          setResourceDraft(
                            (current) => ({
                              ...current,
                              categoria:
                                value,
                            }),
                          )
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold text-slate-600">
                        Visibilidad
                      </span>

                      <EditorSelect
                        value={
                          resourceDraft.visibilidad
                        }
                        options={
                          VISIBILITY_OPTIONS
                        }
                        onChange={(value) =>
                          setResourceDraft(
                            (current) => ({
                              ...current,
                              visibilidad:
                                value,
                            }),
                          )
                        }
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-slate-600">
                      Etiquetas
                    </span>

                    <input
                      type="text"
                      value={
                        resourceDraft.etiquetas
                      }
                      onChange={(event) =>
                        setResourceDraft(
                          (current) => ({
                            ...current,
                            etiquetas:
                              event.target.value,
                          }),
                        )
                      }
                      placeholder="caribe, playa, verano"
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-slate-600">
                      Descripción
                    </span>

                    <textarea
                      value={
                        resourceDraft.descripcion
                      }
                      onChange={(event) =>
                        setResourceDraft(
                          (current) => ({
                            ...current,
                            descripcion:
                              event.target.value,
                          }),
                        )
                      }
                      className="min-h-[100px] w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#FF634A]"
                    />
                  </label>
                </div>
              </div>

              {actionError ||
              error ? (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {actionError ||
                    error}
                </div>
              ) : null}
            </div>

            <footer className="flex shrink-0 justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setEditingResource(
                    null,
                  );

                  setActionError(null);
                }}
                className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  saving ||
                  !resourceDraft.nombre.trim()
                }
                onClick={() =>
                  void handleEditSave()
                }
                className="flex h-10 items-center gap-2 rounded-lg bg-[#FF634A] px-5 text-sm font-semibold text-white transition hover:bg-[#f0543d] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Edit3
                    size={16}
                  />
                )}

                {saving
                  ? "Guardando..."
                  : "Guardar cambios"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {deletingResource ? (
        <div
          className="fixed inset-0 z-[470] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]"
          onMouseDown={() => {
            if (!saving) {
              setDeletingResource(
                null,
              );

              setActionError(null);
            }
          }}
        >
          <section
            className="w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.3)]"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Eliminar recurso
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Se eliminará de la biblioteca y de Supabase Storage.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setDeletingResource(
                    null,
                  );

                  setActionError(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </header>

            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  <img
                    src={
                      deletingResource.archivoUrl
                    }
                    alt={
                      deletingResource.nombre
                    }
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-sm text-slate-700">
                    ¿Eliminar definitivamente?
                  </p>

                  <p className="mt-1 truncate text-base font-semibold text-slate-900">
                    {
                      deletingResource.nombre
                    }
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Los presupuestos y templates que ya contienen esta imagen conservarán la URL actual, pero no podrán recuperarla si el archivo es eliminado del Storage.
              </p>

              {actionError ||
              error ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {actionError ||
                    error}
                </div>
              ) : null}
            </div>

            <footer className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setDeletingResource(
                    null,
                  );

                  setActionError(null);
                }}
                className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void handleDeleteConfirm()
                }
                className="flex h-10 items-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2
                    size={16}
                  />
                )}

                {saving
                  ? "Eliminando..."
                  : "Eliminar recurso"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
