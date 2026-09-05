# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — deps
# Install production dependencies only.
# Cached separately so code changes don't re-install node_modules.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Install OpenSSL for Prisma binary compatibility on Alpine
RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — builder
# Install all deps (including devDependencies), generate Prisma client,
# compile TypeScript to JavaScript.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

# Copy Prisma schema first — the generate step only needs this
COPY prisma ./prisma
RUN npx prisma generate

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build


# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — runner
# Minimal production image. Only compiled output + production node_modules.
# Runs as non-root for security.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN apk add --no-cache openssl libc6-compat \
    && addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 expressjs

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Copy Prisma schema + generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy production node_modules
COPY --from=deps /app/node_modules ./node_modules

# Copy package.json so Node can resolve the module name
COPY package.json ./

USER expressjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/server.js"]