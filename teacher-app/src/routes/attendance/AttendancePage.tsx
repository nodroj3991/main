import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import { Save as SaveIcon } from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { nanoid } from "nanoid";
import { db } from "../../db/db";
import type { AttendanceEntry } from "../../db/schema";
import { ATTENDANCE_STATUSES, type AttendanceStatus } from "../../constants";

export function AttendancePage(): React.ReactElement {
  const groups = useLiveQuery(() => db.groups.toArray(), []);
  const [groupId, setGroupId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const students = useLiveQuery(
    async () => (groupId ? await db.students.where("groupId").equals(groupId).toArray() : []),
    [groupId],
  );
  const existing = useLiveQuery(
    async () =>
      groupId
        ? await db.attendance
            .where("groupId").equals(groupId)
            .and((r) => r.date === date)
            .first()
        : undefined,
    [groupId, date],
  );
  const [entries, setEntries] = useState<Record<string, AttendanceEntry>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, AttendanceEntry> = {};
    for (const s of students ?? []) {
      const prior = existing?.entries.find((e) => e.studentId === s.id);
      next[s.id] = prior ?? { studentId: s.id, status: "present", note: "" };
    }
    setEntries(next);
  }, [students, existing]);

  async function save() {
    if (!groupId || !students?.length) return;
    const payload = {
      id: existing?.id ?? nanoid(8),
      groupId,
      sessionId: null,
      date,
      entries: Object.values(entries),
      recordedAt: Date.now(),
    };
    await db.attendance.put(payload);
    setMessage("Saved.");
    setTimeout(() => setMessage(null), 2000);
  }

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        Attendance
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Quick register per group per date. One row per student, with optional
        note.
      </Typography>

      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <TextField
          select
          label="Group"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">—</MenuItem>
          {groups?.map((g) => (
            <MenuItem key={g.id} value={g.id}>
              {g.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          type="date"
          label="Date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button variant="contained" startIcon={<SaveIcon />} disabled={!groupId || !students?.length} onClick={save}>
          Save register
        </Button>
      </Stack>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {groupId && students && students.length > 0 ? (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell width={180}>Status</TableCell>
                <TableCell>Note</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((s) => {
                const e = entries[s.id];
                return (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>
                      <TextField
                        select
                        value={e?.status ?? "present"}
                        onChange={(ev) =>
                          setEntries((m) => ({
                            ...m,
                            [s.id]: { ...(m[s.id] ?? { studentId: s.id, note: "" }), status: ev.target.value as AttendanceStatus },
                          }))
                        }
                        size="small"
                        variant="standard"
                        fullWidth
                      >
                        {ATTENDANCE_STATUSES.map((st) => (
                          <MenuItem key={st} value={st}>
                            {st}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={e?.note ?? ""}
                        onChange={(ev) =>
                          setEntries((m) => ({
                            ...m,
                            [s.id]: { ...(m[s.id] ?? { studentId: s.id, status: "present" }), note: ev.target.value },
                          }))
                        }
                        size="small"
                        variant="standard"
                        fullWidth
                        placeholder="optional"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      ) : (
        <Alert severity="info">Select a group with students to mark attendance.</Alert>
      )}
    </Box>
  );
}
