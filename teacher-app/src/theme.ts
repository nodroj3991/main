import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1f6feb" },
    secondary: { main: "#7c4dff" },
    background: { default: "#f6f8fa", paper: "#ffffff" },
  },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
    h1: { fontSize: "1.75rem", fontWeight: 600 },
    h2: { fontSize: "1.4rem", fontWeight: 600 },
    h3: { fontSize: "1.15rem", fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiAppBar: {
      styleOverrides: { root: { boxShadow: "none", borderBottom: "1px solid #e1e4e8" } },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
  },
});
