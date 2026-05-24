# Contributing to Apollo

Thank you for your interest in contributing to **Apollo**!
This document explains how to set up the project locally, run it, and submit changes that are consistent with the project's conventions.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Environment Variables](#environment-variables)
4. [Running the Application](#running-the-application)
5. [Code Style](#code-style)
6. [Testing](#testing)
7. [Project Structure](#project-structure)
8. [Adding a New Feature or Fixing a Bug](#adding-a-new-feature-or-fixing-a-bug)
9. [Pull Request Guidelines](#pull-request-guidelines)
10. [Design Patterns & Conventions](#design-patterns--conventions)

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 18+ | LTS recommended; `ts-node` requires ≥14.17 |
| npm | 9+ | Comes with Node.js ≥18 |
| Playwright | latest | `npx playwright install` — for E2E tests and browser-based scraping |
| PostgreSQL | 12+ | Upsource (Supabase) connection string required for production-like runs |
| SQLite | built-in | Used as the fallback dev database when `DATABASE_URL` is not set |

> **Tip:** A local `DATABASE_URL` that points at SQLite (e.g. `sqlite://./apollo.db`) works out of the box for development without a running database server. The bootstrap script in `src/scripts/bootstrap-env.ts` automatically sets this up when no `.env` or `DATABASE_URL` is found.

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/GabrielTenma/apollo.git
cd apollo

# 2. Clean install (CI-safe: skips existing dev dep chain)
npm ci --legacy-peer-deps

# 3. Set up environment variables (see [Environment Variables] section)
cp .env.example .env
# edit .env and fill in the required values

# 4. Run the backend (NestJS on port 3000) + frontend (Vite dev server on port 3001)
npm run dev
```

When both servers are running:
- NestJS API: **http://localhost:3000**
- Vite dev server: **http://localhost:3001**
- CORS is configured for `localhost:5173`, `localhost:3001`, and `localhost:3000`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the required secrets.

### Minimum for a local SQLite dev run

```env
# Leave DATABASE_URL unset, or set it explicitly:
DATABASE_URL=sqlite://./apollo.db

# At minimum for JWT:
JWT_SECRET=<any-secret-string>
```

When `DATABASE_URL` is absent the bootstrap script (`src/scripts/bootstrap-env.ts`) writes `DATABASE_URL=sqlite://./apollo.db` into `.env` automatically.

### Full list

```env
# OpenRouter
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=openai/gpt-oss-120b:free
OPENROUTER_TIMEOUT=300000

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_URL=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_TIMEOUT=30000

# Routines
ROUTINE_ENABLED=true
ROUTINE_EXECUTION_MODE=wait

# JWT
JWT_SECRET=
JWT_ACCESS_EXPIRATION=1d
JWT_REFRESH_EXPIRATION=7d
JWT_SECRET_CREATION=

# Supabase / PostgreSQL
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_PASSWORD=
SUPABASE_USEDIRECT=true
DATABASE_URL=postgresql://postgres:yourpassword@yourdomain.com:5432/postgres
```

### Per-env overrides via `SUPABASE_*` prefix

The Supabase service reads `SUPABASE_<KEY>=<value>` environment variables (case-insensitive, no prefix stripping) to allow multiple connections in a single process. See `src/supabase/config/supabase.config.ts`.

---

## Running the Application

| Task | Command |
|---|---|
| Backend + Frontend (concurrent) | `npm run dev` |
| Backend only (watch mode) | `npm run start:dev` |
| Backend debug (inspect-brk) | `npm run start:debug` |
| Backend only (production build) | `npm run start:prod` |
| All services (production) | `npm run start:all` |
| Build backend only | `npm run build` |
| Build frontend only | `npm run web:build` |
| Build everything | `npm run build:all` |

### First-time SQLite schema setup

When pointing at a fresh SQLite database for the first time, the bootstrap script runs automatically and applies the schema defined in `db_init.sqlite.sql`. To run it manually:

```bash
npx ts-node src/scripts/bootstrap-env.ts
```

You should see output like:
```
[bootstrap-env] SQLite schema created → 9 tables at ".../apollo.db"
```

---

## Code Style

Apollo uses **Biome** for both linting and formatting (replaces ESLint + Prettier).

### Format all files

```bash
npm run format
# equivalent to: npx biome format --write
```

### Lint and auto-fix

```bash
npm run lint
# equivalent to: npx biome check --fix "src" "test" "src/web/src"
```

### Formatting rules (biome.json)

- **Quotes:** single quotes for JS/TS/TSX (`'foo'`)
- **Trailing commas:** `all` — every place a comma is allowed
- **Semicolons:** always
- **Indent:** 2 spaces
- **Line width:** 80
- **JSX attribute position:** multiline
- **Parameter decorators:** `unsafeParameterDecoratorsEnabled: true` (NestJS decorators on constructor/parameter positions)
- **Tailwind CSS parsing:** `tailwindDirectives: true` (CSS files use `@plugin` syntax)

### Custom rules

| Rule | Setting | Rationale |
|---|---|---|
| `noExplicitAny` | off | Intentionally used in legacy adapter code |
| `noImplicitAnyLet` | off | |
| `noAssignInExpressions` | off | |
| `noNonNullAssertion` | off | React `getElementById('root')!` pattern |
| `useHookAtTopLevel` | off | `app.listen()` inside conditions is safe outside React components |

---

## Testing

### Unit & Integration (Jest)

```bash
npm run test          # all tests
npm run test:watch    # watch mode
npm run test:cov      # coverage report
```

### E2E (Playwright)

```bash
npm run test:e2e                        # chromium default
npx playwright test                     # all browsers
npx playwright test tests/ --project=firefox
```

> **CI:** Playwright runs on Ubuntu via `.github/workflows/playwright.yml`.
> Use `.github/workflows/playwright-manual.yml` (`workflow_dispatch`) to
> run any combination of `cache-node-modules`, `cache-playwright-browsers`,
> `force-install`, and browser targets manually from GitHub Actions.

---

## Project Structure

```
src/
├── main.ts                         # NestJS bootstrap
├── app.module.ts                   # Root DI wiring
├── constants/                      # App-wide constants + APP_CONSTANTS token
├── common/                         # Shared concerns (guards, interceptors, config, utils)
├── auth/                           # JWT + Passport authentication
├── openrouter/                     # OpenRouter AI client + financial agent prompt
├── scraper/                        # Playwright-based web scraping + targets
├── telegram/                       # Telegram bot webhook + messaging
├── supabase/                       # Supabase REST client + TypeORM ORM + entities
└── web/                            # React + Vite frontend (built to dist/web/)

scripts/
└── bootstrap-env.ts                # Runs first; auto-generates .env + SQLite schema

db_init.sqlite.sql                  # SQLite DDL for all TypeORM entities
```

See `AGENTS.md` for a full summary and `## Architecture` for the data-flow diagram.

---

## Adding a New Feature or Fixing a Bug

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/issue-42
   ```

2. **Make changes** following the existing patterns in `src/`:
   - NestJS-style `*.module.ts`, `*.service.ts`, `*.controller.ts`, `*.entity.ts`.
   - New API routes live under `/api/v1/{module}`.

3. **Auto-format before committing**:
   ```bash
   npm run format   # biome format --write
   npm run lint     # biome check --fix
   ```

4. **Add tests** — Jest unit tests live alongside the code (`*.spec.ts`);
   full E2E tests live in `tests/`.

5. **Keep it server-only if possible** — the backend is a monolith that also serves
   static frontend assets in production. Split frontend additions into `src/web/src/`.

---

## Pull Request Guidelines

- **One concern per PR** — unrelated refactoring or dependency bumps belong in a
  separate commit / PR.
- **Descriptive title + summary** — the title should be `feat:`, `fix:`, `refactor:`,
  `chore:`, etc. followed by a concise description.
- **Commit style** is conventional commits (`feat:`, `fix:`, `docs:`, `test:`,
  `chore:` …).
- **CI must pass** — lint (`biome check --fix`), type-safety check
  (no new TS errors on `npm run build`), and Jest/Playwright tests must all pass
  before you request review.
- **Self-review** — run `biome check --fix` and `npm run format` before pushing.

---

## Design Patterns & Conventions

These are documented in `AGENTS.md` and are repeated here for quick reference.

- **Global modules** — `@Global()` for all feature and common modules; imported once in `AppModule`.
- **Thread-safe config** — `CommonConfigService` snapshots `process.env` eagerly; reads are immutable.
- **Memory store** — `MemoryKeyStore` (in-process, TTL, deduplication via `getOrSet`).
- **DB dialect detection** — `src/common/typeorm/typeorm.module.ts` detects SQLite vs PostgreSQL
  from `DATABASE_URL` at runtime using `resolveDialect()`.
- **Bootstrap env** — `src/scripts/bootstrap-env.ts` runs synchronously before NestJS,
  auto-creates `.env` + SQLite schema when not present.
- **Routines** — `RoutineService.startRoutine(name, fn, intervalMs)` with `wait` / `skip` / `overlap`
  execution modes; `OnModuleInit` guards use `isEnabled()`.
- **Auth** — `@Public()` bypasses JWT guard; `@Roles('admin')` enforces RBAC;
  JWT payload extracted via `@CurrentUser()`.

---

## Environment Auto-Setup

On a cold start (no `.env` and no `DATABASE_URL`):

1. `bootstrap-env.ts` writes `.env` with SQLite config + UUID JWT_SECRET.
2. SQLite DDL (`db_init.sqlite.sql`) is applied before TypeORM opens its first connection.
3. The app starts normally.

No manual steps are needed to get a working local database.

---

Thank you for contributing! 🚀
