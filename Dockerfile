FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy built files
COPY dist/ ./dist/

# MCP servers communicate via stdio
CMD ["node", "dist/index.js"]
