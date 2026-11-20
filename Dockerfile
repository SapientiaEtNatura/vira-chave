FROM node:22.14-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS migrator
COPY prisma ./prisma
COPY src/lib/seed-data.ts ./src/lib/seed-data.ts
COPY src/lib/discovery/types.ts ./src/lib/discovery/types.ts
RUN npx prisma generate
USER node

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npx prisma generate
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/virachave?schema=public"
ENV AUTH_SECRET="build-time-secret-placeholder"
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV UPLOAD_DIR="/app/uploads"

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

RUN mkdir -p /app/uploads /app/.next/cache \
  && chown -R nextjs:nodejs /app/uploads /app/.next/cache

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
