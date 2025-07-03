import { Router, Request, Response } from 'express';
import { ensureAuthenticated } from '../middleware/auth';
import { pool as db } from '../db/db';

const router = Router();

// Get all tasks for a pet
router.get(
  '/pets/:petId/tasks',
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

      if (pet.user_id !== req.auth?.userId) {
        res.status(403).json({ error: 'Not authorized to view these tasks' });
        return;
      }

      const { rows: tasks } = await db.query(
        'SELECT * FROM daily_tasks WHERE pet_id = $1 ORDER BY created_at DESC',
        [petId]
      );

      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }
);

// Create a new task
router.post(
  '/pets/:petId/tasks',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const petId = parseInt(req.params.petId);
      const { task_name } = req.body;

      if (!task_name) {
        res.status(400).json({ error: 'Task name is required' });
        return;
      }

      // First verify the pet belongs to the user
      const {
        rows: [pet],
      } = await db.query('SELECT user_id FROM pets WHERE id = $1', [petId]);

      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      if (pet.user_id !== req.auth?.userId) {
        res
          .status(403)
          .json({ error: 'Not authorized to add tasks for this pet' });
        return;
      }

      const {
        rows: [task],
      } = await db.query(
        'INSERT INTO daily_tasks (pet_id, task_name) VALUES ($1, $2) RETURNING *',
        [petId, task_name]
      );

      res.status(201).json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
);

// Delete a task
router.delete(
  '/tasks/:taskId',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const taskId = parseInt(req.params.taskId);

      // First verify the task's pet belongs to the user
      const {
        rows: [task],
      } = await db.query(
        'SELECT dt.id, p.user_id FROM daily_tasks dt JOIN pets p ON dt.pet_id = p.id WHERE dt.id = $1',
        [taskId]
      );

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      if (task.user_id !== req.auth?.userId) {
        res.status(403).json({ error: 'Not authorized to delete this task' });
        return;
      }

      await db.query('DELETE FROM daily_tasks WHERE id = $1', [taskId]);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
);

// Mark task as complete
router.post(
  '/tasks/:taskId/complete',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const taskId = parseInt(req.params.taskId);
      const { completion_date } = req.body;

      if (!completion_date) {
        res.status(400).json({ error: 'Completion date is required' });
        return;
      }

      // First verify the task's pet belongs to the user
      const {
        rows: [task],
      } = await db.query(
        'SELECT dt.id, p.user_id FROM daily_tasks dt JOIN pets p ON dt.pet_id = p.id WHERE dt.id = $1',
        [taskId]
      );

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      if (task.user_id !== req.auth?.userId) {
        res.status(403).json({ error: 'Not authorized to complete this task' });
        return;
      }

      const {
        rows: [completion],
      } = await db.query(
        'INSERT INTO task_completions (task_id, completion_date) VALUES ($1, $2) RETURNING *',
        [taskId, completion_date]
      );

      res.status(201).json(completion);
    } catch (error) {
      console.error('Error marking task as complete:', error);
      res.status(500).json({ error: 'Failed to mark task as complete' });
    }
  }
);

export default router;
