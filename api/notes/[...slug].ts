import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPublicNoteBySlug } from "../_lib/content-store";

function normalizeSlug(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value.join("/");
  }
  return value || "";
}

function parseDrafts(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  const normalized = (raw || "").trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function slugFromRequest(req: VercelRequest): string {
  const pathOnly = (req.url || "").split("?")[0] || "";
  const prefix = "/api/notes/";
  if (pathOnly.startsWith(prefix)) {
    return decodeURIComponent(pathOnly.slice(prefix.length)).replace(/^\/+|\/+$/g, "");
  }
  return decodeURIComponent(normalizeSlug(req.query.slug)).replace(/^\/+|\/+$/g, "");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const slug = slugFromRequest(req);
  if (!slug) {
    res.status(400).json({ error: "Missing note slug" });
    return;
  }

  try {
    const includeDrafts = parseDrafts(req.query.drafts);
    const note = await getPublicNoteBySlug({ slug, includeDrafts });

    if (!note) {
      res.status(404).json({ error: "Note not found", slug });
      return;
    }

    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
