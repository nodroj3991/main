import JSZip from "jszip";
import * as XLSX from "xlsx";
import type { Template } from "../../db/schema";

export type FillValues = Record<string, string>;

const TOKEN_SOURCE =
  "\\{\\{\\s*([a-zA-Z0-9_.]+)\\s*\\}\\}|\\$\\{\\s*([a-zA-Z0-9_.]+)\\s*\\}";

function applyTokens(text: string, values: FillValues): string {
  return text.replace(new RegExp(TOKEN_SOURCE, "g"), (match, a, b) => {
    const key = (a ?? b) as string;
    return key in values ? String(values[key]) : match;
  });
}

// XML-aware replacement: only rewrites text inside <w:t> / <a:t> nodes, so the
// rest of the document's structure is preserved. Tokens that span multiple
// text runs are not matched — templates should paste the token as plain text.
function replaceInXmlText(xml: string, values: FillValues, tagNames: string[]): string {
  let out = xml;
  for (const tag of tagNames) {
    const textRe = new RegExp(
      `(<${tag}[^>]*>)([\\s\\S]*?)(</${tag}>)`,
      "g",
    );
    out = out.replace(textRe, (_m, open: string, inner: string, close: string) => {
      return open + applyTokens(inner, values) + close;
    });
  }
  return out;
}

async function fillDocxPptx(
  file: File,
  values: FillValues,
  format: "docx" | "pptx",
): Promise<Blob> {
  const zip = await JSZip.loadAsync(file);
  if (format === "docx") {
    const docXml = await zip.files["word/document.xml"]?.async("string");
    if (docXml) {
      zip.file("word/document.xml", replaceInXmlText(docXml, values, ["w:t"]));
    }
    // Headers / footers sometimes hold placeholders too.
    for (const path of Object.keys(zip.files)) {
      if (/^word\/(header|footer)\d*\.xml$/.test(path)) {
        const xml = await zip.files[path].async("string");
        zip.file(path, replaceInXmlText(xml, values, ["w:t"]));
      }
    }
  } else {
    for (const path of Object.keys(zip.files)) {
      if (/^ppt\/slides\/slide\d+\.xml$/.test(path)) {
        const xml = await zip.files[path].async("string");
        zip.file(path, replaceInXmlText(xml, values, ["a:t"]));
      }
    }
  }
  return zip.generateAsync({
    type: "blob",
    mimeType:
      format === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
}

async function fillXlsx(file: File, values: FillValues): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = sheet[addr];
        if (!cell) continue;
        if (typeof cell.v === "string") {
          const next = applyTokens(cell.v, values);
          if (next !== cell.v) {
            cell.v = next;
            cell.w = next;
            if (cell.t !== "s") cell.t = "s";
          }
        }
      }
    }
  }
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

async function fillCsv(file: File, values: FillValues): Promise<Blob> {
  const text = await file.text();
  return new Blob([applyTokens(text, values)], { type: "text/csv" });
}

async function fillTxtHtml(
  file: File,
  values: FillValues,
  mime: string,
): Promise<Blob> {
  const text = await file.text();
  return new Blob([applyTokens(text, values)], { type: mime });
}

async function fillJson(file: File, values: FillValues): Promise<Blob> {
  const text = await file.text();
  const filled = applyTokens(text, values);
  try {
    // Pretty-print when still valid JSON.
    return new Blob([JSON.stringify(JSON.parse(filled), null, 2)], {
      type: "application/json",
    });
  } catch {
    return new Blob([filled], { type: "application/json" });
  }
}

export async function fillTemplate(
  file: File,
  template: Template,
  values: FillValues,
): Promise<Blob> {
  switch (template.format) {
    case "docx":
      return fillDocxPptx(file, values, "docx");
    case "pptx":
      return fillDocxPptx(file, values, "pptx");
    case "xlsx":
      return fillXlsx(file, values);
    case "csv":
      return fillCsv(file, values);
    case "json":
      return fillJson(file, values);
    case "html":
      return fillTxtHtml(file, values, "text/html");
    case "txt":
    default:
      return fillTxtHtml(file, values, "text/plain");
  }
}

export function suggestValuesFromSession(session: {
  unit: string;
  week: string;
  date: string | null;
  durationMin: number;
  location: string;
  locationDetail: string;
  tools: string[];
  lessonObjectives: string[];
  phases: Record<string, string>;
  embeddedMaths: string;
  embeddedEnglish: string;
  embeddedBritishValues: string;
  embeddedDifferentiation: string;
  embeddedIct: string;
  careerLinks: string;
  notes: string;
}): FillValues {
  return {
    unit: session.unit,
    week: session.week,
    date: session.date ?? "",
    duration: String(session.durationMin),
    location: [session.location, session.locationDetail].filter(Boolean).join(" — "),
    tools: session.tools.join(", "),
    lesson_objectives: session.lessonObjectives.map((o) => `• ${o}`).join("\n"),
    objectives: session.lessonObjectives.map((o) => `• ${o}`).join("\n"),
    connect: session.phases.connect ?? "",
    share: session.phases.share ?? "",
    apply: session.phases.apply ?? "",
    recall_review: session.phases.recallReview ?? "",
    stretch_challenge: session.phases.stretchChallenge ?? "",
    conclusion: session.phases.conclusion ?? "",
    maths: session.embeddedMaths,
    english: session.embeddedEnglish,
    british_values: session.embeddedBritishValues,
    differentiation: session.embeddedDifferentiation,
    ict: session.embeddedIct,
    career: session.careerLinks,
    notes: session.notes,
  };
}

export function suggestValuesFromScheme(scheme: {
  embeddedEqualityDiversity: string;
  embeddedLiteracy: string;
  embeddedNumeracy: string;
  embeddedIct: string;
  embeddedCharacterStrengths: string;
  rows: { weekOrDate: string; learningContent: string }[];
}): FillValues {
  return {
    equality_diversity: scheme.embeddedEqualityDiversity,
    literacy: scheme.embeddedLiteracy,
    numeracy: scheme.embeddedNumeracy,
    ict: scheme.embeddedIct,
    character_strengths: scheme.embeddedCharacterStrengths,
    weeks: scheme.rows.map((r) => `${r.weekOrDate}: ${r.learningContent}`).join("\n"),
  };
}

export function suggestValuesFromGroup(group: {
  name: string;
  ageGroup: string;
  numLearners: number;
  numLddEhcp: number;
  mode: string;
  preparedBy: string;
  startDate: string | null;
  finishDate: string | null;
}): FillValues {
  return {
    group_name: group.name,
    age_group: group.ageGroup,
    number_of_learners: String(group.numLearners),
    ldd_ehcp: String(group.numLddEhcp),
    mode: group.mode,
    prepared_by: group.preparedBy,
    start_date: group.startDate ?? "",
    finish_date: group.finishDate ?? "",
  };
}

export function suggestValuesFromStudent(student: {
  name: string;
  dob: string | null;
  guardianContact: string;
}): FillValues {
  return {
    student_name: student.name,
    name: student.name,
    dob: student.dob ?? "",
    guardian_contact: student.guardianContact,
  };
}
