import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Bookmark as BookmarkIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { nanoid } from "nanoid";
import { db } from "../../db/db";
import type { ModuleSpec } from "../../db/schema";
import { importWord } from "../../features/docimport/wordImport";

export function ModuleSpecsPage(): React.ReactElement {
  const modules = useLiveQuery(() => db.modules.toArray(), []);
  const [moduleId, setModuleId] = useState("");
  const spec = useLiveQuery(
    async () => (moduleId ? await db.moduleSpecs.where("moduleId").equals(moduleId).first() : undefined),
    [moduleId],
  );
  const [draftHtml, setDraftHtml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selection, setSelection] = useState("");

  // Sync loaded spec into the editable draft when module changes.
  const draftMatchesSpec = spec?.bodyHtml === draftHtml;
  if (spec && !draftHtml) {
    // initial hydrate
    setDraftHtml(spec.bodyHtml);
  }

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
    if (!moduleId) return;
    const existing = await db.moduleSpecs.where("moduleId").equals(moduleId).first();
    const next: ModuleSpec = {
      id: existing?.id ?? nanoid(8),
      moduleId,
      bodyHtml: draftHtml,
      sourceFileName: existing?.sourceFileName ?? "",
      updatedAt: Date.now(),
    };
    await db.moduleSpecs.put(next);
    setMessage("Saved.");
    setTimeout(() => setMessage(null), 2000);
  }

  async function saveAsSnippet() {
    const text = selection.trim();
    if (!text) {
      alert("Select some text in the preview first.");
      return;
    }
    const name = prompt("Snippet name?", text.slice(0, 60));
    if (!name) return;
    await db.snippets.put({
      id: nanoid(8),
      name,
      type: "learning-outcome",
      body: text,
      tags: [],
      moduleId: moduleId || null,
      createdAt: Date.now(),
    });
    setMessage(`Snippet "${name}" saved.`);
    setTimeout(() => setMessage(null), 2500);
  }

  function onSelection() {
    const sel = window.getSelection();
    setSelection(sel ? sel.toString() : "");
  }

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        Module Specifications
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Load a module spec from Word; highlight any passage in the preview and
        click <strong>Save as snippet</strong> to reuse it as a learning
        outcome elsewhere. The raw HTML is editable below.
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2} alignItems="center">
        <TextField
          select
          label="Module"
          value={moduleId}
          onChange={(e) => {
            setModuleId(e.target.value);
            setDraftHtml("");
          }}
          sx={{ minWidth: 280 }}
        >
          <MenuItem value="">— select —</MenuItem>
          {modules?.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.code ? `${m.code} · ` : ""}
              {m.name}
            </MenuItem>
          ))}
        </TextField>
        <Button component="label" variant="outlined" startIcon={<UploadIcon />} disabled={!moduleId}>
          Import Word document
          <input type="file" hidden accept=".docx" onChange={onUpload} />
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={save}
          disabled={!moduleId || draftMatchesSpec}
        >
          Save
        </Button>
        {spec && (
          <IconButton
            title="Delete spec"
            onClick={async () => {
              if (confirm("Delete the spec for this module?")) {
                await db.moduleSpecs.delete(spec.id);
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

      {moduleId ? (
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <Paper variant="outlined" sx={{ p: 2, flex: 1, minHeight: 400 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h3">Preview</Typography>
              <Button size="small" startIcon={<BookmarkIcon />} onClick={saveAsSnippet} disabled={!selection}>
                Save selection as snippet
              </Button>
            </Stack>
            <Box
              onMouseUp={onSelection}
              onKeyUp={onSelection}
              sx={{
                "& h1, & h2, & h3": { mt: 2 },
                "& p": { mb: 1 },
                "& table": { borderCollapse: "collapse" },
                "& td, & th": { border: "1px solid #d0d7de", p: 0.5 },
              }}
              dangerouslySetInnerHTML={{ __html: draftHtml || "<em>Empty. Import a Word document to populate.</em>" }}
            />
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, flex: 1, minHeight: 400 }}>
            <Typography variant="h3" gutterBottom>
              HTML source
            </Typography>
            <TextField
              value={draftHtml}
              onChange={(e) => setDraftHtml(e.target.value)}
              multiline
              fullWidth
              minRows={14}
              slotProps={{ htmlInput: { style: { fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12 } } }}
            />
          </Paper>
        </Stack>
      ) : (
        <Alert severity="info">Select a module to load or edit its spec.</Alert>
      )}
    </Box>
  );
}
