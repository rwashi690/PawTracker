FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create uploads directory with persistent storage
RUN mkdir -p /app/uploads/pets

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/index.js"]
