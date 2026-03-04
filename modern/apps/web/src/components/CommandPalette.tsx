import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchNotes } from "../lib/api";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const debounced = useDebouncedValue(query, 160);

  const searchQuery = useQuery({
    queryKey: ["global-search", debounced],
    queryFn: () => searchNotes(debounced, 20),
    enabled: open && debounced.trim().length > 0,
  });

  const items = useMemo(() => searchQuery.data?.items || [], [searchQuery.data]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [debounced]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => Math.min(items.length - 1, current + 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => Math.max(0, current - 1));
        return;
      }
      if (event.key === "Enter" && items[activeIndex]) {
        event.preventDefault();
        navigate(`/note/${items[activeIndex].slug}`);
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, items, navigate, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette" onClick={(event) => event.stopPropagation()}>
        <input
          autoFocus
          type="search"
          placeholder="Search notes (Cmd+K)"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="palette-results">
          {debounced.trim().length === 0 ? <p className="state">Type to search notes.</p> : null}
          {searchQuery.isLoading ? <p className="state">Searching...</p> : null}
          {items.map((item, index) => (
            <button
              type="button"
              key={item.slug}
              className={`palette-item ${index === activeIndex ? "active" : ""}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                navigate(`/note/${item.slug}`);
                onClose();
              }}
            >
              <strong>{item.title}</strong>
              <p>{item.excerpt}</p>
              <span>{item.tags.length ? `#${item.tags.join(" #")}` : "No tags"}</span>
            </button>
          ))}
          {debounced.trim().length > 0 && !searchQuery.isLoading && items.length === 0 ? (
            <p className="state">No results.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
