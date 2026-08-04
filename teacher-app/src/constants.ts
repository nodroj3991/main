export const TMC_MARKERS = {
  C: { label: "Connect", description: "Hook / link to prior learning" },
  R: { label: "Reflection", description: "Pause and reflect on the learning" },
  T: { label: "Teacher / tutor led", description: "Tutor-driven content" },
  L: { label: "Learner-led", description: "Activity led by learners" },
  "?": { label: "Direct questioning", description: "Targeted question to a learner" },
} as const;

export type TmcMarker = keyof typeof TMC_MARKERS;

export const TMC_PHASES = [
  "connect",
  "share",
  "apply",
  "recallReview",
  "stretchChallenge",
  "conclusion",
] as const;
export type TmcPhase = (typeof TMC_PHASES)[number];

export const TMC_PHASE_LABELS: Record<TmcPhase, string> = {
  connect: "Connect",
  share: "Share",
  apply: "Apply",
  recallReview: "Recall & Review",
  stretchChallenge: "Stretch & Challenge",
  conclusion: "Conclusion (Assessment & Feedback)",
};

export const TMC_PHASE_COLORS: Record<TmcPhase, string> = {
  connect: "#dfa07c",
  share: "#94c45a",
  apply: "#06b6d4",
  recallReview: "#f4d03f",
  stretchChallenge: "#a78bfa",
  conclusion: "#ef4444",
};

export const BRITISH_VALUES = [
  "democracy",
  "rule of law",
  "individual liberty",
  "mutual respect",
  "tolerance",
] as const;

export const CHARACTER_STRENGTHS = [
  "resilience",
  "ownership",
  "optimism",
  "ambition",
  "respect",
  "selfControl",
  "confidence",
  "curiosity",
] as const;
export type CharacterStrength = (typeof CHARACTER_STRENGTHS)[number];

export const CHARACTER_STRENGTH_LABELS: Record<CharacterStrength, string> = {
  resilience: "Resilience",
  ownership: "Ownership",
  optimism: "Optimism",
  ambition: "Ambition",
  respect: "Respect",
  selfControl: "Self-Control",
  confidence: "Confidence",
  curiosity: "Curiosity",
};

export const ACTIVITY_KEYWORDS = [
  "multimedia",
  "debate",
  "poster",
  "report",
  "feedback",
  "quiz",
  "discussion",
  "case study",
  "group work",
  "presentation",
] as const;

export const AGE_GROUPS = ["14-16", "16-18", "19+", "Mixed"] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

export const ATTENDANCE_MODES = ["Full time", "Part time"] as const;
export type AttendanceMode = (typeof ATTENDANCE_MODES)[number];

export const SESSION_LOCATIONS = [
  "classroom",
  "fieldwork-trip",
  "external",
  "online",
  "lab",
  "workshop",
] as const;

export const QUESTION_TYPES = ["mcq", "match", "short", "long", "true-false"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "authorised",
  "unauthorised",
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";
export const FAST_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
