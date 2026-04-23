import { z } from "zod";
import {
  AGE_GROUPS,
  ATTENDANCE_MODES,
  ATTENDANCE_STATUSES,
  CHARACTER_STRENGTHS,
  QUESTION_TYPES,
  SESSION_LOCATIONS,
  TMC_PHASES,
} from "../constants";

export const idSchema = z.string().min(1);

export const courseSchema = z.object({
  id: idSchema,
  name: z.string(),
  level: z.string().default(""),
  awardingBody: z.string().default(""),
  notes: z.string().default(""),
  createdAt: z.number(),
});
export type Course = z.infer<typeof courseSchema>;

export const moduleSchema = z.object({
  id: idSchema,
  courseId: idSchema,
  name: z.string(),
  code: z.string().default(""),
  credits: z.number().nullable().default(null),
  notes: z.string().default(""),
  createdAt: z.number(),
});
export type Module = z.infer<typeof moduleSchema>;

export const moduleSpecSchema = z.object({
  id: idSchema,
  moduleId: idSchema,
  bodyHtml: z.string().default(""),
  sourceFileName: z.string().default(""),
  updatedAt: z.number(),
});
export type ModuleSpec = z.infer<typeof moduleSpecSchema>;

export const courseOutlineSchema = z.object({
  id: idSchema,
  courseId: idSchema,
  bodyHtml: z.string().default(""),
  sourceFileName: z.string().default(""),
  updatedAt: z.number(),
});
export type CourseOutline = z.infer<typeof courseOutlineSchema>;

export const groupSchema = z.object({
  id: idSchema,
  courseId: idSchema,
  name: z.string(),
  ageGroup: z.enum(AGE_GROUPS),
  numLearners: z.number().int().nonnegative().default(0),
  numLddEhcp: z.number().int().nonnegative().default(0),
  mode: z.enum(ATTENDANCE_MODES),
  startDate: z.string().nullable().default(null),
  finishDate: z.string().nullable().default(null),
  preparedBy: z.string().default(""),
  createdAt: z.number(),
});
export type Group = z.infer<typeof groupSchema>;

export const studentSchema = z.object({
  id: idSchema,
  groupId: idSchema,
  name: z.string(),
  dob: z.string().nullable().default(null),
  guardianContact: z.string().default(""),
  notes: z.string().default(""),
  createdAt: z.number(),
});
export type Student = z.infer<typeof studentSchema>;

export const syllabusPointSchema = z.object({
  id: idSchema,
  moduleId: idSchema,
  code: z.string().default(""),
  text: z.string(),
  used: z.boolean().default(false),
  order: z.number().int().default(0),
});
export type SyllabusPoint = z.infer<typeof syllabusPointSchema>;

export const sowRowSchema = z.object({
  id: idSchema,
  weekOrDate: z.string(),
  learningContent: z.string().default(""),
  differentiatedActivities: z.string().default(""),
  assessmentFeedback: z.string().default(""),
  location: z.string().default("classroom"),
  tools: z.array(z.string()).default([]),
  syllabusPointIds: z.array(idSchema).default([]),
});
export type SoWRow = z.infer<typeof sowRowSchema>;

export const schemeOfWorkSchema = z.object({
  id: idSchema,
  moduleId: idSchema,
  groupId: idSchema,
  embeddedEqualityDiversity: z.string().default(""),
  embeddedLiteracy: z.string().default(""),
  embeddedNumeracy: z.string().default(""),
  embeddedIct: z.string().default(""),
  embeddedCharacterStrengths: z.string().default(""),
  rows: z.array(sowRowSchema).default([]),
  updatedAt: z.number(),
});
export type SchemeOfWork = z.infer<typeof schemeOfWorkSchema>;

export const characterStrengthFlagsSchema = z.object(
  Object.fromEntries(
    CHARACTER_STRENGTHS.map((s) => [s, z.boolean().default(false)]),
  ) as Record<(typeof CHARACTER_STRENGTHS)[number], z.ZodDefault<z.ZodBoolean>>,
);
export type CharacterStrengthFlags = z.infer<typeof characterStrengthFlagsSchema>;

export const sessionSchema = z.object({
  id: idSchema,
  schemeOfWorkId: idSchema,
  sowRowId: idSchema.nullable().default(null),
  unit: z.string().default(""),
  week: z.string().default(""),
  date: z.string().nullable().default(null),
  durationMin: z.number().int().positive().default(30),
  location: z.enum(SESSION_LOCATIONS).default("classroom"),
  locationDetail: z.string().default(""),
  tools: z.array(z.string()).default([]),
  lessonObjectives: z.array(z.string()).default([]),
  phases: z
    .object(
      Object.fromEntries(
        TMC_PHASES.map((p) => [p, z.string().default("")]),
      ) as Record<(typeof TMC_PHASES)[number], z.ZodDefault<z.ZodString>>,
    )
    .default(() =>
      Object.fromEntries(TMC_PHASES.map((p) => [p, ""])) as Record<
        (typeof TMC_PHASES)[number],
        string
      >,
    ),
  embeddedMaths: z.string().default(""),
  embeddedEnglish: z.string().default(""),
  embeddedBritishValues: z.string().default(""),
  embeddedDifferentiation: z.string().default(""),
  embeddedIct: z.string().default(""),
  careerLinks: z.string().default(""),
  characterStrengths: characterStrengthFlagsSchema.default(() =>
    Object.fromEntries(
      CHARACTER_STRENGTHS.map((s) => [s, false]),
    ) as CharacterStrengthFlags,
  ),
  groupChecks: z
    .object({
      register: z.boolean().default(false),
      reportMissing: z.boolean().default(false),
      checkPpe: z.boolean().default(false),
    })
    .default({ register: false, reportMissing: false, checkPpe: false }),
  notes: z.string().default(""),
  updatedAt: z.number(),
});
export type Session = z.infer<typeof sessionSchema>;

export const questionSchema = z.object({
  id: idSchema,
  sessionId: idSchema.nullable().default(null),
  moduleId: idSchema,
  type: z.enum(QUESTION_TYPES),
  prompt: z.string(),
  options: z.array(z.string()).default([]),
  answer: z.string().default(""),
  explanation: z.string().default(""),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  tags: z.array(z.string()).default([]),
  createdAt: z.number(),
});
export type Question = z.infer<typeof questionSchema>;

export const assessmentSchema = z.object({
  id: idSchema,
  moduleId: idSchema,
  title: z.string(),
  description: z.string().default(""),
  questionIds: z.array(idSchema).default([]),
  generatedAt: z.number(),
});
export type Assessment = z.infer<typeof assessmentSchema>;

export const referenceItemSchema = z.object({
  id: idSchema,
  moduleId: idSchema.nullable().default(null),
  sourceType: z.enum(["url", "doi", "manual"]),
  raw: z.string(),
  harvardFormatted: z.string().default(""),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.number(),
});
export type ReferenceItem = z.infer<typeof referenceItemSchema>;

export const snippetSchema = z.object({
  id: idSchema,
  name: z.string(),
  type: z.enum(["learning-outcome", "activity", "free", "assessment", "objective"]).default("free"),
  body: z.string(),
  tags: z.array(z.string()).default([]),
  moduleId: idSchema.nullable().default(null),
  createdAt: z.number(),
});
export type Snippet = z.infer<typeof snippetSchema>;

export const templateFieldSchema = z.object({
  key: z.string(),
  label: z.string().default(""),
  mappedTo: z.string().nullable().default(null),
  defaultValue: z.string().default(""),
});
export type TemplateField = z.infer<typeof templateFieldSchema>;

export const templateSchema = z.object({
  id: idSchema,
  name: z.string(),
  format: z.enum(["docx", "pptx", "xlsx", "csv", "json", "html", "txt"]),
  category: z
    .enum(["scheme-of-work", "lesson-plan", "ppt-deck", "report-card", "assessment", "other"])
    .default("other"),
  sourceFileName: z.string().default(""),
  storedBlobId: idSchema,
  detectedFields: z.array(templateFieldSchema).default([]),
  notes: z.string().default(""),
  createdAt: z.number(),
});
export type Template = z.infer<typeof templateSchema>;

export const blobRecordSchema = z.object({
  id: idSchema,
  mime: z.string(),
  data: z.unknown(), // Blob in IDB
  createdAt: z.number(),
});
export type BlobRecord = z.infer<typeof blobRecordSchema>;

export const scheduleSlotSchema = z.object({
  id: idSchema,
  groupId: idSchema,
  moduleId: idSchema.nullable().default(null),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string().default(""),
  notes: z.string().default(""),
});
export type ScheduleSlot = z.infer<typeof scheduleSlotSchema>;

export const gradeSchema = z.object({
  id: idSchema,
  studentId: idSchema,
  assessmentId: idSchema.nullable().default(null),
  moduleId: idSchema,
  title: z.string(),
  marks: z.number().nullable().default(null),
  maxMarks: z.number().nullable().default(null),
  letter: z.string().default(""),
  feedback: z.string().default(""),
  recordedAt: z.number(),
});
export type Grade = z.infer<typeof gradeSchema>;

export const attendanceEntrySchema = z.object({
  studentId: idSchema,
  status: z.enum(ATTENDANCE_STATUSES),
  note: z.string().default(""),
});
export type AttendanceEntry = z.infer<typeof attendanceEntrySchema>;

export const attendanceRecordSchema = z.object({
  id: idSchema,
  groupId: idSchema,
  sessionId: idSchema.nullable().default(null),
  date: z.string(),
  entries: z.array(attendanceEntrySchema).default([]),
  recordedAt: z.number(),
});
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;

export const settingsSchema = z.object({
  id: z.literal("settings"),
  preferredModel: z.string().default("claude-sonnet-4-6"),
  preferredFastModel: z.string().default("claude-haiku-4-5-20251001"),
  encryptedAnthropicKey: z.string().default(""), // base64 ciphertext or empty
  keySalt: z.string().default(""),
  keyIv: z.string().default(""),
  schoolName: z.string().default(""),
  defaultPreparedBy: z.string().default(""),
  updatedAt: z.number(),
});
export type Settings = z.infer<typeof settingsSchema>;

export type EntityName =
  | "courses"
  | "modules"
  | "moduleSpecs"
  | "courseOutlines"
  | "groups"
  | "students"
  | "syllabusPoints"
  | "schemes"
  | "sessions"
  | "questions"
  | "assessments"
  | "references"
  | "snippets"
  | "templates"
  | "blobs"
  | "scheduleSlots"
  | "grades"
  | "attendance"
  | "settings";
