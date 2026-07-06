FROM node:20-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./

RUN pnpm ci --omit=dev && pnpm cache clean --force

COPY . .

RUN pnpm run build

CMD ["pnpm", "run", "docker-start"]
