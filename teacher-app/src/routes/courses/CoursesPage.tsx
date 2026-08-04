import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { nanoid } from "nanoid";
import { db } from "../../db/db";
import type { Course, Module } from "../../db/schema";

function CourseDialog({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Course;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [level, setLevel] = useState(initial?.level ?? "");
  const [body, setBody] = useState(initial?.awardingBody ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? "Edit course" : "New course"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Course name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <TextField label="Level" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="e.g. Level 3" />
          <TextField label="Awarding body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="e.g. City & Guilds" />
          <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!name.trim()}
          onClick={async () => {
            if (initial) {
              await db.courses.put({ ...initial, name, level, awardingBody: body, notes });
            } else {
              await db.courses.put({
                id: nanoid(8),
                name,
                level,
                awardingBody: body,
                notes,
                createdAt: Date.now(),
              });
            }
            onClose();
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ModuleDialog({
  open,
  onClose,
  courseId,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  initial?: Module;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [credits, setCredits] = useState<string>(
    initial?.credits != null ? String(initial.credits) : "",
  );
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? "Edit module" : "New module"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Module name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <TextField label="Code" value={code} onChange={(e) => setCode(e.target.value)} />
          <TextField
            label="Credits"
            value={credits}
            onChange={(e) => setCredits(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!name.trim()}
          onClick={async () => {
            const credNum = credits ? Number(credits) : null;
            if (initial) {
              await db.modules.put({ ...initial, name, code, credits: credNum });
            } else {
              await db.modules.put({
                id: nanoid(8),
                courseId,
                name,
                code,
                credits: credNum,
                notes: "",
                createdAt: Date.now(),
              });
            }
            onClose();
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function CoursesPage(): React.ReactElement {
  const [courseDialog, setCourseDialog] = useState<{ open: boolean; course?: Course }>({ open: false });
  const [moduleDialog, setModuleDialog] = useState<{ open: boolean; courseId: string; module?: Module }>({
    open: false,
    courseId: "",
  });
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  const courses = useLiveQuery(() => db.courses.orderBy("createdAt").toArray(), []);
  const modules = useLiveQuery(
    () => (selectedCourse ? db.modules.where("courseId").equals(selectedCourse).toArray() : []),
    [selectedCourse],
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h1">Courses & Modules</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setCourseDialog({ open: true })}>
          New course
        </Button>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        <Box flex={1}>
          <Typography variant="h3" gutterBottom>
            Courses
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Awarding body</TableCell>
                <TableCell width={48} />
              </TableRow>
            </TableHead>
            <TableBody>
              {courses?.map((c) => (
                <TableRow
                  key={c.id}
                  hover
                  selected={selectedCourse === c.id}
                  onClick={() => setSelectedCourse(c.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.level}</TableCell>
                  <TableCell>{c.awardingBody}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete course "${c.name}" and its modules?`)) {
                          const mods = await db.modules.where("courseId").equals(c.id).toArray();
                          await db.modules.bulkDelete(mods.map((m) => m.id));
                          await db.courses.delete(c.id);
                          if (selectedCourse === c.id) setSelectedCourse("");
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
        </Box>

        <Box flex={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h3">
              Modules
              {selectedCourse && courses
                ? ` · ${courses.find((c) => c.id === selectedCourse)?.name ?? ""}`
                : ""}
            </Typography>
            <Button
              startIcon={<AddIcon />}
              size="small"
              disabled={!selectedCourse}
              onClick={() => setModuleDialog({ open: true, courseId: selectedCourse })}
            >
              New module
            </Button>
          </Stack>
          {!selectedCourse ? (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              Select a course on the left to see its modules.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Credits</TableCell>
                  <TableCell width={48} />
                </TableRow>
              </TableHead>
              <TableBody>
                {modules?.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell>{m.code}</TableCell>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.credits ?? ""}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={async () => {
                          if (confirm(`Delete module "${m.name}"?`)) {
                            await db.modules.delete(m.id);
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
          )}
        </Box>
      </Stack>

      {courseDialog.open && (
        <CourseDialog
          open
          onClose={() => setCourseDialog({ open: false })}
          initial={courseDialog.course}
        />
      )}
      {moduleDialog.open && (
        <ModuleDialog
          open
          onClose={() => setModuleDialog({ open: false, courseId: "" })}
          courseId={moduleDialog.courseId}
          initial={moduleDialog.module}
        />
      )}
    </Box>
  );
}
