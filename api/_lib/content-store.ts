import type { NoteMeta, NoteRecord, SearchResult, VideoEmbed } from "./types";
import { getSupabaseServiceClient, isSupabaseConfigured } from "./supabase";
import { loadLocalNotes, toMeta } from "./notes";

function mapSupabaseNote(row: Record<string, unknown>): NoteRecord {
  const tags = Array.isArray(row.tags)
    ? row.tags.map((tag) => String(tag))
    : [];

  const videoEmbedRaw = row.video_embed as VideoEmbed | null | undefined;

  return {
    slug: String(row.slug || ""),
    title: String(row.title || ""),
    tags,
    excerpt: String(row.excerpt || ""),
    content: String(row.content || ""),
    permalink: (row.permalink as string | null) || null,
    published: Boolean(row.published),
    updatedAt: String(row.updated_at || row.updatedAt || new Date().toISOString()),
    frontmatter: (row.frontmatter as Record<string, unknown>) || {},
    videoEmbed: videoEmbedRaw || null,
    sourceFileId: (row.source_file_id as string | null) || null,
    sourceModifiedTime: (row.source_modified_time as string | null) || null,
  };
}

async function listFromSupabase(includeDrafts: boolean): Promise<NoteRecord[]> {
  const supabase = getSupabaseServiceClient();
  let query = supabase.from("notes").select("*").order("updated_at", { ascending: false });
  if (!includeDrafts) {
    query = query.eq("published", true);
  }
  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return (data || []).map((row) => mapSupabaseNote(row as Record<string, unknown>));
}

export async function listPublicNotes(input: {
  query?: string;
  includeDrafts?: boolean;
}): Promise<NoteMeta[]> {
  const includeDrafts = input.includeDrafts ?? false;
  const queryText = (input.query || "").trim().toLowerCase();

  const notes = isSupabaseConfigured()
    ? await listFromSupabase(includeDrafts).catch(() => loadLocalNotes())
    : await loadLocalNotes();

  return notes
    .filter((note) => includeDrafts || note.published)
    .filter((note) => {
      if (!queryText) {
        return true;
      }
      const haystack = [note.title, note.excerpt, note.tags.join(" "), note.content]
        .join(" ")
        .toLowerCase();
      return haystack.includes(queryText);
    })
    .map(toMeta);
}

export async function getPublicNoteBySlug(input: {
  slug: string;
  includeDrafts?: boolean;
}): Promise<NoteRecord | null> {
  const includeDrafts = input.includeDrafts ?? false;
  const slug = input.slug;

  const notes = isSupabaseConfigured()
    ? await listFromSupabase(includeDrafts).catch(() => loadLocalNotes())
    : await loadLocalNotes();

  const note = notes.find((item) => item.slug === slug);
  if (!note) {
    return null;
  }
  if (!includeDrafts && !note.published) {
    return null;
  }
  return note;
}

function scoreNote(note: NoteRecord, query: string): SearchResult | null {
  const q = query.toLowerCase().trim();
  if (!q) {
    return null;
  }

  const title = note.title.toLowerCase();
  const content = note.content.toLowerCase();
  const tagsText = note.tags.join(" ").toLowerCase();

  const matchAreas: Array<"title" | "content" | "tags"> = [];
  let score = 0;

  if (title.includes(q)) {
    score += title.startsWith(q) ? 120 : 80;
    matchAreas.push("title");
  }
  if (tagsText.includes(q)) {
    score += 45;
    matchAreas.push("tags");
  }
  if (content.includes(q)) {
    score += 25;
    matchAreas.push("content");
  }

  if (score === 0) {
    return null;
  }

  return {
    slug: note.slug,
    title: note.title,
    excerpt: note.excerpt,
    matchAreas,
    score,
    tags: note.tags,
    updatedAt: note.updatedAt,
  };
}

export async function searchPublishedNotes(input: {
  query: string;
  limit?: number;
}): Promise<SearchResult[]> {
  const limit = input.limit ?? 20;
  const notes = isSupabaseConfigured()
    ? await listFromSupabase(false).catch(() => loadLocalNotes())
    : await loadLocalNotes();

  const scored = notes
    .filter((note) => note.published)
    .map((note) => scoreNote(note, input.query))
    .filter((item): item is SearchResult => Boolean(item))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })
    .slice(0, Math.max(1, Math.min(100, limit)));

  return scored;
}

export async function upsertSyncedNotes(notes: NoteRecord[]): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase service credentials are required for synced note ingestion.");
  }
  if (notes.length === 0) {
    return;
  }

  const supabase = getSupabaseServiceClient();
  const payload = notes.map((note) => ({
    slug: note.slug,
    title: note.title,
    tags: note.tags,
    excerpt: note.excerpt,
    content: note.content,
    permalink: note.permalink,
    published: note.published,
    updated_at: note.updatedAt,
    frontmatter: note.frontmatter,
    video_embed: note.videoEmbed,
    source_file_id: note.sourceFileId,
    source_modified_time: note.sourceModifiedTime,
    last_ingested_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("notes").upsert(payload, {
    onConflict: "slug",
  });

  if (error) {
    throw error;
  }
}

export async function deleteNotesBySourceFileIds(fileIds: string[]): Promise<void> {
  if (!isSupabaseConfigured() || fileIds.length === 0) {
    return;
  }

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("notes").delete().in("source_file_id", fileIds);
  if (error) {
    throw error;
  }
}

export async function getTotalNotesCount(includeDrafts = true): Promise<number> {
  const notes = isSupabaseConfigured()
    ? await listFromSupabase(includeDrafts).catch(() => loadLocalNotes())
    : await loadLocalNotes();

  return includeDrafts ? notes.length : notes.filter((note) => note.published).length;
}
