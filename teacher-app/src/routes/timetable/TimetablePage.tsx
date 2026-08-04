import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { nanoid } from "nanoid";
import { db } from "../../db/db";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function TimetablePage(): React.ReactElement {
  const groups = useLiveQuery(() => db.groups.toArray(), []);
  const modules = useLiveQuery(() => db.modules.toArray(), []);
  const slots = useLiveQuery(() => db.scheduleSlots.toArray(), []);
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [day, setDay] = useState(0);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [room, setRoom] = useState("");

  async function add() {
    if (!groupId) return;
    await db.scheduleSlots.put({
      id: nanoid(8),
      groupId,
      moduleId: moduleId || null,
      dayOfWeek: day,
      startTime: start,
      endTime: end,
      room,
      notes: "",
    });
    setOpen(false);
  }

  const byGroupDay: Record<string, Record<number, typeof slots>> = {};
  for (const s of slots ?? []) {
    byGroupDay[s.groupId] = byGroupDay[s.groupId] ?? {};
    byGroupDay[s.groupId][s.dayOfWeek] = [
      ...(byGroupDay[s.groupId][s.dayOfWeek] ?? []),
      s,
    ];
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h1">Timetable</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpen(true)}>
          New slot
        </Button>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Weekly grid of class slots per group. Each slot links an optional
        module and a room.
      </Typography>

      {groups?.length === 0 && (
        <Typography color="text.secondary">
          Create at least one group first — see the Groups & Roster tab.
        </Typography>
      )}

      <Stack spacing={3}>
        {groups?.map((g) => (
          <Paper key={g.id} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h3" gutterBottom>
              {g.name}
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 1 }}>
              {DAYS.map((d, i) => (
                <Box key={d}>
                  <Typography variant="overline" color="text.secondary">
                    {d}
                  </Typography>
                  <Stack spacing={1}>
                    {(byGroupDay[g.id]?.[i] ?? []).map((s) => {
                      const m = modules?.find((x) => x.id === s.moduleId);
                      return (
                        <Paper
                          key={s.id}
                          variant="outlined"
                          sx={{ p: 1, bgcolor: "#eef4ff", position: "relative" }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {s.startTime} – {s.endTime}
                          </Typography>
                          {m && <Typography variant="body2">{m.name}</Typography>}
                          {s.room && (
                            <Typography variant="caption" color="text.secondary">
                              Room {s.room}
                            </Typography>
                          )}
                          <IconButton
                            size="small"
                            sx={{ position: "absolute", top: 2, right: 2 }}
                            onClick={async () => {
                              await db.scheduleSlots.delete(s.id);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Paper>
                      );
                    })}
                    {!byGroupDay[g.id]?.[i]?.length && (
                      <Typography variant="caption" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </Stack>
                </Box>
              ))}
            </Box>
          </Paper>
        ))}
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New slot</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Group" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              {groups?.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Module (optional)"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
            >
              <MenuItem value="">— none —</MenuItem>
              {modules?.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Day"
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                sx={{ minWidth: 120 }}
              >
                {DAYS.map((d, i) => (
                  <MenuItem key={d} value={i}>
                    {d}
                  </MenuItem>
                ))}
              </TextField>
              <TextField label="Start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              <TextField label="End" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </Stack>
            <TextField label="Room" value={room} onChange={(e) => setRoom(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!groupId} onClick={add}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
