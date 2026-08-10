// src/registry/appRegistry.ts

export type AppAccess =
  | "all"
  | "ia_admin"
  | "admin";

export type AppProfileLike = {
  rol?: string | null;
  is_support_user?: boolean | null;
  is_super_admin?: boolean | null;
};

export type RegisteredApp = {
  id: string;
  name: string;
  url: string;
  access?: AppAccess;
};

export const appRegistry: RegisteredApp[] = [
  {
    id: "livenos",
    name: "LiveNos",
    url: "internal://livenos"
  },
  {
    id: "contactos-live",
    name: "Contactos Live",
    url: "internal://contactos-live"
  },
  {
    id: "historiales-live",
    name: "Historiales Live",
    url: "internal://historiales-live"
  },
  {
    id: "oportunidades",
    name: "Oportunidades",
    url: "internal://oportunidades"
  },
  {
    id: "cande",
    name: "Cande",
    url: "internal://cande",
    access: "ia_admin"
  },
  {
    id: "nia",
    name: "NIA",
    url: "internal://nia",
    access: "ia_admin"
  },
  {
    id: "control-ia",
    name: "Control IA",
    url: "internal://control-ia",
    access: "ia_admin"
  },
  {
    id: "clientes",
    name: "Clientes",
    url: "internal://clientes"
  },
  {
    id: "carritos",
    name: "Carritos",
    url: "internal://carritos"
  },
  {
    id: "files",
    name: "Files",
    url: "internal://files"
  },
  {
    id: "ctas-ctes",
    name: "Ctas Ctes",
    url: "internal://ctas-ctes"
  },
  {
    id: "comisiones",
    name: "Comisiones",
    url: "internal://comisiones"
  },
  {
    id: "caja",
    name: "Caja",
    url: "internal://caja"
  },
  {
    id: "control-ventas",
    name: "Control de Ventas",
    url: "internal://control-ventas"
  },
  {
    id: "facturas-pagar",
    name: "Facturas a Pagar",
    url: "internal://facturas-pagar"
  },
  {
    id: "cashflow",
    name: "Cashflow",
    url: "internal://cashflow"
  },
  {
    id: "facturas-cobrar",
    name: "Facturas a Cobrar",
    url: "internal://facturas-cobrar"
  },
  {
    id: "metas",
    name: "Metas",
    url: "internal://metas"
  },
  {
    id: "pagos-operadores",
    name: "Pago a Operadores",
    url: "internal://pagos-operadores"
  },
  {
    id: "riesgos",
    name: "Riesgos",
    url: "internal://riesgos"
  },
  {
    id: "calendario-pax",
    name: "Calendario Pax",
    url: "internal://calendario-pax"
  },
  {
    id: "horarios",
    name: "Horarios",
    url: "internal://horarios"
  },
  {
    id: "pendientes",
    name: "Pendientes",
    url: "internal://pendientes"
  },
  {
    id: "colaborativo",
    name: "Colaborativo",
    url: "internal://colaborativo"
  },
  {
    id: "links-utiles",
    name: "Links útiles",
    url: "internal://links-utiles"
  },
  {
    id: "importador-catalogos",
    name: "Importador Catálogos",
    url: "internal://importador-catalogos",
    access: "admin"
  },
  {
    id: "mi-perfil",
    name: "Mi perfil",
    url: "internal://mi-perfil"
  }
];

function normalizeRole(
  profile?: AppProfileLike | null
): string {
  return String(
    profile?.rol || ""
  )
    .trim()
    .toLowerCase();
}

export function canAccessIaAdmin(
  profile?: AppProfileLike | null
): boolean {
  const role = normalizeRole(profile);

  return Boolean(
    profile?.is_super_admin ||
      profile?.is_support_user ||
      role === "gerencia" ||
      role === "admin_general" ||
      role === "soporte"
  );
}

export function canAccessAdminApp(
  profile?: AppProfileLike | null
): boolean {
  const role = normalizeRole(profile);

  return Boolean(
    profile?.is_super_admin ||
      profile?.is_support_user ||
      role === "gerencia" ||
      role === "admin_general" ||
      role === "soporte"
  );
}

export function canAccessApp(
  app: RegisteredApp,
  profile?: AppProfileLike | null
): boolean {
  if (
    !app.access ||
    app.access === "all"
  ) {
    return true;
  }

  if (
    app.access === "ia_admin"
  ) {
    return canAccessIaAdmin(profile);
  }

  if (
    app.access === "admin"
  ) {
    return canAccessAdminApp(profile);
  }

  return true;
}

export function getVisibleAppsForProfile(
  profile?: AppProfileLike | null
): RegisteredApp[] {
  return appRegistry.filter(
    (app) => canAccessApp(app, profile)
  );
}

export function getAppById(
  appId: string
): RegisteredApp {
  const normalizedId =
    appId === "contactos"
      ? "oportunidades"
      : appId;

  return (
    appRegistry.find(
      (app) => app.id === normalizedId
    ) || appRegistry[0]
  );
}

export function findAppByUrl(
  url: string
): RegisteredApp {
  if (
    url === "nostur://home"
  ) {
    return appRegistry[0];
  }

  const normalizedUrl =
    url === "internal://contactos"
      ? "internal://oportunidades"
      : url;

  return (
    appRegistry.find(
      (app) => app.url === normalizedUrl
    ) || appRegistry[0]
  );
}
