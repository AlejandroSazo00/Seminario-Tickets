"use client"

import { useEffect, useRef, useState, useId } from "react"

export function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const rawId = useId()
  const id = "m" + rawId.replace(/[^a-zA-Z0-9]/g, "")

  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        const mermaid = (await import("mermaid")).default
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "loose",
          fontFamily: "var(--font-inter), sans-serif",
          themeVariables: {
            primaryColor: "#1e293b",
            primaryTextColor: "#e2e8f0",
            primaryBorderColor: "#3b82f6",
            lineColor: "#64748b",
            secondaryColor: "#334155",
            tertiaryColor: "#1e293b",
            background: "transparent",
            mainBkg: "#1e293b",
            nodeTextColor: "#e2e8f0",
          },
        })
        const { svg } = await mermaid.render(id, chart)
        if (!cancelled && ref.current) ref.current.innerHTML = svg
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al renderizar el diagrama")
      }
    }
    render()
    return () => {
      cancelled = true
    }
  }, [chart, id])

  if (error) {
    return (
      <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs text-destructive">{error}</pre>
    )
  }

  return <div ref={ref} className="flex justify-center overflow-x-auto py-2 [&_svg]:max-w-full" />
}
