# Use Node.js as the base image
FROM node:20.15.0-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm install

# Build the application
FROM deps AS builder
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NEXT_PUBLIC_DEPLOYMENT_URL=https://softbackend.run.place

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE 3000

# Set the command to run the app
CMD ["node", "server.js"]