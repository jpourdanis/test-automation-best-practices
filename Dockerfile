FROM mcr.microsoft.com/playwright:v1.58.2-noble AS base

WORKDIR /app
ENV CI=true

# Apply OS-level security patches from Ubuntu's security repository
# This resolves HIGH/MEDIUM CVEs in base image packages (libvpx9, openssh-client, etc.)
RUN apt-get update -qq \
    && apt-get upgrade -y --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

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
USER pwuser
EXPOSE 3000
CMD ["npm", "run", "start"]

# ---- Playwright stage: used to run tests ----
FROM base AS playwright
USER pwuser
ENTRYPOINT ["npx", "playwright", "test"]
