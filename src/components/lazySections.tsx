// src/components/lazySections.tsx

import {
  lazy
} from "react";

export const ClientesPanel = lazy(
  () =>
    import(
      "./clientes/ClientesPanel"
    ).then(
      (module) => ({
        default:
          module.ClientesPanel
      })
    )
);

export const CarritosPanel = lazy(
  () =>
    import(
      "./carritos/CarritosPanel"
    ).then(
      (module) => ({
        default:
          module.CarritosPanel
      })
    )
);

export const FilesPanel = lazy(
  () =>
    import(
      "./files/FilesPanel"
    ).then(
      (module) => ({
        default:
          module.FilesPanel
      })
    )
);

export const CtasCtesPanel = lazy(
  () =>
    import(
      "./ctas-ctes/CtasCtesPanel"
    ).then(
      (module) => ({
        default:
          module.CtasCtesPanel
      })
    )
);

export const ControlVentasPanel = lazy(
  () =>
    import(
      "./control-ventas/ControlVentasPanel"
    ).then(
      (module) => ({
        default:
          module.ControlVentasPanel
      })
    )
);

export const PagosOperadoresPanel = lazy(
  () =>
    import(
      "./pagos-operadores/PagosOperadoresPanel"
    ).then(
      (module) => ({
        default:
          module.PagosOperadoresPanel
      })
    )
);

export const RiesgosPanel = lazy(
  () =>
    import(
      "./riesgos/RiesgosPanel"
    ).then(
      (module) => ({
        default:
          module.RiesgosPanel
      })
    )
);

export const CajaPanel = lazy(
  () =>
    import(
      "./caja/CajaPanel"
    ).then(
      (module) => ({
        default:
          module.CajaPanel
      })
    )
);

export const FacturasCobrarPanel = lazy(
  () =>
    import(
      "./facturas-cobrar/FacturasCobrarPanel"
    ).then(
      (module) => ({
        default:
          module.FacturasCobrarPanel
      })
    )
);

export const FacturasPagarPanel = lazy(
  () =>
    import(
      "./facturas-pagar/FacturasPagarPanel"
    ).then(
      (module) => ({
        default:
          module.FacturasPagarPanel
      })
    )
);

export const CashflowPanel = lazy(
  () =>
    import(
      "./cashflow/CashflowPanel"
    ).then(
      (module) => ({
        default:
          module.CashflowPanel
      })
    )
);

export const MetasPanel = lazy(
  () =>
    import(
      "./metas/MetasPanel"
    ).then(
      (module) => ({
        default:
          module.MetasPanel
      })
    )
);

export const ComisionesPanel = lazy(
  () =>
    import(
      "./comisiones/ComisionesPanel"
    ).then(
      (module) => ({
        default:
          module.ComisionesPanel
      })
    )
);

export const PendientesPanel = lazy(
  () =>
    import(
      "./pendientes/PendientesPanel"
    ).then(
      (module) => ({
        default:
          module.PendientesPanel
      })
    )
);

export const LinksUtilesPanel = lazy(
  () =>
    import(
      "./links-utiles/LinksUtilesPanel"
    ).then(
      (module) => ({
        default:
          module.LinksUtilesPanel
      })
    )
);

export const CalendarioPaxPanel = lazy(
  () =>
    import(
      "./calendario-pax/CalendarioPaxPanel"
    ).then(
      (module) => ({
        default:
          module.CalendarioPaxPanel
      })
    )
);

export const HorariosPanel = lazy(
  () =>
    import(
      "./horarios/HorariosPanel"
    ).then(
      (module) => ({
        default:
          module.HorariosPanel
      })
    )
);

export const ColaborativoPanel = lazy(
  () =>
    import(
      "./colaborativo/ColaborativoPanel"
    ).then(
      (module) => ({
        default:
          module.ColaborativoPanel
      })
    )
);

export const ConfigPanel = lazy(
  () =>
    import(
      "./config/ConfigPanel"
    ).then(
      (module) => ({
        default:
          module.ConfigPanel
      })
    )
);

export const ImportadorCatalogosPanel = lazy(
  () =>
    import(
      "./config/ImportadorCatalogosPanel"
    ).then(
      (module) => ({
        default:
          module.ImportadorCatalogosPanel
      })
    )
);

export const LiveNosPanel = lazy(
  () =>
    import(
      "../modules/comunicaciones/LiveNosPanel"
    ).then(
      (module) => ({
        default:
          module.LiveNosPanel
      })
    )
);

export const ContactosLivePanel = lazy(
  () =>
    import(
      "../modules/comunicaciones/ContactosLivePanel"
    ).then(
      (module) => ({
        default:
          module.ContactosLivePanel
      })
    )
);

export const HistorialesLivePanel = lazy(
  () =>
    import(
      "../modules/comunicaciones/HistorialesLivePanel"
    ).then(
      (module) => ({
        default:
          module.HistorialesLivePanel
      })
    )
);

export const OportunidadesPanel = lazy(
  () =>
    import(
      "../modules/comunicaciones/OportunidadesPanel"
    ).then(
      (module) => ({
        default:
          module.OportunidadesPanel
      })
    )
);

export const CandePanel = lazy(
  () =>
    import(
      "../modules/comunicaciones/CandePanel"
    ).then(
      (module) => ({
        default:
          module.CandePanel
      })
    )
);

export const NiaPanel = lazy(
  () =>
    import(
      "../modules/comunicaciones/NiaPanel"
    ).then(
      (module) => ({
        default:
          module.NiaPanel
      })
    )
);

export const ControlIaPanel = lazy(
  () =>
    import(
      "../modules/comunicaciones/ControlIaPanel"
    ).then(
      (module) => ({
        default:
          module.ControlIaPanel
      })
    )
);

export const MiPerfilPanel = lazy(
  () =>
    import(
      "../modules/perfil/MiPerfilPanel"
    ).then(
      (module) => ({
        default:
          module.MiPerfilPanel
      })
    )
);

export const PresupuestosPanel = lazy(
  () =>
    import(
      "../modules/presupuestos-v3/PresupuestosPanel"
    ).then(
      (module) => ({
        default:
          module.PresupuestosPanel
      })
    )
);

export function SectionLoadingFallback() {
  return (
    <div className="flex min-h-[280px] h-full items-center justify-center p-6">
      <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-xs font-medium text-[#64748b] shadow-sm ring-1 ring-black/5">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#cbd5e1] border-t-[#ff634a]" />

        Cargando módulo…
      </div>
    </div>
  );
}
