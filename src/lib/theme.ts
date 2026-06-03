export type ThemeName = "focus" | "scholar" | "depth";

const THEME_KEY = "studydeck_theme";

export function loadTheme(): ThemeName {
  if (typeof window === "undefined") return "focus";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "focus" || stored === "scholar" || stored === "depth") {
    return stored;
  }
  return "focus";
}

export function saveTheme(theme: ThemeName): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, theme);
}

export function applyTheme(theme: ThemeName): void {
  const root = document.documentElement;
  root.classList.remove("theme-focus", "theme-scholar", "theme-depth");
  root.classList.add(`theme-${theme}`);
}
