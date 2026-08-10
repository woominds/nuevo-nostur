import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  base: "/",

  plugins: [react()],

  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  },

  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true
  },

  build: {
    chunkSizeWarningLimit: 2500
  }
});