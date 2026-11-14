import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add as AddIcon, ArrowBack as BackIcon, Delete as DeleteIcon, Save as SaveIcon } from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useParams } from "react-router-dom";
import { nanoid } from "nanoid";
import { db } from "../../db/db";
import type { SchemeOfWork, SoWRow } from "../../db/schema";

export function SoWBuilderPage(): React.ReactElement {
  const { schemeId } = useParams<{ schemeId: string }>();
  const scheme = useLiveQuery(
    async () => (schemeId ? await db.schemes.get(schemeId) : undefined),
    [schemeId],
  );
  const points = useLiveQuery(
    async () =>
      scheme
        ? await db.syllabusPoints.where("moduleId").equals(scheme.moduleId).sortBy("order")
        : [],
    [scheme?.moduleId],
  );

  const [draft, setDraft] = useState<SchemeOfWork | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  useEffect(() => {
    if (scheme && (!draft || draft.id !== scheme.id)) {
      setDraft(scheme);
      setActiveRowId(null);
    }
  }, [scheme, draft]);

  if (!scheme || !draft) {
    return <Alert severity="info">Loading scheme…</Alert>;
  }

  const usedPointIds = new Set(draft.rows.flatMap((r) => r.syllabusPointIds));
  const availablePoints = (points ?? []).filter((p) => !usedPointIds.has(p.id));

  function updateRow(rowId: string, patch: Partial<SoWRow>) {
    setDraft((d) =>
      d
        ? {
            ...d,
            rows: d.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
          }
        : d,
    );
  }
  function addRow() {
    setDraft((d) =>
      d
        ? {
            ...d,
            rows: [
              ...d.rows,
              {
                id: nanoid(8),
                weekOrDate: `Week ${d.rows.length + 1}`,
                learningContent: "",
                differentiatedActivities: "",
                assessmentFeedback: "",
                location: "classroom",
                tools: [],
                syllabusPointIds: [],
              },
            ],
          }
        : d,
    );
  }
  function attachPoint(rowId: string, pointId: string) {
    setDraft((d) =>
      d
        ? {
            ...d,
            rows: d.rows.map((r) =>
              r.id === rowId
                ? { ...r, syllabusPointIds: [...r.syllabusPointIds, pointId] }
                : r,
            ),
          }
        : d,
    );
  }
  function detachPoint(rowId: string, pointId: string) {
    setDraft((d) =>
      d
        ? {
            ...d,
            rows: d.rows.map((r) =>
              r.id === rowId
                ? { ...r, syllabusPointIds: r.syllabusPointIds.filter((id) => id !== pointId) }
                : r,
            ),
          }
        : d,
    );
  }
  async function save() {
    if (!draft) return;
    const updated = { ...draft, updatedAt: Date.now() };
    await db.schemes.put(updated);
    const allUsed = new Set(updated.rows.flatMap((r) => r.syllabusPointIds));
    if (points) {
      const updates = points.map((p) => ({ ...p, used: allUsed.has(p.id) }));
      await db.syllabusPoints.bulkPut(updates);
    }
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" mb={2} spacing={1}>
        <IconButton component={Link} to="/sow">
          <BackIcon />
        </IconButton>
        <Typography variant="h1">Scheme of Work builder</Typography>
        <Box flex={1} />
        <Button startIcon={<SaveIcon />} variant="contained" onClick={save}>
          Save
        </Button>
      </Stack>

      <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
        <Box flex={2}>
          <Typography variant="h3" gutterBottom>
            Embedded skills
          </Typography>
          <Stack spacing={2} mb={3}>
            <TextField
              label="Equality, diversity & British Values"
              value={draft.embeddedEqualityDiversity}
              onChange={(e) => setDraft({ ...draft, embeddedEqualityDiversity: e.target.value })}
              multiline
              minRows={2}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Literacy"
                value={draft.embeddedLiteracy}
                onChange={(e) => setDraft({ ...draft, embeddedLiteracy: e.target.value })}
                multiline
                minRows={2}
                fullWidth
              />
              <TextField
                label="Numeracy"
                value={draft.embeddedNumeracy}
                onChange={(e) => setDraft({ ...draft, embeddedNumeracy: e.target.value })}
                multiline
                minRows={2}
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="ICT"
                value={draft.embeddedIct}
                onChange={(e) => setDraft({ ...draft, embeddedIct: e.target.value })}
                multiline
                minRows={2}
                fullWidth
              />
              <TextField
                label="Character Strengths"
                value={draft.embeddedCharacterStrengths}
                onChange={(e) => setDraft({ ...draft, embeddedCharacterStrengths: e.target.value })}
                multiline
                minRows={2}
                fullWidth
              />
            </Stack>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h3">Weeks / sessions</Typography>
            <Button startIcon={<AddIcon />} onClick={addRow}>
              Add week
            </Button>
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={120}>Week / date</TableCell>
                <TableCell>Learning content</TableCell>
                <TableCell>Differentiated activities</TableCell>
                <TableCell>Assessment & feedback</TableCell>
                <TableCell width={120}>Location</TableCell>
                <TableCell>Syllabus pts</TableCell>
                <TableCell width={48} />
              </TableRow>
            </TableHead>
            <TableBody>
              {draft.rows.map((r) => (
                <TableRow
                  key={r.id}
                  selected={activeRowId === r.id}
                  onClick={() => setActiveRowId(r.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <TextField
                      value={r.weekOrDate}
                      onChange={(e) => updateRow(r.id, { weekOrDate: e.target.value })}
                      size="small"
                      variant="standard"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={r.learningContent}
                      onChange={(e) => updateRow(r.id, { learningContent: e.target.value })}
                      size="small"
                      variant="standard"
                      fullWidth
                      multiline
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={r.differentiatedActivities}
                      onChange={(e) => updateRow(r.id, { differentiatedActivities: e.target.value })}
                      size="small"
                      variant="standard"
                      fullWidth
                      multiline
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={r.assessmentFeedback}
                      onChange={(e) => updateRow(r.id, { assessmentFeedback: e.target.value })}
                      size="small"
                      variant="standard"
                      fullWidth
                      multiline
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={r.location}
                      onChange={(e) => updateRow(r.id, { location: e.target.value })}
                      size="small"
                      variant="standard"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {r.syllabusPointIds.map((id) => {
                        const p = points?.find((x) => x.id === id);
                        return (
                          <Chip
                            key={id}
                            label={p?.code || (p?.text ?? id).slice(0, 18)}
                            size="small"
                            onDelete={() => detachPoint(r.id, id)}
                          />
                        );
                      })}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeRowId === r.id) setActiveRowId(null);
                        setDraft({ ...draft, rows: draft.rows.filter((x) => x.id !== r.id) });
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Box flex={1} sx={{ position: "sticky", top: 80, alignSelf: "flex-start" }}>
          <Typography variant="h3" gutterBottom>
            Available syllabus points
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {activeRowId
              ? `Attaching to: ${draft.rows.find((r) => r.id === activeRowId)?.weekOrDate ?? "selected week"}. Click a point to add it.`
              : "First click a week row on the left to select it, then click a point here to attach it to that week."}
          </Typography>
          <Stack spacing={0.5}>
            {availablePoints.length === 0 && (
              <Alert severity="success">All syllabus points are placed.</Alert>
            )}
            {availablePoints.map((p) => (
              <Chip
                key={p.id}
                label={`${p.code ? p.code + " · " : ""}${p.text}`}
                disabled={!activeRowId && draft.rows.length === 0}
                onClick={() => {
                  const target = activeRowId ?? draft.rows[draft.rows.length - 1]?.id;
                  if (target) attachPoint(target, p.id);
                  else alert("Add a week first using the Add week button.");
                }}
                sx={{ justifyContent: "flex-start", height: "auto", py: 0.5, "& .MuiChip-label": { whiteSpace: "normal" } }}
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
