import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { HomeRoute } from "./routes/HomeRoute";
import { NoteRoute } from "./routes/NoteRoute";
import { NotFoundRoute } from "./routes/NotFoundRoute";

const queryClient = new QueryClient();

const syncLabel = "Auto-refresh every 15s";

function AppInner() {
  return (
    <BrowserRouter>
      <div className="app-background" aria-hidden="true" />
      <div className="app-shell">
        <header className="topbar">
          <Link to="/" className="brandmark">
            <span>Clinical Vault</span>
            <strong>Live Edition</strong>
          </Link>
          <div className="sync-pill">{syncLabel}</div>
        </header>

        <Routes>
          <Route path="/" element={<HomeRoute syncLabel={syncLabel} />} />
          <Route path="/note/*" element={<NoteRoute />} />
          <Route path="*" element={<NotFoundRoute />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
