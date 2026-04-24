import { useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import { Add as AddIcon, Delete as DeleteIcon, Download as DownloadIcon } from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { nanoid } from "nanoid";
import { db } from "../../db/db";
import { downloadBlob } from "../../db/io";

export function GradebookPage(): React.ReactElement {
  const modules = useLiveQuery(() => db.modules.toArray(), []);
  const groups = useLiveQuery(() => db.groups.toArray(), []);
  const [groupId, setGroupId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const students = useLiveQuery(
    async () => (groupId ? await db.students.where("groupId").equals(groupId).toArray() : []),
    [groupId],
  );
  const grades = useLiveQuery(
    async () => (moduleId ? await db.grades.where("moduleId").equals(moduleId).toArray() : []),
    [moduleId],
  );

  const [title, setTitle] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");

  async function addColumn() {
    if (!moduleId || !groupId || !title.trim() || !students?.length) return;
    const rows = students.map((s) => ({
      id: nanoid(8),
      studentId: s.id,
      assessmentId: null,
      moduleId,
      title: title.trim(),
      marks: null,
      maxMarks: Number(maxMarks) || null,
      letter: "",
      feedback: "",
      recordedAt: Date.now(),
    }));
    await db.grades.bulkPut(rows);
    setTitle("");
  }

  const titles = Array.from(new Set((grades ?? []).map((g) => g.title))).sort();

  async function setMark(studentId: string, gradeTitle: string, marks: number | null) {
    const existing = (grades ?? []).find((g) => g.studentId === studentId && g.title === gradeTitle);
    if (existing) {
      await db.grades.put({ ...existing, marks });
    }
  }

  function exportCsv() {
    if (!students?.length) return;
    const header = ["Student", ...titles];
    const rows = [header];
    for (const s of students) {
      const row: string[] = [s.name];
      for (const t of titles) {
        const g = (grades ?? []).find((x) => x.studentId === s.id && x.title === t);
        row.push(g?.marks != null ? String(g.marks) : "");
      }
      rows.push(row);
    }
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const grp = groups?.find((g) => g.id === groupId)?.name ?? "group";
    const mod = modules?.find((m) => m.id === moduleId)?.name ?? "module";
    downloadBlob(new Blob([csv], { type: "text/csv" }), `gradebook-${grp}-${mod}.csv`.replace(/\s+/g, "-"));
  }

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        Gradebook
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Pick a group and module, add a grade column (an assessment or piece of
        coursework), fill in marks. Export the grid as CSV to merge into
        other systems.
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
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
          select
          label="Module"
          value={moduleId}
          onChange={(e) => setModuleId(e.target.value)}
          sx={{ minWidth: 260 }}
        >
          <MenuItem value="">—</MenuItem>
          {modules?.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.name}
            </MenuItem>
          ))}
        </TextField>
        <Button startIcon={<DownloadIcon />} onClick={exportCsv} disabled={!students?.length || titles.length === 0}>
          Export CSV
        </Button>
      </Stack>

      {groupId && moduleId && (
        <Stack direction="row" spacing={2} mb={2}>
          <TextField
            size="small"
            label="New column title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Unit 2 test"
          />
          <TextField
            size="small"
            label="Max marks"
            value={maxMarks}
            onChange={(e) => setMaxMarks(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            sx={{ width: 120 }}
          />
          <Button startIcon={<AddIcon />} variant="outlined" disabled={!title.trim()} onClick={addColumn}>
            Add column
          </Button>
        </Stack>
      )}

      {groupId && moduleId && students && students.length > 0 ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              {titles.map((t) => (
                <TableCell key={t} align="right">
                  <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="flex-end">
                    <span>{t}</span>
                    <IconButton
                      size="small"
                      onClick={async () => {
                        if (confirm(`Remove column "${t}"?`)) {
                          const ids = (grades ?? []).filter((g) => g.title === t).map((g) => g.id);
                          await db.grades.bulkDelete(ids);
                        }
                      }}
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.name}</TableCell>
                {titles.map((t) => {
                  const g = (grades ?? []).find((x) => x.studentId === s.id && x.title === t);
                  return (
                    <TableCell key={t} align="right">
                      <TextField
                        value={g?.marks ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "") {
                            void setMark(s.id, t, null);
                          } else if (/^\d+(\.\d+)?$/.test(v)) {
                            void setMark(s.id, t, Number(v));
                          }
                        }}
                        size="small"
                        variant="standard"
                        sx={{ width: 70 }}
                        inputProps={{ style: { textAlign: "right" } }}
                      />
                      {g?.maxMarks != null && (
                        <Typography component="span" variant="caption" color="text.secondary">
                          {" "}/ {g.maxMarks}
                        </Typography>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Alert severity="info">
          Select a group and a module to get started. Add students in the Groups
          & Roster tab.
        </Alert>
      )}
    </Box>
  );
}
