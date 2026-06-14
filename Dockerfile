FROM node:18-alpine

WORKDIR /app

# Copy server directory
COPY server/package*.json ./
COPY server/tsconfig.json ./

# Copy server source code BEFORE install (needed for postinstall build)
COPY server/ ./

# Install all dependencies (postinstall will run build)
RUN npm install

# Create uploads directory with persistent storage
RUN mkdir -p /app/uploads/pets

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/index.js"]
