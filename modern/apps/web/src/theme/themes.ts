export type ThemeName = "atlas" | "sage" | "graphite";
export type ThemeMode = "light" | "dark";

export type ThemeDescriptor = {
  id: ThemeName;
  label: string;
  description: string;
};

export const THEMES: ThemeDescriptor[] = [
  {
    id: "atlas",
    label: "Atlas",
    description: "Neutral editorial",
  },
  {
    id: "sage",
    label: "Sage",
    description: "Muted clinical green",
  },
  {
    id: "graphite",
    label: "Graphite",
    description: "High-contrast monochrome",
  },
];

export const DEFAULT_THEME: ThemeName = "atlas";
export const DEFAULT_MODE: ThemeMode = "light";
