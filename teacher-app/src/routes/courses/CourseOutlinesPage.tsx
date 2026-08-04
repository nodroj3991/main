import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { nanoid } from "nanoid";
import { db } from "../../db/db";
import type { CourseOutline } from "../../db/schema";
import { headingsFromHtml, importWord } from "../../features/docimport/wordImport";

export function CourseOutlinesPage(): React.ReactElement {
  const courses = useLiveQuery(() => db.courses.toArray(), []);
  const [courseId, setCourseId] = useState("");
  const outline = useLiveQuery(
    async () =>
      courseId ? await db.courseOutlines.where("courseId").equals(courseId).first() : undefined,
    [courseId],
  );
  const [draftHtml, setDraftHtml] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hydrate the editable draft when the selection or its stored outline
  // changes; user edits after that are left alone.
  useEffect(() => {
    setDraftHtml(outline?.bodyHtml ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, outline?.id]);

  const headings = draftHtml ? headingsFromHtml(draftHtml) : [];

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { html } = await importWord(file);
      setDraftHtml(html);
      setMessage(`Imported ${file.name}. Click Save to persist.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      e.target.value = "";
    }
  }

  async function save() {
    if (!courseId) return;
    const existing = await db.courseOutlines.where("courseId").equals(courseId).first();
    const next: CourseOutline = {
      id: existing?.id ?? nanoid(8),
      courseId,
      bodyHtml: draftHtml,
      sourceFileName: existing?.sourceFileName ?? "",
      updatedAt: Date.now(),
    };
    await db.courseOutlines.put(next);
    setMessage("Saved.");
    setTimeout(() => setMessage(null), 2000);
  }

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        Course Outlines
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Import a Word course outline. Each H1/H2 heading is extracted below —
        feed these into a PPT deck or use them to structure a Scheme of Work.
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2} alignItems="center">
        <TextField
          select
          label="Course"
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            setDraftHtml("");
          }}
          sx={{ minWidth: 320 }}
        >
          <MenuItem value="">— select —</MenuItem>
          {courses?.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
        <Button component="label" variant="outlined" startIcon={<UploadIcon />} disabled={!courseId}>
          Import Word outline
          <input type="file" hidden accept=".docx" onChange={onUpload} />
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={save}
          disabled={!courseId || (outline?.bodyHtml === draftHtml)}
        >
          Save
        </Button>
        {outline && (
          <IconButton
            title="Delete outline"
            onClick={async () => {
              if (confirm("Delete the outline for this course?")) {
                await db.courseOutlines.delete(outline.id);
                setDraftHtml("");
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        )}
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      {courseId ? (
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <Paper variant="outlined" sx={{ p: 2, flex: 2, minHeight: 400 }}>
            <Typography variant="h3" gutterBottom>
              Preview
            </Typography>
            <Box
              sx={{
                "& h1, & h2, & h3": { mt: 2 },
                "& p": { mb: 1 },
                "& table": { borderCollapse: "collapse" },
                "& td, & th": { border: "1px solid #d0d7de", p: 0.5 },
              }}
              dangerouslySetInnerHTML={{ __html: draftHtml || "<em>Empty. Import a Word outline to populate.</em>" }}
            />
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, flex: 1, minHeight: 400 }}>
            <Typography variant="h3" gutterBottom>
              Detected headings ({headings.length})
            </Typography>
            {headings.length === 0 ? (
              <Typography color="text.secondary">
                None yet — add H1/H2 headings in the document or paste HTML
                into the source below.
              </Typography>
            ) : (
              <Stack spacing={0.5}>
                {headings.map((h, i) => (
                  <Chip key={`${i}-${h}`} label={h} sx={{ justifyContent: "flex-start" }} />
                ))}
              </Stack>
            )}
            <Typography variant="h3" sx={{ mt: 3 }} gutterBottom>
              HTML source
            </Typography>
            <TextField
              value={draftHtml}
              onChange={(e) => setDraftHtml(e.target.value)}
              multiline
              fullWidth
              minRows={10}
              slotProps={{ htmlInput: { style: { fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12 } } }}
            />
          </Paper>
        </Stack>
      ) : (
        <Alert severity="info">Select a course to load or edit its outline.</Alert>
      )}
    </Box>
  );
}
