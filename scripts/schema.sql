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

CREATE TABLE IF NOT EXISTS counters (
  name  text PRIMARY KEY,
  value integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tickets_requester ON tickets(requester_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_comments_ticket ON comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_history_ticket ON history(ticket_id);
