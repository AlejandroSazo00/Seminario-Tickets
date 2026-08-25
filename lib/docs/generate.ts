import "server-only"
import type { Paragraph, Table } from "docx"
import { h1, h2, h3, p, bullet, code, table, coverTitle, buildDoc } from "./docx-helpers"

// -------- Documento técnico --------

function tecnico(): (Paragraph | Table)[] {
  return [
    ...coverTitle("Documento técnico", "Diseño y especificación del sistema"),

    h1("1. Introducción"),
    p(
      "MesaViva es un sistema web para la gestión centralizada de tickets de soporte técnico. Nace de la necesidad de unificar las incidencias que llegan por múltiples canales (correo, teléfono, chat, portal web y WhatsApp), que hoy no cuentan con un seguimiento centralizado. El objetivo es ofrecer una herramienta amigable que permita crear, priorizar, asignar y dar seguimiento a cada incidencia, además de generar reportes de gestión.",
    ),

    h1("2. Objetivos"),
    h2("2.1 Objetivo general"),
    p(
      "Diseñar e implementar un sistema para administrar tickets de soporte, centralizando las incidencias y ofreciendo la mejor experiencia de usuario posible.",
    ),
    h2("2.2 Objetivos específicos"),
    bullet("Registrar tickets con código único, categoría, canal de origen, prioridad y descripción."),
    bullet("Clasificar tickets por prioridad (baja, media, alta, urgente)."),
    bullet("Asignar tickets a agentes de soporte y balancear la carga de trabajo."),
    bullet("Dar seguimiento al estado de cada ticket a lo largo de su ciclo de vida."),
    bullet("Mantener un historial auditable de todos los cambios."),
    bullet("Generar reportes e indicadores de la operación."),

    h1("3. Alcance"),
    p(
      "El sistema contempla tres perfiles de usuario: Cliente (reporta y da seguimiento a sus incidencias), Agente (atiende y resuelve tickets) y Administrador (gestiona usuarios y consulta reportes globales). El sistema abarca el registro, la clasificación, la asignación, el seguimiento, el historial y los reportes de tickets.",
    ),

    h1("4. Requerimientos"),
    h2("4.1 Requerimientos funcionales"),
    table(
      ["ID", "Requerimiento", "Prioridad"],
      [
        ["RF-01", "Registro e inicio de sesión con roles diferenciados", "Alta"],
        ["RF-02", "Creación de tickets con categoría, canal y prioridad", "Alta"],
        ["RF-03", "Listado y búsqueda de tickets con filtros", "Alta"],
        ["RF-04", "Asignación de tickets a agentes", "Alta"],
        ["RF-05", "Cambio de estado y prioridad del ticket", "Alta"],
        ["RF-06", "Comentarios públicos y notas internas", "Media"],
        ["RF-07", "Historial cronológico de cambios", "Alta"],
        ["RF-08", "Reportes e indicadores de gestión", "Media"],
      ],
    ),
    h2("4.2 Requerimientos no funcionales"),
    bullet("Usabilidad: interfaz amigable, responsiva y en español."),
    bullet("Seguridad: contraseñas con hash+salt, sesiones firmadas y control de acceso por rol."),
    bullet("Rendimiento: renderizado en servidor para carga rápida de páginas."),
    bullet("Mantenibilidad: capa de servicios desacoplada de la persistencia."),

    h1("5. Modelo de datos"),
    p(
      "El modelo relacional se compone de cuatro entidades principales: USUARIO, TICKET, COMENTARIO e HISTORIAL. El diagrama entidad-relación completo se incluye en el documento de arquitectura y en la sección de documentación de la aplicación. A continuación se presenta el DDL equivalente para PostgreSQL/Neon:",
    ),
    code(
`CREATE TYPE rol AS ENUM ('cliente','agente','admin');
CREATE TYPE canal AS ENUM ('email','telefono','chat','web','whatsapp');
CREATE TYPE prioridad AS ENUM ('baja','media','alta','urgente');
CREATE TYPE estado AS ENUM ('abierto','en_progreso','en_espera','resuelto','cerrado');

CREATE TABLE usuario (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  rol           rol  NOT NULL DEFAULT 'cliente',
  password_hash TEXT NOT NULL,
  salt          TEXT NOT NULL,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ticket (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo         TEXT UNIQUE NOT NULL,
  titulo         TEXT NOT NULL,
  descripcion    TEXT NOT NULL,
  categoria      TEXT NOT NULL,
  canal          canal NOT NULL,
  prioridad      prioridad NOT NULL DEFAULT 'media',
  estado         estado NOT NULL DEFAULT 'abierto',
  solicitante_id UUID NOT NULL REFERENCES usuario(id),
  agente_id      UUID REFERENCES usuario(id),
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  cerrado_en     TIMESTAMPTZ
);

CREATE TABLE comentario (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
  autor_id   UUID NOT NULL REFERENCES usuario(id),
  cuerpo     TEXT NOT NULL,
  interno    BOOLEAN NOT NULL DEFAULT false,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE historial (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id      UUID NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
  actor_id       UUID NOT NULL REFERENCES usuario(id),
  tipo           TEXT NOT NULL,
  valor_anterior TEXT,
  valor_nuevo    TEXT,
  nota           TEXT,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
    ),

    h1("6. Ciclo de vida del ticket"),
    p(
      "Un ticket transita por los estados: Abierto → En progreso → En espera → Resuelto → Cerrado. Un ticket resuelto o cerrado puede reabrirse, lo que se registra como un evento en el historial. El diagrama de estados se incluye en la aplicación y en el documento de arquitectura.",
    ),

    h1("7. Tecnologías"),
    table(
      ["Componente", "Tecnología"],
      [
        ["Lenguaje", "TypeScript"],
        ["Framework", "Next.js 16 (App Router)"],
        ["UI", "React 19 + Tailwind CSS v4"],
        ["Gráficos", "Recharts"],
        ["Diagramas", "Mermaid"],
        ["Persistencia (prototipo)", "Store en memoria"],
        ["Persistencia (producción)", "PostgreSQL / Neon"],
        ["Autenticación", "Sesión con cookie firmada (HMAC)"],
      ],
    ),
    p(
      "Nota sobre el lenguaje: el requerimiento indicaba 'el lenguaje más fácil que considere la comunidad'. Aunque Python suele señalarse como el más accesible para lógica de backend, para un prototipo web funcional, amigable y desplegable de inmediato se optó por TypeScript sobre Next.js, que ofrece un único lenguaje para frontend y backend y una experiencia de usuario superior. El diseño en capas permite sustituir la persistencia por cualquier motor sin afectar el resto del sistema.",
    ),
  ]
}

// -------- Arquitectura --------

function arquitectura(): (Paragraph | Table)[] {
  return [
    ...coverTitle("Documento de arquitectura", "Vista de capas, componentes y patrones"),

    h1("1. Visión general"),
    p(
      "MesaViva sigue una arquitectura en capas sobre Next.js App Router. La interfaz se renderiza mayoritariamente en el servidor (React Server Components) y las mutaciones se realizan mediante Server Actions y una API REST. Toda solicitud pasa por una capa de autenticación y autorización basada en roles antes de llegar a la capa de servicios, que a su vez es la única que accede a la persistencia.",
    ),

    h1("2. Capas"),
    h2("2.1 Capa de presentación"),
    bullet("Páginas del panel como Server Components para carga rápida."),
    bullet("Componentes cliente para interacciones (filtros, formularios, gráficos)."),
    h2("2.2 Capa de aplicación"),
    bullet("Server Actions: creación de tickets, comentarios, cambios de estado/prioridad/asignación."),
    bullet("API REST bajo /api para integración con sistemas externos."),
    h2("2.3 Capa de dominio / servicios"),
    bullet("Servicios de tickets, usuarios y reportes que encapsulan las reglas de negocio."),
    bullet("Control de visibilidad por rol (los clientes solo ven sus tickets; las notas internas no se exponen a clientes)."),
    h2("2.4 Capa de persistencia"),
    bullet("En el prototipo, un store en memoria con datos de ejemplo."),
    bullet("En producción, PostgreSQL/Neon mediante el mismo contrato de servicios."),

    h1("3. Patrones aplicados"),
    bullet("Separación de responsabilidades (capas)."),
    bullet("Repositorio: la persistencia se aísla detrás de funciones de servicio."),
    bullet("Control de acceso basado en roles (RBAC)."),
    bullet("Registro de auditoría mediante eventos de historial inmutables."),

    h1("4. Seguridad"),
    bullet("Contraseñas almacenadas con hash y salt (scrypt)."),
    bullet("Sesión mediante cookie httpOnly firmada con HMAC."),
    bullet("Autorización por rol verificada en el servidor en cada operación sensible."),
    bullet("Validación y saneamiento de entradas."),

    h1("5. Diagramas"),
    p("La aplicación incluye, en la sección Documentación, los siguientes diagramas renderizados con Mermaid:"),
    bullet("Diagrama de arquitectura (capas)."),
    bullet("Diagrama de casos de uso (UML)."),
    bullet("Diagrama de clases (UML)."),
    bullet("Modelo Entidad-Relación (MER)."),
    bullet("Diagrama de estados del ticket (UML)."),
    bullet("Diagrama de secuencia (UML)."),
    p(
      "El código fuente de cada diagrama se encuentra en lib/docs/diagrams.ts y puede exportarse a cualquier herramienta compatible con Mermaid.",
    ),
  ]
}

// -------- API REST --------

function apiRest(): (Paragraph | Table)[] {
  const endpoint = (method: string, path: string, desc: string, roles: string) => [
    h3(`${method} ${path}`),
    p(desc),
    p(`Roles autorizados: ${roles}`),
  ]

  return [
    ...coverTitle("Especificación API REST", "Endpoints, métodos y respuestas"),

    h1("1. Convenciones"),
    bullet("Base URL: /api"),
    bullet("Formato: JSON (application/json)."),
    bullet("Autenticación: cookie de sesión enviada automáticamente por el navegador."),
    bullet("Errores: { \"error\": \"mensaje\" } con el código HTTP correspondiente (400, 401, 403, 404)."),

    h1("2. Autenticación"),
    ...endpoint("POST", "/api/auth/register", "Registra un nuevo usuario (rol cliente por defecto) e inicia sesión.", "Público"),
    ...endpoint("POST", "/api/auth/login", "Inicia sesión con correo y contraseña.", "Público"),
    ...endpoint("POST", "/api/auth/logout", "Cierra la sesión actual.", "Autenticado"),
    ...endpoint("GET", "/api/auth/me", "Devuelve el usuario autenticado actual.", "Autenticado"),

    h1("3. Tickets"),
    ...endpoint("GET", "/api/tickets", "Lista tickets. Acepta filtros por query: status, priority, channel, assignee, q (búsqueda).", "Autenticado"),
    ...endpoint("POST", "/api/tickets", "Crea un ticket. Body: title, description, category, channel, priority.", "Autenticado"),
    ...endpoint("GET", "/api/tickets/:id", "Obtiene el detalle de un ticket (incluye comentarios e historial).", "Autenticado (propietario o gestor)"),
    ...endpoint("PATCH", "/api/tickets/:id", "Actualiza estado, prioridad o asignación. Body: { status | priority | assigneeId }.", "Agente / Admin"),
    ...endpoint("POST", "/api/tickets/:id/comments", "Añade un comentario. Body: body, internal (opcional).", "Autenticado"),

    h1("4. Reportes y usuarios"),
    ...endpoint("GET", "/api/reports", "Devuelve indicadores agregados de la operación.", "Agente / Admin"),
    ...endpoint("GET", "/api/users", "Lista usuarios. Query opcional: role.", "Agente / Admin"),

    h1("5. Ejemplo de solicitud"),
    code(
`POST /api/tickets
Content-Type: application/json

{
  "title": "No puedo iniciar sesión",
  "description": "El portal muestra 'error inesperado'.",
  "category": "Acceso y cuentas",
  "channel": "web",
  "priority": "alta"
}

// Respuesta 201
{
  "ticket": {
    "code": "TCK-0009",
    "status": "abierto",
    "priority": "alta"
  }
}`,
    ),

    h1("6. Códigos de estado"),
    table(
      ["Código", "Significado"],
      [
        ["200", "Operación exitosa"],
        ["201", "Recurso creado"],
        ["400", "Solicitud inválida (datos faltantes o incorrectos)"],
        ["401", "No autenticado"],
        ["403", "Sin permisos para la operación"],
        ["404", "Recurso no encontrado"],
      ],
    ),
  ]
}

// -------- Manual de usuario --------

function manualUsuario(): (Paragraph | Table)[] {
  return [
    ...coverTitle("Manual de usuario", "Guía para clientes, agentes y administradores"),

    h1("1. Acceso al sistema"),
    p("Ingrese a la página principal y seleccione 'Crear cuenta' para registrarse o 'Ingresar' si ya tiene una cuenta. Complete su correo y contraseña."),
    h2("Cuentas de demostración"),
    table(
      ["Rol", "Correo", "Contraseña"],
      [
        ["Administrador", "admin@soporte.dev", "demo1234"],
        ["Agente", "bruno@soporte.dev", "demo1234"],
        ["Cliente", "diego@empresa.com", "demo1234"],
      ],
    ),

    h1("2. Para clientes"),
    h2("2.1 Crear un ticket"),
    bullet("Desde el panel, pulse 'Nuevo ticket'."),
    bullet("Complete título, descripción, categoría, canal de origen y prioridad."),
    bullet("Pulse 'Crear ticket'. Se generará un código único (ej. TCK-0009)."),
    h2("2.2 Dar seguimiento"),
    bullet("En 'Tickets' verá el listado de sus solicitudes con su estado actual."),
    bullet("Abra un ticket para ver la conversación y añadir comentarios."),
    bullet("El panel 'Historial' muestra todos los cambios realizados."),

    h1("3. Para agentes"),
    h2("3.1 Gestionar un ticket"),
    bullet("Abra un ticket desde el listado."),
    bullet("En el panel 'Gestión' cambie el estado, la prioridad o el agente asignado."),
    bullet("Los cambios se reflejan de inmediato y se registran en el historial."),
    h2("3.2 Notas internas"),
    bullet("Al comentar, marque 'Nota interna' para dejar observaciones no visibles al cliente."),
    h2("3.3 Filtros y búsqueda"),
    bullet("Use los filtros por estado, prioridad, canal y asignación para localizar tickets."),
    bullet("La casilla 'Asignados a mí' muestra su carga de trabajo."),

    h1("4. Para administradores"),
    bullet("Acceden a todos los tickets y a la sección 'Reportes'."),
    bullet("Los reportes muestran totales, tendencia semanal, distribución por estado, prioridad y canal, y la carga por agente."),
    bullet("Pueden asignar tickets y crear tickets en nombre de un cliente."),

    h1("5. Preguntas frecuentes"),
    h3("¿Puedo reabrir un ticket cerrado?"),
    p("Sí. Un agente o administrador puede cambiar el estado de un ticket resuelto o cerrado nuevamente a abierto o en progreso; la reapertura queda registrada en el historial."),
    h3("¿Quién puede ver las notas internas?"),
    p("Solo los agentes y administradores. Los clientes nunca ven las notas internas."),
  ]
}

// -------- Manual técnico --------

function manualTecnico(): (Paragraph | Table)[] {
  return [
    ...coverTitle("Manual técnico e instalación", "Requisitos, despliegue y base de datos"),

    h1("1. Requisitos"),
    bullet("Node.js 18 o superior."),
    bullet("Gestor de paquetes pnpm (recomendado)."),
    bullet("Opcional para producción: base de datos PostgreSQL / Neon."),

    h1("2. Instalación local"),
    code(
`# 1. Instalar dependencias
pnpm install

# 2. Iniciar el servidor de desarrollo
pnpm dev

# 3. Abrir en el navegador
http://localhost:3000`,
    ),

    h1("3. Estructura del proyecto"),
    code(
`app/                 Páginas y rutas (App Router)
  api/               API REST (route handlers)
  panel/             Panel autenticado (tickets, reportes, docs)
components/          Componentes de interfaz
lib/
  actions/           Server Actions
  services/          Lógica de negocio (tickets, usuarios)
  auth/              Sesión y control de roles
  db/                Capa de persistencia (store)
  docs/              Diagramas y generación de .docx`,
    ),

    h1("4. Despliegue"),
    p("El proyecto está optimizado para desplegarse en Vercel. Al publicar, se compila automáticamente y se sirve con renderizado en servidor."),
    bullet("Conecte el repositorio a Vercel o use el botón Publicar."),
    bullet("Configure las variables de entorno si conecta una base de datos."),

    h1("5. Conexión a base de datos (producción)"),
    p(
      "El prototipo utiliza un store en memoria (lib/db/store.ts) cuyo contrato es asíncrono, idéntico al que tendría un acceso a base de datos. Para migrar a PostgreSQL/Neon:",
    ),
    bullet("Cree las tablas con el DDL incluido en el documento técnico."),
    bullet("Sustituya las funciones de lib/db/store.ts por consultas SQL parametrizadas."),
    bullet("Defina la variable de entorno DATABASE_URL con la cadena de conexión."),
    bullet("El resto del sistema (servicios, acciones, API y UI) no requiere cambios."),
    code(
`// Ejemplo con el cliente de Neon
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL!)

export async function listTickets() {
  return sql\`SELECT * FROM ticket ORDER BY creado_en DESC\`
}`,
    ),

    h1("6. Seguridad en producción"),
    bullet("Defina una variable SESSION_SECRET robusta para firmar las sesiones."),
    bullet("Use HTTPS (Vercel lo provee automáticamente)."),
    bullet("Aplique cabeceras de seguridad (ya incluidas en next.config)."),
  ]
}

const GENERATORS: Record<string, { title: string; build: () => (Paragraph | Table)[] }> = {
  "documento-tecnico": { title: "Documento técnico", build: tecnico },
  arquitectura: { title: "Documento de arquitectura", build: arquitectura },
  "api-rest": { title: "Especificación API REST", build: apiRest },
  "manual-usuario": { title: "Manual de usuario", build: manualUsuario },
  "manual-tecnico": { title: "Manual técnico", build: manualTecnico },
}

export function isValidDoc(slug: string): boolean {
  return slug in GENERATORS
}

export async function generateDoc(slug: string): Promise<{ buffer: Buffer; filename: string } | null> {
  const gen = GENERATORS[slug]
  if (!gen) return null
  const buffer = await buildDoc(gen.title, gen.build())
  return { buffer, filename: `MesaViva-${slug}.docx` }
}

export function allDocSlugs(): string[] {
  return Object.keys(GENERATORS)
}
