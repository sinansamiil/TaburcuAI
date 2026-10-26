import React, { createContext, useContext, useEffect, useState } from "react";
import {
  applyHospitalPreset,
  getHospitalConfig,
  resetHospitalConfig,
  updateHospitalConfig,
} from "../api/client";
import type { HospitalConfig, HospitalConfigUpdate } from "../types";

interface HospitalContextValue {
  config: HospitalConfig;
  loading: boolean;
  refresh: () => Promise<void>;
  update: (payload: HospitalConfigUpdate) => Promise<HospitalConfig>;
  reset: () => Promise<HospitalConfig>;
  applyPreset: (presetKey: string) => Promise<HospitalConfig>;
}

const DEFAULT_CONFIG: HospitalConfig = {
  id: "default",
  hospital_name: "Şehir Eğitim ve Araştırma Hastanesi",
  hospital_subtitle: "Akıllı Taburculuk ve Klinik Takip Sistemi",
  logo_icon: "building-2",
  logo_url: null,
  primary_color: "#1e5ba3",
  accent_color: "#0284c7",
  phone: "+90 (212) 444 00 00",
  emergency_phone: "112 Acil Çağrı",
  address: "Merkez Kampüs Sağlık Caddesi No:1, İstanbul",
  email: "taburcu@hastane.gov.tr",
  active_departments: [
    "Nefroloji Kliniği",
    "Kardiyoloji Kliniği",
    "Dahiliye (İç Hastalıkları)",
    "Endokrinoloji & Diyabet",
    "Göğüs Hastalıkları",
  ],
  custom_disclaimer:
    "Bu sistem, hekiminizin düzenlediği epikriz ve taburculuk talimatlarının hasta tarafından en doğru şekilde anlaşılmasını desteklemek amacıyla sunulmuştur.",
  updated_at: new Date().toISOString(),
};

const HospitalContext = createContext<HospitalContextValue>({
  config: DEFAULT_CONFIG,
  loading: false,
  refresh: async () => {},
  update: async () => DEFAULT_CONFIG,
  reset: async () => DEFAULT_CONFIG,
  applyPreset: async () => DEFAULT_CONFIG,
});

export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<HospitalConfig>(() => {
    const cached = localStorage.getItem("hospital_custom_branding");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_CONFIG;
  });
  const [loading, setLoading] = useState(false);

  // Apply colors dynamically to CSS root
  const applyCssVariables = (cfg: HospitalConfig) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--primary-hospital", cfg.primary_color || "#1e5ba3");
      root.style.setProperty("--accent-hospital", cfg.accent_color || "#0284c7");
    }
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await getHospitalConfig();
      setConfig(data);
      localStorage.setItem("hospital_custom_branding", JSON.stringify(data));
      applyCssVariables(data);
    } catch (err) {
      // Keep cached or fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyCssVariables(config);
    refresh();
  }, []);

  const update = async (payload: HospitalConfigUpdate) => {
    const updated = await updateHospitalConfig(payload);
    setConfig(updated);
    localStorage.setItem("hospital_custom_branding", JSON.stringify(updated));
    applyCssVariables(updated);
    return updated;
  };

  const reset = async () => {
    const resetted = await resetHospitalConfig();
    setConfig(resetted);
    localStorage.setItem("hospital_custom_branding", JSON.stringify(resetted));
    applyCssVariables(resetted);
    return resetted;
  };

  const applyPreset = async (presetKey: string) => {
    const presetConfig = await applyHospitalPreset(presetKey);
    setConfig(presetConfig);
    localStorage.setItem("hospital_custom_branding", JSON.stringify(presetConfig));
    applyCssVariables(presetConfig);
    return presetConfig;
  };

  return (
    <HospitalContext.Provider
      value={{
        config,
        loading,
        refresh,
        update,
        reset,
        applyPreset,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  return useContext(HospitalContext);
}
