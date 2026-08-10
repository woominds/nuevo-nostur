import type {
  CSSProperties,
} from "react";

import type {
  EditorElement,
  PresupuestoDocument,
  PresupuestoPage,
} from "../../types/editor.types";

type DocumentRendererProps = {
  document: PresupuestoDocument;
  scale?: number;
  className?: string;
  pageClassName?: string;
  pageGap?: number;
};

type DocumentPageRendererProps = {
  page: PresupuestoPage;
  scale: number;
  className?: string;
};

const getElementBaseStyle = (
  element: EditorElement,
  scale: number,
): CSSProperties => {
  return {
    position: "absolute",
    left: element.x * scale,
    top: element.y * scale,
    width: element.width * scale,
    height: element.height * scale,
    zIndex: element.zIndex,
    opacity: element.opacity,
    transform: `rotate(${element.rotation}deg)`,
    transformOrigin: "center center",
    display: element.visible
      ? "block"
      : "none",
    overflow: "hidden",
  };
};

function DocumentElementRenderer({
  element,
  scale,
}: {
  element: EditorElement;
  scale: number;
}) {
  const baseStyle =
    getElementBaseStyle(
      element,
      scale,
    );

  if (element.type === "text") {
    return (
      <div
        style={{
          ...baseStyle,
          color: element.color,
          fontFamily:
            element.fontFamily,
          fontSize:
            element.fontSize *
            scale,
          fontWeight:
            element.fontWeight,
          fontStyle:
            element.fontStyle,
          textAlign:
            element.textAlign,
          lineHeight:
            element.lineHeight,
          letterSpacing:
            element.letterSpacing *
            scale,
          whiteSpace: "pre-wrap",
          overflowWrap:
            "break-word",
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
        style={{
          ...baseStyle,
          borderRadius:
            element.borderRadius *
            scale,
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
              scale,
          ),
          top:
            element.y * scale +
            (element.height *
              scale) /
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
        border: `${element.borderWidth * scale}px solid ${element.borderColor}`,
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
                      scale,
                  )
                : element.borderRadius *
                  scale,
        clipPath,
      };
    })();

  return (
    <div
      style={shapeStyle}
    />
  );
}

export function DocumentPageRenderer({
  page,
  scale,
  className,
}: DocumentPageRendererProps) {
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
    <div
      data-presupuesto-export-page={
        page.id
      }
      className={[
        "relative shrink-0 overflow-hidden bg-white",
        className ?? "",
      ].join(" ")}
      style={{
        width:
          page.canvas.width *
          scale,
        height:
          page.canvas.height *
          scale,
        backgroundColor:
          page.canvas.backgroundColor,
      }}
    >
      {orderedElements.map(
        (element) => (
          <DocumentElementRenderer
            key={element.id}
            element={element}
            scale={scale}
          />
        ),
      )}
    </div>
  );
}

export function DocumentRenderer({
  document,
  scale = 1,
  className,
  pageClassName,
  pageGap = 24,
}: DocumentRendererProps) {
  const orderedPages = [
    ...document.pages,
  ].sort(
    (
      firstPage,
      secondPage,
    ) =>
      firstPage.order -
      secondPage.order,
  );

  return (
    <div
      className={[
        "flex flex-col items-center",
        className ?? "",
      ].join(" ")}
      style={{
        gap: pageGap,
      }}
    >
      {orderedPages.map(
        (page) => (
          <DocumentPageRenderer
            key={page.id}
            page={page}
            scale={scale}
            className={
              pageClassName
            }
          />
        ),
      )}
    </div>
  );
}
