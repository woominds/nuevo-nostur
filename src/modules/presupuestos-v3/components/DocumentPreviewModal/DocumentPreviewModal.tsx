import {
  Download,
  Loader2,
  X,
} from "lucide-react";

import {
  useRef,
  useState,
} from "react";

import {
  DocumentRenderer,
} from "../DocumentRenderer";

import type {
  PresupuestoDocument,
} from "../../types/editor.types";

import {
  exportDocumentToPdf,
} from "../../utils/documentExport";

type DocumentPreviewModalProps = {
  document: PresupuestoDocument | null;
  onClose: () => void;
};

export function DocumentPreviewModal({
  document,
  onClose,
}: DocumentPreviewModalProps) {
  const exportContainerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    exporting,
    setExporting,
  ] = useState(false);

  if (!document) {
    return null;
  }

  const firstPage =
    document.pages[0];

  const previewScale = firstPage
    ? Math.min(
        0.62,
        760 /
          firstPage.canvas.width,
      )
    : 0.5;

  const handleDownloadPdf =
    async () => {
      const exportContainer =
        exportContainerRef.current;

      if (
        !exportContainer ||
        exporting
      ) {
        return;
      }

      setExporting(true);

      try {
        await exportDocumentToPdf(
          document,
          exportContainer,
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo generar el PDF.";

        window.alert(message);
      } finally {
        setExporting(false);
      }
    };

  return (
    <>
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[2px] sm:p-6"
        onMouseDown={onClose}
      >
        <section
          className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.32)]"
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-slate-900">
                {document.name}
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                {document.pages.length}{" "}
                {document.pages.length ===
                1
                  ? "hoja"
                  : "hojas"}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={exporting}
                onClick={
                  handleDownloadPdf
                }
                className="flex h-9 items-center gap-2 rounded-lg bg-[#FF634A] px-3 text-sm font-semibold text-white transition hover:bg-[#f0543d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exporting ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Download size={16} />
                )}

                <span className="hidden sm:inline">
                  {exporting
                    ? "Generando..."
                    : "Descargar PDF"}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Cerrar vista previa"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4 sm:p-6">
            <DocumentRenderer
              document={document}
              scale={previewScale}
              pageGap={28}
              pageClassName="shadow-[0_18px_50px_rgba(15,23,42,0.16)] ring-1 ring-black/5"
            />
          </div>
        </section>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[-100000px] top-0 z-[-1]"
      >
        <div
          ref={exportContainerRef}
          className="bg-white"
        >
          <DocumentRenderer
            document={document}
            scale={1}
            pageGap={0}
          />
        </div>
      </div>
    </>
  );
}
