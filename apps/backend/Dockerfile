FROM node:24.4.0-alpine AS base

RUN apk update
RUN apk add --no-cache libc6-compat bash

WORKDIR /app

FROM base AS builder

RUN npm i -g turbo@2.5.4

COPY package*.json ./
COPY turbo.json ./
COPY apps/ ./apps
COPY tsconfig.json ./

RUN turbo prune --scope="@apps/backend" --docker

FROM base AS installer

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
COPY tsconfig.json ./

RUN npm ci

COPY --from=builder /app/out/full/ .

RUN npm run build --filter="@apps/backend"

FROM base AS runner

ENV NODE_ENV=production
ENV NODE_CONFIG_DIR=/app/apps/backend/config

COPY package*.json ./
COPY --from=installer /app/apps/backend/dist ./apps/backend
COPY --from=installer /app/apps/backend/config ./apps/backend/config
COPY --from=installer /app/apps/backend/package.json ./apps/backend/package.json

RUN npm ci

USER node

CMD node apps/backend/src/index.js
