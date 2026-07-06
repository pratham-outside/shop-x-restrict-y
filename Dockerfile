FROM node:20-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

# 🌟 Install pnpm globally using the pre-installed npm tool
RUN npm install -g pnpm

# 🌟 Copy your package.json and pnpm lockfile
COPY package.json pnpm-lock.yaml* ./

# 🌟 Run a clean, production-only install using pnpm syntax
RUN pnpm install --frozen-lockfile --prod && pnpm cache clean --force

COPY . .

RUN pnpm run build

CMD ["pnpm", "run", "docker-start"]