import type { NoteDetail, NotesResponse } from "../types";

type NotesQuery = {
  q?: string;
  drafts?: boolean;
};

function toQuery(params: NotesQuery): string {
  const search = new URLSearchParams();
  if (params.q) {
    search.set("q", params.q);
  }
  if (params.drafts === false) {
    search.set("drafts", "false");
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function fetchNotes(params: NotesQuery): Promise<NotesResponse> {
  const response = await fetch(`/api/notes${toQuery(params)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch notes (${response.status})`);
  }
  return response.json() as Promise<NotesResponse>;
}

export async function fetchNote(slug: string): Promise<NoteDetail> {
  const response = await fetch(`/api/notes/${encodeURIComponent(slug)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch note (${response.status})`);
  }
  return response.json() as Promise<NoteDetail>;
}

export function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}
