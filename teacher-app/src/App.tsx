import { useEffect } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { HashRouter, Route, Routes } from "react-router-dom";
import { theme } from "./theme";
import { Layout } from "./routes/Layout";
import { Dashboard } from "./routes/Dashboard";
import { GuidePage } from "./routes/GuidePage";
import { CoursesPage } from "./routes/courses/CoursesPage";
import { ModuleSpecsPage } from "./routes/courses/ModuleSpecsPage";
import { CourseOutlinesPage } from "./routes/courses/CourseOutlinesPage";
import { SyllabusPage } from "./routes/sow/SyllabusPage";
import { SoWListPage } from "./routes/sow/SoWListPage";
import { SoWBuilderPage } from "./routes/sow/SoWBuilderPage";
import { SessionsListPage } from "./routes/sessions/SessionsListPage";
import { SessionEditorPage } from "./routes/sessions/SessionEditorPage";
import { DecksPage } from "./routes/decks/DecksPage";
import { SnippetsPage } from "./routes/snippets/SnippetsPage";
import { ReferencesPage } from "./routes/references/ReferencesPage";
import { AssessmentsPage } from "./routes/assessments/AssessmentsPage";
import { GroupsPage } from "./routes/groups/GroupsPage";
import { TimetablePage } from "./routes/timetable/TimetablePage";
import { GradebookPage } from "./routes/gradebook/GradebookPage";
import { AttendancePage } from "./routes/attendance/AttendancePage";
import { TemplatesPage } from "./routes/templates/TemplatesPage";
import { AssistantPage } from "./routes/assistant/AssistantPage";
import { DataIoPage } from "./routes/data/DataIoPage";
import { SettingsPage } from "./routes/settings/SettingsPage";
import { ensureSettings, seedDemoIfEmpty } from "./db/seed";

export default function App(): React.ReactElement {
  useEffect(() => {
    void ensureSettings();
    void seedDemoIfEmpty();
  }, []);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="guide" element={<GuidePage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="specs" element={<ModuleSpecsPage />} />
            <Route path="outlines" element={<CourseOutlinesPage />} />
            <Route path="syllabus" element={<SyllabusPage />} />
            <Route path="sow" element={<SoWListPage />} />
            <Route path="sow/:schemeId" element={<SoWBuilderPage />} />
            <Route path="sessions" element={<SessionsListPage />} />
            <Route path="sessions/:sessionId" element={<SessionEditorPage />} />
            <Route path="decks" element={<DecksPage />} />
            <Route path="snippets" element={<SnippetsPage />} />
            <Route path="references" element={<ReferencesPage />} />
            <Route path="assessments" element={<AssessmentsPage />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="timetable" element={<TimetablePage />} />
            <Route path="gradebook" element={<GradebookPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="assistant" element={<AssistantPage />} />
            <Route path="data" element={<DataIoPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
