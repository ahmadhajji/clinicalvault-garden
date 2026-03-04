import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getNotesCount } from "./_lib/notes";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const totalNotes = await getNotesCount({ includeDrafts: true });
    res.status(200).json({
      ok: true,
      totalNotes,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
