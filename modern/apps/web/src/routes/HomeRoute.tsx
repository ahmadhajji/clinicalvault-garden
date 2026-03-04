import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { fetchNotes, formatDate } from "../lib/api";

type HomeRouteProps = {
  syncLabel?: string;
};

export function HomeRoute({ syncLabel }: HomeRouteProps) {
  const [query, setQuery] = useState("");
  const [includeDrafts, setIncludeDrafts] = useState(false);
  const [activeTag, setActiveTag] = useState<string>("");

  const notesQuery = useQuery({
    queryKey: ["notes", query, includeDrafts],
    queryFn: () => fetchNotes({ q: query, drafts: includeDrafts }),
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of notesQuery.data?.items || []) {
      for (const tag of note.tags) {
        const normalized = tag.trim();
        if (!normalized) {
          continue;
        }
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 18);
  }, [notesQuery.data?.items]);

  const filtered = useMemo(() => {
    const notes = notesQuery.data?.items || [];
    if (!activeTag) {
      return notes;
    }
    return notes.filter((note) => note.tags.includes(activeTag));
  }, [activeTag, notesQuery.data?.items]);

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <p className="eyebrow">Clinical Vault</p>
        <h1>Clinical Learning Notes</h1>
        <p>
          Personal notes on medicine, study systems, and clinical learning.
        </p>
        <div className="hero-metrics">
          <span>{notesQuery.data?.total ?? 0} notes loaded</span>
          <span>Use Cmd+K / Ctrl+K for universal search</span>
          {syncLabel ? <span>{syncLabel}</span> : null}
        </div>
      </section>

      <section className="controls-panel">
        <label className="search-control" htmlFor="notes-query">
          <span>Search notes</span>
          <input
            id="notes-query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try: cardiomyopathy, valvular, ACS"
          />
        </label>

        <label className="toggle-control" htmlFor="show-drafts">
          <input
            id="show-drafts"
            type="checkbox"
            checked={includeDrafts}
            onChange={(event) => setIncludeDrafts(event.target.checked)}
          />
          <span>Show drafts</span>
        </label>
      </section>

      <section className="content-grid">
        <aside className="tag-panel">
          <div className="panel-heading">
            <h2>Topic Clusters</h2>
            <button
              type="button"
              className={clsx("ghost-btn", { active: activeTag === "" })}
              onClick={() => setActiveTag("")}
            >
              All
            </button>
          </div>
          <div className="tag-cloud">
            {tags.map(([tag, count]) => (
              <button
                type="button"
                key={tag}
                className={clsx("tag-chip", { active: activeTag === tag })}
                onClick={() => setActiveTag((current) => (current === tag ? "" : tag))}
              >
                #{tag}
                <span>{count}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="notes-panel">
          <div className="panel-heading">
            <h2>{activeTag ? `#${activeTag}` : "Recent Notes"}</h2>
            <p>{filtered.length} visible</p>
          </div>

          {notesQuery.isLoading ? <p className="state">Loading notes...</p> : null}
          {notesQuery.isError ? (
            <p className="state error">Failed to load notes. Check backend server.</p>
          ) : null}

          <div className="notes-list">
            {filtered.map((note) => (
              <Link key={note.slug} to={`/note/${note.slug}`} className="note-card">
                <div className="note-head">
                  <h3>{note.title}</h3>
                  {!note.published ? <span className="draft-pill">Draft</span> : null}
                </div>
                <p>{note.excerpt || "No content preview available."}</p>
                <div className="note-meta">
                  <span>{formatDate(note.updatedAt)}</span>
                  <span>{note.slug}</span>
                </div>
              </Link>
            ))}
            {!notesQuery.isLoading && filtered.length === 0 ? (
              <p className="state">No notes match your filters.</p>
            ) : null}
          </div>
        </section>
      </section>
    </div>
  );
}
