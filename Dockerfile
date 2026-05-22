FROM mcr.microsoft.com/playwright:v1.60.0-noble AS base

WORKDIR /app
ENV CI=true

# Install dependencies using npm (this repo uses npm)
COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts --legacy-peer-deps && npm rebuild esbuild

# Copy project files
COPY . .

# Build shared package so consumers can resolve @color-app/shared dist, and ensure test output directories are writable
RUN npm run build -w @color-app/shared \
    && mkdir -p /app/test-results /app/playwright-report /app/allure-results /app/traces \
    && chmod -R a+rwx /app/test-results /app/playwright-report /app/allure-results /app/traces

# ---- Build stage: builds the production app ----
FROM base AS build
ARG USE_BABEL_PLUGIN_ISTANBUL=1
ENV USE_BABEL_PLUGIN_ISTANBUL=$USE_BABEL_PLUGIN_ISTANBUL
# Cap Node heap to stay well under the Docker VM memory limit.
# Without this, webpack + babel-plugin-istanbul triggers an OOM kill which
# surfaces as "exited too early" with no actionable error message.
# 1024 MB is safe for a ~2 GB Docker VM that also runs mongo + api + web.
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV DISABLE_ESLINT_PLUGIN=true
RUN npm run build

# ---- App stage: serves the production build using Nginx ----
FROM nginx:alpine AS app
RUN apk add --no-cache curl
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1
CMD ["nginx", "-g", "daemon off;"]

# ---- Playwright stage: used to run tests ----
FROM base AS playwright
HEALTHCHECK NONE
USER pwuser
ENTRYPOINT ["npx", "playwright", "test"]
