# Build stage — installs deps, downloads db_init.sql from GitHub (falls back to local), builds frontend
FROM node:20-bookworm AS builder

WORKDIR /app

# Install dependencies (lockfile ensures reproducible installs)
COPY package.json package-lock.json ./
RUN npm ci

# Download db_init.sql from GitHub; if the repo is private/unreachable, fall back to local copy
RUN set -e; \
    curl -sL -o db_init.sql \
      "https://raw.githubusercontent.com/GabrielTenma/apollo/development/.workspace/db-init.sql" \
      || echo 'GitHub fetch failed (repo may be private), using local fallback'; \
    if [ ! -s db_init.sql ] && [ -f ".workspace/db-init.sql" ]; then \
      cp .workspace/db-init.sql db_init.sql; \
    fi; \
    echo "--- db_init.sql (first 3 lines) ---"; \
    head -3 db_init.sql

# Build frontend → dist/web/
COPY dist/ ./dist/
RUN npx vite build

# ─── Runtime stage — minimal Alpine-based, runs server
FROM node:20-alpine AS runner

WORKDIR /app

# ─────────────────────────────────────────────────────────────────────────────
# SECURITY & CONFIGURATION CONTRACT
#   • This image NEVER contains any .env file (see .dockerignore).
#   • All configuration and secrets must be supplied at `docker run` time:
#       docker run --env-file .env -p 3000:3000 yourimage
#       or
#       docker run -e DATABASE_URL=... -e OPENROUTER_API_KEY=... ...
#   • The app (via bootstrap-env.ts + CommonConfigService) reads process.env
#     at startup. Pre-injected vars from Docker are authoritative.
#   • Never use COPY .env or build args for real credentials.
# ─────────────────────────────────────────────────────────────────────────────

# Install PostgreSQL client needed for conditional db_init.sql execution
RUN apk add --no-cache curl postgresql-client

# Install only production deps (no devDeps)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled frontend, server source, and db_init.sql from builder
COPY --from=builder /app/dist ./dist
COPY src ./src
COPY --from=builder /app/db_init.sql ./

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=15s \
  CMD ["/usr/bin/curl", "-f", "http://localhost:3000/health", "--max-time", "5", "--retry", "3"] || exit 1

# Runtime entrypoint:
# - Optionally run db_init.sql if DATABASE_URL + db_init.sql are present.
# - DATABASE_URL (and all other config) must come from docker run --env-file or -e.
# - Then start the NestJS server.
CMD ["/bin/sh", "-c", "\
  if [ -n \"$DATABASE_URL\" ] && [ -f db_init.sql ]; then \
    echo 'DATABASE_URL found — running db_init.sql'; \
    psql \"$DATABASE_URL\" -f db_init.sql || echo 'db_init.sql had errors (continuing)'; \
  else \
    if [ -z \"$DATABASE_URL\" ]; then \
      echo 'No DATABASE_URL set — skipping db_init.sql'; \
    else \
      echo 'db_init.sql not found — skipping'; \
    fi; \
  fi; \
  exec node dist/main\
"]
