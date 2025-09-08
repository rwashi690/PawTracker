import { Router, RequestHandler } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { pool } from '../db/db.js';
import { ensureAuthenticated } from '../middleware/auth.js';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: {
      internalId: string;
    };
  }
}

const router = Router();

// Get all service dog tasks for a pet
router.get('/pet/:petId/servicetasks', ensureAuthenticated, (async (req: Request, res: Response) => {
  try {
    const { petId } = req.params;
    const userId = req.auth?.internalId;

    // Verify the pet exists and is owned by the user
    const petResult = await pool.query('SELECT * FROM pets WHERE id = $1 AND user_id = $2', [petId, userId]);
    if (petResult.rows.length === 0) {
      res.status(404).json({ error: 'Pet not found or access denied' });
      return;
    }

    const result = await pool.query(
      'SELECT * FROM service_dog_tasks WHERE pet_id = $1 ORDER BY created_at DESC',
      [petId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching service dog tasks:', err);
    res.status(500).json({ error: 'Failed to fetch service dog tasks' });
    return;
  }
}) as RequestHandler);

// Create a new service dog task
router.post('/pet/:petId/servicetasks', ensureAuthenticated, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { petId } = req.params;
    const { task_name, notes = null } = req.body;

    if (!task_name) {
      res.status(400).json({ error: 'Task name is required' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO service_dog_tasks (pet_id, task_name, notes)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [petId, task_name, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating service dog task:', err);
    res.status(500).json({ error: 'Failed to create service dog task' });
  }
});

// Delete a service dog task for a specific pet
router.delete('/pet/:petId/servicetasks/:taskId', ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { petId, taskId } = req.params;
    const userId = req.auth?.internalId;

    // Verify the pet exists and is owned by the user
    const petResult = await pool.query('SELECT * FROM pets WHERE id = $1 AND user_id = $2', [petId, userId]);
    if (petResult.rows.length === 0) {
      res.status(404).json({ error: 'Pet not found or access denied' });
      return;
    }

    // Delete the task if it belongs to the specified pet
    const result = await pool.query(
      'DELETE FROM service_dog_tasks WHERE id = $1 AND pet_id = $2 RETURNING *',
      [taskId, petId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Task not found for this pet' });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting service dog task:', err);
    res.status(500).json({ error: 'Failed to delete service dog task' });
  }
});

// Get a single service dog task
router.get('/pet/:petId/servicetasks/:taskId', ensureAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const { petId, taskId } = req.params;
    const userId = req.auth?.internalId;

    // Verify the pet exists and is owned by the user
    const petResult = await pool.query('SELECT * FROM pets WHERE id = $1 AND user_id = $2', [petId, userId]);
    if (petResult.rows.length === 0) {
      res.status(404).json({ error: 'Pet not found or access denied' });
      return;
    }

    const result = await pool.query(
      'SELECT * FROM service_dog_tasks WHERE id = $1 AND pet_id = $2',
      [taskId, petId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Task not found for this pet' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching service dog task:', err);
    res.status(500).json({ error: 'Failed to fetch service dog task' });
  }
});

export default router;
