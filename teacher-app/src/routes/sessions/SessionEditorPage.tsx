import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowBack as BackIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useParams } from "react-router-dom";
import { db } from "../../db/db";
import type { Session } from "../../db/schema";
import {
  CHARACTER_STRENGTHS,
  CHARACTER_STRENGTH_LABELS,
  SESSION_LOCATIONS,
  TMC_MARKERS,
  TMC_PHASES,
  TMC_PHASE_COLORS,
  TMC_PHASE_LABELS,
  type TmcMarker,
  type TmcPhase,
} from "../../constants";

function insertAtCaret(
  textarea: HTMLTextAreaElement,
  toInsert: string,
): { value: string; cursor: number } {
  const { selectionStart, selectionEnd, value } = textarea;
  const next = value.slice(0, selectionStart) + toInsert + value.slice(selectionEnd);
  return { value: next, cursor: selectionStart + toInsert.length };
}

function MarkerBar({
  onInsert,
}: {
  onInsert: (marker: string) => void;
}): React.ReactElement {
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {(Object.keys(TMC_MARKERS) as TmcMarker[]).map((m) => (
        <Tooltip key={m} title={TMC_MARKERS[m].description}>
          <Chip
            label={`[${m}] ${TMC_MARKERS[m].label}`}
            size="small"
            onClick={() => onInsert(`[${m}] `)}
            sx={{ cursor: "pointer" }}
          />
        </Tooltip>
      ))}
    </Stack>
  );
}

function PhasePanel({
  phase,
  value,
  onChange,
}: {
  phase: TmcPhase;
  value: string;
  onChange: (v: string) => void;
}): React.ReactElement {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderTop: `4px solid ${TMC_PHASE_COLORS[phase]}`,
        borderRadius: 1,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {TMC_PHASE_LABELS[phase]}
        </Typography>
        <MarkerBar
          onInsert={(m) => {
            const t = ref.current;
            if (!t) {
              onChange(value + m);
              return;
            }
            const { value: v, cursor } = insertAtCaret(t, m);
            onChange(v);
            requestAnimationFrame(() => {
              t.focus();
              t.setSelectionRange(cursor, cursor);
            });
          }}
        />
      </Stack>
      <TextField
        inputRef={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        multiline
        minRows={3}
        fullWidth
        placeholder={`What happens in the ${TMC_PHASE_LABELS[phase]} phase…`}
      />
    </Paper>
  );
}

export function SessionEditorPage(): React.ReactElement {
  const { sessionId } = useParams<{ sessionId: string }>();
  const session = useLiveQuery(
    async () => (sessionId ? await db.sessions.get(sessionId) : undefined),
    [sessionId],
  );
  const schemes = useLiveQuery(() => db.schemes.toArray(), []);
  const modules = useLiveQuery(() => db.modules.toArray(), []);
  const groups = useLiveQuery(() => db.groups.toArray(), []);

  const [draft, setDraft] = useState<Session | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session && (!draft || draft.id !== session.id)) {
      setDraft(session);
    }
  }, [session, draft]);

  if (!session || !draft) return <Alert severity="info">Loading session…</Alert>;

  const scheme = schemes?.find((s) => s.id === draft.schemeOfWorkId);
  const module = modules?.find((m) => m.id === scheme?.moduleId);
  const group = groups?.find((g) => g.id === scheme?.groupId);

  function update<K extends keyof Session>(key: K, value: Session[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }
  function updatePhase(phase: TmcPhase, value: string) {
    setDraft((d) => (d ? { ...d, phases: { ...d.phases, [phase]: value } } : d));
  }
  function updateCs(key: keyof Session["characterStrengths"], value: boolean) {
    setDraft((d) =>
      d ? { ...d, characterStrengths: { ...d.characterStrengths, [key]: value } } : d,
    );
  }

  async function save() {
    if (!draft) return;
    const updated = { ...draft, updatedAt: Date.now() };
    await db.sessions.put(updated);
    setMessage("Saved.");
    setTimeout(() => setMessage(null), 2000);
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" mb={2} spacing={1}>
        <IconButton component={Link} to="/sessions">
          <BackIcon />
        </IconButton>
        <Box flex={1}>
          <Typography variant="h1" component="div">
            Session editor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {module?.name ?? "—"} · {group?.name ?? "—"}
            {draft.week ? ` · ${draft.week}` : ""}
          </Typography>
        </Box>
        <Button startIcon={<SaveIcon />} variant="contained" onClick={save}>
          Save
        </Button>
      </Stack>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h3" gutterBottom>
            Header
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
            <TextField
              label="Unit"
              value={draft.unit}
              onChange={(e) => update("unit", e.target.value)}
              fullWidth
            />
            <TextField
              label="Week"
              value={draft.week}
              onChange={(e) => update("week", e.target.value)}
              fullWidth
            />
            <TextField
              label="Date"
              type="date"
              value={draft.date ?? ""}
              onChange={(e) => update("date", e.target.value || null)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Duration (min)"
              type="number"
              value={draft.durationMin}
              onChange={(e) => update("durationMin", Number(e.target.value) || 30)}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
            <TextField
              select
              label="Location"
              value={draft.location}
              onChange={(e) => update("location", e.target.value as Session["location"])}
              sx={{ minWidth: 200 }}
            >
              {SESSION_LOCATIONS.map((l) => (
                <MenuItem key={l} value={l}>
                  {l}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Location detail (e.g. Farm A, Room 2.14)"
              value={draft.locationDetail}
              onChange={(e) => update("locationDetail", e.target.value)}
              fullWidth
            />
          </Stack>

          <Typography variant="subtitle2" gutterBottom>
            Group start checks
          </Typography>
          <Stack direction="row" spacing={2} mb={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={draft.groupChecks.register}
                  onChange={(e) =>
                    update("groupChecks", { ...draft.groupChecks, register: e.target.checked })
                  }
                />
              }
              label="Register for group"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={draft.groupChecks.reportMissing}
                  onChange={(e) =>
                    update("groupChecks", { ...draft.groupChecks, reportMissing: e.target.checked })
                  }
                />
              }
              label="Report missing learners"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={draft.groupChecks.checkPpe}
                  onChange={(e) =>
                    update("groupChecks", { ...draft.groupChecks, checkPpe: e.target.checked })
                  }
                />
              }
              label="Check PPE"
            />
          </Stack>

          <Typography variant="subtitle2" gutterBottom>
            Lesson objectives
          </Typography>
          <Stack spacing={1}>
            {draft.lessonObjectives.map((o, i) => (
              <Stack key={i} direction="row" spacing={1} alignItems="center">
                <TextField
                  value={o}
                  onChange={(e) => {
                    const next = [...draft.lessonObjectives];
                    next[i] = e.target.value;
                    update("lessonObjectives", next);
                  }}
                  fullWidth
                  size="small"
                />
                <IconButton
                  size="small"
                  onClick={() =>
                    update(
                      "lessonObjectives",
                      draft.lessonObjectives.filter((_, j) => j !== i),
                    )
                  }
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => update("lessonObjectives", [...draft.lessonObjectives, ""])}
              sx={{ alignSelf: "flex-start" }}
            >
              Add objective
            </Button>
          </Stack>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Tools
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {draft.tools.map((t, i) => (
              <Chip
                key={`${t}-${i}`}
                label={t}
                onDelete={() => update("tools", draft.tools.filter((_, j) => j !== i))}
              />
            ))}
            <TextField
              size="small"
              placeholder="Add tool (e.g. paper, computer)"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v) {
                    update("tools", [...draft.tools, v]);
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
              sx={{ minWidth: 220 }}
            />
          </Stack>
        </Paper>

        <Box>
          <Typography variant="h3" gutterBottom>
            TMC lesson phases
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use the chips to insert TMC markers in line:{" "}
            <code>[C]</code> connect · <code>[R]</code> reflection ·{" "}
            <code>[T]</code> tutor-led · <code>[L]</code> learner-led ·{" "}
            <code>[?]</code> direct questioning.
          </Typography>
          <Stack spacing={2}>
            {TMC_PHASES.map((p) => (
              <PhasePanel
                key={p}
                phase={p}
                value={draft.phases[p]}
                onChange={(v) => updatePhase(p, v)}
              />
            ))}
          </Stack>
        </Box>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h3" gutterBottom>
            Embedded skills
          </Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Maths"
                value={draft.embeddedMaths}
                onChange={(e) => update("embeddedMaths", e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
              <TextField
                label="English"
                value={draft.embeddedEnglish}
                onChange={(e) => update("embeddedEnglish", e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="British Values"
                value={draft.embeddedBritishValues}
                onChange={(e) => update("embeddedBritishValues", e.target.value)}
                placeholder="democracy, rule of law, individual liberty, mutual respect, tolerance"
                multiline
                minRows={2}
                fullWidth
              />
              <TextField
                label="Differentiation"
                value={draft.embeddedDifferentiation}
                onChange={(e) => update("embeddedDifferentiation", e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="ICT / digital literacy"
                value={draft.embeddedIct}
                onChange={(e) => update("embeddedIct", e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
              <TextField
                label="Career links"
                value={draft.careerLinks}
                onChange={(e) => update("careerLinks", e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h3" gutterBottom>
            Character Strengths
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {CHARACTER_STRENGTHS.map((cs) => (
              <FormControlLabel
                key={cs}
                control={
                  <Checkbox
                    checked={draft.characterStrengths[cs]}
                    onChange={(e) => updateCs(cs, e.target.checked)}
                  />
                }
                label={CHARACTER_STRENGTH_LABELS[cs]}
              />
            ))}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h3" gutterBottom>
            Notes
          </Typography>
          <TextField
            value={draft.notes}
            onChange={(e) => update("notes", e.target.value)}
            multiline
            minRows={3}
            fullWidth
            placeholder="Anything that doesn't fit elsewhere…"
          />
        </Paper>

        <Divider />
        <Stack direction="row" justifyContent="flex-end">
          <Button startIcon={<SaveIcon />} variant="contained" onClick={save}>
            Save session
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
