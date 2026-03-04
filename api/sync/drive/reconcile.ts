import type { VercelRequest, VercelResponse } from "@vercel/node";
import { reconcileDriveFolder } from "../../_lib/drive-sync";

function authorized(req: VercelRequest): boolean {
  const secret = process.env.SYNC_SECRET;
  if (!secret) {
    return true;
  }
  if (req.headers["x-vercel-cron"]) {
    return true;
  }
  const header = String(req.headers["x-sync-secret"] || "");
  const querySecret = typeof req.query.secret === "string" ? req.query.secret : "";
  return header === secret || querySecret === secret;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!authorized(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const result = await reconcileDriveFolder({ reason: "manual-reconcile" });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
