FROM node:18-alpine as builder

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
COPY packages/admin/package.json ./packages/admin/

RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn workspace @feature-flag-service/admin build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/packages/admin/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 