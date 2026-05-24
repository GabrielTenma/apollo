// @ts-nocheck

/**
 * bootstrap-env  – runs as the FIRST thing main.ts does
 *
 * Pure CommonJS (require / sync fs).  No top-level await / async IIFE issues.
 * When NestJS calls `require('./scripts/bootstrap-env')` this file executes
 * end-to-end before NestFactory creates the AppModule.
 *
 * Env var precedence (12-factor / Docker friendly):
 *   1. process.env (injected via `docker run --env-file .env` or `-e`, shell, etc.)
 *   2. Existing .env file on disk (local development)
 *
 * Logic:
 *  • If effective DATABASE_URL is present (from env or file) → use it.
 *    - Never auto-generate or overwrite .env when running with Docker-provided vars.
 *  • Only when NOTHING provides DATABASE_URL → generate a dev SQLite .env
 *    (DATABASE_URL=sqlite://./apollo.db + random JWT_SECRET) from .env.example template.
 *  • For SQLite URLs, ensure the schema exists before TypeORM connects.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

try {
  /* Node 14.17+ */ globalThis.crypto.randomUUID();
} catch (_) {
  /* older – fallback covered by crypto below          */
}

const CWD = process.cwd();
const ENV = path.join(CWD, '.env');
const ENV_EX = path.join(CWD, '.env.example');
const DB_INIT = path.join(CWD, 'db_init.sqlite.sql');

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

// ── small helpers ────────────────────────────────────────────────────────────
function uuid() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }
  return crypto.randomUUID();
}

function parseEnv(buf) {
  const out = {};
  for (const raw of buf.toString().split('\n')) {
    const t = raw.trim();
    if (!t || t.startsWith('#')) continue;
    const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (
      (v[0] === '"' && v[v.length - 1] === '"') ||
      (v[0] === "'" && v[v.length - 1] === "'")
    )
      v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

function buildEnv(lines, url, secret) {
  const seen = new Set();
  const result = [];

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      result.push(line);
      continue;
    }
    const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (!m) {
      result.push(line);
      continue;
    }
    if (m[1] === 'DATABASE_URL') result.push(`DATABASE_URL=${url}`);
    else if (m[1] === 'JWT_SECRET') result.push(`JWT_SECRET=${secret}`);
    else result.push(line);
    seen.add(m[1]);
  }
  if (!seen.has('DATABASE_URL')) result.push(`DATABASE_URL=${url}`);
  if (!seen.has('JWT_SECRET')) result.push(`JWT_SECRET=${secret}`);
  return `${result.join('\n')}\n`;
}

// ── SQLite schema helpers ─────────────────────────────────────────────────────
function listTables(db) {
  return new Set(
    db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      )
      .all()
      .map((r) => r.name),
  );
}

function createSchema(dbPath) {
  const Database = require('better-sqlite3');
  const db = new Database(dbPath);
  try {
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(fs.readFileSync(DB_INIT, 'utf-8'));
    return listTables(db);
  } finally {
    db.close();
  }
}

function ensureSqlite(rawUrl) {
  // Accept all sqlite: URL forms:
  //   sqlite:./apollo.db   → apollo.db          (relative)
  //   sqlite:apollo.db     → apollo.db          (relative, no ./)
  //   sqlite:///apollo.db   → apollo.db          (abs path via ///)
  //   sqlite://./apollo.db  → ./apollo.db        (TypeORM relative via //.)
  let pathPart = rawUrl.replace(/^sqlite:\/\//, ''); // strip // if present
  pathPart = pathPart.replace(/^sqlite:/, ''); // strip remaining :
  const dbPath = path.resolve(CWD, pathPart.trim());

  try {
    if (!fs.existsSync(dbPath)) {
      const tables = createSchema(dbPath);
      console.log(
        `[bootstrap-env] SQLite schema created → ${tables.size} tables at "${dbPath}"`,
      );
      return;
    }
    const Database = require('better-sqlite3');
    const db = new Database(dbPath);
    try {
      const have = listTables(db);
      if (EXPECTED_TABLES.some((t) => !have.has(t))) {
        db.close();
        const tables = createSchema(dbPath);
        console.log(
          `[bootstrap-env] SQLite schema created → ${tables.size} tables at "${dbPath}"`,
        );
      } else {
        console.log(
          `[bootstrap-env] SQLite DB at "${dbPath}" already initialised — skipping.`,
        );
      }
    } finally {
      db.close();
    }
  } catch (err) {
    console.warn(`[bootstrap-env] SQLite schema check failed: ${err.message}`);
  }
}

// ── main ─────────────────────────────────────────────────────────────────────
// Determine effective DATABASE_URL with correct precedence:
//   1. process.env (injected by Docker --env-file / -e, or shell)
//   2. Existing .env file on disk
// This is the key change that allows `docker run --env-file .env` to work
// without the script auto-generating a dev SQLite .env inside the container.
const hasEnvFile = fs.existsSync(ENV);
const fileEnv = hasEnvFile ? parseEnv(fs.readFileSync(ENV)) : {};
const effectiveDbUrl = (process.env.DATABASE_URL || fileEnv.DATABASE_URL || '').trim();

const needsBootstrap = !effectiveDbUrl;

if (needsBootstrap) {
  // Local development auto-provision path only.
  // We generate a .env file ONLY when nothing was provided via environment.
  const secret = uuid();
  const url = 'sqlite://./apollo.db';

  console.log(
    '[bootstrap-env] .env missing or DATABASE_URL not set — generating with SQLite.',
  );

  const seed = fs.existsSync(ENV_EX)
    ? fs.readFileSync(ENV_EX, 'utf-8').split('\n')
    : [];
  fs.writeFileSync(ENV, buildEnv(seed, url, secret), 'utf-8');

  process.env.DATABASE_URL = url;
  process.env.JWT_SECRET = secret;

  console.log(`[bootstrap-env] .env written → DATABASE_URL=${url}`);
  console.log(`[bootstrap-env] .env written → JWT_SECRET=${secret}`);

  ensureSqlite(url);
} else {
  // Real configuration provided (either via env or existing .env file).
  // In the Docker case (env vars injected, no .env file on disk) we must NOT write anything.
  // Only run SQLite schema initialization if the effective URL is SQLite.
  if (effectiveDbUrl.toLowerCase().startsWith('sqlite:')) {
    ensureSqlite(effectiveDbUrl);
  }
}
