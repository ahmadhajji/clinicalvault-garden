import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseServiceClient, isSupabaseConfigured } from "../_lib/supabase";
import type { CommentStatus } from "../_lib/types";

function normalizeSlug(req: VercelRequest): string {
  const pathOnly = (req.url || "").split("?")[0] || "";
  const prefix = "/api/comments/";
  if (pathOnly.startsWith(prefix)) {
    return decodeURIComponent(pathOnly.slice(prefix.length)).replace(/^\/+|\/+$/g, "");
  }

  const raw = req.query.slug;
  if (Array.isArray(raw)) {
    return raw.join("/").replace(/^\/+|\/+$/g, "");
  }
  return (raw || "").replace(/^\/+|\/+$/g, "");
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function evaluateComment(body: string): { status: CommentStatus; toxicityScore: number } {
  const tokens = tokenize(body);
  const banned = ["viagra", "casino", "crypto", "loan", "porn", "scam"];
  const toxic = ["idiot", "stupid", "hate", "kill", "die"];

  let score = 0;
  const bannedHits = tokens.filter((token) => banned.includes(token)).length;
  const toxicHits = tokens.filter((token) => toxic.includes(token)).length;

  score += bannedHits * 0.55;
  score += toxicHits * 0.25;
  if (body.length < 4) {
    score += 0.4;
  }
  if (body.length > 4000) {
    score += 0.2;
  }

  if (score >= 1.2) {
    return { status: "rejected", toxicityScore: Math.min(1, score) };
  }
  if (score >= 0.5) {
    return { status: "flagged", toxicityScore: Math.min(1, score) };
  }

  return { status: "visible", toxicityScore: score };
}

function bearerToken(req: VercelRequest): string {
  const auth = req.headers.authorization || "";
  if (!auth.toLowerCase().startsWith("bearer ")) {
    return "";
  }
  return auth.slice(7).trim();
}

async function getUserFromToken(req: VercelRequest) {
  const token = bearerToken(req);
  if (!token) {
    return null;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }
  return data.user;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    res.status(503).json({ error: "Comments are not configured yet." });
    return;
  }

  const slug = normalizeSlug(req);
  if (!slug) {
    res.status(400).json({ error: "Missing note slug" });
    return;
  }

  const supabase = getSupabaseServiceClient();

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("comments")
      .select("id, note_slug, author_user_id, author_name, body_markdown, status, toxicity_score, created_at")
      .eq("note_slug", slug)
      .in("status", ["visible", "flagged"])
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ total: data?.length || 0, items: data || [] });
    return;
  }

  if (req.method === "POST") {
    const user = await getUserFromToken(req);
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const bodyMarkdown = String(req.body?.body || "").trim();
    if (!bodyMarkdown) {
      res.status(400).json({ error: "Comment body is required" });
      return;
    }

    const moderation = evaluateComment(bodyMarkdown);

    const payload = {
      note_slug: slug,
      author_user_id: user.id,
      author_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "User",
      body_markdown: bodyMarkdown,
      status: moderation.status,
      toxicity_score: moderation.toxicityScore,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("comments")
      .insert(payload)
      .select("id, note_slug, author_user_id, author_name, body_markdown, status, toxicity_score, created_at")
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await supabase.from("comment_events").insert({
      note_slug: slug,
      comment_id: data.id,
      action: moderation.status === "visible" ? "created" : "flagged",
      details: {
        toxicityScore: moderation.toxicityScore,
      },
      created_at: new Date().toISOString(),
    });

    res.status(201).json({ item: data });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
