import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { pool } from '../db/db.js';
import { ensureAuthenticated } from '../middleware/auth.js';

const router = Router();

// List all shots for a pet
router.get('/pet/:petId/shots', ensureAuthenticated, (async (req: Request, res: Response) => {
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
      'SELECT * FROM shots WHERE pet_id = $1 ORDER BY date_given DESC, created_at DESC',
      [petId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching shots:', err);
    res.status(500).json({ error: 'Failed to fetch shots' });
  }
}) as RequestHandler);

// Create a new shot
router.post('/pet/:petId/shots', ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { petId } = req.params;
    const { shot_name, date_given, vet_clinic } = req.body as { shot_name?: string; date_given?: string; vet_clinic?: string | null };

    if (!shot_name || !date_given) {
      res.status(400).json({ error: 'shot_name and date_given are required' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO shots (pet_id, shot_name, date_given, vet_clinic)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [petId, shot_name, date_given, vet_clinic ?? null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating shot:', err);
    res.status(500).json({ error: 'Failed to create shot' });
  }
});

// Update a shot
router.put('/pet/:petId/shots/:shotId', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const { petId, shotId } = req.params;
    const userId = req.auth?.internalId;

    const petResult = await pool.query('SELECT * FROM pets WHERE id = $1 AND user_id = $2', [petId, userId]);
    if (petResult.rows.length === 0) {
      res.status(404).json({ error: 'Pet not found or access denied' });
      return;
    }

    const { shot_name, date_given, vet_clinic } = req.body as { shot_name?: string; date_given?: string; vet_clinic?: string | null };
    if (shot_name === undefined && date_given === undefined && typeof vet_clinic === 'undefined') {
      res.status(400).json({ error: 'Nothing to update' });
      return;
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (shot_name !== undefined) { fields.push(`shot_name = $${idx++}`); values.push(shot_name); }
    if (date_given !== undefined) { fields.push(`date_given = $${idx++}`); values.push(date_given); }
    if (vet_clinic !== undefined) { fields.push(`vet_clinic = $${idx++}`); values.push(vet_clinic); }
    fields.push('updated_at = NOW()');

    values.push(shotId);
    values.push(petId);

    const query = `UPDATE shots SET ${fields.join(', ')} WHERE id = $${idx++} AND pet_id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Shot not found for this pet' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating shot:', err);
    res.status(500).json({ error: 'Failed to update shot' });
  }
});

// Delete a shot
router.delete('/pet/:petId/shots/:shotId', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const { petId, shotId } = req.params;
    const userId = req.auth?.internalId;

    const petResult = await pool.query('SELECT * FROM pets WHERE id = $1 AND user_id = $2', [petId, userId]);
    if (petResult.rows.length === 0) {
      res.status(404).json({ error: 'Pet not found or access denied' });
      return;
    }

    const result = await pool.query('DELETE FROM shots WHERE id = $1 AND pet_id = $2 RETURNING *', [shotId, petId]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Shot not found for this pet' });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting shot:', err);
    res.status(500).json({ error: 'Failed to delete shot' });
  }
});

// Get a single shot
router.get('/pet/:petId/shots/:shotId', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const { petId, shotId } = req.params;
    const userId = req.auth?.internalId;

    const petResult = await pool.query('SELECT * FROM pets WHERE id = $1 AND user_id = $2', [petId, userId]);
    if (petResult.rows.length === 0) {
      res.status(404).json({ error: 'Pet not found or access denied' });
      return;
    }

    const result = await pool.query('SELECT * FROM shots WHERE id = $1 AND pet_id = $2', [shotId, petId]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Shot not found for this pet' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching shot:', err);
    res.status(500).json({ error: 'Failed to fetch shot' });
  }
});

export default router;
