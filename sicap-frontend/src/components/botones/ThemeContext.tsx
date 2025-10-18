import { createContext, useState, useContext } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";
const ThemeContext = createContext<{theme: Theme, toggleTheme: () => void}>({
  theme: "dark",
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));

  // Cambia la clase del body
  document.body.className = theme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}