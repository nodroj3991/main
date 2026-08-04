import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { CloudUpload as UploadIcon, Download as DownloadIcon } from "@mui/icons-material";
import { downloadBlob, exportAll, importAll } from "../../db/io";

export function DataIoPage(): React.ReactElement {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        Import / Export
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Move your planning data between machines as a single JSON file.
        Templates and uploaded blobs are bundled in (base64-encoded). Settings
        (including your Anthropic key) are not exported.
      </Typography>

      <Stack spacing={3} sx={{ maxWidth: 600 }}>
        <Box>
          <Typography variant="h3" gutterBottom>
            Export
          </Typography>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={async () => {
              try {
                setError(null);
                const blob = await exportAll();
                downloadBlob(blob, `teacher-app-data-${new Date().toISOString().slice(0, 10)}.json`);
                setInfo("Export ready — download started.");
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              }
            }}
          >
            Export everything
          </Button>
        </Box>

        <Box>
          <Typography variant="h3" gutterBottom>
            Import
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              select
              label="Mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as "merge" | "replace")}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="merge">Merge (overwrite duplicates by id)</MenuItem>
              <MenuItem value="replace">Replace (clear first)</MenuItem>
            </TextField>
            <Button variant="outlined" startIcon={<UploadIcon />} component="label">
              Choose JSON
              <input
                type="file"
                accept="application/json"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setError(null);
                    if (mode === "replace" && !confirm("This will erase all current data. Continue?")) {
                      e.target.value = "";
                      return;
                    }
                    await importAll(file, mode);
                    setInfo("Import complete.");
                  } catch (err) {
                    setError(err instanceof Error ? err.message : String(err));
                  } finally {
                    e.target.value = "";
                  }
                }}
              />
            </Button>
          </Stack>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {info && <Alert severity="success" onClose={() => setInfo(null)}>{info}</Alert>}
      </Stack>
    </Box>
  );
}
