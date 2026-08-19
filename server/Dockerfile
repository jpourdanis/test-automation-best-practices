FROM node:22-alpine3.23

RUN apk upgrade --no-cache

# Copy workspace root manifests so npm ci can resolve shared package deps from lockfile.
# /app/node_modules is build-time only (tsup, typescript, etc. for compiling
# packages/shared) and must not leak into the final image, so we keep just
# the runtime dep (zod) the built dist/ actually requires and drop the rest.
WORKDIR /app
ENV CI=true
COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
RUN npm ci --ignore-scripts --legacy-peer-deps --workspace=packages/shared && \
    npm run build --workspace=packages/shared && \
    mkdir -p packages/shared/node_modules && \
    cp -R node_modules/zod packages/shared/node_modules/zod && \
    rm -rf node_modules

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --ignore-scripts --omit=dev --legacy-peer-deps --no-workspaces

COPY server/ ./

# The image only ever runs `node index.js` -- npm/npx/corepack are build-time
# tools, not runtime dependencies. Removing them drops their bundled
# transitive deps (multiple stale versions of brace-expansion, ip-address,
# fast-uri, tar, sigstore, etc.) from the image entirely instead of chasing
# each new CVE disclosed against Node's vendored npm CLI.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack && \
    rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/ || exit 1

USER node

CMD ["node", "index.js"]
