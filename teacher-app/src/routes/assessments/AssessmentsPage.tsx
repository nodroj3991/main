import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  QuizOutlined as QuizIcon,
} from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { nanoid } from "nanoid";
import { db } from "../../db/db";
import type { Question } from "../../db/schema";
import { QUESTION_TYPES, type QuestionType } from "../../constants";
import { downloadBlob } from "../../db/io";

function QuestionDialog({
  moduleId,
  open,
  onClose,
}: {
  moduleId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [type, setType] = useState<QuestionType>("mcq");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [answer, setAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState<Question["difficulty"]>("medium");

  async function save() {
    await db.questions.put({
      id: nanoid(8),
      moduleId,
      sessionId: null,
      type,
      prompt,
      options: type === "mcq" || type === "match" ? options.filter(Boolean) : [],
      answer,
      explanation,
      difficulty,
      tags: [],
      createdAt: Date.now(),
    });
    setPrompt("");
    setAnswer("");
    setOptions(["", "", "", ""]);
    setExplanation("");
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New question</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as QuestionType)}
              fullWidth
            >
              {QUESTION_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Question["difficulty"])}
              fullWidth
            >
              {["easy", "medium", "hard"].map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField label="Prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} multiline minRows={2} />
          {(type === "mcq" || type === "match") && (
            <Stack spacing={1}>
              <Typography variant="subtitle2">Options</Typography>
              {options.map((opt, i) => (
                <TextField
                  key={i}
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                  size="small"
                  placeholder={`Option ${i + 1}`}
                />
              ))}
              <Button size="small" onClick={() => setOptions([...options, ""])}>
                Add option
              </Button>
            </Stack>
          )}
          <TextField label="Answer / marking key" value={answer} onChange={(e) => setAnswer(e.target.value)} multiline minRows={2} />
          <TextField label="Explanation (optional)" value={explanation} onChange={(e) => setExplanation(e.target.value)} multiline minRows={2} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={!prompt.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function buildAssessmentHtml(
  title: string,
  questions: Question[],
  options: { includeAnswers: boolean },
): string {
  const rows = questions.map((q, i) => {
    const opts =
      (q.type === "mcq" || q.type === "match") && q.options.length
        ? `<ol type="a">${q.options.map((o) => `<li>${escapeHtml(o)}</li>`).join("")}</ol>`
        : "";
    const answer = options.includeAnswers && q.answer
      ? `<p><strong>Answer:</strong> ${escapeHtml(q.answer)}</p>`
      : "";
    const expl = options.includeAnswers && q.explanation
      ? `<p><em>${escapeHtml(q.explanation)}</em></p>`
      : "";
    return `
      <section style="margin-bottom:1.5rem">
        <p><strong>${i + 1}. [${q.type}] ${escapeHtml(q.prompt)}</strong></p>
        ${opts}
        ${answer}
        ${expl}
      </section>`;
  });
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;color:#1f2328}h1{margin-bottom:.5rem}section{page-break-inside:avoid}</style>
</head><body>
<h1>${escapeHtml(title)}</h1>
<p style="color:#6a737d">${questions.length} questions · generated ${new Date().toISOString().slice(0, 10)}</p>
${rows.join("\n")}
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c] as string));
}

export function AssessmentsPage(): React.ReactElement {
  const modules = useLiveQuery(() => db.modules.toArray(), []);
  const assessments = useLiveQuery(() => db.assessments.orderBy("generatedAt").reverse().toArray(), []);
  const [moduleId, setModuleId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [qOpen, setQOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const questions = useLiveQuery(
    async () =>
      moduleId ? await db.questions.where("moduleId").equals(moduleId).toArray() : [],
    [moduleId],
  );

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function createAssessment() {
    if (!moduleId || selected.size === 0) return;
    const title = prompt("Assessment title?", "Formative quiz");
    if (!title) return;
    await db.assessments.put({
      id: nanoid(8),
      moduleId,
      title,
      description: "",
      questionIds: Array.from(selected),
      generatedAt: Date.now(),
    });
    setSelected(new Set());
    setMessage(`Assessment "${title}" created with ${selected.size} questions.`);
    setTimeout(() => setMessage(null), 2500);
  }

  async function exportAssessment(id: string, withAnswers: boolean) {
    const a = await db.assessments.get(id);
    if (!a) return;
    const qs = await db.questions.bulkGet(a.questionIds);
    const filtered = qs.filter((q): q is Question => !!q);
    const html = buildAssessmentHtml(a.title, filtered, { includeAnswers: withAnswers });
    const suffix = withAnswers ? "with-answers" : "student";
    downloadBlob(new Blob([html], { type: "text/html" }), `${a.title.replace(/\W+/g, "-")}-${suffix}.html`);
  }

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        Assessments & Quizzes
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Build a question bank per module, then bundle questions into
        assessments that export as printable HTML (open in Word to save as PDF
        or .docx). Tag questions with difficulty to balance a quiz.
      </Typography>
      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <TextField
          select
          label="Module"
          value={moduleId}
          onChange={(e) => {
            setModuleId(e.target.value);
            setSelected(new Set());
          }}
          sx={{ minWidth: 280 }}
        >
          <MenuItem value="">— select —</MenuItem>
          {modules?.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.code ? `${m.code} · ` : ""}{m.name}
            </MenuItem>
          ))}
        </TextField>
        <Button startIcon={<AddIcon />} variant="outlined" disabled={!moduleId} onClick={() => setQOpen(true)}>
          Add question
        </Button>
        <Button
          startIcon={<QuizIcon />}
          variant="contained"
          disabled={selected.size === 0}
          onClick={createAssessment}
        >
          Build assessment ({selected.size})
        </Button>
      </Stack>

      {moduleId && (
        <Paper variant="outlined" sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell width={80}>Type</TableCell>
                <TableCell width={80}>Level</TableCell>
                <TableCell>Prompt</TableCell>
                <TableCell width={48} />
              </TableRow>
            </TableHead>
            <TableBody>
              {questions?.map((q) => (
                <TableRow key={q.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selected.has(q.id)} onChange={() => toggle(q.id)} />
                  </TableCell>
                  <TableCell>{q.type}</TableCell>
                  <TableCell>
                    <Chip size="small" label={q.difficulty} variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "pre-wrap" }}>{q.prompt}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={async () => {
                        if (confirm("Delete this question?")) await db.questions.delete(q.id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {questions?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary" sx={{ p: 1 }}>
                      No questions yet for this module. Click <strong>Add question</strong>.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Typography variant="h3" gutterBottom>
        Assessments
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Module</TableCell>
            <TableCell>Questions</TableCell>
            <TableCell>Created</TableCell>
            <TableCell width={220} />
          </TableRow>
        </TableHead>
        <TableBody>
          {assessments?.map((a) => {
            const m = modules?.find((x) => x.id === a.moduleId);
            return (
              <TableRow key={a.id} hover>
                <TableCell>{a.title}</TableCell>
                <TableCell>{m?.name ?? "—"}</TableCell>
                <TableCell>{a.questionIds.length}</TableCell>
                <TableCell>{new Date(a.generatedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => void exportAssessment(a.id, false)}
                  >
                    Student
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => void exportAssessment(a.id, true)}
                  >
                    Answers
                  </Button>
                  <IconButton
                    size="small"
                    onClick={async () => {
                      if (confirm(`Delete "${a.title}"?`)) await db.assessments.delete(a.id);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {qOpen && (
        <QuestionDialog moduleId={moduleId} open={qOpen} onClose={() => setQOpen(false)} />
      )}
    </Box>
  );
}
