import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAnonClient, isSupabaseAuthConfigured } from "../_lib/supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isSupabaseAuthConfigured()) {
    res.status(503).json({ error: "Supabase auth is not configured." });
    return;
  }

  try {
    const supabase = getSupabaseAnonClient();
    const redirectTo =
      typeof req.body?.redirectTo === "string" && req.body.redirectTo.trim()
        ? req.body.redirectTo.trim()
        : req.headers.origin || "";

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ url: data.url });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
