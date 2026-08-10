import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  DragEvent,
  MouseEvent,
} from "react";

import {
  CopyPlus,
  FilePlus2,
  Trash2,
} from "lucide-react";

import {
  EditorElement,
} from "../EditorElement";

import {
  EditorTransformControls,
} from "../EditorTransformControls";

import {
  usePresupuestoEditorStore,
} from "../../store/presupuestoEditorStore";

import {
  fileToDataUrl,
} from "../../utils/imageFile";

export function EditorCanvas() {
  const document =
    usePresupuestoEditorStore(
      (state) => state.document,
    );

  const selectedElementIds =
    usePresupuestoEditorStore(
      (state) =>
        state.selectedElementIds,
    );

  const zoom =
    usePresupuestoEditorStore(
      (state) => state.zoom,
    );

  const selectElement =
    usePresupuestoEditorStore(
      (state) => state.selectElement,
    );

  const setActivePage =
    usePresupuestoEditorStore(
      (state) => state.setActivePage,
    );

  const updateElement =
    usePresupuestoEditorStore(
      (state) => state.updateElement,
    );

  const addPage =
    usePresupuestoEditorStore(
      (state) => state.addPage,
    );

  const duplicatePage =
    usePresupuestoEditorStore(
      (state) => state.duplicatePage,
    );

  const deletePage =
    usePresupuestoEditorStore(
      (state) => state.deletePage,
    );

  const [
    activeCanvasElement,
    setActiveCanvasElement,
  ] = useState<HTMLDivElement | null>(
    null,
  );

  const pageElementsRef =
    useRef<
      Map<
        string,
        HTMLElement
      >
    >(new Map());

  const previousActivePageIdRef =
    useRef<string | null>(null);

  const [
    draggingFile,
    setDraggingFile,
  ] = useState(false);

  const [
    dropPageId,
    setDropPageId,
  ] = useState<string | null>(null);

  const orderedPages = useMemo(
    () =>
      document
        ? [...document.pages].sort(
            (
              firstPage,
              secondPage,
            ) =>
              firstPage.order -
              secondPage.order,
          )
        : [],
    [document],
  );

  const registerCanvas = useCallback(
    (
      pageId: string,
      element: HTMLDivElement | null,
    ) => {
      if (element) {
        pageElementsRef.current.set(
          pageId,
          element,
        );
      } else {
        pageElementsRef.current.delete(
          pageId,
        );
      }

      if (
        pageId ===
        document?.activePageId
      ) {
        setActiveCanvasElement(
          element,
        );
      }
    },
    [
      document?.activePageId,
    ],
  );

  useEffect(() => {
    const activePageId =
      document?.activePageId;

    if (!activePageId) {
      return;
    }

    const pageChanged =
      previousActivePageIdRef.current !==
      activePageId;

    previousActivePageIdRef.current =
      activePageId;

    if (!pageChanged) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        const activePageElement =
          pageElementsRef.current.get(
            activePageId,
          );

        activePageElement?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }, 80);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    document?.activePageId,
  ]);

  const handleWorkspaceMouseDown = (
    event: MouseEvent<HTMLDivElement>,
  ) => {
    const target =
      event.target as HTMLElement;

    const clickedEditorElement =
      target.closest(
        "[data-editor-element-id]",
      );

    const clickedMoveableControl =
      target.closest(
        ".moveable-control-box",
      );

    const clickedPageAction =
      target.closest(
        "[data-page-action]",
      );

    if (
      clickedEditorElement ||
      clickedMoveableControl ||
      clickedPageAction
    ) {
      return;
    }

    const clickedPage =
      target.closest<HTMLElement>(
        "[data-editor-page-id]",
      );

    if (clickedPage) {
      const pageId =
        clickedPage.dataset
          .editorPageId;

      if (pageId) {
        setActivePage(pageId);
      }
    }

    selectElement(null);
  };

  const handleElementSelect = (
    pageId: string,
    elementId: string,
    additive: boolean,
  ) => {
    const changingPage =
      document?.activePageId !==
      pageId;

    if (changingPage) {
      setActivePage(pageId);
    }

    selectElement(
      elementId,
      changingPage
        ? false
        : additive,
    );
  };

  const handleDuplicatePage = (
    pageId: string,
  ) => {
    duplicatePage(pageId);
  };

  const handleDeletePage = (
    pageId: string,
  ) => {
    if (
      !document ||
      document.pages.length <= 1
    ) {
      return;
    }

    const shouldDelete =
      window.confirm(
        "¿Eliminar esta hoja del presupuesto?",
      );

    if (!shouldDelete) {
      return;
    }

    deletePage(pageId);
  };

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    const hasImageFile =
      Array.from(
        event.dataTransfer.items,
      ).some(
        (item) =>
          item.kind === "file" &&
          item.type.startsWith(
            "image/",
          ),
      );

    if (!hasImageFile) {
      return;
    }

    event.preventDefault();

    event.dataTransfer.dropEffect =
      "copy";

    const target =
      event.target as HTMLElement;

    const pageElement =
      target.closest<HTMLElement>(
        "[data-editor-page-id]",
      );

    setDropPageId(
      pageElement?.dataset
        .editorPageId ??
        null,
    );

    setDraggingFile(true);
  };

  const handleDragLeave = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    if (
      event.currentTarget.contains(
        event.relatedTarget as
          | Node
          | null,
      )
    ) {
      return;
    }

    setDraggingFile(false);
    setDropPageId(null);
  };

  const handleDrop = async (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();

    setDraggingFile(false);

    const target =
      event.target as HTMLElement;

    const pageElement =
      target.closest<HTMLElement>(
        "[data-editor-page-id]",
      );

    const pageId =
      pageElement?.dataset
        .editorPageId ??
      dropPageId;

    setDropPageId(null);

    if (
      !document ||
      !pageId ||
      !pageElement
    ) {
      return;
    }

    const page =
      document.pages.find(
        (currentPage) =>
          currentPage.id === pageId,
      );

    const file =
      Array.from(
        event.dataTransfer.files,
      ).find(
        (currentFile) =>
          currentFile.type.startsWith(
            "image/",
          ),
      );

    if (
      !page ||
      !file
    ) {
      return;
    }

    const pageBounds =
      pageElement.getBoundingClientRect();

    const dropX =
      (event.clientX -
        pageBounds.left) /
      zoom;

    const dropY =
      (event.clientY -
        pageBounds.top) /
      zoom;

    try {
      const imageDataUrl =
        await fileToDataUrl(file);

      setActivePage(pageId);

      usePresupuestoEditorStore
        .getState()
        .addImageElement();

      const nextState =
        usePresupuestoEditorStore.getState();

      if (
        !nextState.selectedElementId
      ) {
        return;
      }

      nextState.updateElement(
        nextState.selectedElementId,
        {
          src: imageDataUrl,
          alt: file.name,
          name: file.name,
          x: Math.max(
            0,
            Math.min(
              page.canvas.width -
                520,
              dropX - 260,
            ),
          ),
          y: Math.max(
            0,
            Math.min(
              page.canvas.height -
                320,
              dropY - 160,
            ),
          ),
        },
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo cargar la imagen.";

      window.alert(message);
    }
  };

  if (!document) {
    return (
      <div className="flex min-h-[420px] flex-1 items-center justify-center bg-slate-100 p-6 text-center">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            No hay un presupuesto abierto
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Seleccioná un template para comenzar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-0 flex-1 overflow-auto bg-slate-100 px-4 pb-32 pt-6 sm:px-8 sm:pb-32 sm:pt-8"
      onMouseDown={
        handleWorkspaceMouseDown
      }
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mx-auto flex w-max min-w-full flex-col items-center gap-8">
        {orderedPages.map(
          (page) => {
            const active =
              page.id ===
              document.activePageId;

            const orderedElements = [
              ...page.elements,
            ].sort(
              (
                firstElement,
                secondElement,
              ) =>
                firstElement.zIndex -
                secondElement.zIndex,
            );

            return (
              <section
                key={page.id}
                className="flex flex-col items-center"
              >
                <div className="mb-2 flex w-full items-center justify-between gap-4 px-1">
                  <div>
                    <span
                      className={[
                        "text-xs font-semibold",
                        active
                          ? "text-[#FF634A]"
                          : "text-slate-500",
                      ].join(" ")}
                    >
                      {page.name}
                    </span>

                    <span className="ml-2 text-[11px] text-slate-400">
                      {page.canvas.width} ×{" "}
                      {page.canvas.height}
                    </span>
                  </div>

                  <div
                    data-page-action
                    className="flex items-center gap-1"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleDuplicatePage(
                          page.id,
                        )
                      }
                      className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-600 transition hover:bg-white hover:text-slate-900 hover:shadow-sm"
                      title="Duplicar hoja"
                    >
                      <CopyPlus
                        size={15}
                      />

                      <span className="hidden sm:inline">
                        Duplicar
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={
                        document.pages
                          .length <= 1
                      }
                      onClick={() =>
                        handleDeletePage(
                          page.id,
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      title="Eliminar hoja"
                      aria-label="Eliminar hoja"
                    >
                      <Trash2
                        size={15}
                      />
                    </button>
                  </div>
                </div>

                <div
                  ref={(element) =>
                    registerCanvas(
                      page.id,
                      element,
                    )
                  }
                  data-editor-page-id={
                    page.id
                  }
                  className={[
                    "relative shrink-0 overflow-hidden bg-white shadow-[0_20px_60px_rgba(15,23,42,0.16)] transition",
                    active
                      ? "ring-2 ring-[#FF634A]/60 ring-offset-4 ring-offset-slate-100"
                      : "ring-1 ring-black/5",
                    dropPageId ===
                    page.id
                      ? "outline outline-4 outline-[#FF634A]/50"
                      : "",
                  ].join(" ")}
                  style={{
                    width:
                      page.canvas.width *
                      zoom,
                    height:
                      page.canvas.height *
                      zoom,
                    backgroundColor:
                      page.canvas
                        .backgroundColor,
                  }}
                >
                  {orderedElements.map(
                    (element) => (
                      <EditorElement
                        key={element.id}
                        element={element}
                        selected={
                          active &&
                          selectedElementIds.includes(
                            element.id,
                          )
                        }
                        zoom={zoom}
                        onSelect={(
                          elementId,
                          additive,
                        ) =>
                          handleElementSelect(
                            page.id,
                            elementId,
                            additive,
                          )
                        }
                        onUpdateText={(
                          elementId,
                          content,
                        ) => {
                          if (!active) {
                            setActivePage(
                              page.id,
                            );
                          }

                          updateElement(
                            elementId,
                            {
                              content,
                            },
                          );
                        }}
                      />
                    ),
                  )}

                  {active && (
                    <EditorTransformControls
                      canvasElement={
                        activeCanvasElement
                      }
                    />
                  )}
                </div>
                <button
                  type="button"
                  data-page-action
                  onClick={() =>
                    addPage(page.id)
                  }
                  className="mt-5 flex h-9 items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-[#FF634A] hover:text-[#FF634A] hover:shadow-sm"
                >
                  <FilePlus2 size={15} />

                  Agregar hoja debajo
                </button>
              </section>
            );
          },
        )}

        <button
          type="button"
          data-page-action
          onClick={() =>
            addPage(
              orderedPages.at(-1)?.id,
            )
          }
          className="flex h-11 items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:border-[#FF634A] hover:text-[#FF634A] hover:shadow-sm"
        >
          <FilePlus2 size={17} />

          Agregar hoja al final
        </button>
      </div>

      {draggingFile && (
        <div className="pointer-events-none fixed inset-4 z-50 flex items-center justify-center rounded-lg border-2 border-dashed border-[#FF634A] bg-[#FFF4F1]/85 backdrop-blur-[1px]">
          <div className="rounded-lg bg-white px-5 py-4 text-center shadow-lg">
            <p className="text-sm font-semibold text-slate-900">
              Soltá la imagen sobre una hoja
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Se agregará en la página indicada.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
