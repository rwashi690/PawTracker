import express, { type Request, type Response } from 'express';
import { pool as db } from '../db/db.js';
import { ensureAuthenticated } from '../middleware/auth.js';
import { ensureAuthenticated as authenticateToken } from '../middleware/auth.js';

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
// Mark a preventative complete
router.post(
  '/:preventativeId/complete',
  ensureAuthenticated,
  async (req: Request<{ preventativeId: string }>, res: Response): Promise<void> => {
    try {
      const { preventativeId } = req.params;
      const { completion_date } = req.body;
      const internalId = req.auth?.internalId;

      // Verify user owns this preventative
      const preventative = await db.query(
        'SELECT p.* FROM preventatives p JOIN pets ON p.pet_id = pets.id WHERE p.id = $1 AND pets.user_id = $2',
        [preventativeId, internalId]
      );

      if (preventative.rows.length === 0) {
        res.status(404).json({ error: 'Preventative not found or unauthorized' });
        return;
      }

      // Insert completion
      const result = await db.query(
        'INSERT INTO preventative_completions (preventative_id, completion_date) VALUES ($1, $2) RETURNING *',
        [preventativeId, completion_date]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error marking preventative complete:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get preventative completion status
router.get(
  '/:preventativeId/completions/:date',
  ensureAuthenticated,
  async (req: Request<{ preventativeId: string; date: string }>, res: Response): Promise<void> => {
    try {
      const { preventativeId, date } = req.params;
      const internalId = req.auth?.internalId;

      // Verify user owns this preventative
      const preventative = await db.query(
        'SELECT p.* FROM preventatives p JOIN pets ON p.pet_id = pets.id WHERE p.id = $1 AND pets.user_id = $2',
        [preventativeId, internalId]
      );

      if (preventative.rows.length === 0) {
        res.status(404).json({ error: 'Preventative not found or unauthorized' });
        return;
      }

      // Get completion status
      const completion = await db.query(
        'SELECT * FROM preventative_completions WHERE preventative_id = $1 AND completion_date = $2',
        [preventativeId, date]
      );

      if (completion.rows.length === 0) {
        res.json(null);
        return;
      }

      res.json(completion.rows[0]);
    } catch (error) {
      console.error('Error getting preventative completion:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get(
  '/pets/:petId/preventatives',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const petId = parseInt(req.params.petId || '0');

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
// 1B. Mark a preventative complete
router.post(
  '/preventatives/:prevId/complete',
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    const userId = req.auth!.internalId;
    const prevId = +req.params.prevId;
    const { date } = req.body as { date: string };
    const { rows } = await db.query(
      `INSERT INTO preventative_completions
         (preventative_id, completion_date, owner_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (preventative_id, completion_date, owner_id) DO NOTHING
       RETURNING *`,
      [prevId, date, userId]
    );
    res.json(rows[0] || null);
  }
);

// 1C. Check completion status for a date
router.get(
  '/preventatives/:prevId/completions/:date',
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    const userId = req.auth!.internalId;
    const prevId = +req.params.prevId;
    const date = req.params.date;
    const { rows } = await db.query(
      `SELECT *
       FROM preventative_completions
       WHERE preventative_id = $1
         AND completion_date = $2
         AND owner_id = $3`,
      [prevId, date, userId]
    );
    res.json(rows[0] || null);
  }
);
export default router;
