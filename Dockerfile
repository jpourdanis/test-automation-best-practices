FROM mcr.microsoft.com/playwright:v1.59.1-noble AS base

WORKDIR /app
ENV CI=true

# Install dependencies using npm (this repo uses npm)
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

# Copy project files
COPY . .

# Ensure test output directories are writable by the non-root Playwright user
RUN mkdir -p /app/test-results /app/playwright-report /app/allure-results /app/traces \
    && chmod -R a+rwx /app/test-results /app/playwright-report /app/allure-results /app/traces

# ---- Build stage: builds the production app ----
FROM base AS build
ARG USE_BABEL_PLUGIN_ISTANBUL=1
ENV USE_BABEL_PLUGIN_ISTANBUL=$USE_BABEL_PLUGIN_ISTANBUL
RUN npm run build

# ---- App stage: serves the production build using Nginx ----
FROM nginx:alpine AS app
RUN apk add --no-cache curl
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]

# ---- Playwright stage: used to run tests ----
FROM base AS playwright
USER pwuser
ENTRYPOINT ["npx", "playwright", "test"]
