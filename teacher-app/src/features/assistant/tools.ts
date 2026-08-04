import Anthropic from "@anthropic-ai/sdk";
import { db } from "../../db/db";
import { getCachedKey } from "./secureKey";
import type { Session } from "../../db/schema";
import { buildSystemPrompt } from "./client";

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

type Json = Record<string, unknown>;

async function callJson<T>(prompt: string, schemaHint: string, fast = false): Promise<T> {
  const c = client();
  const system = await buildSystemPrompt();
  const res = await c.messages.create({
    model: await modelId(fast),
    max_tokens: 3000,
    system: [
      { type: "text", text: system, cache_control: { type: "ephemeral" } },
      {
        type: "text",
        text:
          "You return ONLY a single JSON object that matches the schema below. " +
          "No prose, no markdown fences, no commentary.\n\nSchema: " +
          schemaHint,
      },
    ],
    messages: [{ role: "user", content: prompt }],
  });
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("Empty response.");
  // Strip accidental ```json fences.
  const cleaned = block.text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Last-ditch: extract the first {...} block.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("Could not parse JSON from assistant.");
  }
}

async function callText(prompt: string, fast = false): Promise<string> {
  const c = client();
  const system = await buildSystemPrompt();
  const res = await c.messages.create({
    model: await modelId(fast),
    max_tokens: 2500,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: prompt }],
  });
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

// ── Tools ──────────────────────────────────────────────────────────────

export type DraftedSession = Pick<
  Session,
  | "unit"
  | "week"
  | "lessonObjectives"
  | "phases"
  | "embeddedMaths"
  | "embeddedEnglish"
  | "embeddedBritishValues"
  | "embeddedDifferentiation"
  | "embeddedIct"
  | "careerLinks"
  | "characterStrengths"
  | "notes"
>;

export async function draftSession(input: {
  topic: string;
  durationMin: number;
  moduleName?: string;
  groupName?: string;
  ageGroup?: string;
}): Promise<DraftedSession> {
  const prompt = `Draft a ${input.durationMin}-minute TMC-structured lesson plan on the topic: "${input.topic}".
Module: ${input.moduleName ?? "—"}. Group: ${input.groupName ?? "—"}. Age group: ${input.ageGroup ?? "—"}.

Use TMC markers ([C] [R] [T] [L] [?]) inline where useful. Include concrete activities in each phase, not generic filler.`;
  const schema = `{
  "unit": string,
  "week": string,
  "lessonObjectives": string[3-5],
  "phases": {
    "connect": string,
    "share": string,
    "apply": string,
    "recallReview": string,
    "stretchChallenge": string,
    "conclusion": string
  },
  "embeddedMaths": string,
  "embeddedEnglish": string,
  "embeddedBritishValues": string,
  "embeddedDifferentiation": string,
  "embeddedIct": string,
  "careerLinks": string,
  "characterStrengths": {
    "resilience": boolean, "ownership": boolean, "optimism": boolean,
    "ambition": boolean, "respect": boolean, "selfControl": boolean,
    "confidence": boolean, "curiosity": boolean
  },
  "notes": string
}`;
  return callJson<DraftedSession>(prompt, schema);
}

export async function suggestEmbeddedHooks(input: {
  topic: string;
  context?: string;
}): Promise<{
  maths: string;
  english: string;
  britishValues: string;
  differentiation: string;
  ict: string;
  career: string;
  characterStrengths: string[];
}> {
  const prompt = `Topic: "${input.topic}"${input.context ? `. Context: ${input.context}` : ""}.
Suggest one or two concrete teaching hooks for each embedded skill area that naturally fit this topic.`;
  const schema = `{
  "maths": string,
  "english": string,
  "britishValues": string,
  "differentiation": string,
  "ict": string,
  "career": string,
  "characterStrengths": string[]
}`;
  return callJson(prompt, schema, true);
}

export type GeneratedQuestion = {
  type: "mcq" | "match" | "short" | "long" | "true-false";
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
};

export async function generateQuiz(input: {
  moduleName: string;
  count: number;
  topic?: string;
  sourceText?: string;
}): Promise<GeneratedQuestion[]> {
  const prompt = `Generate ${input.count} formative-assessment questions for module "${input.moduleName}"${input.topic ? ` on the topic "${input.topic}"` : ""}.
${input.sourceText ? `Use this source material:\n---\n${input.sourceText.slice(0, 5000)}\n---\n` : ""}
Mix question types (at least some MCQ and at least one short-answer). Provide options where relevant and a brief marking-key answer for every question.`;
  const schema = `{ "questions": [{
    "type": "mcq"|"match"|"short"|"long"|"true-false",
    "prompt": string,
    "options": string[],
    "answer": string,
    "explanation": string,
    "difficulty": "easy"|"medium"|"hard"
  }] }`;
  const res = await callJson<{ questions: GeneratedQuestion[] }>(prompt, schema);
  return res.questions ?? [];
}

export async function reviewSession(input: {
  session: Session;
  moduleName?: string;
  framework?: "Bloom" | "UDL" | "Ofsted";
}): Promise<string> {
  const serialised = JSON.stringify(
    {
      unit: input.session.unit,
      week: input.session.week,
      objectives: input.session.lessonObjectives,
      phases: input.session.phases,
      embedded: {
        maths: input.session.embeddedMaths,
        english: input.session.embeddedEnglish,
        britishValues: input.session.embeddedBritishValues,
        differentiation: input.session.embeddedDifferentiation,
        ict: input.session.embeddedIct,
        career: input.session.careerLinks,
      },
      characterStrengths: input.session.characterStrengths,
    },
    null,
    2,
  );
  const prompt = `Please critique the following TMC session plan against the ${input.framework ?? "Ofsted"} framework. Be specific about what works, what's missing, and what to strengthen. Use bullet points.

Module: ${input.moduleName ?? "—"}

${serialised}`;
  return callText(prompt);
}

export type AssistantToolName = keyof typeof TOOL_REGISTRY;
export const TOOL_REGISTRY = {
  draftSession,
  suggestEmbeddedHooks,
  generateQuiz,
  reviewSession,
};
// Hint for bundlers & TS completeness
void (0 as unknown as Json);
