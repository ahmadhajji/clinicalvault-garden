import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listPublicNotes } from "../_lib/content-store";

function queryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }
  return value || "";
}

function parseDrafts(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const q = queryValue(req.query.q);
    const draftsQuery = queryValue(req.query.drafts);
    const includeDrafts = draftsQuery ? parseDrafts(draftsQuery) : false;

    const items = await listPublicNotes({
      query: q,
      includeDrafts,
    });

    res.status(200).json({
      total: items.length,
      items,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
