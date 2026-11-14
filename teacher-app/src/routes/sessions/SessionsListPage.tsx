import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  AutoFixHigh as GenerateIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { nanoid } from "nanoid";
import { db } from "../../db/db";
import type { Session } from "../../db/schema";
import { CHARACTER_STRENGTHS, TMC_PHASES } from "../../constants";

function emptySession(): Partial<Session> {
  return {
    unit: "",
    week: "",
    date: null,
    durationMin: 30,
    location: "classroom",
    locationDetail: "",
    tools: [],
    lessonObjectives: [],
    phases: Object.fromEntries(TMC_PHASES.map((p) => [p, ""])) as Session["phases"],
    embeddedMaths: "",
    embeddedEnglish: "",
    embeddedBritishValues: "",
    embeddedDifferentiation: "",
    embeddedIct: "",
    careerLinks: "",
    characterStrengths: Object.fromEntries(
      CHARACTER_STRENGTHS.map((s) => [s, false]),
    ) as Session["characterStrengths"],
    groupChecks: { register: false, reportMissing: false, checkPpe: false },
    notes: "",
  };
}

export function SessionsListPage(): React.ReactElement {
  const [message, setMessage] = useState<string | null>(null);

  const sessions = useLiveQuery(() => db.sessions.orderBy("updatedAt").reverse().toArray(), []);
  const schemes = useLiveQuery(() => db.schemes.toArray(), []);
  const modules = useLiveQuery(() => db.modules.toArray(), []);
  const groups = useLiveQuery(() => db.groups.toArray(), []);

  async function generateFromScheme(schemeId: string) {
    const scheme = await db.schemes.get(schemeId);
    if (!scheme) return;
    const existing = await db.sessions.where("schemeOfWorkId").equals(schemeId).toArray();
    const existingRowIds = new Set(existing.map((s) => s.sowRowId).filter(Boolean));
    const toCreate: Session[] = [];
    for (const row of scheme.rows) {
      if (existingRowIds.has(row.id)) continue;
      toCreate.push({
        id: nanoid(8),
        schemeOfWorkId: schemeId,
        sowRowId: row.id,
        ...(emptySession() as Omit<Session, "id" | "schemeOfWorkId" | "sowRowId" | "updatedAt">),
        week: row.weekOrDate,
        location: (row.location || "classroom") as Session["location"],
        tools: row.tools,
        lessonObjectives: row.learningContent ? [row.learningContent] : [],
        notes: row.assessmentFeedback || "",
        updatedAt: Date.now(),
      });
    }
    if (toCreate.length === 0) {
      setMessage("All scheme rows already have sessions.");
      return;
    }
    await db.sessions.bulkPut(toCreate);
    setMessage(`Created ${toCreate.length} session${toCreate.length === 1 ? "" : "s"}.`);
  }

  async function createBlank() {
    const firstScheme = schemes?.[0];
    if (!firstScheme) {
      alert("Create a Scheme of Work first.");
      return;
    }
    const id = nanoid(8);
    await db.sessions.put({
      id,
      schemeOfWorkId: firstScheme.id,
      sowRowId: null,
      ...(emptySession() as Omit<Session, "id" | "schemeOfWorkId" | "sowRowId" | "updatedAt">),
      updatedAt: Date.now(),
    });
    window.location.hash = `#/sessions/${id}`;
  }

  function labelForScheme(schemeId: string): string {
    const s = schemes?.find((x) => x.id === schemeId);
    if (!s) return "—";
    const m = modules?.find((x) => x.id === s.moduleId);
    const g = groups?.find((x) => x.id === s.groupId);
    return `${m?.name ?? "?"} · ${g?.name ?? "?"}`;
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h1">Sessions / Lesson Plans</Typography>
        <Button variant="contained" onClick={createBlank}>
          New blank session
        </Button>
      </Stack>

      <Typography color="text.secondary" sx={{ mb: 2 }}>
        One session per row of a Scheme of Work. Click <strong>Generate</strong>{" "}
        on a scheme to create a session stub for every row in one go.
      </Typography>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}

      <Typography variant="h3" gutterBottom>
        Schemes — generate sessions
      </Typography>
      <Table size="small" sx={{ mb: 4 }}>
        <TableHead>
          <TableRow>
            <TableCell>Module · Group</TableCell>
            <TableCell>Rows</TableCell>
            <TableCell width={180} />
          </TableRow>
        </TableHead>
        <TableBody>
          {schemes?.map((s) => (
            <TableRow key={s.id} hover>
              <TableCell>{labelForScheme(s.id)}</TableCell>
              <TableCell>{s.rows.length}</TableCell>
              <TableCell>
                <Button
                  size="small"
                  startIcon={<GenerateIcon />}
                  onClick={() => void generateFromScheme(s.id)}
                >
                  Generate
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {schemes?.length === 0 && (
            <TableRow>
              <TableCell colSpan={3}>
                <Typography color="text.secondary">No schemes yet. Create one on the Schemes of Work tab.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Typography variant="h3" gutterBottom>
        Sessions
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Week</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Scheme</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Updated</TableCell>
            <TableCell width={120} />
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions?.map((s) => (
            <TableRow key={s.id} hover>
              <TableCell>{s.week || "—"}</TableCell>
              <TableCell>{s.unit || "—"}</TableCell>
              <TableCell>{labelForScheme(s.schemeOfWorkId)}</TableCell>
              <TableCell>{s.location}</TableCell>
              <TableCell>{s.durationMin} min</TableCell>
              <TableCell>{new Date(s.updatedAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <IconButton component={Link} to={`/sessions/${s.id}`} size="small">
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={async () => {
                    if (confirm("Delete this session?")) await db.sessions.delete(s.id);
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
                <Typography color="text.secondary">No sessions yet. Generate them from a scheme above.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
}
