FROM node:22-alpine
RUN apk add --no-cache openssl libc6-compat

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

# 📦 Install pnpm globally inside the container
RUN npm install -g pnpm

# 📄 Copy the package.json and the pnpm lockfile
COPY package.json pnpm-lock.yaml* ./

# 🛠️ Configure pnpm to allow third-party build scripts and install ALL dependencies
RUN  pnpm install --frozen-lockfile && pnpm cache clean

# 📂 Copy the rest of your application code
COPY . .

# 🏗️ Build the React Router app and the Shopify extension
RUN pnpm run build

# 🚀 Start the application using your production script
CMD ["pnpm", "run", "docker-start"]