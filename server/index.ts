import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createUser } from './services/users';
import pool from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'healthy', timestamp: result.rows[0].now });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// User creation endpoint
app.post('/api/users', async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName } = req.body;
    
    if (!clerkId || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
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