"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeSettings } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const DEFAULT_THEME: ThemeSettings = {
  themeName: "Dream Noir",
  primaryColor: "#0E0E0E",
  accentColor: "#B8955A",
  accentSoftColor: "#FEF3C7",
  canvasBg: "#FFFFFF",
  cardRadius: "16px",
  fontHeading: "var(--font-heading)",
  fontBody: "var(--font-sans)",
};

interface ThemeContextType {
  theme: ThemeSettings;
  setTheme: (theme: ThemeSettings) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);

  useEffect(() => {
    // Load from localStorage first for immediate flash-free rendering
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dream_theme_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setTheme(parsed);
          applyThemeStyles(parsed);
        } catch (e) {}
      }
    }

    // Load dynamic theme settings from Firestore
    async function loadThemeSettings() {
      try {
        const snap = await getDoc(doc(db, "settings", "theme"));
        if (snap.exists()) {
          const data = snap.data() as ThemeSettings;
          setTheme(data);
          applyThemeStyles(data);
          if (typeof window !== "undefined") {
            localStorage.setItem("dream_theme_settings", JSON.stringify(data));
          }
        }
      } catch (e) {}
    }
    loadThemeSettings();
  }, []);

  const handleSetTheme = (newTheme: ThemeSettings) => {
    setTheme(newTheme);
    applyThemeStyles(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("dream_theme_settings", JSON.stringify(newTheme));
    }
  };

  const applyThemeStyles = (t: ThemeSettings) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--theme-primary", t.primaryColor || "#0E0E0E");
    root.style.setProperty("--theme-accent", t.accentColor || "#B8955A");
    root.style.setProperty("--theme-accent-soft", t.accentSoftColor || "#FEF3C7");
    root.style.setProperty("--theme-canvas", t.canvasBg || "#FFFFFF");
    root.style.setProperty("--theme-radius", t.cardRadius || "16px");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
