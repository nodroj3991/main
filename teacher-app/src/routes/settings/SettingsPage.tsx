import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import {
  cacheKey,
  clearKey,
  getCachedKey,
  getDecryptedKey,
  hasStoredKey,
  setEncryptedKey,
} from "../../features/assistant/secureKey";

const MODELS = [
  { id: "claude-opus-4-7", label: "Claude Opus 4.7 (most capable)" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (recommended balance)" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (fast & cheap)" },
];

export function SettingsPage(): React.ReactElement {
  const settings = useLiveQuery(() => db.settings.get("settings"), []);
  const [school, setSchool] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [fastModel, setFastModel] = useState("claude-haiku-4-5-20251001");

  const [apiKey, setApiKey] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [unlockPass, setUnlockPass] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [unlocked, setUnlocked] = useState(!!getCachedKey());
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    void hasStoredKey().then(setHasKey);
  }, [settings]);

  useEffect(() => {
    if (settings) {
      setSchool(settings.schoolName);
      setPreparedBy(settings.defaultPreparedBy);
      setModel(settings.preferredModel);
      setFastModel(settings.preferredFastModel);
    }
  }, [settings]);

  async function saveProfile() {
    if (!settings) return;
    await db.settings.put({
      ...settings,
      schoolName: school,
      defaultPreparedBy: preparedBy,
      preferredModel: model,
      preferredFastModel: fastModel,
      updatedAt: Date.now(),
    });
    setInfo("Profile saved.");
  }

  async function saveKey() {
    setError(null);
    if (!apiKey.trim().startsWith("sk-")) {
      setError("Anthropic keys typically start with 'sk-'. Double-check before saving.");
      return;
    }
    if (passphrase.length < 8) {
      setError("Use a passphrase of at least 8 characters.");
      return;
    }
    if (passphrase !== confirmPass) {
      setError("Passphrases don't match.");
      return;
    }
    await setEncryptedKey(apiKey, passphrase);
    cacheKey(apiKey);
    setApiKey("");
    setPassphrase("");
    setConfirmPass("");
    setHasKey(true);
    setUnlocked(true);
    setInfo("API key saved (encrypted).");
  }

  async function unlock() {
    setError(null);
    const k = await getDecryptedKey(unlockPass);
    if (!k) {
      setError("Wrong passphrase, or no key stored.");
      return;
    }
    cacheKey(k);
    setUnlockPass("");
    setUnlocked(true);
    setInfo("Key unlocked for this session.");
  }

  async function forget() {
    if (!confirm("Remove the encrypted API key from this browser?")) return;
    await clearKey();
    cacheKey(null);
    setHasKey(false);
    setUnlocked(false);
    setInfo("Key removed.");
  }

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography variant="h1" gutterBottom>
        Settings
      </Typography>

      <Typography variant="h3" gutterBottom>
        Profile
      </Typography>
      <Stack spacing={2} mb={4}>
        <TextField label="School / college name" value={school} onChange={(e) => setSchool(e.target.value)} fullWidth />
        <TextField
          label="Default 'Prepared by' name"
          value={preparedBy}
          onChange={(e) => setPreparedBy(e.target.value)}
          fullWidth
        />
        <TextField select label="Default model" value={model} onChange={(e) => setModel(e.target.value)} fullWidth>
          {MODELS.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Fast / cheap model (for suggestions)"
          value={fastModel}
          onChange={(e) => setFastModel(e.target.value)}
          fullWidth
        >
          {MODELS.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.label}
            </MenuItem>
          ))}
        </TextField>
        <Box>
          <Button variant="contained" onClick={saveProfile}>
            Save profile
          </Button>
        </Box>
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h3" gutterBottom>
        Anthropic API key (BYOK)
      </Typography>
      <Alert severity="warning" sx={{ mb: 2 }}>
        Your key is encrypted with a passphrase you choose and stored locally
        in this browser only. It is sent only to <code>api.anthropic.com</code>.
        Anyone who can run scripts in this tab (browser extensions, malicious
        third-party scripts) could in theory exfiltrate the key once unlocked
        — use a key scoped to a low spend limit.
      </Alert>

      {hasKey ? (
        <Stack spacing={2} mb={3}>
          <Typography color="text.secondary">A key is stored. {unlocked ? "Unlocked for this session." : "Locked."}</Typography>
          {!unlocked && (
            <Stack direction="row" spacing={1}>
              <TextField
                type="password"
                label="Passphrase"
                value={unlockPass}
                onChange={(e) => setUnlockPass(e.target.value)}
                fullWidth
              />
              <Button variant="contained" onClick={unlock}>
                Unlock
              </Button>
            </Stack>
          )}
          <Box>
            <Button color="error" onClick={forget}>
              Remove stored key
            </Button>
          </Box>
        </Stack>
      ) : (
        <Stack spacing={2} mb={3}>
          <TextField
            type="password"
            label="API key (sk-ant-...)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <TextField
              type="password"
              label="Passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              fullWidth
            />
            <TextField
              type="password"
              label="Confirm passphrase"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              fullWidth
            />
          </Stack>
          <Box>
            <Button variant="contained" onClick={saveKey}>
              Save & unlock
            </Button>
          </Box>
        </Stack>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {info && <Alert severity="success" onClose={() => setInfo(null)}>{info}</Alert>}
    </Box>
  );
}
