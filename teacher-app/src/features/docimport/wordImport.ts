import mammoth from "mammoth";

export type WordImportResult = {
  html: string;
  text: string;
  messages: string[];
};

export async function importWord(file: File): Promise<WordImportResult> {
  const buffer = await file.arrayBuffer();
  const { value: html, messages } = await mammoth.convertToHtml({ arrayBuffer: buffer });
  const textResult = await mammoth.extractRawText({ arrayBuffer: buffer });
  return {
    html,
    text: textResult.value,
    messages: messages.map((m) => `${m.type}: ${m.message}`),
  };
}

// Pull each top-level heading (h1/h2) from an HTML fragment. Useful for
// converting a course outline into slide titles.
export function headingsFromHtml(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const hs = Array.from(doc.querySelectorAll("h1, h2"));
  return hs.map((h) => (h.textContent ?? "").trim()).filter(Boolean);
}
