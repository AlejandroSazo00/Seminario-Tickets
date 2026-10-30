"use client"

import { useEffect, useState, useTransition } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveThemePreference, type ThemePreference } from "@/lib/actions/theme"

export function ThemeToggle({ initialTheme }: { initialTheme: ThemePreference | "system" }) {
  const [theme, setTheme] = useState(initialTheme)
  const [systemIsDark, setSystemIsDark] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [pending, startTransition] = useTransition()
  const isDark = theme === "dark" || (theme === "system" && systemIsDark)

  useEffect(() => {
    if (theme !== "system") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const update = () => setSystemIsDark(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [theme])

  function toggleTheme() {
    const nextTheme: ThemePreference = isDark ? "light" : "dark"
    const previousTheme = theme
    document.documentElement.classList.remove("dark", "light")
    document.documentElement.classList.add(nextTheme)
    setTheme(nextTheme)
    setErrorMessage("")
    startTransition(async () => {
      try {
        await saveThemePreference(nextTheme)
      } catch {
        document.documentElement.classList.remove("dark", "light")
        if (previousTheme !== "system") document.documentElement.classList.add(previousTheme)
        setTheme(previousTheme)
        setErrorMessage("No se pudo guardar la preferencia del tema.")
      }
    })
  }

  return (
    <>
      {errorMessage && (
        <span role="alert" className="fixed bottom-36 right-4 z-50 rounded-lg border bg-card px-3 py-2 text-xs shadow-lg md:bottom-20 md:right-5">
          {errorMessage}
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="fixed bottom-20 right-4 z-50 size-12 rounded-full bg-card shadow-lg md:bottom-5 md:right-5"
        aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
        title={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
        disabled={pending}
        onClick={toggleTheme}
      >
        {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </Button>
    </>
  )
}
