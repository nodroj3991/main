import React from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

// Catches any crash inside a page and shows a plain-English recovery screen
// instead of a blank white page.
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render(): React.ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <Box sx={{ maxWidth: 640, mx: "auto", mt: 6 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>
            Something went wrong on this page.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Your data is safe — it lives in your browser's storage and this
            error hasn't touched it. Try one of the buttons below. If it keeps
            happening, use Import / Export to download a backup, then tell us
            what you clicked just before this appeared.
          </Typography>
          <Typography
            variant="caption"
            component="pre"
            sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace", color: "text.secondary" }}
          >
            {this.state.error.message}
          </Typography>
        </Alert>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Reload the app
          </Button>
        </Stack>
      </Box>
    );
  }
}
