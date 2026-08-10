import {
  toJpeg,
} from "html-to-image";

const THUMBNAIL_PIXEL_RATIO = 0.7;

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

export async function createTemplateThumbnail(
  pageElement: HTMLElement,
): Promise<string> {
  await waitForImages(
    pageElement,
  );

  return toJpeg(
    pageElement,
    {
      cacheBust: true,
      quality: 0.72,
      pixelRatio:
        THUMBNAIL_PIXEL_RATIO,
      backgroundColor:
        "#ffffff",
      width:
        pageElement.offsetWidth,
      height:
        pageElement.offsetHeight,
    },
  );
}
