/**
 * ============================================================================
 * Proyecto: MesaViva - Sistema de Gestión de Tickets de Soporte
 * Archivo: components/auth/auth-form.tsx
 * Descripción: Componente cliente para formularios de inicio de sesión y registro.
 * ============================================================================
 */

"use client"

// Importaciones para manejo de estado dinámico del cliente y navegación
import { useActionState } from "react"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

// Componentes reutilizables del Sistema de Diseño (Design Tokens)
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/field"
import { loginAction, registerAction, type ActionState } from "@/lib/actions/auth"

/**
 * Propiedades esperadas por el componente AuthForm.
 */
interface AuthFormProps {
  /** Modo de operación del formulario: 'login' para ingresar o 'register' para crear cuenta */
  mode: "login" | "register"
}

/**
 * Formulario interactivo de autenticación del lado del cliente.
 * 
 * - Utiliza el hook `useActionState` de React 19 para coordinar el envío de Server Actions
 *   (`loginAction` o `registerAction`) sin requerir llamadas manuales con fetch.
 * - Muestra estados de carga durante la ejecución y mensajes de error en caso de fallo.
 * - Alterna dinámicamente entre los campos requeridos para inicio de sesión o registro completo.
 * 
 * @param {AuthFormProps} props - Propiedades del componente.
 * @returns {JSX.Element} Formulario de autenticación renderizado.
 */
export function AuthForm({ mode }: AuthFormProps) {
  // Selección de la Server Action correspondiente según el modo
  const action = mode === "login" ? loginAction : registerAction
  
  // Gestión del estado de la acción (errores, resultado y estado de carga)
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Campo de nombre completo (exclusivo para registro) */}
      {mode === "register" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre completo</Label>
          <Input id="name" name="name" placeholder="Ej. María González" required autoComplete="name" />
        </div>
      )}
      
      {/* Campo de correo electrónico */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" name="email" type="email" placeholder="tucorreo@empresa.com" required autoComplete="email" />
      </div>

      {/* Campo de contraseña con atributo autoComplete adaptativo */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </div>

      {/* Alerta de error en caso de fallo en la autenticación */}
      {state?.error && (
        <p className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </p>
      )}

      {/* Botón de acción principal con indicador de procesamiento (Pending state) */}
      <Button type="submit" size="lg" className="mt-1 w-full" disabled={pending}>
        {pending ? "Procesando..." : mode === "login" ? "Ingresar" : "Crear cuenta"}
      </Button>

      {/* Enlace de navegación secundaria entre Login y Registro */}
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-medium text-primary hover:underline">
              Regístrate
            </Link>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <Link href="/ingresar" className="font-medium text-primary hover:underline">
              Inicia sesión
            </Link>
          </>
        )}
      </p>
    </form>
  )
}