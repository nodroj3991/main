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
import { Add as AddIcon, ContentCopy as CopyIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { nanoid } from "nanoid";
import { db } from "../../db/db";
import { formatHarvard, lookupDoi, lookupUrl, type RefMetadata } from "../../features/references/harvard";

export function ReferencesPage(): React.ReactElement {
  const [bulk, setBulk] = useState("");
  const [type, setType] = useState<"doi" | "url">("doi");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refs = useLiveQuery(() => db.references.orderBy("createdAt").reverse().toArray(), []);

  async function process() {
    setError(null);
    setWorking(true);
    try {
      const lines = bulk
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      for (const line of lines) {
        let meta: RefMetadata;
        try {
          meta = type === "doi" ? await lookupDoi(line) : await lookupUrl(line);
        } catch (e) {
          meta = type === "doi"
            ? { type: "journal-article", doi: line }
            : { type: "webpage", url: line, title: line };
          console.warn("Lookup failed", line, e);
        }
        await db.references.put({
          id: nanoid(8),
          moduleId: null,
          sourceType: type,
          raw: line,
          harvardFormatted: formatHarvard(meta),
          metadata: meta as unknown as Record<string, unknown>,
          createdAt: Date.now(),
        });
      }
      setBulk("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setWorking(false);
    }
  }

  function copyAll() {
    const text = (refs ?? []).map((r) => r.harvardFormatted).join("\n\n");
    navigator.clipboard.writeText(text);
  }

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        Reading List & References
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Paste a list of DOIs or URLs (one per line) and the system will fetch
        metadata and format each in Harvard style. URL lookups depend on the
        target site's CORS policy — fall back to a manual entry if blocked.
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
        <TextField
          select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as "doi" | "url")}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="doi">DOI</MenuItem>
          <MenuItem value="url">URL</MenuItem>
        </TextField>
        <TextField
          label="One per line"
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          multiline
          minRows={3}
          fullWidth
        />
        <Button startIcon={<AddIcon />} variant="contained" disabled={!bulk.trim() || working} onClick={process}>
          {working ? "Working…" : "Add"}
        </Button>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h3">References ({refs?.length ?? 0})</Typography>
        <Button size="small" startIcon={<CopyIcon />} onClick={copyAll} disabled={!refs?.length}>
          Copy all
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width={80}>Type</TableCell>
            <TableCell>Harvard</TableCell>
            <TableCell width={48} />
          </TableRow>
        </TableHead>
        <TableBody>
          {refs?.map((r) => (
            <TableRow key={r.id} hover>
              <TableCell>{r.sourceType}</TableCell>
              <TableCell sx={{ whiteSpace: "pre-wrap" }}>{r.harvardFormatted}</TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={async () => {
                    if (confirm("Delete this reference?")) await db.references.delete(r.id);
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
  );
}
