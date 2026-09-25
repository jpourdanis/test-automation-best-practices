FROM node:26-alpine3.23 AS build

# Everything resolves from the single root lockfile. The shared package is built
# with its dev toolchain first; then node_modules is wiped and reinstalled with
# only the server workspace's production tree, which is all the runtime copies.
WORKDIR /app
ENV CI=true
COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY server/package.json ./server/
RUN npm ci --ignore-scripts --legacy-peer-deps --workspace=packages/shared && \
    npm run build --workspace=packages/shared && \
    rm -rf node_modules packages/shared/node_modules && \
    npm ci --ignore-scripts --omit=dev --legacy-peer-deps --workspace=server && \
    mkdir -p server/node_modules packages/shared/node_modules

FROM node:26-alpine3.23

RUN apk upgrade --no-cache

WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build /app/server/node_modules ./server/node_modules
COPY server/ ./server/

# The image only ever runs `node index.js` -- npm/npx/corepack are build-time
# tools, not runtime dependencies. Removing them drops their bundled
# transitive deps (multiple stale versions of brace-expansion, ip-address,
# fast-uri, tar, sigstore, etc.) from the image entirely instead of chasing
# each new CVE disclosed against Node's vendored npm CLI.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack && \
    rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

WORKDIR /app/server

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/ || exit 1

USER node

CMD ["node", "index.js"]
