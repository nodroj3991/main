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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { nanoid } from "nanoid";
import { db } from "../../db/db";
import { AGE_GROUPS, ATTENDANCE_MODES, type AgeGroup, type AttendanceMode } from "../../constants";

export function GroupsPage(): React.ReactElement {
  const courses = useLiveQuery(() => db.courses.toArray(), []);
  const groups = useLiveQuery(() => db.groups.orderBy("createdAt").toArray(), []);
  const [selectedGroup, setSelectedGroup] = useState("");
  const students = useLiveQuery(
    async () =>
      selectedGroup
        ? await db.students.where("groupId").equals(selectedGroup).toArray()
        : [],
    [selectedGroup],
  );

  const [groupOpen, setGroupOpen] = useState(false);
  const [studentOpen, setStudentOpen] = useState(false);

  const [gName, setGName] = useState("");
  const [gCourse, setGCourse] = useState("");
  const [gAge, setGAge] = useState<AgeGroup>("16-18");
  const [gNum, setGNum] = useState("0");
  const [gLdd, setGLdd] = useState("0");
  const [gMode, setGMode] = useState<AttendanceMode>("Full time");

  const [sName, setSName] = useState("");

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h1">Groups & Roster</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setGroupOpen(true)}>
          New group
        </Button>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        <Box flex={1}>
          <Typography variant="h3" gutterBottom>
            Groups
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>Learners</TableCell>
                <TableCell width={48} />
              </TableRow>
            </TableHead>
            <TableBody>
              {groups?.map((g) => {
                const c = courses?.find((x) => x.id === g.courseId);
                return (
                  <TableRow
                    key={g.id}
                    hover
                    selected={selectedGroup === g.id}
                    onClick={() => setSelectedGroup(g.id)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>{g.name}</TableCell>
                    <TableCell>{c?.name ?? "—"}</TableCell>
                    <TableCell>{g.ageGroup}</TableCell>
                    <TableCell>{g.mode}</TableCell>
                    <TableCell>{g.numLearners}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`Delete group "${g.name}" and its students?`)) {
                            const ss = await db.students.where("groupId").equals(g.id).toArray();
                            await db.students.bulkDelete(ss.map((x) => x.id));
                            await db.groups.delete(g.id);
                            if (selectedGroup === g.id) setSelectedGroup("");
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>

        <Box flex={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h3">Students</Typography>
            <Button
              startIcon={<AddIcon />}
              size="small"
              disabled={!selectedGroup}
              onClick={() => setStudentOpen(true)}
            >
              Add student
            </Button>
          </Stack>
          {!selectedGroup ? (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              Select a group on the left to manage its students.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell width={48} />
                </TableRow>
              </TableHead>
              <TableBody>
                {students?.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={async () => {
                          if (confirm(`Remove ${s.name}?`)) await db.students.delete(s.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Stack>

      <Dialog open={groupOpen} onClose={() => setGroupOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New group</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Group name" value={gName} onChange={(e) => setGName(e.target.value)} autoFocus />
            <TextField select label="Course" value={gCourse} onChange={(e) => setGCourse(e.target.value)}>
              {courses?.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField select label="Age group" value={gAge} onChange={(e) => setGAge(e.target.value as AgeGroup)} fullWidth>
                {AGE_GROUPS.map((a) => (
                  <MenuItem key={a} value={a}>
                    {a}
                  </MenuItem>
                ))}
              </TextField>
              <TextField select label="Mode" value={gMode} onChange={(e) => setGMode(e.target.value as AttendanceMode)} fullWidth>
                {ATTENDANCE_MODES.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Number of learners"
                value={gNum}
                onChange={(e) => setGNum(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                fullWidth
              />
              <TextField
                label="With LDD/EHCP"
                value={gLdd}
                onChange={(e) => setGLdd(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!gName.trim() || !gCourse}
            onClick={async () => {
              await db.groups.put({
                id: nanoid(8),
                courseId: gCourse,
                name: gName,
                ageGroup: gAge,
                numLearners: Number(gNum) || 0,
                numLddEhcp: Number(gLdd) || 0,
                mode: gMode,
                startDate: null,
                finishDate: null,
                preparedBy: "",
                createdAt: Date.now(),
              });
              setGroupOpen(false);
              setGName("");
              setGCourse("");
              setGNum("0");
              setGLdd("0");
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={studentOpen} onClose={() => setStudentOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add student</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={sName}
            onChange={(e) => setSName(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!sName.trim()}
            onClick={async () => {
              await db.students.put({
                id: nanoid(8),
                groupId: selectedGroup,
                name: sName,
                dob: null,
                guardianContact: "",
                notes: "",
                createdAt: Date.now(),
              });
              setSName("");
              setStudentOpen(false);
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
