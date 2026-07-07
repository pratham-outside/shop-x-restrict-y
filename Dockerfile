FROM node:22-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

# 📦 Install pnpm globally inside the container
RUN npm install -g pnpm

# 📄 Copy the package.json and the pnpm lockfile
COPY package.json pnpm-lock.yaml* ./

# 🛠️ Install ALL dependencies so we can build successfully
RUN pnpm install --frozen-lockfile && pnpm cache clean

# 📂 Copy the rest of your application code
COPY . .

# 🏗️ Build the React Router app and the Shopify extension
RUN pnpm run build

# 🚀 Start the application using your production script
CMD ["pnpm", "run", "docker-start"]