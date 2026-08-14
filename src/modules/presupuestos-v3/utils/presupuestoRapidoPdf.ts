import {
  toPng,
} from "html-to-image";

import {
  jsPDF,
} from "jspdf";

const EXPORT_PIXEL_RATIO = 2;

const waitForImages = async (
  container: HTMLElement,
): Promise<void> => {
  const images =
    Array.from(
      container.querySelectorAll(
        "img",
      ),
    );

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>(
          (resolve) => {
            if (
              image.complete &&
              image.naturalWidth >
                0
            ) {
              resolve();
              return;
            }

            const finish =
              () => {
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

const sanitizeFileName = (
  value: string,
): string => {
  return (
    value
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
      .replace(/\s+/g, "-") ||
    "presupuesto"
  );
};

export async function exportPresupuestoRapidoPdf(
  container: HTMLElement,
  fileName: string,
): Promise<void> {
  await waitForImages(
    container,
  );

  const pages =
    Array.from(
      container.querySelectorAll<HTMLElement>(
        "[data-presupuesto-rapido-pdf-page]",
      ),
    );

  if (
    pages.length === 0
  ) {
    throw new Error(
      "No se encontraron páginas para generar el PDF.",
    );
  }

  let pdf: jsPDF | null =
    null;

  for (
    let index = 0;
    index < pages.length;
    index += 1
  ) {
    const page =
      pages[index];

    const width =
      page.offsetWidth;

    const height =
      page.offsetHeight;

    const image =
      await toPng(
        page,
        {
          cacheBust: true,
          pixelRatio:
            EXPORT_PIXEL_RATIO,
          backgroundColor:
            "#ffffff",
          width,
          height,
        },
      );

    if (!pdf) {
      pdf = new jsPDF({
        orientation:
          "portrait",
        unit: "px",
        format: [
          width,
          height,
        ],
        hotfixes: [
          "px_scaling",
        ],
      });
    } else {
      pdf.addPage(
        [
          width,
          height,
        ],
        "portrait",
      );
    }

    pdf.addImage(
      image,
      "PNG",
      0,
      0,
      width,
      height,
      undefined,
      "FAST",
    );
  }

  if (!pdf) {
    throw new Error(
      "No se pudo generar el PDF.",
    );
  }

  pdf.save(
    `${sanitizeFileName(
      fileName,
    )}.pdf`,
  );
}
