import express, { type Request, type Response } from 'express';
import { type CreatePetDTO } from '../models/Pet.js';
import { PetService } from '../services/petService.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { pool } from '../db/db.js';
import { getUserIdFromClerkId } from '../utils/auth.js';
import { ensureAuthenticated } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const petService = new PetService(pool);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/pets');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get a single pet by ID
router.get(
  '/:id',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const petId = parseInt(req.params.id || '0');
      if (isNaN(petId)) {
        res.status(400).json({ error: 'Invalid pet ID' });
        return;
      }

      if (typeof req.auth?.internalId !== 'number') {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get the pet
      const pet = await petService.getPetById(petId);

      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      // Verify the pet belongs to the authenticated user
      {
        const internalId = req.auth.internalId;
        if (pet.user_id !== internalId) {
        res.status(403).json({ error: 'Not authorized to view this pet' });
        return;
        }
      }

      res.json(pet);
    } catch (error) {
      console.error('Error getting pet:', error);
      res.status(500).json({
        error: 'Failed to get pet',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Get all pets for the authenticated user
router.get(
  '/',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('GET /pets - Auth info:', {
        internalId: req.auth?.internalId,
        headers: req.headers,
        auth: req.auth,
      });

      if (typeof req.auth?.internalId !== 'number') {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      console.log('Fetching pets for user:', { internalId: req.auth.internalId });
      const pets = await petService.getPetsByUserId(req.auth.internalId as number);
      console.log('Found pets:', pets);
      res.json(pets);
    } catch (error) {
      console.error('Error getting pets:', error);
      res.status(500).json({
        error: 'Failed to get pets',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Add a new pet
router.post(
  '/',
  ensureAuthenticated,
  upload.single('image'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('POST /pets - Request:', {
        body: req.body,
        file: req.file,
        internalId: req.auth?.internalId,
      });

      if (!req.auth?.internalId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { name, breed, birthdate } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Pet name is required' });
        return;
      }

      const image_url = req.file ? `/uploads/pets/${req.file.filename}` : null;
      console.log('Setting image URL:', image_url, 'for file:', req.file);

      console.log('Creating pet:', {
        name,
        breed,
        birthdate,
        image_url,
        user_id: req.auth.internalId,
      });

      const pet = await petService.createPet({
        name,
        breed,
        birthdate: birthdate ? new Date(birthdate) : null,
        image_url,
        user_id: req.auth.internalId as number,
      });

      console.log('Pet created successfully:', pet);
      res.status(201).json(pet);
    } catch (error) {
      console.error('Error creating pet:', error);
      res.status(500).json({
        error: 'Failed to create pet',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Get a specific pet
router.get(
  '/:id',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const petId = parseInt(req.params.id || '0');
      const pet = await petService.getPetById(petId);

      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      if (pet.user_id !== req.auth?.internalId) {
        res.status(403).json({ error: 'Not authorized to view this pet' });
        return;
      }

      res.json(pet);
    } catch (error) {
      console.error('Error getting pet:', error);
      res.status(500).json({ error: 'Failed to get pet' });
    }
  }
);

// Update a pet
router.put(
  '/:id',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const petId = parseInt(req.params.id || '0');
      const pet = await petService.getPetById(petId);

      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      if (pet.user_id !== (req.auth?.internalId as number)) {
        res.status(403).json({ error: 'Not authorized to update this pet' });
        return;
      }

      const updatedPet = await petService.updatePet(petId, req.body);
      res.json(updatedPet);
    } catch (error) {
      console.error('Error updating pet:', error);
      res.status(500).json({ error: 'Failed to update pet' });
    }
  }
);

// Update a pet with image
router.put(
  '/:id/image',
  ensureAuthenticated,
  upload.single('image'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const petId = parseInt(req.params.id || '0');
      const pet = await petService.getPetById(petId);

      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      if (pet.user_id !== req.auth?.internalId) {
        res.status(403).json({ error: 'Not authorized to update this pet' });
        return;
      }

      const updates: Partial<CreatePetDTO> = {};
      if (req.file) {
        // Delete old image if it exists and it's not null
        if (pet.image_url) {
          const oldImagePath = path.join(__dirname, '..', pet.image_url);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        updates.image_url = `/uploads/pets/${req.file.filename}`;
      }

      const updatedPet = await petService.updatePet(petId, updates);
      res.json(updatedPet);
    } catch (error) {
      console.error('Error updating pet:', error);
      res.status(500).json({ error: 'Failed to update pet' });
    }
  }
);

// Delete a pet
router.delete(
  '/:id',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const petId = parseInt(req.params.id || '0');
      const pet = await petService.getPetById(petId);

      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      if (pet.user_id !== (req.auth?.internalId as number)) {
        res.status(403).json({ error: 'Not authorized to delete this pet' });
        return;
      }

      // Delete the image file if it exists
      if (pet.image_url) {
        const imagePath = path.join(__dirname, '..', pet.image_url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      await petService.deletePet(petId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting pet:', error);
      res.status(500).json({ error: 'Failed to delete pet' });
    }
  }
);

// Get tasks for a pet
router.get(
  '/:id/tasks',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    console.log('Getting tasks for pet:', {
      petId: req.params.id,
      internalId: req.auth?.internalId
    });
    try {
      const petId = parseInt(req.params.id || '0');
      console.log('Getting tasks for pet:', { petId, auth: req.auth });
      const pet = await petService.getPetById(petId);
      console.log('Found pet:', pet);

      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      console.log('Checking authorization:', { petUserId: pet.user_id, internalId: req.auth?.internalId });
      if (pet.user_id !== (req.auth?.internalId as number)) {
        res.status(403).json({ error: 'Not authorized to view this pet\'s tasks' });
        return;
      }

      const query = `
        SELECT *
        FROM daily_tasks
        WHERE pet_id = $1
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [petId]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting pet tasks:', error);
      res.status(500).json({ error: 'Failed to get pet tasks' });
    }
  }
);

// Create a task for a pet
router.post(
  '/:id/tasks',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const petId = parseInt(req.params.id || '0');
      const pet = await petService.getPetById(petId);

      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      if (pet.user_id !== (req.auth?.internalId as number)) {
        res.status(403).json({ error: 'Not authorized to add tasks to this pet' });
        return;
      }

      const { task_name } = req.body;
      if (!task_name) {
        res.status(400).json({ error: 'Task name is required' });
        return;
      }

      const query = `
        INSERT INTO daily_tasks (pet_id, task_name)
        VALUES ($1, $2)
        RETURNING *
      `;
      const result = await pool.query(query, [petId, task_name]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating pet task:', error);
      res.status(500).json({ error: 'Failed to create pet task' });
    }
  }
);

// List files for a pet
router.get(
  '/:id/files',
  ensureAuthenticated,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const petId = parseInt(req.params.id || '0');
      if (isNaN(petId)) {
        res.status(400).json({ error: 'Invalid pet ID' });
        return;
      }

      const pet = await petService.getPetById(petId);
      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      if (pet.user_id !== (req.auth?.internalId as number)) {
        res.status(403).json({ error: 'Not authorized to view this pet\'s files' });
        return;
      }

      const result = await pool.query(
        `SELECT id, pet_id, file_name, file_path, file_type, uploaded_at
         FROM pet_files
         WHERE pet_id = $1
         ORDER BY uploaded_at DESC`,
        [petId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting pet files:', error);
      res.status(500).json({ error: 'Failed to get pet files' });
    }
  }
);

// Upload a file for a pet
router.post(
  '/:id/files',
  ensureAuthenticated,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const petId = parseInt(req.params.id || '0');
      if (isNaN(petId)) {
        res.status(400).json({ error: 'Invalid pet ID' });
        return;
      }

      const pet = await petService.getPetById(petId);
      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      if (pet.user_id !== (req.auth?.internalId as number)) {
        res.status(403).json({ error: 'Not authorized to add files to this pet' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const storedPath = `/uploads/pets/${req.file.filename}`;
      const result = await pool.query(
        `INSERT INTO pet_files (pet_id, file_name, file_path, file_type)
         VALUES ($1, $2, $3, $4)
         RETURNING id, pet_id, file_name, file_path, file_type, uploaded_at`,
        [petId, req.file.originalname, storedPath, req.file.mimetype]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error uploading pet file:', error);
      res.status(500).json({ error: 'Failed to upload pet file' });
    }
  }
);

export default router;
