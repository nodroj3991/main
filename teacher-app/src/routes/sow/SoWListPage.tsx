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
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { nanoid } from "nanoid";
import { db } from "../../db/db";

export function SoWListPage(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [moduleId, setModuleId] = useState("");
  const [groupId, setGroupId] = useState("");

  const modules = useLiveQuery(() => db.modules.toArray(), []);
  const groups = useLiveQuery(() => db.groups.toArray(), []);
  const schemes = useLiveQuery(() => db.schemes.orderBy("updatedAt").reverse().toArray(), []);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h1">Schemes of Work</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpen(true)}>
          New scheme
        </Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Module</TableCell>
            <TableCell>Group</TableCell>
            <TableCell>Rows</TableCell>
            <TableCell>Updated</TableCell>
            <TableCell width={120}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {schemes?.map((s) => {
            const m = modules?.find((x) => x.id === s.moduleId);
            const g = groups?.find((x) => x.id === s.groupId);
            return (
              <TableRow key={s.id} hover>
                <TableCell>{m?.name ?? "—"}</TableCell>
                <TableCell>{g?.name ?? "—"}</TableCell>
                <TableCell>{s.rows.length}</TableCell>
                <TableCell>{new Date(s.updatedAt).toLocaleString()}</TableCell>
                <TableCell>
                  <IconButton component={Link} to={`/sow/${s.id}`} size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={async () => {
                      if (confirm("Delete this scheme?")) await db.schemes.delete(s.id);
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

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New scheme of work</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Module"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
            >
              {modules?.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Group"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              {groups?.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!moduleId || !groupId}
            onClick={async () => {
              await db.schemes.put({
                id: nanoid(8),
                moduleId,
                groupId,
                embeddedEqualityDiversity: "",
                embeddedLiteracy: "",
                embeddedNumeracy: "",
                embeddedIct: "",
                embeddedCharacterStrengths: "",
                rows: [],
                updatedAt: Date.now(),
              });
              setOpen(false);
              setModuleId("");
              setGroupId("");
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
