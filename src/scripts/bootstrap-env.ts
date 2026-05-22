// @ts-nocheck
'use strict';
/**
 * bootstrap-env  – runs as the FIRST thing main.ts does
 *
 * Pure CommonJS (require / sync fs).  No top-level await / async IIFE issues.
 * When NestJS calls `require('./scripts/bootstrap-env')` this file executes
 * end-to-end before NestFactory creates the AppModule.
 *
 * Logic:
 *  1. If .env is missing or DATABASE_URL is blank → generate .env
 *       DATABASE_URL=sqlite://./apollo.db
 *       JWT_SECRET=<uuid v4>
 *     All other keys are preserved from .env.example.
 *  2. Overwrite process.env so no later dotenv loader clobbers the values.
 *  3. If the active DB is SQLite, check whether the file has the expected
 *     tables; if anything is missing, apply db_init.sqlite.sql in one shot
 *     using better-sqlite3 (→ DB is ready before TypeORM opens its first
 *     connection).
 */
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');

try        { /* Node 14.17+ */ globalThis.crypto.randomUUID(); }
catch (_)  { /* older – fallback covered by crypto below          */ }

const CWD     = process.cwd();
const ENV     = path.join(CWD, '.env');
const ENV_EX  = path.join(CWD, '.env.example');
const DB_INIT = path.join(CWD, 'db_init.sqlite.sql');

const EXPECTED_TABLES = [
  'users', 'user_auth_providers', 'user_sessions',
  'telegram_bots', 'telegram_chats', 'telegram_updates',
  'scraping_sources', 'scraped_data', 'feature_configs',
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
    if ((v[0] === '"' && v[v.length - 1] === '"') || (v[0] === "'" && v[v.length - 1] === "'"))
      v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

function buildEnv(lines, url, secret) {
  const seen   = new Set();
  const result = [];

  for (const line of lines) {
    const t = line.trim();
    if (!t) { result.push(line); continue; }
    const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (!m) { result.push(line); continue; }
    if (m[1] === 'DATABASE_URL') result.push(`DATABASE_URL=${url}`);
    else if (m[1] === 'JWT_SECRET') result.push(`JWT_SECRET=${secret}`);
    else result.push(line);
    seen.add(m[1]);
  }
  if (!seen.has('DATABASE_URL')) result.push(`DATABASE_URL=${url}`);
  if (!seen.has('JWT_SECRET'))  result.push(`JWT_SECRET=${secret}`);
  return result.join('\n') + '\n';
}

// ── SQLite schema helpers ─────────────────────────────────────────────────────
function listTables(db) {
  return new Set(
    db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    ).all().map((r) => r.name),
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
  let pathPart = rawUrl.replace(/^sqlite:\/\//, '');   // strip // if present
  pathPart = pathPart.replace(/^sqlite:/, '');          // strip remaining :
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
const needsBootstrap =
  !fs.existsSync(ENV) ||
  (() => {
    const env = parseEnv(fs.readFileSync(ENV));
    return !env.DATABASE_URL || env.DATABASE_URL.trim() === '';
  })();

if (needsBootstrap) {
  const secret = uuid();
  const url    = 'sqlite://./apollo.db';

  console.log(
    '[bootstrap-env] .env missing or DATABASE_URL not set — generating with SQLite.',
  );

  const seed = fs.existsSync(ENV_EX) ? fs.readFileSync(ENV_EX, 'utf-8').split('\n') : [];
  fs.writeFileSync(ENV, buildEnv(seed, url, secret), 'utf-8');

  process.env.DATABASE_URL = url;
  process.env.JWT_SECRET   = secret;

  console.log(`[bootstrap-env] .env written → DATABASE_URL=${url}`);
  console.log(`[bootstrap-env] .env written → JWT_SECRET=${secret}`);

  ensureSqlite(url);
} else {
  const raw = String(process.env.DATABASE_URL || '').toLowerCase();
  if (raw.startsWith('sqlite:')) ensureSqlite(raw);
}
