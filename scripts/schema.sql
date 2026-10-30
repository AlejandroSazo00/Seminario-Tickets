-- Esquema de base de datos del sistema de tickets de soporte (Mesa de Ayuda)
-- Ejecutar antes del seed (scripts/seed.mjs).

CREATE TABLE IF NOT EXISTS users (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  email         text NOT NULL UNIQUE,
  role          text NOT NULL DEFAULT 'cliente',
  password_hash text NOT NULL,
  salt          text NOT NULL,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id           text PRIMARY KEY,
  code         text NOT NULL UNIQUE,
  title        text NOT NULL,
  description  text NOT NULL,
  category     text NOT NULL,
  channel      text NOT NULL,
  priority     text NOT NULL,
  status       text NOT NULL,
  requester_id text NOT NULL REFERENCES users(id),
  assignee_id  text REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  closed_at    timestamptz
);

CREATE TABLE IF NOT EXISTS comments (
  id         text PRIMARY KEY,
  ticket_id  text NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id  text NOT NULL REFERENCES users(id),
  body       text NOT NULL,
  internal   boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS history (
  id         text PRIMARY KEY,
  ticket_id  text NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  actor_id   text NOT NULL REFERENCES users(id),
  type       text NOT NULL,
  "from"     text,
  "to"       text,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_time_entries (
  id               text PRIMARY KEY,
  ticket_id        text NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  agent_id         text NOT NULL REFERENCES users(id),
  started_at       timestamptz NOT NULL DEFAULT now(),
  stopped_at       timestamptz,
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  CHECK (
    (stopped_at IS NULL AND duration_seconds IS NULL) OR
    (stopped_at IS NOT NULL AND duration_seconds IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS counters (
  name  text PRIMARY KEY,
  value integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ticket_catalogs (
  kind       text NOT NULL CHECK (kind IN ('status', 'priority', 'category', 'channel')),
  value      text NOT NULL,
  label      text NOT NULL,
  active     boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (kind, value)
);

INSERT INTO ticket_catalogs (kind, value, label, sort_order) VALUES
  ('status', 'abierto', 'Abierto', 10),
  ('status', 'en_progreso', 'En progreso', 20),
  ('status', 'en_espera', 'En espera', 30),
  ('status', 'resuelto', 'Resuelto', 40),
  ('status', 'cerrado', 'Cerrado', 50),
  ('priority', 'baja', 'Baja', 10),
  ('priority', 'media', 'Media', 20),
  ('priority', 'alta', 'Alta', 30),
  ('priority', 'urgente', 'Urgente', 40),
  ('channel', 'email', 'Correo', 10),
  ('channel', 'telefono', 'Teléfono', 20),
  ('channel', 'chat', 'Chat en vivo', 30),
  ('channel', 'web', 'Portal web', 40),
  ('channel', 'whatsapp', 'WhatsApp', 50),
  ('category', 'Acceso y cuentas', 'Acceso y cuentas', 10),
  ('category', 'Facturación', 'Facturación', 20),
  ('category', 'Errores de software', 'Errores de software', 30),
  ('category', 'Hardware', 'Hardware', 40),
  ('category', 'Redes', 'Redes', 50),
  ('category', 'Solicitud de información', 'Solicitud de información', 60),
  ('category', 'Otro', 'Otro', 70)
ON CONFLICT (kind, value) DO NOTHING;
INSERT INTO ticket_catalogs (kind, value, label, sort_order)
SELECT 'channel', min(ticket.channel), min(ticket.channel), 100
FROM tickets AS ticket
WHERE btrim(ticket.channel) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM ticket_catalogs AS catalog
    WHERE catalog.kind = 'channel'
      AND lower(catalog.label) = lower(ticket.channel)
  )
GROUP BY lower(ticket.channel)
ON CONFLICT (kind, value) DO NOTHING;
INSERT INTO ticket_catalogs (kind, value, label, sort_order)
SELECT 'category', min(ticket.category), min(ticket.category), 100
FROM tickets AS ticket
WHERE btrim(ticket.category) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM ticket_catalogs AS catalog
    WHERE catalog.kind = 'category'
      AND lower(catalog.label) = lower(ticket.category)
  )
GROUP BY lower(ticket.category)
ON CONFLICT (kind, value) DO NOTHING;
UPDATE tickets AS ticket
SET category = catalog.value
FROM ticket_catalogs AS catalog
WHERE catalog.kind = 'category'
  AND lower(catalog.label) = lower(ticket.category)
  AND ticket.category <> catalog.value;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_catalogs_unique_label
  ON ticket_catalogs(kind, lower(label));

CREATE INDEX IF NOT EXISTS idx_tickets_requester ON tickets(requester_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_comments_ticket ON comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_history_ticket ON history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_time_entries_ticket ON ticket_time_entries(ticket_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_time_entries_one_active_per_agent
  ON ticket_time_entries(agent_id)
  WHERE stopped_at IS NULL;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM ticket_time_entries
    WHERE stopped_at IS NULL
    GROUP BY ticket_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Hay varios cronómetros activos por ticket. Revise ticket_time_entries antes de crear idx_ticket_time_entries_one_active_per_ticket.';
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_time_entries_one_active_per_ticket
  ON ticket_time_entries(ticket_id)
  WHERE stopped_at IS NULL;
