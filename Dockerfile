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

# Read DATABASE_URL from environment variables; if set, run db_init.sql, then start server
CMD ["/bin/sh", "-c", "\
  export DATABASE_URL=$(env | sed -n 's/^DATABASE_URL=//p'); \
  if [ -n \"$DATABASE_URL\" ] && [ -f db_init.sql ]; then \
    echo 'DATABASE_URL found — running db_init.sql'; \
    psql \"$DATABASE_URL\" -f db_init.sql; \
  else \
    if [ -z \"$DATABASE_URL\" ]; then \
      echo 'No DATABASE_URL set — skipping db_init.sql'; \
    else \
      echo 'db_init.sql not found — skipping'; \
    fi; \
  fi; \
  exec node dist/main;\
"]
