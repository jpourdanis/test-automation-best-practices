FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

COPY . .

EXPOSE 5001

CMD ["node", "index.js"]
