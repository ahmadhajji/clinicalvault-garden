import type { VercelRequest, VercelResponse } from "@vercel/node";
import { searchPublishedNotes } from "../_lib/content-store";

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const query = first(req.query.q).trim();
  const limitRaw = Number(first(req.query.limit) || "20");
  const limit = Number.isFinite(limitRaw) ? limitRaw : 20;

  if (!query) {
    res.status(200).json({ total: 0, items: [] });
    return;
  }

  try {
    const items = await searchPublishedNotes({ query, limit });
    res.status(200).json({ total: items.length, items });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
