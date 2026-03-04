import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getTotalNotesCount } from "./_lib/content-store";
import { isSupabaseConfigured } from "./_lib/supabase";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const totalNotes = await getTotalNotesCount(true);
    res.status(200).json({
      ok: true,
      totalNotes,
      source: isSupabaseConfigured() ? "supabase_or_local_fallback" : "local_files",
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
