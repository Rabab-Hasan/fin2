# Multi-stage Docker build for Finance Dashboard

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN chmod +x node_modules/.bin/* 
RUN npm run build

# Stage 2: Setup Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ .

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

# Install backend dependencies
COPY --from=backend-builder /app/backend ./backend
# Copy built frontend
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Create uploads directory
RUN mkdir -p /app/backend/uploads/marketing

# Set environment
ENV NODE_ENV=production
ENV PORT=2345

# Expose port
EXPOSE 2345

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:2345/api/health || exit 1

# Start server
WORKDIR /app/backend
CMD ["npm", "start"]