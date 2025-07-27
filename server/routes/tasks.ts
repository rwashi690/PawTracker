import express, { type Request, type Response, Router } from 'express';
import { ensureAuthenticated } from '../middleware/auth.js';
import { pool as db } from '../db/db.js';

const router = Router();

// Get all tasks for a pet
router.get(
  '/pet/:petId',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const petId = parseInt(req.params.petId || '0');
      
      if (isNaN(petId)) {
        res.status(400).json({ error: 'Invalid pet ID' });
        return;
      }

      // Verify pet belongs to user
      const { rows: [pet] } = await db.query(
        'SELECT user_id FROM pets WHERE id = $1',
        [petId]
      );

      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      if (pet.user_id !== req.auth?.internalId) {
        res.status(403).json({ error: 'Not authorized to view these tasks' });
        return;
      }

      // Get daily tasks
      const { rows: dailyTasks } = await db.query(
        'SELECT * FROM daily_tasks WHERE pet_id = $1',
        [petId]
      );

      // Get preventatives
      const { rows: preventatives } = await db.query(
        'SELECT * FROM preventatives WHERE pet_id = $1',
        [petId]
      );

      res.json({
        dailyTasks,
        preventatives
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }
);

// Create a new task for a pet
router.post(
  '/pet/:petId',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const petId = parseInt(req.params.petId || '0');
      const { name, frequency, type, details } = req.body;
      
      if (isNaN(petId) || !name || !frequency || !type) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Verify pet belongs to user
      const { rows: [pet] } = await db.query(
        'SELECT user_id FROM pets WHERE id = $1',
        [petId]
      );

      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      if (pet.user_id !== req.auth?.internalId) {
        res.status(403).json({ error: 'Not authorized to add tasks to this pet' });
        return;
      }

      // Insert new task
      const { rows: [newTask] } = await db.query(
        `INSERT INTO ${type} (pet_id, name, frequency, details)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [petId, name, frequency, details || null]
      );

      res.status(201).json(newTask);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
);

// Delete a task
router.delete(
  '/:taskId',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const taskId = parseInt(req.params.taskId || '0');
      const { type } = req.query;
      
      if (isNaN(taskId) || !type) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
      }

      // Verify task belongs to user's pet
      const { rows: [task] } = await db.query(
        `SELECT p.user_id 
         FROM ${type} t
         JOIN pets p ON t.pet_id = p.id
         WHERE t.id = $1`,
        [taskId]
      );

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      if (task.user_id !== req.auth?.internalId) {
        res.status(403).json({ error: 'Not authorized to delete this task' });
        return;
      }

      // Delete the task
      await db.query(
        `DELETE FROM ${type} WHERE id = $1`,
        [taskId]
      );

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
);

export default router;
