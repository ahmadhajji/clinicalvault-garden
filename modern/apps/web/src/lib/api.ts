import type {
  CommentRecord,
  CommentsResponse,
  NoteDetail,
  NotesResponse,
  SearchResponse,
} from "../types";

type NotesQuery = {
  q?: string;
  drafts?: boolean;
};

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function jsonRequest<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function fetchNotes(params: NotesQuery): Promise<NotesResponse> {
  return jsonRequest<NotesResponse>(
    `/api/notes${toQuery({
      q: params.q,
      drafts: params.drafts,
    })}`
  );
}

export async function fetchNote(slug: string): Promise<NoteDetail> {
  return jsonRequest<NoteDetail>(`/api/notes/${encodeURIComponent(slug)}`);
}

export async function searchNotes(query: string, limit = 20): Promise<SearchResponse> {
  return jsonRequest<SearchResponse>(`/api/search${toQuery({ q: query, limit })}`);
}

export async function fetchComments(slug: string): Promise<CommentsResponse> {
  return jsonRequest<CommentsResponse>(`/api/comments/${encodeURIComponent(slug)}`);
}

export async function postComment(input: {
  slug: string;
  body: string;
  accessToken: string;
}): Promise<{ item: CommentRecord }> {
  return jsonRequest<{ item: CommentRecord }>(`/api/comments/${encodeURIComponent(input.slug)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify({ body: input.body }),
  });
}

export async function beginGoogleAuth(redirectTo: string): Promise<{ url: string }> {
  return jsonRequest<{ url: string }>(`/api/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ redirectTo }),
  });
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
