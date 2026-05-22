/**
 * run-sqlite-schema.ts
 * ─────────────────────
 * Idempotent SQLite schema initialiser for Apollo.
 *
 * Called from `bootstrap-env.ts` after it injects a SQLite DATABASE_URL into
 * `process.env`.  This script is a no-op on PostgreSQL connections.
 *
 * Logic:
 *  1. Read DATABASE_URL from process.env.
 *  2. If URL does NOT start with "sqlite:" → skip immediately.
 *  3. Resolve the filesystem path from the URL (strip `sqlite:` prefix).
 *  4. If the DB file does NOT exist, or if any expected table is missing,
 *     read `db_init.sqlite.sql` (from the project root) and execute it via
 *     `better-sqlite3`.
 *  5. Log a short summary of what was done.
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import Database from 'better-sqlite3';

// Must match the IF NOT EXISTS guard already inside the SQL file.
const EXPECTED_TABLES = [
  'users',
  'user_auth_providers',
  'user_sessions',
  'telegram_bots',
  'telegram_chats',
  'telegram_updates',
  'scraping_sources',
  'scraped_data',
  'feature_configs',
];

/** Resolve a filesystem path from a sqlite: URL. */
function resolveDbPath(url: string): string {
  // Handles: sqlite:///absolute, sqlite://./relative, sqlite:relative
  let pathPart = url.replace(/^sqlite:\/\//, '').replace(/^sqlite:/, '');
  if (pathPart.startsWith('./') || pathPart.startsWith('/')) {
    return resolve(process.cwd(), pathPart);
  }
  return resolve(process.cwd(), pathPart);
}

/** Return the set of table names that already exist in the given DB. */
function listExistingTables(db: Database.Database): Set<string> {
  const rows = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )
    .all() as Array<{ name: string }>;
  return new Set(rows.map((r) => r.name));
}

/** Detect whether the SQLite DB needs initialisation. */
function needsInit(dbPath: string): boolean {
  if (!existsSync(dbPath)) return true;
  const db = new Database(dbPath);
  try {
    const existing = listExistingTables(db);
    // Need init if even one expected table is absent
    return EXPECTED_TABLES.some((t) => !existing.has(t));
  } finally {
    db.close();
  }
}

/** Execute the raw SQL from db_init.sqlite.sql inside the target DB. */
function applySchema(dbPath: string): void {
  const projectRoot = resolve(process.cwd());
  const sqlFile = join(projectRoot, 'db_init.sqlite.sql');
  const sql = readFileSync(sqlFile, 'utf-8');

  const db = new Database(dbPath);
  try {
    // better-sqlite3 does not silently handle multiple statements; we exec the
    // whole file at once which works because each statement ends with a ";"
    // and the file does not contain expressions or variable substitution.
    db.exec(sql);
    const existing = listExistingTables(db);
    const newlyCreated = EXPECTED_TABLES.filter((t) => existing.has(t));
    console.log(
      `[run-sqlite-schema] Applied db_init.sqlite.sql → ${newlyCreated.length} tables created.`,
    );
  } finally {
    db.close();
  }
}

// ── Entry point ─────────────────────────────────────────────────────────────
const dbUrl = (process.env.DATABASE_URL ?? '').toLowerCase();

if (!dbUrl.startsWith('sqlite:')) {
  // Not a SQLite connection — nothing to do.
  process.exit(0);
}

const dbPath = resolveDbPath(process.env.DATABASE_URL!);

if (needsInit(dbPath)) {
  console.log(`[run-sqlite-schema] SQLite DB at "${dbPath}" needs initialisation.`);
  applySchema(dbPath);
} else {
  console.log(
    `[run-sqlite-schema] SQLite DB at "${dbPath}" already initialised — skipping.`,
  );
}
