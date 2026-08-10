/* =========================================================
   NOSTUR — Brand assets
   Logos e isotipos centralizados para todo el sistema.

   Los archivos ubicados dentro de /public se sirven desde
   la raíz del sitio.

   Es importante mantener la barra inicial en cada ruta:
   /brand/archivo.png

   De esta manera los logos siguen funcionando aunque el
   usuario esté navegando dentro de una sección interna.
========================================================= */

export const brandAssets = {
  logoNegro: "/brand/nostur-logo-negro.png",
  logoBlanco: "/brand/nostur-logo-blanco.png",

  logoColorNegro: "/brand/nostur-logo-color-negro.png",
  logoColorBlanco: "/brand/nostur-logo-color-blanco.png",

  logoNegroConIcono: "/brand/nostur-logo-negro-con-icono.png",
  logoBlancoConIcono: "/brand/nostur-logo-blanco-con-icono.png",

  iconoColor: "/brand/nostur-icono-color.png",
  iconoNegro: "/brand/nostur-icono-negro.png",
  iconoBlanco: "/brand/nostur-icono-blanco.png"
} as const;

export const brandText = {
  appName: "NOSTUR Travel",
  appDescription: "Sistema integral de turismo emisivo"
} as const;
