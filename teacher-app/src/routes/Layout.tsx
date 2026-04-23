import { useState } from "react";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  ListAlt as ListAltIcon,
  Edit as EditIcon,
  Slideshow as SlideshowIcon,
  Quiz as QuizIcon,
  Bookmark as BookmarkIcon,
  FormatQuote as RefIcon,
  CalendarMonth as CalendarIcon,
  Group as GroupIcon,
  Grade as GradeIcon,
  CheckCircle as AttendanceIcon,
  Description as TemplateIcon,
  SmartToy as AssistantIcon,
  Settings as SettingsIcon,
  ImportExport as IoIcon,
} from "@mui/icons-material";
import { Link, Outlet, useLocation } from "react-router-dom";

const DRAWER_WIDTH = 260;

type NavItem = { to: string; label: string; icon: React.ReactNode };
type NavSection = { title: string; items: NavItem[] };

const sections: NavSection[] = [
  {
    title: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: <DashboardIcon /> }],
  },
  {
    title: "Courses & planning",
    items: [
      { to: "/courses", label: "Courses & Modules", icon: <SchoolIcon /> },
      { to: "/specs", label: "Module Specs", icon: <MenuBookIcon /> },
      { to: "/outlines", label: "Course Outlines", icon: <ListAltIcon /> },
      { to: "/syllabus", label: "Syllabus", icon: <ListAltIcon /> },
      { to: "/sow", label: "Schemes of Work", icon: <EditIcon /> },
      { to: "/sessions", label: "Sessions / Lesson Plans", icon: <EditIcon /> },
      { to: "/decks", label: "PPT Decks", icon: <SlideshowIcon /> },
    ],
  },
  {
    title: "Resources",
    items: [
      { to: "/snippets", label: "Reusable Snippets", icon: <BookmarkIcon /> },
      { to: "/references", label: "Reading List & Refs", icon: <RefIcon /> },
      { to: "/assessments", label: "Assessments & Quizzes", icon: <QuizIcon /> },
    ],
  },
  {
    title: "Cohorts",
    items: [
      { to: "/groups", label: "Groups & Roster", icon: <GroupIcon /> },
      { to: "/timetable", label: "Timetable", icon: <CalendarIcon /> },
      { to: "/gradebook", label: "Gradebook", icon: <GradeIcon /> },
      { to: "/attendance", label: "Attendance", icon: <AttendanceIcon /> },
    ],
  },
  {
    title: "Tools",
    items: [
      { to: "/templates", label: "Templates", icon: <TemplateIcon /> },
      { to: "/assistant", label: "AI Assistant", icon: <AssistantIcon /> },
      { to: "/data", label: "Import / Export", icon: <IoIcon /> },
      { to: "/settings", label: "Settings", icon: <SettingsIcon /> },
    ],
  },
];

export function Layout(): React.ReactElement {
  const [open, setOpen] = useState(true);
  const { pathname } = useLocation();
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        color="inherit"
        sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
      >
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            onClick={() => setOpen((o) => !o)}
            sx={{ mr: 2 }}
            aria-label="toggle navigation"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            TOPS · Teacher Online Planning System
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="persistent"
        open={open}
        sx={{
          width: open ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "1px solid #e1e4e8",
          },
        }}
      >
        <Toolbar variant="dense" />
        <Box sx={{ overflow: "auto", py: 1 }}>
          {sections.map((s) => (
            <List
              key={s.title}
              dense
              subheader={
                <ListSubheader
                  disableSticky
                  sx={{
                    fontSize: "0.7rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#6a737d",
                    lineHeight: 2,
                  }}
                >
                  {s.title}
                </ListSubheader>
              }
            >
              {s.items.map((it) => {
                const selected =
                  it.to === "/"
                    ? pathname === "/"
                    : pathname.startsWith(it.to);
                return (
                  <ListItemButton
                    key={it.to}
                    component={Link}
                    to={it.to}
                    selected={selected}
                    sx={{ pl: 2 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>{it.icon}</ListItemIcon>
                    <ListItemText
                      primary={it.label}
                      primaryTypographyProps={{ fontSize: "0.9rem" }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          ))}
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: open ? `calc(100% - ${DRAWER_WIDTH}px)` : "100%",
          transition: "width 0.2s",
        }}
      >
        <Toolbar variant="dense" />
        <Outlet />
      </Box>
    </Box>
  );
}
