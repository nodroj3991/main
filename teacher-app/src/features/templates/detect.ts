import JSZip from "jszip";
import * as XLSX from "xlsx";
import type { Template, TemplateField } from "../../db/schema";

export type DetectedTemplate = {
  format: Template["format"];
  category: Template["category"];
  fields: TemplateField[];
};

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}|\$\{\s*([a-zA-Z0-9_.]+)\s*\}/g;

function uniqueFields(keys: string[]): TemplateField[] {
  const seen = new Set<string>();
  const out: TemplateField[] = [];
  for (const k of keys) {
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ key: k, label: k.replace(/[._]/g, " "), mappedTo: null, defaultValue: "" });
    }
  }
  return out;
}

function extractPlaceholders(text: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = PLACEHOLDER_RE.exec(text)) !== null) {
    out.push(m[1] ?? m[2] ?? "");
  }
  return out.filter(Boolean);
}

function categorise(name: string): Template["category"] {
  const n = name.toLowerCase();
  if (n.includes("scheme") || n.includes("sow")) return "scheme-of-work";
  if (n.includes("lesson") || n.includes("tmc")) return "lesson-plan";
  if (n.includes("ppt") || n.includes("deck") || n.includes("slide")) return "ppt-deck";
  if (n.includes("report")) return "report-card";
  if (n.includes("quiz") || n.includes("assessment") || n.includes("test")) return "assessment";
  return "other";
}

function formatFromExtension(name: string): Template["format"] {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "docx") return "docx";
  if (ext === "pptx") return "pptx";
  if (ext === "xlsx" || ext === "xls") return "xlsx";
  if (ext === "csv") return "csv";
  if (ext === "json") return "json";
  if (ext === "html" || ext === "htm") return "html";
  return "txt";
}

export async function detectTemplate(file: File): Promise<DetectedTemplate> {
  const format = formatFromExtension(file.name);
  const category = categorise(file.name);
  let fields: TemplateField[] = [];
  switch (format) {
    case "docx":
    case "pptx": {
      const zip = await JSZip.loadAsync(file);
      const xmlFiles = Object.keys(zip.files).filter((n) =>
        format === "docx" ? n === "word/document.xml" : n.startsWith("ppt/slides/slide"),
      );
      const placeholders: string[] = [];
      for (const name of xmlFiles) {
        const text = await zip.files[name].async("string");
        // strip XML tags so {{tokens}} that span runs can still match
        const stripped = text.replace(/<[^>]+>/g, "");
        placeholders.push(...extractPlaceholders(stripped));
      }
      fields = uniqueFields(placeholders);
      break;
    }
    case "xlsx": {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const firstSheet = wb.SheetNames[0];
      const sheet = wb.Sheets[firstSheet];
      const headerRow = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, range: 0 })[0] ?? [];
      fields = uniqueFields(headerRow.map((h) => String(h ?? "").trim()).filter(Boolean));
      break;
    }
    case "csv": {
      const text = await file.text();
      const firstLine = text.split(/\r?\n/)[0] ?? "";
      const headers = firstLine.split(",").map((h) => h.trim()).filter(Boolean);
      fields = uniqueFields(headers);
      break;
    }
    case "json": {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const collect = (obj: unknown, prefix = ""): string[] => {
          if (obj === null || typeof obj !== "object") return [];
          const keys: string[] = [];
          for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
            const path = prefix ? `${prefix}.${k}` : k;
            keys.push(path);
            if (v && typeof v === "object" && !Array.isArray(v)) {
              keys.push(...collect(v, path));
            }
          }
          return keys;
        };
        fields = uniqueFields(collect(parsed));
      } catch {
        fields = [];
      }
      break;
    }
    case "html":
    case "txt": {
      const text = await file.text();
      fields = uniqueFields(extractPlaceholders(text));
      break;
    }
  }
  return { format, category, fields };
}
