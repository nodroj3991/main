import { Alert, Box, Typography } from "@mui/material";

export function Placeholder({
  title,
  message,
}: {
  title: string;
  message?: string;
}): React.ReactElement {
  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        {title}
      </Typography>
      <Alert severity="info">
        {message ?? "This area is being built. Check back soon."}
      </Alert>
    </Box>
  );
}
