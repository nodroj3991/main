import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Groups as ClassIcon,
  Person as StudentIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { nanoid } from "nanoid";
import { db } from "../../db/db";
import type { TutorReport, TutorSession } from "../../db/schema";
import { generateClassReport, generateStudentReport } from "../../features/tutor/engine";
import { getCachedKey } from "../../features/assistant/secureKey";
import { downloadBlob } from "../../db/io";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c] as string));
}

function reportHtml(r: TutorReport): string {
  // Markdown-lite: headings and paragraphs are enough for a printable report.
  const body = escapeHtml(r.body)
    .split("\n")
    .map((line) => {
      if (line.startsWith("### ")) return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
      if (line.startsWith("- ")) return `<li>${line.slice(2)}</li>`;
      if (!line.trim()) return "";
      return `<p>${line}</p>`;
    })
    .join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(r.title)}</title>
<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;color:#1f2328;line-height:1.5}h1{border-bottom:2px solid #1f6feb;padding-bottom:.3rem}h2{margin-top:1.6rem}li{margin:.2rem 0}</style>
</head><body>${body}<hr><p style="color:#6a737d;font-size:.85rem">Generated ${new Date(r.generatedAt).toLocaleString("en-GB")} · TOPS out-of-hours tutor</p></body></html>`;
}

export function TutorReportsPage(): React.ReactElement {
  const sessions = useLiveQuery(() => db.tutorSessions.orderBy("startedAt").reverse().toArray(), []);
  const reports = useLiveQuery(() => db.tutorReports.orderBy("generatedAt").reverse().toArray(), []);
  const modules = useLiveQuery(() => db.modules.toArray(), []);

  const [moduleFilter, setModuleFilter] = useState("");
  const [studentPick, setStudentPick] = useState("");
  const [busy, setBusy] = useState<"student" | "class" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<TutorReport | null>(null);

  const hasKey = !!getCachedKey();

  const scoped = useMemo(
    () => (sessions ?? []).filter((s) => !moduleFilter || s.moduleId === moduleFilter),
    [sessions, moduleFilter],
  );
  const studentNames = useMemo(
    () => Array.from(new Set(scoped.map((s) => s.studentName).filter(Boolean))).sort(),
    [scoped],
  );

  async function schemeOutline(moduleId: string): Promise<string> {
    const schemes = await db.schemes.where("moduleId").equals(moduleId).toArray();
    return schemes
      .flatMap((s) => s.rows.map((r) => `${r.weekOrDate}: ${r.learningContent}`))
      .join("\n");
  }

  async function runStudentReport() {
    const subject = (sessions ?? []).filter(
      (s) => s.studentName === studentPick && (!moduleFilter || s.moduleId === moduleFilter),
    );
    if (!subject.length) return;
    setBusy("student");
    setError(null);
    try {
      const moduleName = modules?.find((m) => m.id === moduleFilter)?.name;
      const body = await generateStudentReport({ studentName: studentPick, sessions: subject, moduleName });
      const report: TutorReport = {
        id: nanoid(8),
        kind: "student-progress",
        title: `Progress report — ${studentPick}${moduleName ? ` (${moduleName})` : ""}`,
        studentName: studentPick,
        moduleId: moduleFilter || null,
        body,
        sourceSessionIds: subject.map((s) => s.id),
        generatedAt: Date.now(),
      };
      await db.tutorReports.put(report);
      setViewing(report);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function runClassReport() {
    if (!scoped.length) return;
    setBusy("class");
    setError(null);
    try {
      const moduleName = modules?.find((m) => m.id === moduleFilter)?.name;
      const outline = moduleFilter ? await schemeOutline(moduleFilter) : undefined;
      const body = await generateClassReport({ sessions: scoped, moduleName, schemeOutline: outline });
      const report: TutorReport = {
        id: nanoid(8),
        kind: "class-teaching",
        title: `Class teaching report${moduleName ? ` — ${moduleName}` : ""}`,
        studentName: "",
        moduleId: moduleFilter || null,
        body,
        sourceSessionIds: scoped.map((s) => s.id),
        generatedAt: Date.now(),
      };
      await db.tutorReports.put(report);
      setViewing(report);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  function moduleName(id: string | null): string {
    return modules?.find((m) => m.id === id)?.name ?? "—";
  }

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        Tutor Reports
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Every out-of-hours tutoring chat is logged below. Generate two kinds of
        report: a progress summary for one student, or a class-level report
        that shows which parts of your scheme need restructuring and how to
        sharpen delivery.
      </Typography>

      {!hasKey && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Report generation needs an unlocked AI key — add or unlock it in{" "}
          <Link to="/settings">Settings</Link>. Session logs below are always
          available.
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h3" gutterBottom>
          Generate a report
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
          <TextField
            select
            label="Module (optional filter)"
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setStudentPick("");
            }}
            sx={{ minWidth: 240 }}
          >
            <MenuItem value="">All modules</MenuItem>
            {modules?.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Student"
            value={studentPick}
            onChange={(e) => setStudentPick(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {studentNames.map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            startIcon={<StudentIcon />}
            disabled={!hasKey || !studentPick || busy !== null}
            onClick={() => void runStudentReport()}
          >
            {busy === "student" ? "Writing…" : "Student progress report"}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ClassIcon />}
            disabled={!hasKey || scoped.length === 0 || busy !== null}
            onClick={() => void runClassReport()}
          >
            {busy === "class" ? "Writing…" : `Class teaching report (${scoped.length} sessions)`}
          </Button>
        </Stack>
      </Paper>

      <Typography variant="h3" gutterBottom>
        Saved reports
      </Typography>
      <Table size="small" sx={{ mb: 4 }}>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Kind</TableCell>
            <TableCell>Generated</TableCell>
            <TableCell width={160} />
          </TableRow>
        </TableHead>
        <TableBody>
          {reports?.map((r) => (
            <TableRow key={r.id} hover>
              <TableCell>{r.title}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={r.kind === "student-progress" ? "student" : "class"}
                  color={r.kind === "student-progress" ? "primary" : "secondary"}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>{new Date(r.generatedAt).toLocaleString("en-GB")}</TableCell>
              <TableCell>
                <IconButton size="small" title="View" onClick={() => setViewing(r)}>
                  <ViewIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  title="Download"
                  onClick={() =>
                    downloadBlob(
                      new Blob([reportHtml(r)], { type: "text/html" }),
                      `${r.title.replace(/\W+/g, "-")}.html`,
                    )
                  }
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  title="Delete"
                  onClick={async () => {
                    if (confirm(`Delete "${r.title}"?`)) await db.tutorReports.delete(r.id);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {reports?.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                <Typography color="text.secondary">No reports yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Typography variant="h3" gutterBottom>
        Session log
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Student</TableCell>
            <TableCell>Module</TableCell>
            <TableCell>Topic</TableCell>
            <TableCell>Turns</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Digest</TableCell>
            <TableCell width={48} />
          </TableRow>
        </TableHead>
        <TableBody>
          {(sessions ?? []).map((s: TutorSession) => (
            <TableRow key={s.id} hover>
              <TableCell>{s.studentName || "—"}</TableCell>
              <TableCell>{moduleName(s.moduleId)}</TableCell>
              <TableCell sx={{ maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.topic || "—"}
              </TableCell>
              <TableCell>{s.turns.length}</TableCell>
              <TableCell>{new Date(s.startedAt).toLocaleDateString("en-GB")}</TableCell>
              <TableCell sx={{ maxWidth: 360 }}>
                <Typography variant="body2" color="text.secondary">
                  {s.summary || (s.endedAt ? "(no digest)" : "in progress / not ended")}
                </Typography>
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  title="Delete session"
                  onClick={async () => {
                    if (confirm(`Delete this tutoring session for ${s.studentName}?`))
                      await db.tutorSessions.delete(s.id);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {sessions?.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <Typography color="text.secondary">
                  No tutoring sessions yet — they appear here as soon as a student uses the Student Tutor page.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={!!viewing} onClose={() => setViewing(null)} fullWidth maxWidth="md">
        <DialogTitle>{viewing?.title}</DialogTitle>
        <DialogContent>
          <Typography sx={{ whiteSpace: "pre-wrap" }}>{viewing?.body}</Typography>
        </DialogContent>
        <DialogActions>
          {viewing && (
            <Button
              startIcon={<DownloadIcon />}
              onClick={() =>
                downloadBlob(
                  new Blob([reportHtml(viewing)], { type: "text/html" }),
                  `${viewing.title.replace(/\W+/g, "-")}.html`,
                )
              }
            >
              Download
            </Button>
          )}
          <Button onClick={() => setViewing(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
