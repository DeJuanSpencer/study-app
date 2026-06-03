"use client";

import { useEffect, useCallback, useSyncExternalStore } from "react";
import { ThemeName, loadTheme, saveTheme, applyTheme } from "@/lib/theme";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): ThemeName {
  return loadTheme();
}

function getServerSnapshot(): ThemeName {
  return "focus";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((t: ThemeName) => {
    saveTheme(t);
    applyTheme(t);
    window.dispatchEvent(new Event("storage"));
  }, []);

  return { theme, setTheme };
}
