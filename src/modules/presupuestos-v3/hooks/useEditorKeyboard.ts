import {
  useEffect,
  useRef,
} from "react";

import {
  usePresupuestoEditorStore,
} from "../store/presupuestoEditorStore";

import {
  fileToDataUrl,
} from "../utils/imageFile";

const isEditableTarget = (
  target: EventTarget | null,
): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
};

export function useEditorKeyboard() {
  const copiedElementIdRef =
    useRef<string | null>(null);

  const selectedElementId =
    usePresupuestoEditorStore(
      (state) =>
        state.selectedElementId,
    );

  const selectElement =
    usePresupuestoEditorStore(
      (state) => state.selectElement,
    );

  const duplicateElement =
    usePresupuestoEditorStore(
      (state) => state.duplicateElement,
    );

  const deleteElement =
    usePresupuestoEditorStore(
      (state) => state.deleteElement,
    );

  const undo =
    usePresupuestoEditorStore(
      (state) => state.undo,
    );

  const redo =
    usePresupuestoEditorStore(
      (state) => state.redo,
    );

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const modifierPressed =
        event.metaKey || event.ctrlKey;

      const key =
        event.key.toLowerCase();

      if (
        modifierPressed &&
        key === "c" &&
        selectedElementId
      ) {
        event.preventDefault();

        copiedElementIdRef.current =
          selectedElementId;

        return;
      }

      if (
        modifierPressed &&
        key === "z"
      ) {
        event.preventDefault();

        if (event.shiftKey) {
          redo();
          return;
        }

        undo();
        return;
      }

      if (
        modifierPressed &&
        key === "y"
      ) {
        event.preventDefault();
        redo();
        return;
      }

      if (
        modifierPressed &&
        key === "d" &&
        selectedElementId
      ) {
        event.preventDefault();

        duplicateElement(
          selectedElementId,
        );

        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        selectElement(null);
        return;
      }

      if (
        (event.key === "Delete" ||
          event.key === "Backspace") &&
        selectedElementId
      ) {
        event.preventDefault();

        deleteElement(
          selectedElementId,
        );

        return;
      }

      const arrowKeys = [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
      ];

      if (
        !selectedElementId ||
        !arrowKeys.includes(event.key)
      ) {
        return;
      }

      const store =
        usePresupuestoEditorStore.getState();

      const currentDocument =
        store.document;

      const selectedElement =
        currentDocument?.elements.find(
          (element) =>
            element.id ===
            selectedElementId,
        );

      if (
        !currentDocument ||
        !selectedElement ||
        selectedElement.locked
      ) {
        return;
      }

      event.preventDefault();

      const movement =
        event.shiftKey ? 10 : 1;

      let nextX =
        selectedElement.x;

      let nextY =
        selectedElement.y;

      if (event.key === "ArrowLeft") {
        nextX -= movement;
      }

      if (event.key === "ArrowRight") {
        nextX += movement;
      }

      if (event.key === "ArrowUp") {
        nextY -= movement;
      }

      if (event.key === "ArrowDown") {
        nextY += movement;
      }

      const maximumX = Math.max(
        0,
        currentDocument.canvas.width -
          selectedElement.width,
      );

      const maximumY = Math.max(
        0,
        currentDocument.canvas.height -
          selectedElement.height,
      );

      store.updateElement(
        selectedElement.id,
        {
          x: Math.max(
            0,
            Math.min(maximumX, nextX),
          ),
          y: Math.max(
            0,
            Math.min(maximumY, nextY),
          ),
        },
      );
    };

    const handlePaste = async (
      event: ClipboardEvent,
    ) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const clipboardData =
        event.clipboardData;

      if (!clipboardData) {
        return;
      }

      const clipboardItems =
        Array.from(
          clipboardData.items,
        );

      const imageItem =
        clipboardItems.find(
          (item) =>
            item.type.startsWith(
              "image/",
            ),
        );

      if (imageItem) {
        const file =
          imageItem.getAsFile();

        if (!file) {
          return;
        }

        event.preventDefault();

        try {
          const imageDataUrl =
            await fileToDataUrl(file);

          const store =
            usePresupuestoEditorStore.getState();

          store.addImageElement();

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
              alt:
                file.name ||
                "Imagen pegada",
            },
          );
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "No se pudo pegar la imagen.";

          window.alert(message);
        }

        return;
      }

      const copiedElementId =
        copiedElementIdRef.current;

      const currentDocument =
        usePresupuestoEditorStore
          .getState()
          .document;

      const copiedElementExists =
        Boolean(
          copiedElementId &&
            currentDocument?.elements.some(
              (element) =>
                element.id ===
                copiedElementId,
            ),
        );

      if (copiedElementExists) {
        event.preventDefault();

        duplicateElement(
          copiedElementId as string,
        );

        return;
      }

      const pastedText =
        clipboardData
          .getData("text/plain")
          .trim();

      if (!pastedText) {
        return;
      }

      event.preventDefault();

      const store =
        usePresupuestoEditorStore.getState();

      store.addTextElement();

      const nextState =
        usePresupuestoEditorStore.getState();

      if (!nextState.selectedElementId) {
        return;
      }

      nextState.updateElement(
        nextState.selectedElementId,
        {
          content: pastedText,
          name: "Texto pegado",
        },
      );
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    window.addEventListener(
      "paste",
      handlePaste,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      window.removeEventListener(
        "paste",
        handlePaste,
      );
    };
  }, [
    deleteElement,
    duplicateElement,
    redo,
    selectElement,
    selectedElementId,
    undo,
  ]);
}
