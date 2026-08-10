// src/App.tsx

import { useEffect } from "react";

import { Shell } from "./components/Shell";
import { LoginScreen } from "./components/LoginScreen";

import { brandAssets, brandText } from "./lib/brandAssets";

import { useAuthStore } from "./store/authStore";

function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#eef1f6] text-[#1f2937]">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-[24px] bg-white shadow-md ring-1 ring-black/10">
          <img
            src={brandAssets.iconoColor}
            alt={brandText.appName}
            className="h-12 w-12 object-contain"
            draggable={false}
          />
        </div>

        <img
          src={brandAssets.logoColorNegro}
          alt={brandText.appName}
          className="mx-auto h-auto max-h-[42px] w-[210px] object-contain"
          draggable={false}
        />

        <div className="mt-3 text-xs text-[#64748b]">Verificando sesión</div>
      </div>
    </div>
  );
}

export default function App() {
  const initialized = useAuthStore((state) => state.initialized);
  const loading = useAuthStore((state) => state.loading);
  const session = useAuthStore((state) => state.session);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <Shell />;
}