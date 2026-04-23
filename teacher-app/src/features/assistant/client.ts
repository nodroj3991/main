import Anthropic from "@anthropic-ai/sdk";
import { db } from "../../db/db";
import { getCachedKey } from "./secureKey";

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export async function buildSystemPrompt(): Promise<string> {
  const settings = await db.settings.get("settings");
  const courses = await db.courses.toArray();
  const groups = await db.groups.toArray();
  const modules = await db.modules.toArray();
  const lines: string[] = [];
  lines.push(
    "You are an assistant for UK Further Education / vocational teachers using",
    "the TOPS planning app. Default to UK English. Be concise, structured, and",
    "ground suggestions in the teacher's actual courses, modules and groups.",
    "When asked to draft a lesson, use the TMC structure: Connect, Share,",
    "Apply, Recall & Review, Stretch & Challenge, Conclusion. Reference embedded",
    "skills (Maths, English, ICT, British Values, Differentiation, Character",
    "Strengths) where relevant. Use the [C] [R] [T] [L] [?] markers in line.",
  );
  if (settings?.schoolName) lines.push(`The teacher works at: ${settings.schoolName}.`);
  if (courses.length) {
    lines.push("\nCourses:");
    for (const c of courses) lines.push(`- ${c.name} (${c.level || "level n/a"})`);
  }
  if (modules.length) {
    lines.push("\nModules:");
    for (const m of modules) lines.push(`- ${m.code ? m.code + ": " : ""}${m.name}`);
  }
  if (groups.length) {
    lines.push("\nGroups:");
    for (const g of groups) lines.push(`- ${g.name} (${g.ageGroup}, ${g.numLearners} learners, ${g.mode})`);
  }
  return lines.join("\n");
}

export async function chat(
  history: ChatTurn[],
  options?: { model?: string; signal?: AbortSignal },
): Promise<string> {
  const apiKey = getCachedKey();
  if (!apiKey) {
    throw new Error("No Anthropic API key unlocked. Open Settings to add or unlock it.");
  }
  const settings = await db.settings.get("settings");
  const model = options?.model ?? settings?.preferredModel ?? "claude-sonnet-4-6";
  const system = await buildSystemPrompt();

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const res = await client.messages.create(
    {
      model,
      max_tokens: 2000,
      system: [
        {
          type: "text",
          text: system,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: history.map((t) => ({ role: t.role, content: t.content })),
    },
    { signal: options?.signal },
  );
  const textBlock = res.content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
}
