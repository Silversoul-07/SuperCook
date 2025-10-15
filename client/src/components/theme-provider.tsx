// src/components/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Initialize theme from localStorage or system preference
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null
      if (stored === "light" || stored === "dark") {
        return stored
      }
    } catch {
      // ignore localStorage errors
    }

    // fallback: prefers-color-scheme
    try {
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      return prefersDark ? "dark" : "light"
    } catch {
      return "light"
    }
  })

  useEffect(() => {
    // Apply theme class and persist selection
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)
    try {
      localStorage.setItem("theme", theme)
    } catch {
      // ignore
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"))

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider")
  return ctx
}
  