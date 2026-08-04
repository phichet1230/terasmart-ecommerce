# Multi-stage Dockerfile for TeraSmart E-Commerce Application

# Stage 1: Build Frontend App
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=frontend-builder /app/dist ./dist
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
