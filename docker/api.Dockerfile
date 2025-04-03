FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
COPY packages/server/package.json ./packages/server/
COPY packages/common/package.json ./packages/common/

RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn workspace @feature-flag-service/server build

# Expose the port
EXPOSE 3000

# Start the application
CMD ["yarn", "workspace", "@feature-flag-service/server", "start:prod"] 