FROM node:22-alpine3.23

RUN apk upgrade --no-cache

# Copy shared package, build its dist, then strip dev deps
COPY packages/shared /app/packages/shared
WORKDIR /app/packages/shared
RUN --mount=type=cache,target=/root/.npm \
    npm install && npm run build && npm prune --omit=dev

WORKDIR /app/server
COPY server/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

COPY server/ ./

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/ || exit 1

USER node

CMD ["node", "index.js"]
