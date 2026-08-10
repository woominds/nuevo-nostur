import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  CSSProperties,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
} from "react";

import type {
  EditorElement as EditorElementType,
} from "../../types/editor.types";

type EditorElementProps = {
  element: EditorElementType;
  selected: boolean;
  zoom: number;
  onSelect: (
    elementId: string,
    additive: boolean,
  ) => void;
  onUpdateText: (
    elementId: string,
    content: string,
  ) => void;
};

const getBaseStyle = (
  element: EditorElementType,
  zoom: number,
): CSSProperties => {
  return {
    position: "absolute",
    left: element.x * zoom,
    top: element.y * zoom,
    width: element.width * zoom,
    height: element.height * zoom,
    zIndex: element.zIndex,
    opacity: element.opacity,
    transform: `rotate(${element.rotation}deg)`,
    transformOrigin: "center center",
    display: element.visible
      ? "block"
      : "none",
    cursor: element.locked
      ? "default"
      : "pointer",
    userSelect: "none",
  };
};

export function EditorElement({
  element,
  selected,
  zoom,
  onSelect,
  onUpdateText,
}: EditorElementProps) {
  const textElementRef =
    useRef<HTMLDivElement | null>(null);

  const [
    editingText,
    setEditingText,
  ] = useState(false);

  useEffect(() => {
    if (
      editingText &&
      textElementRef.current
    ) {
      textElementRef.current.focus();

      const selection =
        window.getSelection();

      const range =
        document.createRange();

      range.selectNodeContents(
        textElementRef.current,
      );

      range.collapse(false);

      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [editingText]);

  useEffect(() => {
    if (!selected) {
      setEditingText(false);
    }
  }, [selected]);

  const handleMouseDown = (
    event: MouseEvent<HTMLDivElement>,
  ) => {
    event.stopPropagation();

    onSelect(
      element.id,
      event.shiftKey,
    );
  };

  const handleDoubleClick = (
    event: MouseEvent<HTMLDivElement>,
  ) => {
    if (
      element.type !== "text" ||
      element.locked
    ) {
      return;
    }

    event.stopPropagation();

    onSelect(
      element.id,
      false,
    );

    setEditingText(true);
  };

  const commitTextContent = (
    target: HTMLDivElement,
  ) => {
    if (element.type !== "text") {
      return;
    }

    const nextContent =
      target.innerText.replace(
        /\n$/,
        "",
      );

    if (
      nextContent !== element.content
    ) {
      onUpdateText(
        element.id,
        nextContent,
      );
    }

    setEditingText(false);
  };

  const handleTextBlur = (
    event: FocusEvent<HTMLDivElement>,
  ) => {
    commitTextContent(
      event.currentTarget,
    );
  };

  const handleTextKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    event.stopPropagation();

    if (event.key === "Escape") {
      event.preventDefault();

      event.currentTarget.innerText =
        element.type === "text"
          ? element.content
          : "";

      setEditingText(false);
      event.currentTarget.blur();
    }

    if (
      event.key === "Enter" &&
      (event.metaKey ||
        event.ctrlKey)
    ) {
      event.preventDefault();

      commitTextContent(
        event.currentTarget,
      );

      event.currentTarget.blur();
    }
  };

  const baseStyle = getBaseStyle(
    element,
    zoom,
  );

  if (element.type === "text") {
    return (
      <div
        ref={textElementRef}
        data-editor-element-id={element.id}
        contentEditable={editingText}
        suppressContentEditableWarning
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onBlur={handleTextBlur}
        onKeyDown={handleTextKeyDown}
        style={{
          ...baseStyle,
          color: element.color,
          fontFamily:
            element.fontFamily ||
            "Open Sans",
          fontSize:
            element.fontSize * zoom,
          fontWeight:
            element.fontWeight,
          fontStyle: element.fontStyle,
          textAlign: element.textAlign,
          lineHeight:
            element.lineHeight,
          letterSpacing:
            element.letterSpacing *
            zoom,
          whiteSpace: "pre-wrap",
          overflow: "hidden",
          outline: selected
            ? "2px solid #FF634A"
            : "none",
          outlineOffset: 2,
          cursor: editingText
            ? "text"
            : element.locked
              ? "default"
              : "move",
          userSelect: editingText
            ? "text"
            : "none",
        }}
      >
        {element.content}
      </div>
    );
  }

  if (element.type === "image") {
    const cropZoom =
      element.cropZoom ?? 1;

    return (
      <div
        data-editor-element-id={element.id}
        onMouseDown={handleMouseDown}
        style={{
          ...baseStyle,
          overflow: "hidden",
          borderRadius:
            element.borderRadius *
            zoom,
          outline: selected
            ? "2px solid #FF634A"
            : "none",
          outlineOffset: 2,
          cursor: element.locked
            ? "default"
            : "move",
        }}
      >
        <img
          src={element.src}
          alt={element.alt}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: element.fit,
            objectPosition: `${element.positionX}% ${element.positionY}%`,
            transform:
              `scale(${cropZoom})`,
            transformOrigin:
              `${element.positionX}% ${element.positionY}%`,
            pointerEvents: "none",
          }}
        />
      </div>
    );
  }

  const shapeStyle =
    (() => {
      const common = {
        ...baseStyle,
        boxSizing:
          "border-box" as const,
        outline: selected
          ? "2px solid #FF634A"
          : "none",
        outlineOffset: 2,
        cursor: element.locked
          ? "default"
          : "move",
      };

      if (
        element.shape ===
        "line"
      ) {
        return {
          ...common,
          height: Math.max(
            2,
            element.borderWidth *
              zoom,
          ),
          top:
            element.y * zoom +
            (element.height *
              zoom) /
              2,
          backgroundColor:
            element.borderColor,
          border: "none",
          borderRadius: 999,
        };
      }

      const clipPath =
        element.shape ===
        "triangle"
          ? "polygon(50% 0%, 100% 100%, 0% 100%)"
          : element.shape ===
              "diamond"
            ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
            : element.shape ===
                "star"
              ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 94%, 50% 72%, 21% 94%, 32% 57%, 2% 35%, 39% 35%)"
              : undefined;

      return {
        ...common,
        backgroundColor:
          element.backgroundColor,
        border: `${element.borderWidth * zoom}px solid ${element.borderColor}`,
        borderRadius:
          element.shape ===
          "circle"
            ? "50%"
            : element.shape ===
                "pill"
              ? 999
              : element.shape ===
                  "rounded-rectangle"
                ? Math.max(
                    24,
                    element.borderRadius *
                      zoom,
                  )
                : element.borderRadius *
                  zoom,
        clipPath,
      };
    })();

  return (
    <div
      data-editor-element-id={element.id}
      onMouseDown={handleMouseDown}
      style={shapeStyle}
    />
  );
}
