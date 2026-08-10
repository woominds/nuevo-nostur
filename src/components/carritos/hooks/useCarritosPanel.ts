import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  useCarritosStore,
  type Carrito
} from "../../../store/carritosStore";
import {
  type SelectOption,
  type ToastState
} from "../carritosModel";

export function useCarritosPanel() {
  const loading = useCarritosStore(
    (state) => state.loading
  );

  const saving = useCarritosStore(
    (state) => state.saving
  );

  const error = useCarritosStore(
    (state) => state.error
  );

  const filters = useCarritosStore(
    (state) => state.filters
  );

  const catalogos = useCarritosStore(
    (state) => state.catalogos
  );

  const selectedCarritoId = useCarritosStore(
    (state) => state.selectedCarritoId
  );

  const canManageCarritos = useCarritosStore(
    (state) => state.canManageCarritos
  );

  const loadCarritos = useCarritosStore(
    (state) => state.loadCarritos
  );

  const setFilter = useCarritosStore(
    (state) => state.setFilter
  );

  const setMonthFilter = useCarritosStore(
    (state) => state.setMonthFilter
  );

  const goToPreviousMonth = useCarritosStore(
    (state) => state.goToPreviousMonth
  );

  const goToNextMonth = useCarritosStore(
    (state) => state.goToNextMonth
  );

  const goToCurrentMonth = useCarritosStore(
    (state) => state.goToCurrentMonth
  );

  const clearError = useCarritosStore(
    (state) => state.clearError
  );

  const selectCarrito = useCarritosStore(
    (state) => state.selectCarrito
  );

  const toggleCarritoActivo = useCarritosStore(
    (state) => state.toggleCarritoActivo
  );

  const sendToControl = useCarritosStore(
    (state) => state.sendToControl
  );

  const getFilteredCarritos = useCarritosStore(
    (state) => state.getFilteredCarritos
  );

  const getMetrics = useCarritosStore(
    (state) => state.getMetrics
  );

  const carritos = getFilteredCarritos();
  const metrics = getMetrics();

  const [filtersOpen, setFiltersOpen] =
    useState(false);

  const [wizardOpen, setWizardOpen] =
    useState(false);

  useEffect(() => {
    console.log("🟠 wizardOpen:", wizardOpen);
  }, [wizardOpen]);

  const [detailCarrito, setDetailCarrito] =
    useState<Carrito | null>(null);

  const [editingCarrito, setEditingCarrito] =
    useState<Carrito | null>(null);

  const [toast, setToast] =
    useState<ToastState>(null);

  const selectedCarrito = useMemo(
    () =>
      carritos.find(
        (carrito) =>
          carrito.id === selectedCarritoId
      ) ||
      carritos[0] ||
      null,
    [
      carritos,
      selectedCarritoId
    ]
  );

  useEffect(() => {
    void loadCarritos();
  }, [loadCarritos]);

  function showToast(
    message: string,
    type: "success" | "error" = "success"
  ) {
    setToast({
      type,
      message
    });
  }

  function refreshAfterPeriodChange(
    action: () => void
  ) {
    action();

    window.setTimeout(() => {
      void loadCarritos();
    }, 0);
  }

  function handlePreviousMonth() {
    refreshAfterPeriodChange(
      goToPreviousMonth
    );
  }

  function handleNextMonth() {
    refreshAfterPeriodChange(
      goToNextMonth
    );
  }

  function handleCurrentMonth() {
    refreshAfterPeriodChange(
      goToCurrentMonth
    );
  }

  function handleUseOperationalMonth() {
    setMonthFilter(filters.month);

    window.setTimeout(() => {
      void loadCarritos();
    }, 0);
  }

  function handleVendedorFilter(
    value: string
  ) {
    setFilter("vendedorId", value);

    window.setTimeout(() => {
      void loadCarritos();
    }, 0);
  }

  async function handleToggle(
    carrito: Carrito
  ) {
    const ok =
      await toggleCarritoActivo(
        carrito
      );

    if (!ok) return;

    showToast(
      carrito.activo
        ? "Carrito desactivado."
        : "Carrito activado."
    );
  }

  async function handleSendToControl(
    carrito: Carrito
  ) {
    if (
      [
        "EN_CONTROL",
        "CONTROLADO",
        "FACTURADO",
        "COBRADO"
      ].includes(carrito.estado)
    ) {
      showToast(
        "Este carrito ya fue enviado a control o ya fue controlado.",
        "error"
      );

      return;
    }

    const ok =
      await sendToControl(carrito);

    if (ok) {
      showToast(
        "Carrito enviado a control."
      );
    }
  }

  function openWizard() {
    setWizardOpen(true);
  }

  function closeWizard() {
    setWizardOpen(false);
  }

  function closeEditor() {
    setEditingCarrito(null);
  }

  function closeDetail() {
    setDetailCarrito(null);
  }

  function editFromDetail() {
    if (!detailCarrito) return;

    setEditingCarrito(
      detailCarrito
    );

    setDetailCarrito(null);
  }

  function handleWizardSaved(
    message: string
  ) {
    showToast(message);
  }

  function handleEditorSaved(
    message: string
  ) {
    showToast(message);
    setEditingCarrito(null);
  }

  const vendedorOptions =
    useMemo<SelectOption[]>(
      () => [
        {
          value: "todos",
          label: "Todos"
        },
        ...catalogos.vendedores.map(
          (item) => ({
            value: item.id,
            label:
              `${item.nombre} ${item.apellido}`.trim()
          })
        )
      ],
      [catalogos.vendedores]
    );

  const sucursalOptions =
    useMemo<SelectOption[]>(
      () => [
        {
          value: "todos",
          label: "Todas"
        },
        ...catalogos.sucursales.map(
          (item) => ({
            value: item.id,
            label: item.nombre
          })
        )
      ],
      [catalogos.sucursales]
    );

  const riesgoOptions =
    useMemo<SelectOption[]>(
      () => [
        {
          value: "todos",
          label: "Todos"
        },
        {
          value: "riesgo",
          label: "Con riesgo"
        },
        {
          value: "normal",
          label: "Sin riesgo"
        }
      ],
      []
    );

  const activoOptions =
    useMemo<SelectOption[]>(
      () => [
        {
          value: "activos",
          label: "Activos"
        },
        {
          value: "inactivos",
          label: "Inactivos"
        },
        {
          value: "todos",
          label: "Todos"
        }
      ],
      []
    );

  const selectedVendedorFilterLabel =
    vendedorOptions.find(
      (option) =>
        option.value ===
        filters.vendedorId
    )?.label || "Todos";

  return {
    loading,
    saving,
    error,
    filters,
    catalogos,
    canManageCarritos,

    carritos,
    metrics,
    selectedCarrito,

    filtersOpen,
    wizardOpen,
    detailCarrito,
    editingCarrito,
    toast,

    vendedorOptions,
    sucursalOptions,
    riesgoOptions,
    activoOptions,
    selectedVendedorFilterLabel,

    setFiltersOpen,
    setDetailCarrito,
    setEditingCarrito,
    setToast,

    loadCarritos,
    setFilter,
    clearError,
    selectCarrito,

    handlePreviousMonth,
    handleNextMonth,
    handleCurrentMonth,
    handleUseOperationalMonth,
    handleVendedorFilter,
    handleToggle,
    handleSendToControl,

    openWizard,
    closeWizard,
    closeEditor,
    closeDetail,
    editFromDetail,
    handleWizardSaved,
    handleEditorSaved
  };
}
