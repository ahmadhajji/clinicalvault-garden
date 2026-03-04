import { THEMES } from "../theme/themes";
import { useTheme } from "../theme/ThemeProvider";

export function ThemeSwitcher() {
  const { theme, mode, setTheme, toggleMode } = useTheme();

  return (
    <div className="theme-switcher" aria-label="Theme controls">
      <label className="theme-field" htmlFor="theme-select">
        <span>Theme</span>
        <select
          id="theme-select"
          value={theme}
          onChange={(event) => setTheme(event.target.value as typeof theme)}
        >
          {THEMES.map((descriptor) => (
            <option value={descriptor.id} key={descriptor.id}>
              {descriptor.label}
            </option>
          ))}
        </select>
      </label>

      <button type="button" className="ghost-btn" onClick={toggleMode}>
        {mode === "light" ? "Dark" : "Light"} mode
      </button>
    </div>
  );
}
