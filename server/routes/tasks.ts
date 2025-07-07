import express, { type Request, type Response, Router } from 'express';
import { ensureAuthenticated } from '../middleware/auth.js';
import { pool as db } from '../db/db.js';

const router = Router();

// Get all tasks for a pet
router.get(
  '/pet/:petId',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    console.log('🎯 ROUTE HIT: GET /pets/:petId/tasks');
    console.log('🔍 Request details:', {
      method: req.method,
      url: req.url,
      path: req.path,
      params: req.params,
      query: req.query,
      headers: req.headers
    });
    console.log('=== GET /pets/:petId/tasks ===');
    console.log('Route hit with:', {
      url: req.url,
      params: req.params,
      query: req.query
    });

    // Direct database check
    const { rows: dbCheck } = await db.query('SELECT * FROM preventatives');
    console.log('Direct DB check - all preventatives:', dbCheck);
    console.log('Query params:', req.query);
    console.log('Raw date from query:', req.query.date);
    const selectedDate = req.query.date ? new Date(req.query.date as string) : new Date();
    console.log('Parsed selected date:', {
      date: selectedDate,
      iso: selectedDate.toISOString(),
      utc: selectedDate.toUTCString(),
      local: selectedDate.toLocaleString(),
      utcDay: selectedDate.getUTCDate(),
      localDay: selectedDate.getDate()
    });
    console.log('Selected date:', selectedDate);
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
        res.status(403).json({ error: 'Not authorized to view these tasks' });
        return;
      }

      // Get daily tasks
      const { rows: tasks } = await db.query(
        'SELECT id, task_name, pet_id, created_at, updated_at, \'daily\' as task_type FROM daily_tasks WHERE pet_id = $1 ORDER BY created_at DESC',
        [petId]
      );

      // Get preventatives due on selected date
      // Get the day of the month in the user's timezone
      const selectedDay = selectedDate.getDate();

      // Get all preventatives for this pet first
      const allPreventativesQuery = `SELECT * FROM preventatives WHERE pet_id = $1`;
      const { rows: allPreventatives } = await db.query(allPreventativesQuery, [petId]);
      console.log('All preventatives for pet:', {
        petId,
        preventatives: allPreventatives,
        selectedDate: selectedDate.toISOString(),
        selectedDay
      });

      console.log('Date debug:', {
        selectedDate,
        selectedDay,
        isoString: selectedDate.toISOString(),
        localString: selectedDate.toLocaleString(),
        allPreventatives
      });

      // Get preventatives for selected day
      const preventativesQuery = `
        SELECT 
          p.id, 
          p.name as task_name, 
          p.pet_id,
          p.created_at,
          p.updated_at,
          'preventative' as task_type,
          p.due_day
        FROM preventatives p 
        WHERE p.pet_id = $1 
        AND p.due_day = $2`;

      const { rows: preventatives } = await db.query(preventativesQuery, [petId, selectedDay]);
      console.log('Preventatives query result:', {
        query: preventativesQuery,
        params: [petId, selectedDay],
        results: preventatives,
        matches: allPreventatives.filter(p => p.due_day === selectedDay)
      });

      // Only include preventatives if a date was provided in the query
      const allTasks = req.query.date
        ? [...tasks, ...preventatives]
        : tasks;

      res.json(allTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }
);

// Create a new task
router.post(
  '/pet/:petId/tasks',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const petId = parseInt(req.params.petId || '0');
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

      if (pet.user_id !== req.auth?.internalId) {
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
  '/:taskId',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const taskId = parseInt(req.params.taskId || '0');

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

      if (task.user_id !== req.auth?.internalId) {
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
      const taskId = parseInt(req.params.taskId || '0');
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

      // Use internalId for comparison since user_id is numeric
      if (task.user_id !== req.auth?.internalId) {
        console.log('Auth failed:', { taskUserId: task.user_id, authInternalId: req.auth?.internalId });
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

// Get task completions for a specific task and date
router.get(
  '/tasks/:taskId/completions/:date',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const taskId = parseInt(req.params.taskId || '0');
      const date = req.params.date;

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

      if (task.user_id !== req.auth?.internalId) {
        res.status(403).json({ error: 'Not authorized to view this task' });
        return;
      }

      const { rows: completions } = await db.query(
        'SELECT * FROM task_completions WHERE task_id = $1 AND DATE(completion_date) = $2',
        [taskId, date]
      );

      // Return the completion if found, null if not completed
      res.json(completions[0] || null);
    } catch (error) {
      console.error('Error fetching task completion:', error);
      res.status(500).json({ error: 'Failed to fetch task completion' });
    }
  }
);

// Get task completions for a specific date
router.get(
  '/:taskId/completions/:date',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const taskId = parseInt(req.params.taskId || '0');
      const date = req.params.date;

      // First verify the task belongs to the user
      const {
        rows: [task],
      } = await db.query(
        `
          SELECT t.*, p.user_id 
          FROM (
            SELECT id, pet_id FROM daily_tasks WHERE id = $1
            UNION
            SELECT id, pet_id FROM preventatives WHERE id = $1
          ) t 
          JOIN pets p ON t.pet_id = p.id
        `,
        [taskId]
      );

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      if (task.user_id !== req.auth?.internalId) {
        res.status(403).json({ error: 'Not authorized to view this task' });
        return;
      }

      // Get completions for the specified date
      const { rows: completions } = await db.query(
        'SELECT * FROM task_completions WHERE task_id = $1 AND DATE(completion_date) = $2',
        [taskId, date]
      );

      // Return null if no completions found, otherwise return the first completion
      res.json(completions.length > 0 ? completions[0] : null);
    } catch (error) {
      console.error('Error getting task completions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Mark task as complete
router.post(
  '/:taskId/complete',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const taskId = parseInt(req.params.taskId || '0');
      const { completion_date } = req.body;

      // First verify the task belongs to the user
      const {
        rows: [task],
      } = await db.query(
        `
          SELECT t.*, p.user_id 
          FROM (
            SELECT id, pet_id FROM daily_tasks WHERE id = $1
            UNION
            SELECT id, pet_id FROM preventatives WHERE id = $1
          ) t 
          JOIN pets p ON t.pet_id = p.id
        `,
        [taskId]
      );

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      if (task.user_id !== req.auth?.internalId) {
        res.status(403).json({ error: 'Not authorized to complete this task' });
        return;
      }

      // Add completion record
      const { rows: [completion] } = await db.query(
        'INSERT INTO task_completions (task_id, completion_date) VALUES ($1, $2) RETURNING *',
        [taskId, completion_date]
      );

      res.json(completion);
    } catch (error) {
      console.error('Error marking task complete:', error);
      res.status(500).json({ error: 'Internal server error' });
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

      // First verify the task belongs to the user's pet
      const {
        rows: [task],
      } = await db.query(
        'SELECT dt.id, dt.pet_id, p.user_id FROM daily_tasks dt JOIN pets p ON dt.pet_id = p.id WHERE dt.id = $1',
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
      await db.query('DELETE FROM daily_tasks WHERE id = $1', [taskId]);

      res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
);

export default router;
