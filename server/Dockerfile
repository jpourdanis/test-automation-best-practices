FROM node:22-alpine3.23

RUN apk upgrade --no-cache

WORKDIR /app/server

# Copy shared package so npm ci can resolve @color-app/shared via ../packages/shared
COPY packages/shared /app/packages/shared

COPY server/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

COPY server/ ./

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/ || exit 1

USER node

CMD ["node", "index.js"]
