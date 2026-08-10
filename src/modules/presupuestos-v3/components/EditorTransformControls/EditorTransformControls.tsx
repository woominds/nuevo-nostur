import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Moveable from "react-moveable";

import {
  usePresupuestoEditorStore,
} from "../../store/presupuestoEditorStore";

import type {
  EditorElement,
} from "../../types/editor.types";

type EditorTransformControlsProps = {
  canvasElement: HTMLDivElement | null;
};

type TransformStartState = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type GroupStartItem = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  target: HTMLElement;
};

type GroupDelta = {
  x: number;
  y: number;
};

export function EditorTransformControls({
  canvasElement,
}: EditorTransformControlsProps) {
  const document =
    usePresupuestoEditorStore(
      (state) => state.document,
    );

  const selectedElementId =
    usePresupuestoEditorStore(
      (state) =>
        state.selectedElementId,
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

  const updateElement =
    usePresupuestoEditorStore(
      (state) =>
        state.updateElement,
    );

  const [
    targets,
    setTargets,
  ] = useState<HTMLElement[]>(
    [],
  );

  const transformStartRef =
    useRef<TransformStartState | null>(
      null,
    );

  const groupStartRef =
    useRef<GroupStartItem[]>(
      [],
    );

  const groupDeltaRef =
    useRef<GroupDelta>({
      x: 0,
      y: 0,
    });

  const selectedElement =
    document?.elements.find(
      (element) =>
        element.id ===
        selectedElementId,
    ) ?? null;

  const selectedElements =
    useMemo(
      () =>
        document?.elements.filter(
          (element) =>
            selectedElementIds.includes(
              element.id,
            ) &&
            element.visible &&
            !element.locked,
        ) ?? [],
      [
        document?.elements,
        selectedElementIds,
      ],
    );

  const multipleSelection =
    selectedElements.length > 1;

  const elementGuidelines =
    useMemo(() => {
      if (
        !canvasElement ||
        !document
      ) {
        return [];
      }

      return document.elements
        .filter(
          (element) =>
            !selectedElementIds.includes(
              element.id,
            ) &&
            element.visible,
        )
        .map((element) =>
          canvasElement.querySelector<HTMLElement>(
            `[data-editor-element-id="${element.id}"]`,
          ),
        )
        .filter(
          (
            element,
          ): element is HTMLElement =>
            element !== null,
        );
    }, [
      canvasElement,
      document,
      selectedElementIds,
    ]);

  useEffect(() => {
    if (
      !canvasElement ||
      selectedElementIds.length === 0
    ) {
      setTargets([]);
      return;
    }

    const nextTargets =
      selectedElementIds
        .map((elementId) =>
          canvasElement.querySelector<HTMLElement>(
            `[data-editor-element-id="${elementId}"]`,
          ),
        )
        .filter(
          (
            element,
          ): element is HTMLElement =>
            element !== null,
        );

    setTargets(
      nextTargets,
    );
  }, [
    canvasElement,
    document?.elements,
    selectedElementIds,
  ]);

  if (
    !canvasElement ||
    !document ||
    targets.length === 0
  ) {
    return null;
  }

  const clampPosition = (
    value: number,
    maximum: number,
  ) => {
    return Math.max(
      0,
      Math.min(
        maximum,
        value,
      ),
    );
  };

  const getAllowedGroupDelta = (
    requestedX: number,
    requestedY: number,
  ): GroupDelta => {
    const starts =
      groupStartRef.current;

    if (
      starts.length === 0
    ) {
      return {
        x: 0,
        y: 0,
      };
    }

    const minX =
      Math.max(
        ...starts.map(
          (item) =>
            -item.x,
        ),
      );

    const maxX =
      Math.min(
        ...starts.map(
          (item) =>
            document.canvas.width -
            item.x -
            item.width,
        ),
      );

    const minY =
      Math.max(
        ...starts.map(
          (item) =>
            -item.y,
        ),
      );

    const maxY =
      Math.min(
        ...starts.map(
          (item) =>
            document.canvas.height -
            item.y -
            item.height,
        ),
      );

    return {
      x:
        Math.max(
          minX,
          Math.min(
            maxX,
            requestedX,
          ),
        ),

      y:
        Math.max(
          minY,
          Math.min(
            maxY,
            requestedY,
          ),
        ),
    };
  };

  /*
    =====================================================
    SELECCIÓN MÚLTIPLE
    =====================================================

    Moveable recibe TODOS los targets seleccionados.

    Durante el drag movemos visualmente todos juntos.
    Al soltar persistimos cada nueva posición.
  */
  if (multipleSelection) {
    return (
      <Moveable
        target={targets}
        container={
          canvasElement
        }
        origin={false}
        draggable
        resizable={false}
        rotatable={false}
        snappable
        throttleDrag={1}
        snapThreshold={6}
        snapGap
        elementGuidelines={
          elementGuidelines
        }
        verticalGuidelines={[
          0,
          document.canvas.width *
            zoom /
            2,
          document.canvas.width *
            zoom,
        ]}
        horizontalGuidelines={[
          0,
          document.canvas.height *
            zoom /
            2,
          document.canvas.height *
            zoom,
        ]}
        onDragGroupStart={({
          events,
        }) => {
          const nextStarts =
            events
              .map(
                ({
                  target,
                }) => {
                  const elementId =
                    target.dataset
                      .editorElementId;

                  if (!elementId) {
                    return null;
                  }

                  const element =
                    selectedElements.find(
                      (currentElement) =>
                        currentElement.id ===
                        elementId,
                    );

                  if (!element) {
                    return null;
                  }

                  return {
                    id:
                      element.id,

                    x:
                      element.x,

                    y:
                      element.y,

                    width:
                      element.width,

                    height:
                      element.height,

                    target,
                  };
                },
              )
              .filter(
                (
                  item,
                ): item is GroupStartItem =>
                  item !== null,
              );

          groupStartRef.current =
            nextStarts;

          groupDeltaRef.current = {
            x: 0,
            y: 0,
          };
        }}
        onDragGroup={({
          events,
        }) => {
          if (
            events.length === 0 ||
            groupStartRef.current
              .length === 0
          ) {
            return;
          }

          const firstEvent =
            events[0];

          const requestedX =
            firstEvent.beforeTranslate[0] /
            zoom;

          const requestedY =
            firstEvent.beforeTranslate[1] /
            zoom;

          const allowedDelta =
            getAllowedGroupDelta(
              requestedX,
              requestedY,
            );

          groupDeltaRef.current =
            allowedDelta;

          groupStartRef.current.forEach(
            (item) => {
              item.target.style.left =
                `${
                  (
                    item.x +
                    allowedDelta.x
                  ) * zoom
                }px`;

              item.target.style.top =
                `${
                  (
                    item.y +
                    allowedDelta.y
                  ) * zoom
                }px`;
            },
          );
        }}
        onDragGroupEnd={() => {
          const starts =
            groupStartRef.current;

          const delta =
            groupDeltaRef.current;

          groupStartRef.current =
            [];

          groupDeltaRef.current = {
            x: 0,
            y: 0,
          };

          if (
            starts.length === 0 ||
            (
              delta.x === 0 &&
              delta.y === 0
            )
          ) {
            return;
          }

          /*
            Persistimos todas las posiciones.
            updateElement ya existe y funciona.
          */
          starts.forEach(
            (item) => {
              updateElement(
                item.id,
                {
                  x:
                    item.x +
                    delta.x,

                  y:
                    item.y +
                    delta.y,
                },
              );
            },
          );
        }}
      />
    );
  }

  /*
    =====================================================
    SELECCIÓN INDIVIDUAL
    =====================================================
  */

  const target =
    targets[0];

  if (
    !target ||
    !selectedElement ||
    selectedElement.locked ||
    !selectedElement.visible
  ) {
    return null;
  }

  const commitUpdate = (
    update: Partial<EditorElement>,
  ) => {
    updateElement(
      selectedElement.id,
      update,
    );
  };

  return (
    <Moveable
      target={target}
      container={
        canvasElement
      }
      origin={false}
      draggable
      resizable
      rotatable
      snappable
      keepRatio={
        selectedElement.type ===
        "image"
          ? selectedElement
              .maintainAspectRatio
          : false
      }
      throttleDrag={1}
      throttleResize={1}
      throttleRotate={1}
      edge={false}
      snapThreshold={6}
      snapGap
      elementGuidelines={
        elementGuidelines
      }
      verticalGuidelines={[
        0,
        document.canvas.width *
          zoom /
          2,
        document.canvas.width *
          zoom,
      ]}
      horizontalGuidelines={[
        0,
        document.canvas.height *
          zoom /
          2,
        document.canvas.height *
          zoom,
      ]}
      renderDirections={[
        "nw",
        "n",
        "ne",
        "w",
        "e",
        "sw",
        "s",
        "se",
      ]}
      onDragStart={() => {
        transformStartRef.current = {
          x:
            selectedElement.x,

          y:
            selectedElement.y,

          width:
            selectedElement.width,

          height:
            selectedElement.height,
        };
      }}
      onDrag={({
        target: dragTarget,
        beforeDelta,
      }) => {
        const start =
          transformStartRef.current;

        if (!start) {
          return;
        }

        start.x +=
          beforeDelta[0] /
          zoom;

        start.y +=
          beforeDelta[1] /
          zoom;

        const maximumX =
          Math.max(
            0,
            document.canvas.width -
              selectedElement.width,
          );

        const maximumY =
          Math.max(
            0,
            document.canvas.height -
              selectedElement.height,
          );

        const nextX =
          clampPosition(
            start.x,
            maximumX,
          );

        const nextY =
          clampPosition(
            start.y,
            maximumY,
          );

        dragTarget.style.left =
          `${nextX * zoom}px`;

        dragTarget.style.top =
          `${nextY * zoom}px`;
      }}
      onDragEnd={({
        isDrag,
      }) => {
        const start =
          transformStartRef.current;

        transformStartRef.current =
          null;

        if (
          !isDrag ||
          !start
        ) {
          return;
        }

        const maximumX =
          Math.max(
            0,
            document.canvas.width -
              selectedElement.width,
          );

        const maximumY =
          Math.max(
            0,
            document.canvas.height -
              selectedElement.height,
          );

        commitUpdate({
          x:
            clampPosition(
              start.x,
              maximumX,
            ),

          y:
            clampPosition(
              start.y,
              maximumY,
            ),
        });
      }}
      onResizeStart={() => {
        transformStartRef.current = {
          x:
            selectedElement.x,

          y:
            selectedElement.y,

          width:
            selectedElement.width,

          height:
            selectedElement.height,
        };
      }}
      onResize={({
        target: resizeTarget,
        width,
        height,
        drag,
      }) => {
        const nextWidth =
          Math.max(
            10,
            width / zoom,
          );

        const nextHeight =
          Math.max(
            10,
            height / zoom,
          );

        const nextX =
          clampPosition(
            drag.left / zoom,
            Math.max(
              0,
              document.canvas.width -
                nextWidth,
            ),
          );

        const nextY =
          clampPosition(
            drag.top / zoom,
            Math.max(
              0,
              document.canvas.height -
                nextHeight,
            ),
          );

        resizeTarget.style.width =
          `${nextWidth * zoom}px`;

        resizeTarget.style.height =
          `${nextHeight * zoom}px`;

        resizeTarget.style.left =
          `${nextX * zoom}px`;

        resizeTarget.style.top =
          `${nextY * zoom}px`;

        transformStartRef.current = {
          x: nextX,
          y: nextY,
          width: nextWidth,
          height: nextHeight,
        };
      }}
      onResizeEnd={({
        isDrag,
      }) => {
        const nextTransform =
          transformStartRef.current;

        transformStartRef.current =
          null;

        if (
          !isDrag ||
          !nextTransform
        ) {
          return;
        }

        commitUpdate(
          nextTransform,
        );
      }}
      onRotate={({
        target:
          rotateTarget,
        beforeRotate,
      }) => {
        rotateTarget.style.transform =
          `rotate(${beforeRotate}deg)`;
      }}
      onRotateEnd={({
        lastEvent,
      }) => {
        if (!lastEvent) {
          return;
        }

        commitUpdate({
          rotation:
            lastEvent.beforeRotate,
        });
      }}
    />
  );
}
