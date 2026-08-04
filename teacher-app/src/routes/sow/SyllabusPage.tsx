import { useState } from "react";
import {
  Box,
  Button,
  Chip,
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

export function SyllabusPage(): React.ReactElement {
  const modules = useLiveQuery(() => db.modules.toArray(), []);
  const [moduleId, setModuleId] = useState("");
  const [bulkText, setBulkText] = useState("");
  const points = useLiveQuery(
    async () =>
      moduleId
        ? await db.syllabusPoints.where("moduleId").equals(moduleId).sortBy("order")
        : [],
    [moduleId],
  );

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        Syllabus
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Add 30–40 syllabus points per module. Drag them into a Scheme of Work
        and they'll dim once placed.
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
        <TextField
          select
          label="Module"
          value={moduleId}
          onChange={(e) => setModuleId(e.target.value)}
          sx={{ minWidth: 280 }}
        >
          <MenuItem value="">— select —</MenuItem>
          {modules?.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.code ? `${m.code} · ` : ""}
              {m.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {moduleId && (
        <>
          <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
            <TextField
              label="Bulk add (one point per line)"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              multiline
              minRows={3}
              fullWidth
              placeholder={"AC1.1 Explain the meaning of animal welfare\nAC1.2 Summarise UK animal welfare legislation"}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!bulkText.trim()}
              onClick={async () => {
                const startOrder = (points?.length ?? 0);
                const lines = bulkText
                  .split("\n")
                  .map((l) => l.trim())
                  .filter(Boolean);
                await db.syllabusPoints.bulkPut(
                  lines.map((text, i) => {
                    const codeMatch = text.match(/^([A-Z]{1,4}\d[\d.]*)\s+/);
                    return {
                      id: nanoid(8),
                      moduleId,
                      code: codeMatch?.[1] ?? "",
                      text,
                      used: false,
                      order: startOrder + i,
                    };
                  }),
                );
                setBulkText("");
              }}
            >
              Add
            </Button>
          </Stack>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={48}>#</TableCell>
                <TableCell width={120}>Code</TableCell>
                <TableCell>Text</TableCell>
                <TableCell width={120}>Status</TableCell>
                <TableCell width={48} />
              </TableRow>
            </TableHead>
            <TableBody>
              {points?.map((p, i) => (
                <TableRow key={p.id} hover sx={{ opacity: p.used ? 0.5 : 1 }}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{p.code}</TableCell>
                  <TableCell>{p.text}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={p.used ? "used" : "available"}
                      color={p.used ? "default" : "primary"}
                      variant={p.used ? "outlined" : "filled"}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={async () => {
                        if (confirm("Delete this syllabus point?")) {
                          await db.syllabusPoints.delete(p.id);
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
        </>
      )}
    </Box>
  );
}
