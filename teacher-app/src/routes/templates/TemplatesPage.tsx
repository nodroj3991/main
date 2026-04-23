import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
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
  AutoFixHigh as FillIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { nanoid } from "nanoid";
import { db } from "../../db/db";
import type { Template } from "../../db/schema";
import { detectTemplate } from "../../features/templates/detect";
import { downloadBlob } from "../../db/io";
import { TemplateFillDialog } from "./TemplateFillDialog";

const FORMATS: Template["format"][] = ["docx", "pptx", "xlsx", "csv", "json", "html", "txt"];
const CATEGORIES: Template["category"][] = [
  "scheme-of-work",
  "lesson-plan",
  "ppt-deck",
  "report-card",
  "assessment",
  "other",
];

export function TemplatesPage(): React.ReactElement {
  const templates = useLiveQuery(() => db.templates.orderBy("createdAt").reverse().toArray(), []);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [fillFor, setFillFor] = useState<Template | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setWorking(true);
    try {
      const detected = await detectTemplate(file);
      const blobId = nanoid(8);
      await db.blobs.put({
        id: blobId,
        mime: file.type || "application/octet-stream",
        data: file,
        createdAt: Date.now(),
      });
      await db.templates.put({
        id: nanoid(8),
        name: file.name,
        format: detected.format,
        category: detected.category,
        sourceFileName: file.name,
        storedBlobId: blobId,
        detectedFields: detected.fields,
        notes: "",
        createdAt: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setWorking(false);
      e.target.value = "";
    }
  }

  async function downloadTemplate(t: Template) {
    const blob = await db.blobs.get(t.storedBlobId);
    if (!blob || !(blob.data instanceof Blob)) {
      alert("Source file missing.");
      return;
    }
    downloadBlob(blob.data, t.sourceFileName || t.name);
  }

  async function updateTemplate(id: string, patch: Partial<Template>) {
    const existing = await db.templates.get(id);
    if (existing) await db.templates.put({ ...existing, ...patch });
  }

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        Templates
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Upload your school's own templates — Scheme of Work (.docx), TMC lesson
        plan (.docx/.pdf), PPT phase deck (.pptx), report cards (.xlsx) and so
        on. The app detects placeholder fields and lets other tabs fill them
        with your real data.
      </Typography>

      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <Button startIcon={<UploadIcon />} variant="contained" component="label" disabled={working}>
          {working ? "Detecting…" : "Upload template"}
          <input
            type="file"
            hidden
            accept=".docx,.pptx,.xlsx,.csv,.json,.html,.txt,.pdf"
            onChange={onFile}
          />
        </Button>
        <Typography variant="body2" color="text.secondary">
          Supported: .docx, .pptx, .xlsx, .csv, .json, .html, .txt
        </Typography>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell width={120}>Format</TableCell>
            <TableCell width={180}>Category</TableCell>
            <TableCell>Detected fields</TableCell>
            <TableCell width={120} />
          </TableRow>
        </TableHead>
        <TableBody>
          {templates?.map((t) => (
            <TableRow key={t.id} hover>
              <TableCell>
                <TextField
                  value={t.name}
                  onChange={(e) => void updateTemplate(t.id, { name: e.target.value })}
                  size="small"
                  variant="standard"
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  select
                  value={t.format}
                  onChange={(e) => void updateTemplate(t.id, { format: e.target.value as Template["format"] })}
                  size="small"
                  variant="standard"
                  fullWidth
                >
                  {FORMATS.map((f) => (
                    <MenuItem key={f} value={f}>
                      {f}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  select
                  value={t.category}
                  onChange={(e) => void updateTemplate(t.id, { category: e.target.value as Template["category"] })}
                  size="small"
                  variant="standard"
                  fullWidth
                >
                  {CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>
                {t.detectedFields.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    none detected
                  </Typography>
                ) : (
                  <Typography variant="body2">
                    {t.detectedFields.map((f) => f.label || f.key).join(", ")}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <IconButton size="small" title="Fill" onClick={() => setFillFor(t)}>
                  <FillIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" title="Download original" onClick={() => void downloadTemplate(t)}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  title="Delete"
                  onClick={async () => {
                    if (confirm(`Delete template "${t.name}"?`)) {
                      await db.blobs.delete(t.storedBlobId);
                      await db.templates.delete(t.id);
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {fillFor && (
        <TemplateFillDialog
          template={fillFor}
          open={!!fillFor}
          onClose={() => setFillFor(null)}
        />
      )}
    </Box>
  );
}
