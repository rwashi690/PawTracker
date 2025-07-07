import express, { Request, Response } from 'express';
import { pool as db } from '../db/db';
import { ensureAuthenticated } from '../middleware/auth';
import { ensureAuthenticated as authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all preventatives for a pet
router.get(
  '/pet/:petId',
  authenticateToken,
  async (req: Request<{ petId: string }>, res: Response): Promise<void> => {
    try {
      const { petId } = req.params;
      const preventatives = await db.query(
        'SELECT * FROM preventatives WHERE pet_id = $1 ORDER BY due_day',
        [petId]
      );
      res.json(preventatives.rows);
    } catch (error) {
      console.error('Error fetching preventatives:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Create a new preventative
router.post(
  '/',
  authenticateToken,
  async (
    req: Request<{}, {}, { pet_id: number; name: string; due_day: number; notes?: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const { pet_id, name, due_day, notes } = req.body;
      // Validate due_day is between 1 and 31
      if (due_day < 1 || due_day > 31) {
        res.status(400).json({ error: 'Due day must be between 1 and 31' });
        return;
      }

      const result = await db.query(
        'INSERT INTO preventatives (pet_id, name, due_day, notes) VALUES ($1, $2, $3, $4) RETURNING *',
        [pet_id, name, due_day, notes]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating preventative:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update a preventative
router.put(
  '/:id',
  authenticateToken,
  async (
    req: Request<{ id: string }, {}, { name: string; due_day: number; notes?: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, due_day, notes } = req.body;

      if (due_day < 1 || due_day > 31) {
        res.status(400).json({ error: 'Due day must be between 1 and 31' });
        return;
      }

      const result = await db.query(
        'UPDATE preventatives SET name = $1, due_day = $2, notes = $3 WHERE id = $4 RETURNING *',
        [name, due_day, notes, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Preventative not found' });
        return;
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating preventative:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete a preventative
router.delete(
  '/:id',
  authenticateToken,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await db.query(
        'DELETE FROM preventatives WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Preventative not found' });
        return;
      }

      res.json({ message: 'Preventative deleted successfully' });
    } catch (error) {
      console.error('Error deleting preventative:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get preventatives for a pet
router.get(
  '/pets/:petId/preventatives',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const petId = parseInt(req.params.petId);

      // First verify the pet belongs to the user
      const {
        rows: [pet],
      } = await db.query('SELECT user_id FROM pets WHERE id = $1', [petId]);

      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      if (pet.user_id !== req.auth?.internalId) {
        res.status(403).json({ error: 'Not authorized to view this pet\'s preventatives' });
        return;
      }

      const { rows: preventatives } = await db.query(
        'SELECT * FROM preventatives WHERE pet_id = $1',
        [petId]
      );

      res.json(preventatives);
    } catch (error) {
      console.error('Error fetching preventatives:', error);
      res.status(500).json({ error: 'Failed to fetch preventatives' });
    }
  }
);

export default router;
