import { db } from "./db";

export const EXPORT_VERSION = 1;

const TABLES = [
  "courses",
  "modules",
  "moduleSpecs",
  "courseOutlines",
  "groups",
  "students",
  "syllabusPoints",
  "schemes",
  "sessions",
  "questions",
  "assessments",
  "references",
  "snippets",
  "templates",
  "scheduleSlots",
  "grades",
  "attendance",
] as const;

type SerializedBlob = {
  __blob: true;
  mime: string;
  base64: string;
};

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function exportAll(): Promise<Blob> {
  const data: Record<string, unknown[]> = {};
  for (const t of TABLES) {
    data[t] = await (db as unknown as Record<string, { toArray: () => Promise<unknown[]> }>)[t].toArray();
  }
  const blobs = await db.blobs.toArray();
  const serializedBlobs: (SerializedBlob & { id: string; createdAt: number })[] = [];
  for (const b of blobs) {
    if (b.data instanceof Blob) {
      serializedBlobs.push({
        __blob: true,
        id: b.id,
        mime: b.mime,
        createdAt: b.createdAt,
        base64: await blobToBase64(b.data),
      });
    }
  }
  const payload = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data,
    blobs: serializedBlobs,
  };
  return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
}

export async function importAll(file: File, mode: "merge" | "replace" = "merge"): Promise<void> {
  const text = await file.text();
  const payload = JSON.parse(text) as {
    version: number;
    data: Record<string, unknown[]>;
    blobs?: { id: string; mime: string; base64: string; createdAt: number }[];
  };
  if (payload.version !== EXPORT_VERSION) {
    throw new Error(`Unsupported export version ${payload.version}`);
  }
  await db.transaction(
    "rw",
    db.tables.filter((t) => t.name !== "settings"),
    async () => {
      if (mode === "replace") {
        for (const t of TABLES) {
          await (db as unknown as Record<string, { clear: () => Promise<void> }>)[t].clear();
        }
        await db.blobs.clear();
      }
      for (const t of TABLES) {
        const rows = payload.data[t];
        if (Array.isArray(rows) && rows.length > 0) {
          await (db as unknown as Record<string, { bulkPut: (xs: unknown[]) => Promise<unknown> }>)[t].bulkPut(rows);
        }
      }
      if (payload.blobs && payload.blobs.length > 0) {
        const records = payload.blobs.map((b) => ({
          id: b.id,
          mime: b.mime,
          createdAt: b.createdAt,
          data: base64ToBlob(b.base64, b.mime),
        }));
        await db.blobs.bulkPut(records);
      }
    },
  );
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
