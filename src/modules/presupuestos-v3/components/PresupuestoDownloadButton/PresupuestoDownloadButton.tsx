import {
  Download,
  Loader2,
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

type PresupuestoDownloadButtonProps = {
  document: PresupuestoDocument;
};

export function PresupuestoDownloadButton({
  document,
}: PresupuestoDownloadButtonProps) {
  const exportContainerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    exporting,
    setExporting,
  ] = useState(false);

  const handleDownload =
    async () => {
      const container =
        exportContainerRef.current;

      if (
        !container ||
        exporting
      ) {
        return;
      }

      setExporting(true);

      try {
        await exportDocumentToPdf(
          document,
          container,
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
      <button
        type="button"
        disabled={exporting}
        onClick={
          handleDownload
        }
        className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        title="Descargar presupuesto en PDF"
      >
        {exporting ? (
          <Loader2
            size={15}
            className="animate-spin"
          />
        ) : (
          <Download size={15} />
        )}

        {exporting
          ? "Generando..."
          : "Descargar"}
      </button>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[-100000px] top-0 z-[-1]"
      >
        <div
          ref={
            exportContainerRef
          }
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
