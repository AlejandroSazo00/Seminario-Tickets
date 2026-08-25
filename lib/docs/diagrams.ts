// Definiciones Mermaid compartidas entre la página de documentación y los .docx

export const ARQUITECTURA = `flowchart TB
  subgraph Cliente["Navegador (Cliente)"]
    UI["Interfaz React / Next.js<br/>Componentes de servidor y cliente"]
  end
  subgraph Servidor["Servidor Next.js (App Router)"]
    RSC["Server Components<br/>(páginas del panel)"]
    SA["Server Actions<br/>(mutaciones)"]
    API["API REST<br/>/api/*"]
    AUTH["Sesión + Roles<br/>(cookie firmada)"]
    SVC["Capa de servicios<br/>tickets / usuarios / reportes"]
  end
  subgraph Datos["Persistencia"]
    STORE["Store de datos<br/>(memoria → PostgreSQL/Neon)"]
  end
  UI -->|HTTP| RSC
  UI -->|invoca| SA
  UI -->|fetch JSON| API
  RSC --> AUTH
  SA --> AUTH
  API --> AUTH
  AUTH --> SVC
  SVC --> STORE`

export const CASOS_USO = `flowchart LR
  Cliente(("Cliente"))
  Agente(("Agente"))
  Admin(("Administrador"))

  UC1["Crear ticket"]
  UC2["Ver mis tickets"]
  UC3["Comentar ticket"]
  UC4["Asignar ticket"]
  UC5["Cambiar estado / prioridad"]
  UC6["Notas internas"]
  UC7["Ver reportes"]
  UC8["Gestionar usuarios"]

  Cliente --> UC1
  Cliente --> UC2
  Cliente --> UC3
  Agente --> UC3
  Agente --> UC4
  Agente --> UC5
  Agente --> UC6
  Agente --> UC7
  Admin --> UC4
  Admin --> UC5
  Admin --> UC7
  Admin --> UC8`

export const MER = `erDiagram
  USUARIO ||--o{ TICKET : "reporta"
  USUARIO ||--o{ TICKET : "atiende"
  USUARIO ||--o{ COMENTARIO : "escribe"
  USUARIO ||--o{ HISTORIAL : "genera"
  TICKET ||--o{ COMENTARIO : "tiene"
  TICKET ||--o{ HISTORIAL : "registra"

  USUARIO {
    uuid id PK
    string nombre
    string email UK
    enum rol "cliente|agente|admin"
    string password_hash
    timestamp creado_en
  }
  TICKET {
    uuid id PK
    string codigo UK "TCK-0001"
    string titulo
    text descripcion
    string categoria
    enum canal
    enum prioridad
    enum estado
    uuid solicitante_id FK
    uuid agente_id FK "nullable"
    timestamp creado_en
    timestamp actualizado_en
    timestamp cerrado_en "nullable"
  }
  COMENTARIO {
    uuid id PK
    uuid ticket_id FK
    uuid autor_id FK
    text cuerpo
    boolean interno
    timestamp creado_en
  }
  HISTORIAL {
    uuid id PK
    uuid ticket_id FK
    uuid actor_id FK
    enum tipo
    string valor_anterior "nullable"
    string valor_nuevo "nullable"
    string nota "nullable"
    timestamp creado_en
  }`

export const CLASES = `classDiagram
  class Usuario {
    +UUID id
    +String nombre
    +String email
    +Rol rol
    +autenticar(password) bool
  }
  class Ticket {
    +UUID id
    +String codigo
    +String titulo
    +Prioridad prioridad
    +Estado estado
    +asignar(agente)
    +cambiarEstado(estado)
    +cambiarPrioridad(prioridad)
  }
  class Comentario {
    +UUID id
    +String cuerpo
    +bool interno
  }
  class Historial {
    +UUID id
    +TipoEvento tipo
    +String valorAnterior
    +String valorNuevo
  }
  Usuario "1" --> "*" Ticket : reporta
  Usuario "0..1" --> "*" Ticket : atiende
  Ticket "1" --> "*" Comentario : contiene
  Ticket "1" --> "*" Historial : registra
  Usuario "1" --> "*" Comentario : escribe`

export const ESTADOS = `stateDiagram-v2
  [*] --> Abierto : crear
  Abierto --> EnProgreso : asignar agente
  EnProgreso --> EnEspera : requiere info
  EnEspera --> EnProgreso : info recibida
  EnProgreso --> Resuelto : solución aplicada
  Resuelto --> Cerrado : confirmado
  Resuelto --> Abierto : reabrir
  Cerrado --> Abierto : reabrir
  Cerrado --> [*]`

export const SECUENCIA = `sequenceDiagram
  actor C as Cliente
  participant UI as Interfaz
  participant API as API/Servicio
  participant DB as Persistencia
  actor A as Agente
  C->>UI: Completa formulario de ticket
  UI->>API: POST /api/tickets
  API->>API: Validar sesión y datos
  API->>DB: Insertar ticket + evento historial
  DB-->>API: Ticket creado (TCK-0001)
  API-->>UI: 201 Created
  UI-->>C: Muestra ticket con seguimiento
  A->>UI: Abre ticket y asigna
  UI->>API: PATCH /api/tickets/:id
  API->>DB: Actualizar + registrar historial
  DB-->>API: OK
  API-->>UI: 200 OK`

export interface DiagramDef {
  slug: string
  title: string
  description: string
  chart: string
}

export const DIAGRAMS: DiagramDef[] = [
  { slug: "arquitectura", title: "Diagrama de arquitectura", description: "Vista por capas del sistema: cliente, servidor y persistencia.", chart: ARQUITECTURA },
  { slug: "casos-uso", title: "Diagrama de casos de uso (UML)", description: "Acciones disponibles para cada rol del sistema.", chart: CASOS_USO },
  { slug: "clases", title: "Diagrama de clases (UML)", description: "Entidades del dominio y sus relaciones.", chart: CLASES },
  { slug: "mer", title: "Modelo Entidad-Relación (MER)", description: "Esquema relacional para la base de datos PostgreSQL.", chart: MER },
  { slug: "estados", title: "Diagrama de estados del ticket (UML)", description: "Ciclo de vida de un ticket de soporte.", chart: ESTADOS },
  { slug: "secuencia", title: "Diagrama de secuencia (UML)", description: "Flujo de creación y atención de un ticket.", chart: SECUENCIA },
]
