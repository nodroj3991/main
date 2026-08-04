import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { downloadBlob } from "../../db/io";
import type { Template } from "../../db/schema";
import {
  fillTemplate,
  suggestValuesFromGroup,
  suggestValuesFromScheme,
  suggestValuesFromSession,
  suggestValuesFromStudent,
  type FillValues,
} from "../../features/templates/fill";

type SourceKind = "none" | "session" | "scheme" | "group" | "student";

export function TemplateFillDialog({
  template,
  open,
  onClose,
}: {
  template: Template;
  open: boolean;
  onClose: () => void;
}): React.ReactElement {
  const [sourceKind, setSourceKind] = useState<SourceKind>("none");
  const [sourceId, setSourceId] = useState("");
  const [values, setValues] = useState<FillValues>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sessions = useLiveQuery(() => db.sessions.toArray(), []);
  const schemes = useLiveQuery(() => db.schemes.toArray(), []);
  const groups = useLiveQuery(() => db.groups.toArray(), []);
  const students = useLiveQuery(() => db.students.toArray(), []);
  const modules = useLiveQuery(() => db.modules.toArray(), []);

  // Reset state each time the dialog re-opens.
  useEffect(() => {
    if (open) {
      const initial: FillValues = {};
      for (const f of template.detectedFields) initial[f.key] = f.defaultValue ?? "";
      setValues(initial);
      setSourceKind("none");
      setSourceId("");
      setError(null);
    }
  }, [open, template]);

  const suggested = useMemo<FillValues>(() => {
    if (sourceKind === "session") {
      const s = sessions?.find((x) => x.id === sourceId);
      return s ? suggestValuesFromSession(s) : {};
    }
    if (sourceKind === "scheme") {
      const s = schemes?.find((x) => x.id === sourceId);
      return s ? suggestValuesFromScheme(s) : {};
    }
    if (sourceKind === "group") {
      const g = groups?.find((x) => x.id === sourceId);
      return g ? suggestValuesFromGroup(g) : {};
    }
    if (sourceKind === "student") {
      const st = students?.find((x) => x.id === sourceId);
      return st ? suggestValuesFromStudent(st) : {};
    }
    return {};
  }, [sourceKind, sourceId, sessions, schemes, groups, students]);

  function applySuggestions() {
    setValues((v) => {
      const next = { ...v };
      for (const f of template.detectedFields) {
        const guess = suggested[f.key];
        if (guess !== undefined && (!next[f.key] || next[f.key].length === 0)) {
          next[f.key] = guess;
        }
      }
      return next;
    });
  }

  async function doFill() {
    setError(null);
    setBusy(true);
    try {
      const blob = await db.blobs.get(template.storedBlobId);
      if (!blob || !(blob.data instanceof Blob)) throw new Error("Source template file missing.");
      const sourceFile = new File([blob.data], template.sourceFileName || template.name, {
        type: blob.mime,
      });
      const filled = await fillTemplate(sourceFile, template, values);
      const base = (template.sourceFileName || template.name).replace(/\.(\w+)$/, "");
      const ext = template.format === "html" ? "html" : template.format;
      downloadBlob(filled, `${base}-filled-${new Date().toISOString().slice(0, 10)}.${ext}`);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function sourceOptions() {
    switch (sourceKind) {
      case "session":
        return (
          sessions?.map((s) => {
            const scheme = schemes?.find((x) => x.id === s.schemeOfWorkId);
            const module = modules?.find((x) => x.id === scheme?.moduleId);
            return (
              <MenuItem key={s.id} value={s.id}>
                {module?.name ?? "—"} · {s.week || s.unit || "session"}
              </MenuItem>
            );
          }) ?? []
        );
      case "scheme":
        return (
          schemes?.map((s) => {
            const module = modules?.find((x) => x.id === s.moduleId);
            const group = groups?.find((x) => x.id === s.groupId);
            return (
              <MenuItem key={s.id} value={s.id}>
                {module?.name ?? "—"} · {group?.name ?? "—"}
              </MenuItem>
            );
          }) ?? []
        );
      case "group":
        return (
          groups?.map((g) => (
            <MenuItem key={g.id} value={g.id}>
              {g.name}
            </MenuItem>
          )) ?? []
        );
      case "student":
        return (
          students?.map((st) => (
            <MenuItem key={st.id} value={st.id}>
              {st.name}
            </MenuItem>
          )) ?? []
        );
      default:
        return [];
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Fill template: {template.name}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Each detected field becomes a row below. Pre-fill from a stored entity, then tweak, then download.
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
          <TextField
            select
            label="Pre-fill source"
            value={sourceKind}
            onChange={(e) => {
              setSourceKind(e.target.value as SourceKind);
              setSourceId("");
            }}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="none">None (manual entry)</MenuItem>
            <MenuItem value="session">From a Session</MenuItem>
            <MenuItem value="scheme">From a Scheme of Work</MenuItem>
            <MenuItem value="group">From a Group</MenuItem>
            <MenuItem value="student">From a Student</MenuItem>
          </TextField>
          {sourceKind !== "none" && (
            <TextField
              select
              label="Source"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              sx={{ minWidth: 320 }}
            >
              {sourceOptions()}
            </TextField>
          )}
          <Button
            variant="outlined"
            disabled={sourceKind === "none" || !sourceId}
            onClick={applySuggestions}
          >
            Apply suggestions
          </Button>
        </Stack>

        {template.detectedFields.length === 0 ? (
          <Alert severity="info">
            No placeholder fields detected in this template. The output will be a copy of the source file.
          </Alert>
        ) : (
          <Stack spacing={1}>
            {template.detectedFields.map((f) => {
              const suggestion = suggested[f.key];
              return (
                <Box key={f.key}>
                  <TextField
                    label={f.label || f.key}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    multiline
                    fullWidth
                    size="small"
                    helperText={
                      suggestion != null && suggestion !== ""
                        ? `Suggestion from source: ${suggestion.slice(0, 120)}${suggestion.length > 120 ? "…" : ""}`
                        : `Token: {{${f.key}}}`
                    }
                  />
                </Box>
              );
            })}
          </Stack>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => void doFill()} disabled={busy}>
          {busy ? "Filling…" : "Fill & download"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
