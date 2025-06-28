# Build stage
FROM node:24-alpine AS build

WORKDIR /build

# Copy package files
COPY package.json ./

# Install all dependencies (including dev dependencies for TypeScript)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install only production dependencies
RUN npm install --production

# Copy built application from build stage
COPY --from=build /build/dist /app/dist

# # Copy tasks directory (needed for graphile-worker)
# COPY --from=build /build/dist/tasks /app/tasks

# Default command - run our programmatic worker
CMD ["npm", "start"] 