import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  type ThemeMode,
  type ThemeName,
  THEMES,
} from "./themes";

type ThemeContextValue = {
  theme: ThemeName;
  mode: ThemeMode;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = "cv_theme";
const MODE_KEY = "cv_mode";

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY) as ThemeName | null;
    const storedMode = localStorage.getItem(MODE_KEY) as ThemeMode | null;

    if (storedTheme && THEMES.some((x) => x.id === storedTheme)) {
      setThemeState(storedTheme);
    }
    if (storedMode === "light" || storedMode === "dark") {
      setModeState(storedMode);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      setTheme: setThemeState,
      setMode: setModeState,
      toggleMode: () => setModeState((current) => (current === "light" ? "dark" : "light")),
    }),
    [theme, mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
