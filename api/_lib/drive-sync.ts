import { google } from "googleapis";
import { parseNoteFromRaw } from "./notes";
import { deleteNotesBySourceFileIds, upsertSyncedNotes } from "./content-store";
import { getSupabaseServiceClient, isSupabaseConfigured } from "./supabase";
import type { NoteRecord } from "./types";

type DriveFile = {
  id: string;
  name: string;
  modifiedTime?: string | null;
  trashed?: boolean | null;
};

function envRequired(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getServiceAccountCredentials() {
  return {
    clientEmail: envRequired("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    privateKey: envRequired("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n"),
  };
}

function getDriveClient() {
  const { clientEmail, privateKey } = getServiceAccountCredentials();
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return google.drive({ version: "v3", auth });
}

async function listMarkdownFilesInFolder(folderId: string): Promise<DriveFile[]> {
  const drive = getDriveClient();

  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and (mimeType = 'text/markdown' or name contains '.md')`,
      fields: "nextPageToken, files(id, name, modifiedTime, trashed)",
      pageToken,
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const chunk = response.data.files || [];
    chunk.forEach((file) => {
      if (!file.id || !file.name) {
        return;
      }
      files.push({
        id: file.id,
        name: file.name,
        modifiedTime: file.modifiedTime,
        trashed: file.trashed,
      });
    });

    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return files;
}

async function downloadMarkdown(fileId: string): Promise<string> {
  const drive = getDriveClient();
  const response = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "text" }
  );

  if (typeof response.data === "string") {
    return response.data;
  }

  if (Buffer.isBuffer(response.data)) {
    return response.data.toString("utf8");
  }

  return String(response.data || "");
}

async function loadCurrentSourceFileIds(): Promise<Set<string>> {
  if (!isSupabaseConfigured()) {
    return new Set();
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("notes")
    .select("source_file_id")
    .not("source_file_id", "is", null);

  if (error) {
    throw error;
  }

  return new Set((data || []).map((row) => String(row.source_file_id)));
}

async function insertDeadLetter(payload: {
  sourceFileId: string | null;
  fileName: string | null;
  reason: string;
  details: Record<string, unknown>;
}) {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = getSupabaseServiceClient();
  await supabase.from("ingest_dead_letters").insert({
    source_file_id: payload.sourceFileId,
    file_name: payload.fileName,
    reason: payload.reason,
    details: payload.details,
    created_at: new Date().toISOString(),
  });
}

async function setSyncState(key: string, value: Record<string, unknown>) {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = getSupabaseServiceClient();
  await supabase.from("sync_state").upsert(
    {
      key,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
}

function toSlugPath(name: string): string {
  return name.endsWith(".md") || name.endsWith(".markdown") ? name : `${name}.md`;
}

export async function reconcileDriveFolder(input?: { reason?: string }) {
  const folderId = envRequired("GOOGLE_DRIVE_FOLDER_ID");

  const remoteFiles = await listMarkdownFilesInFolder(folderId);
  const notesToUpsert: NoteRecord[] = [];

  for (const file of remoteFiles) {
    try {
      const raw = await downloadMarkdown(file.id);

      const note = parseNoteFromRaw({
        raw,
        filePathForSlug: toSlugPath(file.name),
        notesDirForSlug: ".",
        sourceFileId: file.id,
        sourceModifiedTime: file.modifiedTime || new Date().toISOString(),
      });

      if (!note) {
        await insertDeadLetter({
          sourceFileId: file.id,
          fileName: file.name,
          reason: "parse-null",
          details: { reason: "parseNoteFromRaw returned null" },
        });
        continue;
      }

      notesToUpsert.push(note);
    } catch (error) {
      await insertDeadLetter({
        sourceFileId: file.id,
        fileName: file.name,
        reason: "ingest-failed",
        details: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  const existingIds = await loadCurrentSourceFileIds();
  const currentIds = new Set(remoteFiles.map((file) => file.id));
  const toDelete = [...existingIds].filter((id) => !currentIds.has(id));

  await upsertSyncedNotes(notesToUpsert);
  await deleteNotesBySourceFileIds(toDelete);

  await setSyncState("drive_sync", {
    lastRunAt: new Date().toISOString(),
    reason: input?.reason || "reconcile",
    totalRemoteFiles: remoteFiles.length,
    upsertedNotes: notesToUpsert.length,
    deletedNotes: toDelete.length,
  });

  return {
    ok: true,
    totalRemoteFiles: remoteFiles.length,
    upsertedNotes: notesToUpsert.length,
    deletedNotes: toDelete.length,
  };
}
