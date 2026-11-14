// Claude calls for the out-of-hours tutor: the live coaching chat, the
// end-of-session summary, and the two teacher reports.

import Anthropic from "@anthropic-ai/sdk";
import { db } from "../../db/db";
import type { TutorSession, TutorTurn } from "../../db/schema";
import { getCachedKey } from "../assistant/secureKey";

function client(): Anthropic {
  const apiKey = getCachedKey();
  if (!apiKey) throw new Error("No Anthropic API key unlocked. Open Settings.");
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

async function modelId(fast = false): Promise<string> {
  const settings = await db.settings.get("settings");
  return fast
    ? settings?.preferredFastModel ?? "claude-haiku-4-5-20251001"
    : settings?.preferredModel ?? "claude-sonnet-4-6";
}

export async function tutorReply(
  systemPrompt: string,
  turns: TutorTurn[],
  signal?: AbortSignal,
): Promise<string> {
  const c = client();
  const res = await c.messages.create(
    {
      model: await modelId(),
      max_tokens: 700,
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages: turns.map((t) => ({
        role: t.role === "student" ? ("user" as const) : ("assistant" as const),
        content: t.content,
      })),
    },
    { signal },
  );
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

function transcriptText(s: TutorSession, maxChars = 9000): string {
  const text = s.turns
    .map((t) => `${t.role === "student" ? "STUDENT" : "TUTOR"}: ${t.content}`)
    .join("\n");
  return text.length <= maxChars ? text : text.slice(-maxChars);
}

async function callJson<T>(prompt: string, schemaHint: string, fast = false): Promise<T> {
  const c = client();
  const res = await c.messages.create({
    model: await modelId(fast),
    max_tokens: 2500,
    system:
      "You return ONLY a single JSON object matching the schema. No prose, no markdown fences.\nSchema: " +
      schemaHint,
    messages: [{ role: "user", content: prompt }],
  });
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("Empty response.");
  const cleaned = block.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("Could not parse JSON from assistant.");
  }
}

async function callText(prompt: string): Promise<string> {
  const c = client();
  const res = await c.messages.create({
    model: await modelId(),
    max_tokens: 3500,
    messages: [{ role: "user", content: prompt }],
  });
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

// Run when a tutor session ends: a compact structured digest stored on the
// session record so reports don't need to re-read every transcript.
export async function summariseTutorSession(session: TutorSession): Promise<{
  summary: string;
  struggles: string[];
  breakthroughs: string[];
}> {
  const prompt = `This is a transcript of a Socratic tutoring chat (the tutor coaches, never answers). Student: ${session.studentName}. Topic: ${session.topic || "unspecified"}.

${transcriptText(session)}

Digest it for the teacher.`;
  return callJson(
    prompt,
    `{ "summary": string (2-3 sentences on what was worked on and how it went),
  "struggles": string[] (specific concepts or steps the student got stuck on),
  "breakthroughs": string[] (things the student worked out for themselves) }`,
    true,
  );
}

export async function generateStudentReport(input: {
  studentName: string;
  sessions: TutorSession[];
  moduleName?: string;
}): Promise<string> {
  const sessionBlocks = input.sessions
    .map(
      (s, i) =>
        `--- Session ${i + 1} (${new Date(s.startedAt).toLocaleDateString("en-GB")}, topic: ${s.topic || "unspecified"}) ---
${s.summary ? `Digest: ${s.summary}\nStruggles: ${s.struggles.join("; ") || "—"}\nBreakthroughs: ${s.breakthroughs.join("; ") || "—"}` : transcriptText(s, 4000)}`,
    )
    .join("\n\n");

  const prompt = `You are writing a progress report for a teacher about one student's out-of-hours tutoring sessions${input.moduleName ? ` on the module "${input.moduleName}"` : ""}. The tutor coaches Socratically (never gives answers), so the transcripts show the student's own thinking.

Student: ${input.studentName}
Number of sessions: ${input.sessions.length}

${sessionBlocks}

Write the report in UK English with these sections, using markdown headings:
# Progress report: ${input.studentName}
## What they worked on
## How their understanding developed (evidence from their own words where possible)
## Recurring sticking points
## Strengths shown (persistence, self-correction, questioning)
## Suggested next steps for this student
Keep it honest and specific — this is for the teacher, not the parent.`;
  return callText(prompt);
}

export async function generateClassReport(input: {
  sessions: TutorSession[];
  moduleName?: string;
  schemeOutline?: string;
}): Promise<string> {
  const byStudent = new Map<string, TutorSession[]>();
  for (const s of input.sessions) {
    byStudent.set(s.studentName, [...(byStudent.get(s.studentName) ?? []), s]);
  }
  const blocks = Array.from(byStudent.entries())
    .map(
      ([name, ss]) =>
        `== ${name} (${ss.length} session${ss.length === 1 ? "" : "s"}) ==\n` +
        ss
          .map(
            (s) =>
              `topic: ${s.topic || "unspecified"} | struggles: ${s.struggles.join("; ") || "—"} | breakthroughs: ${s.breakthroughs.join("; ") || "—"}${s.summary ? ` | digest: ${s.summary}` : ""}`,
          )
          .join("\n"),
    )
    .join("\n\n");

  const prompt = `You are writing a teaching-improvement report for a teacher, based on every out-of-hours tutoring session their students have had${input.moduleName ? ` on the module "${input.moduleName}"` : ""}. The point is NOT to grade students — it is to find patterns the teacher can act on.

${input.schemeOutline ? `Current scheme of work outline:\n${input.schemeOutline}\n` : ""}
Tutoring data (${input.sessions.length} sessions across ${byStudent.size} students):

${blocks}

Write the report in UK English with these sections, using markdown headings:
# Class teaching report
## What students are coming to the tutor about (ranked by frequency)
## Areas of the scheme of work to restructure (name the week/topic, say what the pattern suggests, propose the change)
## How to improve collective delivery (concrete classroom practices addressing the patterns — pacing, modelling, checking for understanding, resources)
## What's landing well (topics with breakthroughs and few repeat visits)
Be concrete: every recommendation should trace back to something in the data.`;
  return callText(prompt);
}
