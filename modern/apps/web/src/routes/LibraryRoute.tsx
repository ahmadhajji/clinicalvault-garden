import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchNotes, formatDate } from "../lib/api";

function estimateReadingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function LibraryRoute() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const tagFilter = params.get("tag") || "";
  const sort = params.get("sort") || "updated";

  const notesQuery = useQuery({
    queryKey: ["library-notes", query],
    queryFn: () => fetchNotes({ q: query, drafts: false }),
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });

  const tags = useMemo(() => {
    const map = new Map<string, number>();
    for (const note of notesQuery.data?.items || []) {
      for (const tag of note.tags) {
        map.set(tag, (map.get(tag) || 0) + 1);
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [notesQuery.data?.items]);

  const rows = useMemo(() => {
    let items = [...(notesQuery.data?.items || [])];
    if (tagFilter) {
      items = items.filter((note) => note.tags.includes(tagFilter));
    }

    if (sort === "title") {
      items.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "specialty") {
      items.sort((a, b) => {
        const aSpecialty = a.tags[0] || "zz";
        const bSpecialty = b.tags[0] || "zz";
        return aSpecialty.localeCompare(bSpecialty);
      });
    } else {
      items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return items;
  }, [notesQuery.data?.items, sort, tagFilter]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setParams(next);
  };

  return (
    <main className="library-page">
      <section className="library-head">
        <h1>Library</h1>
        <p>Structured index of all published notes.</p>
      </section>

      <section className="library-controls">
        <label>
          <span>Filter text</span>
          <input
            type="search"
            value={query}
            onChange={(event) => updateParam("q", event.target.value)}
            placeholder="Search title/body/tags"
          />
        </label>

        <label>
          <span>Sort</span>
          <select value={sort} onChange={(event) => updateParam("sort", event.target.value)}>
            <option value="updated">Updated</option>
            <option value="title">Title</option>
            <option value="specialty">Specialty</option>
          </select>
        </label>
      </section>

      <section className="library-tags">
        <button
          type="button"
          className={`tag-chip ${!tagFilter ? "active" : ""}`}
          onClick={() => updateParam("tag", "")}
        >
          All topics
        </button>
        {tags.map(([tag, count]) => (
          <button
            type="button"
            key={tag}
            className={`tag-chip ${tagFilter === tag ? "active" : ""}`}
            onClick={() => updateParam("tag", tagFilter === tag ? "" : tag)}
          >
            #{tag} <span>{count}</span>
          </button>
        ))}
      </section>

      <section className="library-table-wrap">
        {notesQuery.isLoading ? <p className="state">Loading library...</p> : null}
        {notesQuery.isError ? <p className="state error">Failed to load library.</p> : null}

        <table className="library-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Specialty</th>
              <th>Tags</th>
              <th>Updated</th>
              <th>Status</th>
              <th>Read</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((note) => (
              <tr key={note.slug}>
                <td>
                  <Link to={`/note/${note.slug}`}>{note.title}</Link>
                </td>
                <td>{note.tags[0] || "General"}</td>
                <td>{note.tags.map((x) => `#${x}`).join(" ")}</td>
                <td>{formatDate(note.updatedAt)}</td>
                <td>{note.published ? "Published" : "Draft"}</td>
                <td>{estimateReadingMinutes(note.excerpt)} min</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!notesQuery.isLoading && rows.length === 0 ? (
          <p className="state">No notes match these filters.</p>
        ) : null}
      </section>
    </main>
  );
}
