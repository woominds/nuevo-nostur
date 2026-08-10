import {
  useCallback,
  useEffect,
  useRef,
} from "react";

import {
  usePresupuestoEditorStore,
} from "../store/presupuestoEditorStore";

const HORIZONTAL_PADDING = 48;
const VERTICAL_PADDING = 48;

export function useEditorFitZoom() {
  const workspaceRef =
    useRef<HTMLDivElement | null>(null);

  const documentId =
    usePresupuestoEditorStore(
      (state) => state.document?.id ?? null,
    );

  const canvasWidth =
    usePresupuestoEditorStore(
      (state) =>
        state.document?.canvas.width ??
        0,
    );

  const canvasHeight =
    usePresupuestoEditorStore(
      (state) =>
        state.document?.canvas.height ??
        0,
    );

  const setZoom =
    usePresupuestoEditorStore(
      (state) => state.setZoom,
    );

  const fitToScreen =
    useCallback(() => {
      const workspace =
        workspaceRef.current;

      if (
        !workspace ||
        !documentId ||
        canvasWidth <= 0 ||
        canvasHeight <= 0
      ) {
        return;
      }

      const availableWidth =
        workspace.clientWidth -
        HORIZONTAL_PADDING;

      const availableHeight =
        workspace.clientHeight -
        VERTICAL_PADDING;

      if (
        availableWidth <= 0 ||
        availableHeight <= 0
      ) {
        return;
      }

      const widthZoom =
        availableWidth /
        canvasWidth;

      const heightZoom =
        availableHeight /
        canvasHeight;

      setZoom(
        Math.min(
          widthZoom,
          heightZoom,
          1,
        ),
      );
    }, [
      canvasHeight,
      canvasWidth,
      documentId,
      setZoom,
    ]);

  useEffect(() => {
    const workspace =
      workspaceRef.current;

    if (
      !workspace ||
      !documentId
    ) {
      return;
    }

    const observer =
      new ResizeObserver(() => {
        fitToScreen();
      });

    observer.observe(workspace);

    fitToScreen();

    return () => {
      observer.disconnect();
    };
  }, [
    documentId,
    fitToScreen,
  ]);

  return {
    workspaceRef,
    fitToScreen,
  };
}
