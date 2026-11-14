import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Slideshow as SlideshowIcon } from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { downloadBlob } from "../../db/io";
import { buildDeckForSession } from "../../features/pptgen/deckBuilder";

export function DecksPage(): React.ReactElement {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const sessions = useLiveQuery(() => db.sessions.orderBy("updatedAt").reverse().toArray(), []);
  const schemes = useLiveQuery(() => db.schemes.toArray(), []);
  const modules = useLiveQuery(() => db.modules.toArray(), []);
  const groups = useLiveQuery(() => db.groups.toArray(), []);
  const settings = useLiveQuery(() => db.settings.get("settings"), []);

  async function generate(sessionId: string) {
    setError(null);
    setBusyId(sessionId);
    try {
      const session = await db.sessions.get(sessionId);
      if (!session) throw new Error("Session not found.");
      const scheme = await db.schemes.get(session.schemeOfWorkId);
      const module = scheme ? await db.modules.get(scheme.moduleId) : undefined;
      const group = scheme ? await db.groups.get(scheme.groupId) : undefined;
      const blob = await buildDeckForSession(session, {
        module,
        group,
        schoolName: settings?.schoolName,
        preparedBy: settings?.defaultPreparedBy,
      });
      const safe = `${module?.name ?? "session"}-${session.week || session.unit || session.id}`
        .replace(/[^a-zA-Z0-9-]+/g, "-")
        .replace(/-+/g, "-");
      downloadBlob(blob, `${safe}.pptx`);
      setMessage("Deck generated.");
      setTimeout(() => setMessage(null), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  function sessionLabel(schemeOfWorkId: string): string {
    const s = schemes?.find((x) => x.id === schemeOfWorkId);
    if (!s) return "—";
    const m = modules?.find((x) => x.id === s.moduleId);
    const g = groups?.find((x) => x.id === s.groupId);
    return `${m?.name ?? "?"} · ${g?.name ?? "?"}`;
  }

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        PPT Decks
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Generates a PowerPoint (.pptx) deck for any session: title slide,
        one colour-coded slide per TMC phase, plus embedded skills and
        character strengths slides. Open in PowerPoint / Keynote / Google
        Slides.
      </Typography>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Week</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Scheme</TableCell>
            <TableCell>Updated</TableCell>
            <TableCell width={180} />
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions?.map((s) => (
            <TableRow key={s.id} hover>
              <TableCell>{s.week || "—"}</TableCell>
              <TableCell>{s.unit || "—"}</TableCell>
              <TableCell>{sessionLabel(s.schemeOfWorkId)}</TableCell>
              <TableCell>{new Date(s.updatedAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<SlideshowIcon />}
                    disabled={busyId === s.id}
                    onClick={() => void generate(s.id)}
                  >
                    {busyId === s.id ? "Generating…" : "Generate"}
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          {sessions?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography color="text.secondary">
                  No sessions yet. Create a Scheme of Work, generate sessions from it, then come back here.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
}
