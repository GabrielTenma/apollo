-- ============================================================
-- db_init.sqlite.sql
-- Initial DDL for Apollo's TypeORM entities, targeting SQLite.
--
-- SQLite type mapping (from TypeORM entity definitions):
--   uuid      → TEXT      (UUID stored as canonical string)
--   varchar   → TEXT
--   text      → TEXT
--   boolean   → INTEGER   (0 = false, 1 = true)
--   jsonb     → TEXT      (JSON-serialised string)
--   timestamptz → TEXT    (ISO 8601 string, e.g. "2025-01-02T03:04:05.000Z")
--   bigint    → INTEGER
--   inet      → TEXT      (IPv4/IPv6 stored as string)
--   int       → INTEGER
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- ── users ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            TEXT    NOT NULL PRIMARY KEY,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT,
    full_name     TEXT,
    is_active     INTEGER NOT NULL DEFAULT 1,
    roles         TEXT    NOT NULL DEFAULT '["user"]',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── user_auth_providers ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_auth_providers (
    id               TEXT    NOT NULL PRIMARY KEY,
    user_id          TEXT    NOT NULL,
    provider         TEXT    NOT NULL,
    provider_user_id TEXT    NOT NULL,
    provider_data    TEXT,
    created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── user_sessions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
    id             TEXT    NOT NULL PRIMARY KEY,
    user_id        TEXT    NOT NULL,
    refresh_token_hash TEXT NOT NULL,
    user_agent     TEXT,
    ip_address     TEXT,
    expires_at     TEXT    NOT NULL,
    revoked_at     TEXT,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── telegram_bots ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS telegram_bots (
    id            TEXT    NOT NULL PRIMARY KEY,
    bot_token_hash TEXT   NOT NULL,
    bot_username  TEXT    UNIQUE,
    webhook_secret TEXT   NOT NULL,
    is_active     INTEGER NOT NULL DEFAULT 1,
    config        TEXT    NOT NULL DEFAULT '{}'
);

-- ── telegram_chats ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS telegram_chats (
    id                TEXT NOT NULL PRIMARY KEY,
    bot_id            TEXT NOT NULL,
    telegram_chat_id  INTEGER NOT NULL,
    chat_type         TEXT,
    title             TEXT,
    username          TEXT,
    first_name        TEXT,
    last_name         TEXT,
    linked_user_id    TEXT,
    settings          TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY (bot_id)         REFERENCES telegram_bots(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(bot_id, telegram_chat_id)
);

-- ── telegram_updates ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS telegram_updates (
    id              TEXT    NOT NULL PRIMARY KEY,
    bot_id          TEXT    NOT NULL,
    update_id       INTEGER NOT NULL,
    telegram_chat_id INTEGER,
    message_date    TEXT,
    raw_update      TEXT    NOT NULL,
    processed_at    TEXT,
    processed_by    TEXT,
    error           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (bot_id) REFERENCES telegram_bots(id) ON DELETE CASCADE,
    UNIQUE(bot_id, update_id)
);

-- ── scraping_sources ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scraping_sources (
    id               TEXT    NOT NULL PRIMARY KEY,
    name             TEXT    NOT NULL,
    source_type      TEXT    NOT NULL,
    connection_config TEXT   NOT NULL,
    schedule_cron    TEXT,
    is_active        INTEGER NOT NULL DEFAULT 1,
    created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── scraped_data ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scraped_data (
    id            TEXT    NOT NULL PRIMARY KEY,
    source_id     TEXT    NOT NULL,
    captured_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    raw_content   TEXT,
    parsed_data   TEXT,
    data_hash     TEXT,
    status        TEXT    NOT NULL DEFAULT 'new',
    processing_log TEXT,
    FOREIGN KEY (source_id) REFERENCES scraping_sources(id) ON DELETE CASCADE,
    UNIQUE(source_id, data_hash)
);

-- ── feature_configs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_configs (
    id            TEXT    NOT NULL PRIMARY KEY,
    feature_key   TEXT    NOT NULL UNIQUE,
    value_type    TEXT    NOT NULL DEFAULT 'string',
    value_string  TEXT,
    value_integer INTEGER,
    value_boolean INTEGER,
    value_json    TEXT,
    description   TEXT,
    scope_type    TEXT    NOT NULL,
    scope_id      TEXT,
    priority      INTEGER NOT NULL DEFAULT 0,
    is_enabled    INTEGER NOT NULL DEFAULT 1,
    updated_by    TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ── indexes for foreign keys not covered by UNIQUE constraints ─────────────
CREATE INDEX IF NOT EXISTS idx_user_auth_providers_user_id
    ON user_auth_providers (user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
    ON user_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_telegram_chats_bot_id
    ON telegram_chats (bot_id);

CREATE INDEX IF NOT EXISTS idx_telegram_updates_bot_id
    ON telegram_updates (bot_id);

CREATE INDEX IF NOT EXISTS idx_scraped_data_source_id
    ON scraped_data (source_id);

COMMIT TRANSACTION;
