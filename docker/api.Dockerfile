FROM node:18-slim

WORKDIR /app

# Install build dependencies for bcrypt without any SSL
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++

# Disable all SSL verification
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV NPM_CONFIG_STRICT_SSL=false
ENV YARN_REGISTRY=http://registry.npmjs.org/
ENV NPM_CONFIG_REGISTRY=http://registry.npmjs.org/
ENV NODE_OPTIONS=--no-warnings

# Create npmrc file to disable SSL
RUN echo "strict-ssl=false" > .npmrc && \
    echo "registry=http://registry.npmjs.org/" >> .npmrc

# Copy package files
COPY package.json yarn.lock ./
COPY packages/server/package.json ./packages/server/
COPY packages/common/package.json ./packages/common/

# Install dependencies without SSL
RUN yarn config set strict-ssl false && \
    yarn config set registry http://registry.npmjs.org/ && \
    yarn install --frozen-lockfile --network-timeout 100000 --legacy-peer-deps

# Copy source code
COPY . .

# Build packages
RUN cd packages/common && yarn build
RUN cd packages/server && yarn build

# Set working directory
WORKDIR /app/packages/server

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main.js"] 