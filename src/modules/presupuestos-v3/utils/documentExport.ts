import {
  toPng,
} from "html-to-image";

import {
  jsPDF,
} from "jspdf";

import type {
  PresupuestoDocument,
} from "../types/editor.types";

const EXPORT_PIXEL_RATIO = 2;

const waitForImages = async (
  container: HTMLElement,
): Promise<void> => {
  const images = Array.from(
    container.querySelectorAll("img"),
  );

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>(
          (resolve) => {
            if (
              image.complete &&
              image.naturalWidth > 0
            ) {
              resolve();
              return;
            }

            const finish = () => {
              image.removeEventListener(
                "load",
                finish,
              );

              image.removeEventListener(
                "error",
                finish,
              );

              resolve();
            };

            image.addEventListener(
              "load",
              finish,
            );

            image.addEventListener(
              "error",
              finish,
            );
          },
        ),
    ),
  );
};

export const sanitizeDocumentFileName = (
  value: string,
): string => {
  const normalizedValue = value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^a-zA-Z0-9-_ ]/g,
      "",
    )
    .trim()
    .replace(/\s+/g, "-");

  return (
    normalizedValue ||
    "presupuesto"
  );
};

const getOrderedPageElements = (
  container: HTMLElement,
): HTMLElement[] => {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      "[data-presupuesto-export-page]",
    ),
  );
};

const createPdf = async (
  container: HTMLElement,
): Promise<jsPDF> => {
  await waitForImages(container);

  const pageElements =
    getOrderedPageElements(
      container,
    );

  if (pageElements.length === 0) {
    throw new Error(
      "No se encontraron hojas para exportar.",
    );
  }

  let pdf: jsPDF | null = null;

  for (
    let index = 0;
    index < pageElements.length;
    index += 1
  ) {
    const pageElement =
      pageElements[index];

    const pageWidth =
      pageElement.offsetWidth;

    const pageHeight =
      pageElement.offsetHeight;

    if (
      pageWidth <= 0 ||
      pageHeight <= 0
    ) {
      continue;
    }

    const orientation =
      pageWidth > pageHeight
        ? "landscape"
        : "portrait";

    const imageData =
      await toPng(
        pageElement,
        {
          cacheBust: true,
          pixelRatio:
            EXPORT_PIXEL_RATIO,
          backgroundColor:
            "#ffffff",
          width: pageWidth,
          height: pageHeight,
        },
      );

    if (!pdf) {
      pdf = new jsPDF({
        orientation,
        unit: "px",
        format: [
          pageWidth,
          pageHeight,
        ],
        hotfixes: [
          "px_scaling",
        ],
      });
    } else {
      pdf.addPage(
        [
          pageWidth,
          pageHeight,
        ],
        orientation,
      );
    }

    pdf.addImage(
      imageData,
      "PNG",
      0,
      0,
      pageWidth,
      pageHeight,
      undefined,
      "FAST",
    );
  }

  if (!pdf) {
    throw new Error(
      "No se pudo generar el PDF.",
    );
  }

  return pdf;
};

export const createDocumentPdfBlob =
  async (
    container: HTMLElement,
  ): Promise<Blob> => {
    const pdf =
      await createPdf(
        container,
      );

    return pdf.output(
      "blob",
    );
  };

export const createDocumentPdfFile =
  async (
    document: PresupuestoDocument,
    container: HTMLElement,
  ): Promise<File> => {
    const blob =
      await createDocumentPdfBlob(
        container,
      );

    const fileName =
      `${sanitizeDocumentFileName(
        document.name,
      )}.pdf`;

    return new File(
      [
        blob,
      ],
      fileName,
      {
        type: "application/pdf",
        lastModified:
          Date.now(),
      },
    );
  };

export const exportDocumentToPdf =
  async (
    document: PresupuestoDocument,
    container: HTMLElement,
  ): Promise<void> => {
    const pdf =
      await createPdf(
        container,
      );

    pdf.save(
      `${sanitizeDocumentFileName(
        document.name,
      )}.pdf`,
    );
  };
