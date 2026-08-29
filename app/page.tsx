/**
 * ============================================================================
 * Proyecto: MesaViva - Sistema de Gestión de Tickets de Soporte
 * Archivo: app/page.tsx
 * Descripción: Página principal pública (Landing Page) del sistema.
 * ============================================================================
 */

import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  Ticket,
  Flag,
  UserCheck,
  Activity,
  History,
  BarChart3,
  Mail,
  Phone,
  MessageSquare,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/session"

/**
 * Listado de características y funcionalidades clave presentadas
 * en la cuadrícula de beneficios del sistema.
 */
const features = [
  { icon: Ticket, title: "Tickets", desc: "Registra cada incidencia con código único, categoría, canal de origen y descripción detallada." },
  { icon: Flag, title: "Prioridades", desc: "Clasifica por urgencia (baja, media, alta, urgente) para atender primero lo crítico." },
  { icon: UserCheck, title: "Asignación", desc: "Deriva cada caso al agente adecuado y balancea la carga del equipo de soporte." },
  { icon: Activity, title: "Seguimiento", desc: "Estados claros (abierto, en progreso, en espera, resuelto, cerrado) en todo momento." },
  { icon: History, title: "Historial", desc: "Bitácora completa de cambios, comentarios y notas internas de cada ticket." },
  { icon: BarChart3, title: "Reportes", desc: "Métricas en vivo: volumen, tiempos de resolución y desempeño por agente." },
]

/**
 * Canales de comunicación e integración admitidos por la plataforma.
 */
const channels = [
  { icon: Mail, label: "Correo" },
  { icon: Phone, label: "Teléfono" },
  { icon: MessageSquare, label: "Chat / WhatsApp" },
  { icon: Globe, label: "Portal web" },
]

/**
 * LANDING PAGE PÚBLICA (Página Principal - Server Component)
 * 
 * - Verifica si existe una sesión activa; de ser así, redirige automáticamente al usuario a su panel (/panel).
 * - Renderiza la cabecera con accesos rápidos a login/registro, la sección principal (Hero),
 *   los canales disponibles, la lista de beneficios destacados y el pie de página.
 */
export default async function LandingPage() {
  // Validación de sesión en el servidor para evitar mostrar la landing a usuarios autenticados
  const user = await getCurrentUser()
  if (user) redirect("/panel")

  return (
    <div className="flex min-h-screen flex-col">
      {/* Barra de navegación superior con enlaces de acceso rápido */}
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          {/* Isotipo y Logotipo */}
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Ticket className="size-4" />
            </span>
            MesaViva
          </Link>
          
          {/* Navegación CTA principal (Ingresar / Crear Cuenta) */}
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="lg" render={<Link href="/ingresar" />}>
              Ingresar
            </Button>
            <Button size="lg" render={<Link href="/registro" />}>
              Crear cuenta
            </Button>
          </nav>
        </div>
      </header>

      {/* Contenido principal de la página */}
      <main className="flex-1">
        {/* Sección Hero: Título, llamada a la acción y canales soportados */}
        <section className="mx-auto w-full max-w-6xl px-5 pt-20 pb-16 text-center">
          {/* Badge de Contexto */}
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Mesa de ayuda centralizada
          </span>
          
          {/* Título y Copys Principales (Tipografía adaptable) */}
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Todas tus incidencias de soporte, en un solo lugar
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Las incidencias llegan por correo, teléfono, chat y web. MesaViva las unifica para que tu equipo cree,
            priorice, asigne y dé seguimiento a cada ticket sin perder nada de vista.
          </p>

          {/* Grupo de Botones Principales (Primary vs Secondary Action) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" render={<Link href="/registro" />}>
              Comenzar ahora <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" size="lg" render={<Link href="/ingresar" />}>
              Ya tengo cuenta
            </Button>
          </div>

          {/* Listado visual de canales de recepción */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Canaliza desde:</span>
            {channels.map((c) => (
              <span key={c.label} className="inline-flex items-center gap-1.5">
                <c.icon className="size-4 text-primary" />
                {c.label}
              </span>
            ))}
          </div>
        </section>

        {/* Sección de características principales del sistema */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Pie de página con derechos y enlace a la documentación técnica */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>MesaViva · Sistema de gestión de tickets de soporte</p>
          <Link href="/panel/documentacion" className="hover:text-foreground">
            Documentación del proyecto
          </Link>
        </div>
      </footer>
    </div>
  )
}