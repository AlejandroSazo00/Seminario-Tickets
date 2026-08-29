import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Carga de la fuente tipográfica primaria definida en el Sistema de Diseño (Inter)
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

/**
 * METADATOS GLOBALES (Branding, SEO y Accesibilidad)
 * Define el título de la plataforma, descripción descriptiva e íconos adaptativos.
 */
export const metadata: Metadata = {
  title: 'MesaViva · Sistema de tickets de soporte',
  description:
    'Centraliza incidencias de todos los canales: crea, prioriza, asigna y da seguimiento a tickets de soporte con reportes en tiempo real.',
  generator: 'v0.app',
  
  // Branding UI: Favicons dinámicos según la preferencia de tema (Light / Dark) del dispositivo
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

/**
 * CONFIGURACIÓN DE VIEWPORT Y TEMA NATIVO
 * Controla el esquema de color nativo del navegador para que coincida con el tema de la UI.
 */
export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

/**
 * LAYOUT RAÍZ
 * Estructura contenedora global que aplica la tipografía 'Inter' y el fondo base de la UI.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased">
        {/* Renderizado de las vistas (Login, Dashboard, etc.) */}
        {children}
        
        {/* Métricas de rendimiento y uso de UI en producción */}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}