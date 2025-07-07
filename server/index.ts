import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { createUser } from './services/users';
import { pool } from './db/db';
import petsRouter from './routes/pets';
import tasksRouter from './routes/tasks';
import preventativesRouter from './routes/preventatives';
import { ensureAuthenticated } from './middleware/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'clerk-token',
      'Clerk-Session-Id',
      'Clerk-Session-Token',
    ],
  })
);
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ message: 'API is working!' });
});

// Routes
app.use('/api/pets', petsRouter);
app.use('/api/tasks', tasksRouter); // Adding tasks routes
app.use('/api/preventatives', preventativesRouter); // Adding preventatives routes

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'healthy', timestamp: result.rows[0].now });
  } catch (error) {
    console.error('Database connection error:', error);
    res
      .status(500)
      .json({ status: 'error', message: 'Database connection failed' });
  }
});

// User creation endpoint
app.post('/api/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { clerkId, email, firstName, lastName } = req.body;

    if (!clerkId || !email) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const user = await createUser({ clerkId, email, firstName, lastName });
    // Even if the user already existed, we return 200 since the user data was successfully retrieved/updated
    res.status(200).json({
      user,
      message: 'User created or updated successfully',
    });
  } catch (error) {
    console.error('Error creating user:', error);
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: message });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Performing graceful shutdown...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Performing graceful shutdown...');
  process.exit(0);
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
