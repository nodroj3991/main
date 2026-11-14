import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { School as TutorIcon, Send as SendIcon, StopCircle as EndIcon } from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { nanoid } from "nanoid";
import { db } from "../../db/db";
import type { TutorSession, TutorTurn } from "../../db/schema";
import { buildTutorSystemPrompt } from "../../features/tutor/prompt";
import { summariseTutorSession, tutorReply } from "../../features/tutor/engine";
import { getCachedKey } from "../../features/assistant/secureKey";

export function TutorPage(): React.ReactElement {
  const groups = useLiveQuery(() => db.groups.toArray(), []);
  const modules = useLiveQuery(() => db.modules.toArray(), []);
  const [groupId, setGroupId] = useState("");
  const students = useLiveQuery(
    async () => (groupId ? await db.students.where("groupId").equals(groupId).toArray() : []),
    [groupId],
  );

  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [topic, setTopic] = useState("");

  const [session, setSession] = useState<TutorSession | null>(null);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const hasKey = !!getCachedKey();
  const effectiveName =
    studentName.trim() || students?.find((s) => s.id === studentId)?.name || "";

  async function start() {
    setError(null);
    try {
      const sys = await buildTutorSystemPrompt({
        moduleId: moduleId || null,
        topic,
        studentName: effectiveName,
      });
      const s: TutorSession = {
        id: nanoid(8),
        studentId: studentId || null,
        studentName: effectiveName,
        groupId: groupId || null,
        moduleId: moduleId || null,
        topic,
        turns: [],
        summary: "",
        struggles: [],
        breakthroughs: [],
        startedAt: Date.now(),
        endedAt: null,
      };
      await db.tutorSessions.put(s);
      setSystemPrompt(sys);
      setSession(s);
      setEnded(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function send() {
    if (!session || !input.trim()) return;
    setError(null);
    const studentTurn: TutorTurn = { role: "student", content: input.trim(), at: Date.now() };
    const withStudent = { ...session, turns: [...session.turns, studentTurn] };
    setSession(withStudent);
    setInput("");
    setBusy(true);
    abortRef.current = new AbortController();
    try {
      await db.tutorSessions.put(withStudent); // autosave before the call
      const reply = await tutorReply(systemPrompt, withStudent.turns, abortRef.current.signal);
      const withTutor = {
        ...withStudent,
        turns: [...withStudent.turns, { role: "tutor" as const, content: reply, at: Date.now() }],
      };
      setSession(withTutor);
      await db.tutorSessions.put(withTutor); // autosave after
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  async function endSession() {
    if (!session) return;
    setBusy(true);
    const closed = { ...session, endedAt: Date.now() };
    try {
      if (closed.turns.length >= 2) {
        try {
          const digest = await summariseTutorSession(closed);
          closed.summary = digest.summary;
          closed.struggles = digest.struggles;
          closed.breakthroughs = digest.breakthroughs;
        } catch {
          // Digest is best-effort; the raw transcript is already saved.
        }
      }
      await db.tutorSessions.put(closed);
      setEnded(true);
      setSession(null);
      setSystemPrompt("");
      setTopic("");
    } finally {
      setBusy(false);
    }
  }

  // ── Setup screen ───────────────────────────────────────────────────────
  if (!session) {
    return (
      <Box sx={{ maxWidth: 640, mx: "auto" }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          <TutorIcon color="primary" fontSize="large" />
          <Typography variant="h1">Out-of-hours Tutor</Typography>
        </Stack>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Stuck on your work? The tutor won't give you answers — it will help
          you work them out yourself, step by step, using what you covered in
          class. Your teacher can see a summary of the chat afterwards.
        </Typography>

        {ended && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Session saved. Well done for working through it — you can start
            another one any time.
          </Alert>
        )}
        {!hasKey && (
          <Alert severity="info" sx={{ mb: 2 }}>
            The tutor needs an unlocked AI key. Teachers: add or unlock it in{" "}
            <Link to="/settings">Settings</Link> before handing over.
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <TextField
              select
              label="Your class / group (optional)"
              value={groupId}
              onChange={(e) => {
                setGroupId(e.target.value);
                setStudentId("");
              }}
            >
              <MenuItem value="">— not sure —</MenuItem>
              {groups?.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </TextField>
            {groupId && (students?.length ?? 0) > 0 ? (
              <TextField
                select
                label="Your name"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              >
                {students?.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                label="Your name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            )}
            <TextField
              select
              label="Which module is this about?"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
            >
              <MenuItem value="">— not sure —</MenuItem>
              {modules?.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="What are you stuck on?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              multiline
              minRows={2}
              placeholder="e.g. I don't get how to tell the Five Freedoms apart in the case study"
            />
            <Button
              variant="contained"
              size="large"
              disabled={!hasKey || !effectiveName || busy}
              onClick={start}
            >
              Start tutoring session
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  // ── Chat screen ────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 96px)", maxWidth: 860, mx: "auto" }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <TutorIcon color="primary" />
        <Typography variant="h2" sx={{ flexGrow: 1 }}>
          Tutoring: {session.studentName}
        </Typography>
        <Chip label={session.topic ? session.topic.slice(0, 40) : "open topic"} variant="outlined" />
        <Button color="error" startIcon={<EndIcon />} onClick={endSession} disabled={busy}>
          End session
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ flex: 1, overflow: "auto", p: 2, mb: 2, bgcolor: "#fafbfc" }}>
        {session.turns.length === 0 && (
          <Typography color="text.secondary">
            Tell the tutor what you're working on and what you've tried so far.
          </Typography>
        )}
        <Stack spacing={2}>
          {session.turns.map((t, i) => (
            <Box key={i} sx={{ display: "flex", justifyContent: t.role === "student" ? "flex-end" : "flex-start" }}>
              <Paper
                elevation={0}
                sx={{
                  maxWidth: "80%",
                  px: 2,
                  py: 1.2,
                  bgcolor: t.role === "student" ? "primary.main" : "background.paper",
                  color: t.role === "student" ? "primary.contrastText" : "text.primary",
                  border: t.role === "tutor" ? "1px solid #e1e4e8" : "none",
                  whiteSpace: "pre-wrap",
                  fontSize: "0.95rem",
                }}
              >
                {t.content}
              </Paper>
            </Box>
          ))}
          {busy && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Tutor is thinking…
              </Typography>
            </Stack>
          )}
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction="row" spacing={1}>
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Type what you're thinking…"
          fullWidth
          multiline
          maxRows={4}
          disabled={busy}
        />
        <Button variant="contained" endIcon={<SendIcon />} onClick={() => void send()} disabled={busy || !input.trim()}>
          Send
        </Button>
      </Stack>
    </Box>
  );
}
