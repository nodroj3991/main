import { Alert, Box, Button, Card, CardContent, Grid, Typography } from "@mui/material";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { db } from "../db/db";

function StatCard({ label, value, to }: { label: string; value: number | string; to: string }) {
  return (
    <Card
      component={Link}
      to={to}
      sx={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
        height: "100%",
        "&:hover": { borderColor: "primary.main" },
        border: "1px solid #e1e4e8",
      }}
      elevation={0}
    >
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4">{value}</Typography>
      </CardContent>
    </Card>
  );
}

export function Dashboard(): React.ReactElement {
  const counts = useLiveQuery(async () => {
    const [
      courses,
      modules,
      groups,
      sessions,
      schemes,
      questions,
      references,
      snippets,
      templates,
      students,
    ] = await Promise.all([
      db.courses.count(),
      db.modules.count(),
      db.groups.count(),
      db.sessions.count(),
      db.schemes.count(),
      db.questions.count(),
      db.references.count(),
      db.snippets.count(),
      db.templates.count(),
      db.students.count(),
    ]);
    return {
      courses,
      modules,
      groups,
      sessions,
      schemes,
      questions,
      references,
      snippets,
      templates,
      students,
    };
  }, []);

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Welcome to TOPS. All data lives locally in your browser — use Import /
        Export to move it between machines. Seeded with a demo Animal Welfare
        module on first load so you can explore right away.
      </Typography>
      <Alert
        severity="info"
        sx={{ mb: 3, alignItems: "center" }}
        action={
          <Button component={Link} to="/guide" variant="contained" size="small">
            Open the guide
          </Button>
        }
      >
        New here? The Step-by-step Guide walks you through everything in plain
        English and ticks each step off as you complete it.
      </Alert>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Courses" value={counts?.courses ?? "…"} to="/courses" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Modules" value={counts?.modules ?? "…"} to="/courses" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Groups" value={counts?.groups ?? "…"} to="/groups" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Students" value={counts?.students ?? "…"} to="/groups" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Schemes of Work" value={counts?.schemes ?? "…"} to="/sow" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Sessions" value={counts?.sessions ?? "…"} to="/sessions" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Templates" value={counts?.templates ?? "…"} to="/templates" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Snippets" value={counts?.snippets ?? "…"} to="/snippets" />
        </Grid>
      </Grid>
    </Box>
  );
}
