import matter from "gray-matter";
import { promises as fs } from "node:fs";
import path from "node:path";

export type Frontmatter = Record<string, unknown>;

export type NoteRecord = {
  slug: string;
  title: string;
  tags: string[];
  excerpt: string;
  content: string;
  permalink: string | null;
  published: boolean;
  updatedAt: string;
  frontmatter: Frontmatter;
};

export type NoteMeta = Omit<NoteRecord, "content" | "frontmatter">;

const defaultNotesDir = path.resolve(process.cwd(), "src/site/notes");

function resolveNotesDir(): string {
  const configured = process.env.NOTES_DIR;
  if (!configured) {
    return defaultNotesDir;
  }
  return path.isAbsolute(configured)
    ? configured
    : path.resolve(process.cwd(), configured);
}

export function normalizePermalink(permalink: unknown): string | null {
  if (typeof permalink !== "string") {
    return null;
  }
  const normalized = permalink.trim().replace(/^\/+|\/+$/g, "");
  return normalized || null;
}

function toBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function slugifySegment(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function deriveSlug(filePath: string, notesDir: string, frontmatter: Frontmatter): string {
  const permalink = normalizePermalink(frontmatter.permalink);
  if (permalink && permalink !== "notes") {
    return permalink;
  }

  const relativeStem = path
    .relative(notesDir, filePath)
    .replace(/\\/g, "/")
    .replace(/\.(md|markdown)$/i, "");

  return relativeStem
    .split("/")
    .map(slugifySegment)
    .filter(Boolean)
    .join("/");
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return [value.trim()].filter(Boolean);
  }
  return [];
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[>*_~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerptFromContent(markdown: string): string {
  const plainText = stripMarkdown(markdown);
  if (plainText.length <= 220) {
    return plainText;
  }
  return `${plainText.slice(0, 217)}...`;
}

function toMeta(note: NoteRecord): NoteMeta {
  return {
    slug: note.slug,
    title: note.title,
    tags: note.tags,
    excerpt: note.excerpt,
    permalink: note.permalink,
    published: note.published,
    updatedAt: note.updatedAt,
  };
}

async function* walkFiles(root: string): AsyncGenerator<string> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath);
      continue;
    }
    if (/\.(md|markdown)$/i.test(entry.name)) {
      yield fullPath;
    }
  }
}

export async function loadNotes(): Promise<NoteRecord[]> {
  const notesDir = resolveNotesDir();
  const notes: NoteRecord[] = [];

  for await (const filePath of walkFiles(notesDir)) {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(raw);
    const frontmatter = (parsed.data || {}) as Frontmatter;

    const slug = deriveSlug(filePath, notesDir, frontmatter);
    if (!slug) {
      continue;
    }

    const titleFromData =
      typeof frontmatter.title === "string" ? frontmatter.title.trim() : "";
    const titleFallback = path
      .basename(filePath)
      .replace(/\.(md|markdown)$/i, "")
      .trim();

    const stats = await fs.stat(filePath);

    notes.push({
      slug,
      title: titleFromData || titleFallback,
      tags: normalizeTags(frontmatter.tags),
      excerpt: excerptFromContent(parsed.content),
      content: parsed.content,
      permalink: normalizePermalink(frontmatter.permalink),
      published: toBoolean(frontmatter["dg-publish"]),
      updatedAt:
        typeof frontmatter.updated === "string" && frontmatter.updated.trim()
          ? frontmatter.updated.trim()
          : stats.mtime.toISOString(),
      frontmatter,
    });
  }

  return notes.sort((a, b) => {
    const aTime = new Date(a.updatedAt).getTime();
    const bTime = new Date(b.updatedAt).getTime();
    return bTime - aTime;
  });
}

export async function listNotes(input: {
  query?: string;
  includeDrafts?: boolean;
}): Promise<NoteMeta[]> {
  const { query = "", includeDrafts = false } = input;
  const notes = await loadNotes();
  const queryNormalized = query.trim().toLowerCase();

  return notes
    .filter((note) => includeDrafts || note.published)
    .filter((note) => {
      if (!queryNormalized) {
        return true;
      }
      const haystack = [note.title, note.excerpt, note.tags.join(" "), note.slug]
        .join(" ")
        .toLowerCase();
      return haystack.includes(queryNormalized);
    })
    .map(toMeta);
}

export async function getNoteBySlug(
  slug: string,
  input: { includeDrafts?: boolean } = {}
): Promise<NoteRecord | null> {
  const includeDrafts = input.includeDrafts ?? false;
  const notes = await loadNotes();
  const note = notes.find((item) => item.slug === slug);
  if (!note) {
    return null;
  }
  if (!includeDrafts && !note.published) {
    return null;
  }
  return note;
}

export async function getNotesCount(input: { includeDrafts?: boolean } = {}): Promise<number> {
  const includeDrafts = input.includeDrafts ?? true;
  const notes = await loadNotes();
  return includeDrafts ? notes.length : notes.filter((note) => note.published).length;
}
