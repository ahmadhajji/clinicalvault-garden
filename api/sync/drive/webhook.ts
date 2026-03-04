import type { VercelRequest, VercelResponse } from "@vercel/node";
import { reconcileDriveFolder } from "../../_lib/drive-sync";

function tokenValid(req: VercelRequest): boolean {
  const expected = process.env.GOOGLE_DRIVE_WEBHOOK_TOKEN;
  if (!expected) {
    return true;
  }
  return String(req.headers["x-goog-channel-token"] || "") === expected;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!tokenValid(req)) {
    res.status(401).json({ error: "Invalid webhook token" });
    return;
  }

  const resourceState = String(req.headers["x-goog-resource-state"] || "sync");

  try {
    const result = await reconcileDriveFolder({ reason: `drive-webhook:${resourceState}` });
    res.status(200).json({ ok: true, ...result, resourceState });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
