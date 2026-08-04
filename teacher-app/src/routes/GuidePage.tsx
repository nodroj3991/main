import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { CheckCircle as DoneIcon, RadioButtonUnchecked as TodoIcon } from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { db } from "../db/db";

type Step = {
  title: string;
  body: string;
  to: string;
  toLabel: string;
  done: boolean | null; // null = can't be auto-detected
  optional?: boolean;
};

export function GuidePage(): React.ReactElement {
  const counts = useLiveQuery(async () => {
    const [courses, modules, groups, students, points, schemes, sessions, templates, settings] =
      await Promise.all([
        db.courses.count(),
        db.modules.count(),
        db.groups.count(),
        db.students.count(),
        db.syllabusPoints.count(),
        db.schemes.count(),
        db.sessions.count(),
        db.templates.count(),
        db.settings.get("settings"),
      ]);
    const sessionsWithContent = await db.sessions
      .filter((s) => Object.values(s.phases).some((p) => p.trim().length > 0))
      .count();
    const schemesWithRows = await db.schemes.filter((s) => s.rows.length > 0).count();
    return {
      courses,
      modules,
      groups,
      students,
      points,
      schemes: schemesWithRows,
      schemesAny: schemes,
      sessions,
      sessionsWithContent,
      templates,
      hasKey: !!settings?.encryptedAnthropicKey,
    };
  }, []);

  if (!counts) return <Typography>Loading…</Typography>;

  const steps: Step[] = [
    {
      title: "Create your course",
      body: "A course is the qualification you teach, e.g. \"L3 Diploma in Animal Management\". Click New course, give it a name and level, and save.",
      to: "/courses",
      toLabel: "Open Courses & Modules",
      done: counts.courses > 0,
    },
    {
      title: "Add a module",
      body: "Click your course in the left-hand table so it highlights, then click New module on the right. A module is one unit of the course, e.g. \"Animal Welfare\".",
      to: "/courses",
      toLabel: "Open Courses & Modules",
      done: counts.modules > 0,
    },
    {
      title: "Create a group",
      body: "A group is the class you teach — its age range, how many learners, full or part time. Click New group and fill in the boxes.",
      to: "/groups",
      toLabel: "Open Groups & Roster",
      done: counts.groups > 0,
    },
    {
      title: "Add your students",
      body: "Click the group so it highlights, then Add student for each learner. You only need names to start — this powers the register and gradebook later.",
      to: "/groups",
      toLabel: "Open Groups & Roster",
      done: counts.students > 0,
      optional: true,
    },
    {
      title: "Type or paste your syllabus points",
      body: "Pick your module from the dropdown, then paste your syllabus into the big box — one point per line — and click Add. Codes like AC1.1 at the start of a line are picked up automatically.",
      to: "/syllabus",
      toLabel: "Open Syllabus",
      done: counts.points > 0,
    },
    {
      title: "Build your Scheme of Work",
      body: "Click New scheme, pick your module and group, then open it. Click Add week for each teaching week, type what you'll cover, and click syllabus points on the right to attach them — they grey out as you use them. Click Save when done.",
      to: "/sow",
      toLabel: "Open Schemes of Work",
      done: counts.schemes > 0,
    },
    {
      title: "Generate your sessions",
      body: "Find your scheme in the top table and click Generate. One lesson-plan stub is created for every week of the scheme — no typing needed.",
      to: "/sessions",
      toLabel: "Open Sessions",
      done: counts.sessions > 0,
    },
    {
      title: "Write a lesson plan",
      body: "Click the pencil on any session. Fill in the six coloured TMC boxes (Connect, Share, Apply…) — or click Draft with AI, describe the topic in a sentence, and let it fill everything for you to edit. Click Save.",
      to: "/sessions",
      toLabel: "Open Sessions",
      done: counts.sessionsWithContent > 0,
    },
    {
      title: "Turn a session into PowerPoint slides",
      body: "Click Generate next to any session. A .pptx file downloads with a title slide plus one colour-coded slide per lesson phase. Open it in PowerPoint or Google Slides and add your pictures.",
      to: "/decks",
      toLabel: "Open PPT Decks",
      done: null,
    },
    {
      title: "Upload your school's templates",
      body: "Upload your Scheme of Work or lesson-plan template (.docx, .xlsx, etc.). Anywhere the template should show your data, the file must contain a tag like {{group_name}} or {{week}}. Then click the wand to fill it from a real session or group and download the finished document.",
      to: "/templates",
      toLabel: "Open Templates",
      done: counts.templates > 0,
      optional: true,
    },
    {
      title: "Switch on the AI assistant",
      body: "Paste your Anthropic API key (starts sk-ant-…) and choose a passphrase. This unlocks Draft with AI, Review, and Generate questions. Skip this if you don't have a key — everything else works without it.",
      to: "/settings",
      toLabel: "Open Settings",
      done: counts.hasKey,
      optional: true,
    },
    {
      title: "Back up your work",
      body: "Everything lives in this browser only. Click Export everything to download a single file you can keep safe or import on another computer. Do this at the end of each planning session.",
      to: "/data",
      toLabel: "Open Import / Export",
      done: null,
    },
  ];

  const requiredDone = steps.filter((s) => !s.optional && s.done === true).length;
  const requiredTotal = steps.filter((s) => !s.optional && s.done !== null).length;

  return (
    <Box sx={{ maxWidth: 860 }}>
      <Typography variant="h1" gutterBottom>
        Step-by-step Guide
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 1 }}>
        Work down this list in order. Each step ticks itself as soon as the app
        sees you've done it — nothing here needs any technical knowledge.
      </Typography>
      <Typography sx={{ mb: 3, fontWeight: 600 }}>
        Progress: {requiredDone} of {requiredTotal} core steps done
      </Typography>

      <Stack spacing={2}>
        {steps.map((s, i) => (
          <Paper
            key={s.title}
            variant="outlined"
            sx={{
              p: 2,
              borderLeft: `4px solid ${s.done ? "#2da44e" : "#1f6feb"}`,
              opacity: s.done ? 0.75 : 1,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="flex-start">
              {s.done ? (
                <DoneIcon sx={{ color: "#2da44e", mt: 0.3 }} />
              ) : (
                <TodoIcon sx={{ color: "#6a737d", mt: 0.3 }} />
              )}
              <Box flex={1}>
                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                  <Typography sx={{ fontWeight: 600 }}>
                    {i + 1}. {s.title}
                  </Typography>
                  {s.optional && <Chip size="small" label="optional" variant="outlined" />}
                  {s.done === null && (
                    <Chip size="small" label="manual step" variant="outlined" color="info" />
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {s.body}
                </Typography>
                <Button component={Link} to={s.to} size="small" variant="outlined">
                  {s.toLabel}
                </Button>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
