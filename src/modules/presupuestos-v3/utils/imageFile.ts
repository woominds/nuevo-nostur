const MAX_SOURCE_IMAGE_SIZE_BYTES =
  20 * 1024 * 1024;

const MAX_IMAGE_DIMENSION = 2200;

const OUTPUT_QUALITY = 0.86;

const loadImage = (
  source: string,
): Promise<HTMLImageElement> => {
  return new Promise(
    (resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        resolve(image);
      };

      image.onerror = () => {
        reject(
          new Error(
            "No se pudo procesar la imagen.",
          ),
        );
      };

      image.src = source;
    },
  );
};

const calculateOutputSize = (
  width: number,
  height: number,
) => {
  const largestDimension =
    Math.max(width, height);

  if (
    largestDimension <=
    MAX_IMAGE_DIMENSION
  ) {
    return {
      width,
      height,
    };
  }

  const scale =
    MAX_IMAGE_DIMENSION /
    largestDimension;

  return {
    width: Math.round(
      width * scale,
    ),
    height: Math.round(
      height * scale,
    ),
  };
};

const readFileAsDataUrl = (
  file: File,
): Promise<string> => {
  return new Promise(
    (resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (
          typeof reader.result !==
          "string"
        ) {
          reject(
            new Error(
              "No se pudo leer la imagen.",
            ),
          );

          return;
        }

        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(
          new Error(
            "No se pudo leer la imagen.",
          ),
        );
      };

      reader.readAsDataURL(file);
    },
  );
};

export const isImageFile = (
  file: File,
): boolean => {
  return file.type.startsWith(
    "image/",
  );
};

export const validateImageFile = (
  file: File,
): void => {
  if (!isImageFile(file)) {
    throw new Error(
      "El archivo seleccionado no es una imagen válida.",
    );
  }

  if (
    file.size >
    MAX_SOURCE_IMAGE_SIZE_BYTES
  ) {
    throw new Error(
      "La imagen no puede superar los 20 MB.",
    );
  }
};

export const fileToDataUrl = async (
  file: File,
): Promise<string> => {
  validateImageFile(file);

  const originalDataUrl =
    await readFileAsDataUrl(file);

  if (
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return originalDataUrl;
  }

  const image =
    await loadImage(
      originalDataUrl,
    );

  const outputSize =
    calculateOutputSize(
      image.naturalWidth,
      image.naturalHeight,
    );

  const canvas =
    document.createElement(
      "canvas",
    );

  canvas.width =
    outputSize.width;

  canvas.height =
    outputSize.height;

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "No se pudo preparar la imagen.",
    );
  }

  context.imageSmoothingEnabled =
    true;

  context.imageSmoothingQuality =
    "high";

  context.drawImage(
    image,
    0,
    0,
    outputSize.width,
    outputSize.height,
  );

  const outputType =
    file.type === "image/png"
      ? "image/png"
      : "image/jpeg";

  try {
    return canvas.toDataURL(
      outputType,
      outputType === "image/jpeg"
        ? OUTPUT_QUALITY
        : undefined,
    );
  } catch {
    throw new Error(
      "No se pudo optimizar la imagen.",
    );
  }
};
