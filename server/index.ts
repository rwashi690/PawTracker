import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { createUser } from './services/users';
import { pool } from './db/db';
import petsRouter from './routes/pets';
import { ensureAuthenticated } from './middleware/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
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
}));
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ message: 'API is working!' });
});

// Routes
app.use('/api/pets', petsRouter);

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'healthy', timestamp: result.rows[0].now });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
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
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});