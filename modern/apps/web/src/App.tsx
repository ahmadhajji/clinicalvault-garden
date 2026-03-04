import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import { HomeRoute } from "./routes/HomeRoute";
import { LibraryRoute } from "./routes/LibraryRoute";
import { NoteRoute } from "./routes/NoteRoute";
import { NotFoundRoute } from "./routes/NotFoundRoute";
import { CommandPalette } from "./components/CommandPalette";
import { ThemeProvider } from "./theme/ThemeProvider";
import { ThemeSwitcher } from "./components/ThemeSwitcher";

const queryClient = new QueryClient();

function AppInner() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="app-background" aria-hidden="true" />
      <div className="app-shell">
        <header className="topbar">
          <Link to="/" className="brandmark">
            <span>Clinical Vault</span>
            <strong>Notes</strong>
          </Link>
          <nav className="topnav">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/library">Library</NavLink>
            <button type="button" className="ghost-btn" onClick={() => setPaletteOpen(true)}>
              Search
            </button>
          </nav>
          <ThemeSwitcher />
        </header>

        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/library" element={<LibraryRoute />} />
          <Route path="/note/*" element={<NoteRoute />} />
          <Route path="*" element={<NotFoundRoute />} />
        </Routes>

        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
