# ── Stage 1 : build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY packages/server/package.json ./packages/server/

RUN pnpm install --filter server --frozen-lockfile

COPY packages/server ./packages/server

# Générer le client Prisma
RUN cd packages/server && npx prisma generate --schema=prisma/schema.prisma

# Compiler TypeScript → dist/
RUN pnpm --filter server build

# ── Stage 2 : production ──────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copier tout depuis le builder — node_modules inclus (Prisma déjà généré)
COPY --from=builder /app/packages/server/dist         ./packages/server/dist
COPY --from=builder /app/packages/server/prisma       ./packages/server/prisma
COPY --from=builder /app/packages/server/node_modules ./packages/server/node_modules
COPY --from=builder /app/node_modules                 ./node_modules

WORKDIR /app/packages/server

EXPOSE 3002

CMD ["node", "dist/index.js"]
