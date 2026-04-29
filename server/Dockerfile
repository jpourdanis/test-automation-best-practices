FROM node:22-alpine3.23

RUN apk upgrade --no-cache

# Copy workspace root manifests so npm ci can resolve shared package deps from lockfile
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --legacy-peer-deps --workspace=packages/shared && \
    npm run build --workspace=packages/shared

WORKDIR /app/server
COPY server/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --omit=dev

COPY server/ ./

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/ || exit 1

USER node

CMD ["node", "index.js"]
