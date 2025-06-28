# Build stage
FROM node:24-alpine AS build

WORKDIR /build

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY --from=build /build/dist /app/dist

EXPOSE 8000

# Default command (can be overridden in docker-compose)
CMD ["npm", "run", "start"] 