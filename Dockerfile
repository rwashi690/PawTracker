FROM node:18-alpine

WORKDIR /app

# Copy server directory
COPY server/package*.json ./

# Install dependencies
RUN npm install --production

# Copy server source code
COPY server/ ./

# Build TypeScript
RUN npm run build

# Create uploads directory with persistent storage
RUN mkdir -p /app/uploads/pets

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/index.js"]
