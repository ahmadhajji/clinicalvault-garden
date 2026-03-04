import chokidar from "chokidar";
import cors from "cors";
import express from "express";
import matter from "gray-matter";
import { createServer } from "node:http";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";

type Frontmatter = Record<string, unknown>;

type NoteRecord = {
  slug: string;
  title: string;
  tags: string[];
  excerpt: string;
  content: string;
  permalink: string | null;
  published: boolean;
  updatedAt: string;
  filePath: string;
  frontmatter: Frontmatter;
};

type NoteMeta = Omit<NoteRecord, "content" | "frontmatter" | "filePath">;

type ServerEvent = {
  type: "notes.snapshot" | "notes.ready";
  reason?: string;
  total: number;
  notesDir: string;
  timestamp: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../../../");
const defaultNotesDir = path.resolve(repoRoot, "src/site/notes");
const notesDir = (() => {
  const configured = process.env.NOTES_DIR;
  if (!configured) {
    return defaultNotesDir;
  }
  return path.isAbsolute(configured)
    ? configured
    : path.resolve(repoRoot, configured);
})();

const webDistDir = path.resolve(repoRoot, "modern/apps/web/dist");
const port = Number(process.env.PORT || 8787);

const notesBySlug = new Map<string, NoteRecord>();

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

function normalizePermalink(permalink: unknown): string | null {
  if (typeof permalink !== "string") {
    return null;
  }
  const normalized = permalink.trim().replace(/^\/+|\/+$/g, "");
  return normalized || null;
}

function deriveSlug(filePath: string, frontmatter: Frontmatter): string {
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

async function loadNotes(): Promise<void> {
  notesBySlug.clear();

  const files = await fs.readdir(notesDir, { withFileTypes: true });
  const stack = files.map((entry) => path.join(notesDir, entry.name));

  while (stack.length > 0) {
    const currentPath = stack.pop();
    if (!currentPath) {
      continue;
    }

    const stats = await fs.stat(currentPath);
    if (stats.isDirectory()) {
      const nested = await fs.readdir(currentPath, { withFileTypes: true });
      nested.forEach((entry) => {
        stack.push(path.join(currentPath, entry.name));
      });
      continue;
    }

    if (!/\.(md|markdown)$/i.test(currentPath)) {
      continue;
    }

    const raw = await fs.readFile(currentPath, "utf8");
    const parsed = matter(raw);
    const frontmatter = (parsed.data || {}) as Frontmatter;
    const slug = deriveSlug(currentPath, frontmatter);
    if (!slug) {
      continue;
    }

    const titleFromData =
      typeof frontmatter.title === "string" ? frontmatter.title.trim() : "";
    const titleFallback = path
      .basename(currentPath)
      .replace(/\.(md|markdown)$/i, "")
      .trim();

    const note: NoteRecord = {
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
      filePath: currentPath,
      frontmatter,
    };

    notesBySlug.set(slug, note);
  }
}

function noteList(query?: string, includeDrafts = true): NoteMeta[] {
  const queryNormalized = query?.trim().toLowerCase() || "";

  const notes = [...notesBySlug.values()]
    .filter((note) => includeDrafts || note.published)
    .filter((note) => {
      if (!queryNormalized) {
        return true;
      }
      const haystack = [
        note.title,
        note.excerpt,
        note.tags.join(" "),
        note.slug,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(queryNormalized);
    })
    .sort((a, b) => {
      const aTime = new Date(a.updatedAt).getTime();
      const bTime = new Date(b.updatedAt).getTime();
      return bTime - aTime;
    })
    .map(toMeta);

  return notes;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    totalNotes: notesBySlug.size,
    notesDir,
    serverTime: new Date().toISOString(),
  });
});

app.get("/api/notes", (req, res) => {
  const includeDrafts = req.query.drafts !== "false";
  const q = typeof req.query.q === "string" ? req.query.q : "";
  res.json({
    total: notesBySlug.size,
    items: noteList(q, includeDrafts),
  });
});

app.get("/api/notes/*", (req, res) => {
  const wildcard = (req.params as Record<string, string>)["0"] || "";
  const slug = decodeURIComponent(wildcard).replace(
    /^\/+|\/+$/g,
    ""
  );

  const note = notesBySlug.get(slug);
  if (!note) {
    res.status(404).json({ error: "Note not found", slug });
    return;
  }

  res.json({
    ...toMeta(note),
    content: note.content,
    frontmatter: note.frontmatter,
  });
});

if (existsSync(webDistDir)) {
  app.use(express.static(webDistDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(path.join(webDistDir, "index.html"));
  });
}

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

function broadcast(event: ServerEvent): void {
  const message = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

function snapshotEvent(type: ServerEvent["type"], reason?: string): ServerEvent {
  return {
    type,
    reason,
    total: notesBySlug.size,
    notesDir,
    timestamp: new Date().toISOString(),
  };
}

wss.on("connection", (socket) => {
  socket.send(JSON.stringify(snapshotEvent("notes.ready")));
});

let reloadTimer: NodeJS.Timeout | null = null;
async function reloadAndBroadcast(reason: string): Promise<void> {
  try {
    await loadNotes();
    broadcast(snapshotEvent("notes.snapshot", reason));
  } catch (error) {
    console.error("[watcher] reload failed", error);
  }
}

function scheduleReload(reason: string): void {
  if (reloadTimer) {
    clearTimeout(reloadTimer);
  }
  reloadTimer = setTimeout(() => {
    reloadAndBroadcast(reason).catch((error) => {
      console.error("[watcher] schedule reload failed", error);
    });
  }, 140);
}

async function start(): Promise<void> {
  if (!existsSync(notesDir)) {
    throw new Error(`Notes directory not found: ${notesDir}`);
  }

  await loadNotes();

  const watcher = chokidar.watch(["**/*.md", "**/*.markdown"], {
    cwd: notesDir,
    ignoreInitial: true,
  });

  watcher.on("all", (eventName, changedPath) => {
    scheduleReload(`${eventName}:${changedPath}`);
  });

  server.listen(port, () => {
    console.log(`[server] running on http://localhost:${port}`);
    console.log(`[server] watching notes in ${notesDir}`);
    console.log(`[server] loaded ${notesBySlug.size} notes`);
  });
}

start().catch((error) => {
  console.error("[server] startup failed", error);
  process.exit(1);
});
