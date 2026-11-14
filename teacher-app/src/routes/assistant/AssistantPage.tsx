import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { Send as SendIcon } from "@mui/icons-material";
import { chat, type ChatTurn } from "../../features/assistant/client";
import { getCachedKey } from "../../features/assistant/secureKey";

export function AssistantPage(): React.ReactElement {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasKey = !!getCachedKey();

  async function send() {
    setError(null);
    const user = input.trim();
    if (!user) return;
    const next: ChatTurn[] = [...turns, { role: "user", content: user }];
    setTurns(next);
    setInput("");
    setBusy(true);
    abortRef.current = new AbortController();
    try {
      const reply = await chat(next, { signal: abortRef.current.signal });
      setTurns([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 96px)" }}>
      <Typography variant="h1" gutterBottom>
        AI Assistant
      </Typography>
      {!hasKey && (
        <Alert severity="info" sx={{ mb: 2 }}>
          The assistant needs an Anthropic API key. Add or unlock one in{" "}
          <Link to="/settings">Settings</Link>.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ flex: 1, overflow: "auto", p: 2, mb: 2, bgcolor: "#fafbfc" }}>
        {turns.length === 0 && (
          <Typography color="text.secondary">
            Ask me anything about lesson planning. Try: "Draft a 30-min session on the Five Freedoms for a Year 1 Animal Management group, including a halal-aware nutrition tie-in."
          </Typography>
        )}
        <Stack spacing={2}>
          {turns.map((t, i) => (
            <Box key={i} sx={{ display: "flex", justifyContent: t.role === "user" ? "flex-end" : "flex-start" }}>
              <Paper
                elevation={0}
                sx={{
                  maxWidth: "80%",
                  px: 2,
                  py: 1.2,
                  bgcolor: t.role === "user" ? "primary.main" : "background.paper",
                  color: t.role === "user" ? "primary.contrastText" : "text.primary",
                  border: t.role === "assistant" ? "1px solid #e1e4e8" : "none",
                  whiteSpace: "pre-wrap",
                  fontSize: "0.95rem",
                }}
              >
                {t.content}
              </Paper>
            </Box>
          ))}
          {busy && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Thinking…
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction="row" spacing={1}>
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Ask the assistant…"
          fullWidth
          multiline
          maxRows={4}
          disabled={!hasKey || busy}
        />
        <Button
          variant="contained"
          endIcon={<SendIcon />}
          onClick={() => void send()}
          disabled={!hasKey || busy || !input.trim()}
        >
          Send
        </Button>
      </Stack>
    </Box>
  );
}
