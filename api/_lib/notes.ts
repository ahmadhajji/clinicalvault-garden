import matter from "gray-matter";
import { promises as fs } from "node:fs";
import path from "node:path";
import { toVideoEmbed } from "./video";
import type { Frontmatter, NoteMeta, NoteRecord } from "./types";

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

export function toMeta(note: NoteRecord): NoteMeta {
  return {
    slug: note.slug,
    title: note.title,
    tags: note.tags,
    excerpt: note.excerpt,
    permalink: note.permalink,
    published: note.published,
    updatedAt: note.updatedAt,
    videoEmbed: note.videoEmbed,
    sourceFileId: note.sourceFileId || null,
    sourceModifiedTime: note.sourceModifiedTime || null,
  };
}

export function parseNoteFromRaw(params: {
  raw: string;
  filePathForSlug: string;
  notesDirForSlug: string;
  mtimeIso?: string;
  sourceFileId?: string;
  sourceModifiedTime?: string;
}): NoteRecord | null {
  const parsed = matter(params.raw);
  const frontmatter = (parsed.data || {}) as Frontmatter;
  const slug = deriveSlug(params.filePathForSlug, params.notesDirForSlug, frontmatter);
  if (!slug) {
    return null;
  }

  const titleFromData =
    typeof frontmatter.title === "string" ? frontmatter.title.trim() : "";
  const titleFallback = path
    .basename(params.filePathForSlug)
    .replace(/\.(md|markdown)$/i, "")
    .trim();

  const updatedAt =
    (typeof frontmatter.updated === "string" && frontmatter.updated.trim()) ||
    params.sourceModifiedTime ||
    params.mtimeIso ||
    new Date().toISOString();

  return {
    slug,
    title: titleFromData || titleFallback,
    tags: normalizeTags(frontmatter.tags),
    excerpt: excerptFromContent(parsed.content),
    content: parsed.content,
    permalink: normalizePermalink(frontmatter.permalink),
    published: toBoolean(frontmatter["dg-publish"]),
    updatedAt,
    frontmatter,
    videoEmbed: toVideoEmbed(frontmatter),
    sourceFileId: params.sourceFileId || null,
    sourceModifiedTime: params.sourceModifiedTime || null,
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

export async function loadLocalNotes(): Promise<NoteRecord[]> {
  const notesDir = resolveNotesDir();
  const notes: NoteRecord[] = [];

  for await (const filePath of walkFiles(notesDir)) {
    const raw = await fs.readFile(filePath, "utf8");
    const stats = await fs.stat(filePath);

    const note = parseNoteFromRaw({
      raw,
      filePathForSlug: filePath,
      notesDirForSlug: notesDir,
      mtimeIso: stats.mtime.toISOString(),
    });

    if (!note) {
      continue;
    }

    notes.push(note);
  }

  return notes.sort((a, b) => {
    const aTime = new Date(a.updatedAt).getTime();
    const bTime = new Date(b.updatedAt).getTime();
    return bTime - aTime;
  });
}
