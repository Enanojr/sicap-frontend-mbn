import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { ThemeContext } from "./theme.context";
import type { Theme } from "./theme.context";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));

  // Cambia la clase del body
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
