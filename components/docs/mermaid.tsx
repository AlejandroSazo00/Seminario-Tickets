"use client"

import { useEffect, useRef, useState, useId } from "react"

/**
 * Propiedades esperadas por el componente Mermaid.
 */
interface MermaidProps {
  /** Cadena de texto en sintaxis Mermaid que define el diagrama a renderizar */
  chart: string
}

/**
 * COMPONENTE DE RENDERIZADO DE DIAGRAMAS (UI Component)
 * 
 * - Realiza importación dinámica (`import("mermaid")`) del lado del cliente para no afectar
 *   el bundle inicial del servidor en Next.js (App Router).
 * - Genera IDs únicos e inmunes a caracteres especiales usando `useId` para evitar colisiones
 *   en el DOM al renderizar múltiples gráficos simultáneamente.
 * - Aplica temas y estilos personalizados adaptados al sistema de diseño oscuro/slate.
 * - Maneja estados de carga asíncrona, limpieza de llamadas canceladas y captura de errores.
 * 
 * @param {MermaidProps} props - Propiedades del componente.
 * @returns {JSX.Element} Contenedor con el gráfico SVG renderizado o mensaje de error.
 */
export function Mermaid({ chart }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Sanitización del ID único generado por React para compatibilidad con selectores SVG de Mermaid
  const rawId = useId()
  const id = "m" + rawId.replace(/[^a-zA-Z0-9]/g, "")

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        // Carga asíncrona de la librería en el cliente
        const mermaid = (await import("mermaid")).default
        
        // Configuración de tema visual y variables de diseño tokens
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

        // Generación del SVG a partir del string en sintaxis Mermaid
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

  // Estado visual de fallback ante sintaxis inválida o fallos de renderizado
  if (error) {
    return (
      <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs text-destructive">{error}</pre>
    )
  }

  // Contenedor principal responsive para el vector SVG
  return <div ref={ref} className="flex justify-center overflow-x-auto py-2 [&_svg]:max-w-full" />
}