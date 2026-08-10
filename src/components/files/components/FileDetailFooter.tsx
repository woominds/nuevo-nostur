type FileDetailFooterProps = {
  editing: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
};

export function FileDetailFooter({
  editing,
  saving,
  onClose,
  onSave
}: FileDetailFooterProps) {
  return (
    <div className="mt-4 flex justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        className="h-8 rounded-[10px] border border-black/10 bg-white px-4 text-[12px] font-medium text-[#334155] hover:bg-[#f8fafc]"
      >
        Cerrar
      </button>

      {editing ? (
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="h-8 rounded-[10px] bg-[#4f7c90] px-4 text-[12px] font-medium text-white shadow-sm hover:bg-[#406b7d] disabled:opacity-50"
        >
          {saving
            ? "Guardando..."
            : "Guardar cambios"}
        </button>
      ) : null}
    </div>
  );
}
