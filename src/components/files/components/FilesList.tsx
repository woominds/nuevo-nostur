import {
  Eye,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

import type {
  FileItem
} from "../../../store/filesStore";

import {
  IconButton
} from "../../ui/IconButton";

import {
  formatMoneyAR
} from "../../../lib/formatters";

import {
  formatDateAR,
  parseMoney
} from "../filesModel";

type FilesListProps = {
  files: FileItem[];
  loading: boolean;
  selectedFileId?: string | null;

  onSelect: (
    fileId: string
  ) => void;

  onView: (
    file: FileItem
  ) => void;

  onToggle: (
    file: FileItem
  ) => void;
};

export function FilesList({
  files,
  loading,
  selectedFileId,
  onSelect,
  onView,
  onToggle
}: FilesListProps) {
  return (
    <section className="min-w-0 rounded-[16px] border border-black/10 bg-white/62 p-3 shadow-sm backdrop-blur-xl">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold text-[#172033]">
            Listado de files
          </h2>

          <p className="text-[11.5px] font-normal text-[#64748b]">
            {loading
              ? "Cargando..."
              : `${files.length} files cargados`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-5 text-center text-[12px] font-normal text-[#64748b]">
          Cargando files...
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-[14px] border border-black/10 bg-[#f8fafc] p-5 text-center text-[12px] font-normal text-[#64748b]">
          No hay files para los filtros seleccionados.
        </div>
      ) : (
        <div className="grid gap-1.5">
          {files.map((file) => {
            const selected =
              selectedFileId === file.id;

            const cliente =
              file.clientes;

            const margen =
              parseMoney(
                file.importe_final
              ) -
              parseMoney(
                file.neto_operador
              );

            return (
              <button
                key={file.id}
                type="button"
                onClick={() =>
                  onSelect(file.id)
                }
                className={[
                  "grid min-w-0 gap-2 rounded-[12px] border px-2.5 py-2 text-left transition lg:grid-cols-[1.35fr_1.15fr_1fr_128px_136px]",
                  selected
                    ? "border-[#4f7c90]/50 bg-[#eef6f7]"
                    : "border-black/10 bg-[#f8fafc] hover:bg-white"
                ].join(" ")}
              >
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-semibold text-[#172033]">
                    {cliente
                      ?.nombre_completo ||
                      "Sin cliente"}
                  </div>

                  <div className="truncate text-[11px] font-normal text-[#64748b]">
                    {cliente
                      ?.telefono ||
                      "—"}
                  </div>

                  <div className="truncate text-[11px] font-medium text-[#4f7c90]">
                    {file.numero_file}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="truncate text-[12px] font-semibold text-[#172033]">
                    {file.destino ||
                      "Sin destino"}
                  </div>

                  <div className="truncate text-[11px] font-normal text-[#64748b]">
                    {formatDateAR(
                      file.fecha_in
                    )}{" "}
                    →{" "}
                    {file.solo_ida
                      ? "Solo ida"
                      : formatDateAR(
                          file.fecha_out
                        )}
                  </div>

                  <div className="truncate text-[11px] font-normal text-[#64748b]">
                    {file.servicio ||
                      "Sin servicio"}{" "}
                    ·{" "}
                    {file.metodo_contacto ||
                      "Sin método"}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-[#172033]">
                    {formatMoneyAR(
                      file.importe_final,
                      file.moneda
                    )}
                  </div>

                  <div className="text-[11px] font-normal text-[#64748b]">
                    Margen{" "}
                    {formatMoneyAR(
                      margen,
                      file.moneda
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <span className="rounded-md border border-black/10 bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#334155]">
                    {file.estado}
                  </span>

                  {file.riesgo ? (
                    <span className="rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                      Riesgo
                    </span>
                  ) : null}

                  {parseMoney(
                    file.neto_operador
                  ) <= 0 ? (
                    <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                      Falta neto
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center justify-end gap-1">
                  <IconButton
                    icon={Eye}
                    label="Ver detalle"
                    onClick={(event) => {
                      event.stopPropagation();
                      onView(file);
                    }}
                  />

                  <IconButton
                    icon={
                      file.activo
                        ? ToggleRight
                        : ToggleLeft
                    }
                    label={
                      file.activo
                        ? "Desactivar"
                        : "Activar"
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggle(file);
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
