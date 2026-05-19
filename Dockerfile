# Multi-stage build for Apollo - NestJS + React + Playwright

# Stage 1: Build (compiles NestJS backend + Vite frontend)
FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS builder

WORKDIR /app

# Install Node dependencies (includes devDeps needed for build)
COPY package.json package-lock.json* ./
RUN npm install

# Install Playwright Chromium browser (used by scraper at runtime)
RUN npx playwright install chromium

# Copy source
COPY . .

# Build both backend and frontend; copy .env.example to dist/
RUN npm run build:all

# Strip devDependencies for a lean final image
ENV NODE_ENV=production
RUN cp package.json package.json.bak \
    && npm prune --production \
    && mv package.json.bak package.json

# Stage 2: Runtime — Playwright browsers pre-installed via base image
FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS runner

WORKDIR /app

ENV NODE_ENV=production PORT=3000

# Production node_modules (playwright npm package + runtime deps)
COPY --from=builder /app/node_modules ./node_modules

# Built artefacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.env.example ./.env.example

EXPOSE 3000

CMD ["node", "dist/main"]
