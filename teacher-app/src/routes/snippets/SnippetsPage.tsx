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
import { Add as AddIcon, ContentCopy as CopyIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { nanoid } from "nanoid";
import { db } from "../../db/db";
import type { Snippet } from "../../db/schema";

const TYPES: Snippet["type"][] = ["learning-outcome", "objective", "activity", "assessment", "free"];

export function SnippetsPage(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<Snippet["type"]>("learning-outcome");
  const [body, setBody] = useState("");
  const snippets = useLiveQuery(() => db.snippets.orderBy("createdAt").reverse().toArray(), []);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h1">Reusable Snippets</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpen(true)}>
          New snippet
        </Button>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Save chunks of text — learning outcomes, common activities, assessment
        criteria — and reuse them anywhere with one click.
      </Typography>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width={200}>Name</TableCell>
            <TableCell width={140}>Type</TableCell>
            <TableCell>Body</TableCell>
            <TableCell width={100} />
          </TableRow>
        </TableHead>
        <TableBody>
          {snippets?.map((s) => (
            <TableRow key={s.id} hover>
              <TableCell>{s.name}</TableCell>
              <TableCell>{s.type}</TableCell>
              <TableCell sx={{ whiteSpace: "pre-wrap" }}>{s.body}</TableCell>
              <TableCell>
                <IconButton size="small" onClick={() => navigator.clipboard.writeText(s.body)}>
                  <CopyIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={async () => {
                    if (confirm(`Delete "${s.name}"?`)) await db.snippets.delete(s.id);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New snippet</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <TextField select label="Type" value={type} onChange={(e) => setType(e.target.value as Snippet["type"])}>
              {TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Body" value={body} onChange={(e) => setBody(e.target.value)} multiline minRows={4} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!name.trim() || !body.trim()}
            onClick={async () => {
              await db.snippets.put({
                id: nanoid(8),
                name,
                type,
                body,
                tags: [],
                moduleId: null,
                createdAt: Date.now(),
              });
              setOpen(false);
              setName("");
              setBody("");
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
