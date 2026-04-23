import { nanoid } from "nanoid";
import { db } from "./db";

export async function ensureSettings(): Promise<void> {
  const existing = await db.settings.get("settings");
  if (!existing) {
    await db.settings.put({
      id: "settings",
      preferredModel: "claude-sonnet-4-6",
      preferredFastModel: "claude-haiku-4-5-20251001",
      encryptedAnthropicKey: "",
      keySalt: "",
      keyIv: "",
      schoolName: "",
      defaultPreparedBy: "",
      updatedAt: Date.now(),
    });
  }
}

export async function seedDemoIfEmpty(): Promise<void> {
  const courseCount = await db.courses.count();
  if (courseCount > 0) return;

  const courseId = nanoid(8);
  const moduleId = nanoid(8);
  const groupId = nanoid(8);
  const now = Date.now();

  await db.courses.put({
    id: courseId,
    name: "L3 Adv Tech Ext Dip in Animal Management",
    level: "Level 3",
    awardingBody: "City & Guilds",
    notes: "Sample course populated on first run. Edit or delete freely.",
    createdAt: now,
  });

  await db.modules.put({
    id: moduleId,
    courseId,
    name: "Animal Welfare",
    code: "L3-AM-AW",
    credits: 10,
    notes: "",
    createdAt: now,
  });

  await db.groups.put({
    id: groupId,
    courseId,
    name: "Year 1 cohort",
    ageGroup: "16-18",
    numLearners: 18,
    numLddEhcp: 3,
    mode: "Full time",
    startDate: null,
    finishDate: null,
    preparedBy: "",
    createdAt: now,
  });

  const points = [
    "AC1.1 Explain the meaning of animal welfare",
    "AC1.2 Summarise UK animal welfare legislation",
    "AC1.3 Describe the Five Freedoms",
    "AC2.1 Identify common signs of poor welfare",
    "AC2.2 Evaluate housing requirements for different species",
    "AC3.1 Demonstrate handling techniques for small mammals",
    "AC3.2 Demonstrate handling techniques for birds",
    "AC4.1 Plan an enrichment activity",
    "AC4.2 Justify the choice of enrichment",
    "AC5.1 Reflect on practical handling sessions",
  ];
  await db.syllabusPoints.bulkPut(
    points.map((text, i) => ({
      id: nanoid(8),
      moduleId,
      code: text.slice(0, text.indexOf(" ")),
      text,
      used: false,
      order: i,
    })),
  );
}
