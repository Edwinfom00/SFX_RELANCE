# ── Stage 1 : dépendances ────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY packages/web/package.json    ./packages/web/
COPY packages/server/package.json ./packages/server/

RUN pnpm install --frozen-lockfile

# ── Stage 2 : build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

# Copier tous les node_modules depuis deps
COPY --from=deps /app/node_modules                 ./node_modules
COPY --from=deps /app/packages/web/node_modules    ./packages/web/node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY packages/web                 ./packages/web
COPY packages/server/prisma       ./packages/server/prisma
COPY packages/server/package.json ./packages/server/

# Générer le client Prisma
RUN cd packages/server && npx prisma generate --schema=prisma/schema.prisma

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm --filter web build

# ── Stage 3 : runner ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/standalone  ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/static       ./packages/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/public             ./packages/web/public

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "packages/web/server.js"]
