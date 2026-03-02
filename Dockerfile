FROM mcr.microsoft.com/playwright:v1.51.1-noble AS base

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

# ---- App stage: runs the frontend server ----
FROM base AS app
EXPOSE 3000
CMD ["npm", "run", "start"]

# ---- Playwright stage: used to run tests ----
FROM base AS playwright
USER pwuser
ENTRYPOINT ["npx", "playwright", "test"]
