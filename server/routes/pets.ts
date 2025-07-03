import express, { type Request, type Response } from 'express';
import { type CreatePetDTO } from '../models/Pet';
import { PetService } from '../services/petService';
import { upload } from '../middleware/uploadMiddleware';
import { pool } from '../db/db';
import { getUserIdFromClerkId } from '../utils/auth';
import { ensureAuthenticated } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

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
      const petId = parseInt(req.params.id);
      if (isNaN(petId)) {
        res.status(400).json({ error: 'Invalid pet ID' });
        return;
      }

      if (!req.auth?.userId) {
        res.status(401).json({ error: 'User ID not found in request' });
        return;
      }

      // Get the pet
      const pet = await petService.getPetById(petId);

      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      // Verify the pet belongs to the authenticated user
      if (pet.user_id !== req.auth.userId) {
        res.status(403).json({ error: 'Not authorized to view this pet' });
        return;
      }

      res.json(pet);
    } catch (error) {
      console.error('Error getting pet:', error);
      res
        .status(500)
        .json({
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
        userId: req.auth?.userId,
        headers: req.headers,
        auth: req.auth,
      });

      if (!req.auth?.userId) {
        console.error('No user ID found in request');
        res.status(401).json({ error: 'User ID not found in request' });
        return;
      }

      // First verify the user exists in our database
      const userQuery = 'SELECT clerk_id FROM users WHERE clerk_id = $1';
      const userResult = await pool.query(userQuery, [req.auth.userId]);

      if (!userResult.rows[0]) {
        console.error('User not found in database:', req.auth.userId);
        res.status(404).json({ error: 'User not found' });
        return;
      }

      console.log('Fetching pets for user:', req.auth.userId);
      const pets = await petService.getPetsByUserId(req.auth.userId);
      console.log('Found pets:', pets);
      res.json(pets);
    } catch (error) {
      console.error('Error getting pets:', error);
      res
        .status(500)
        .json({
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
        userId: req.auth?.userId,
      });

      if (!req.auth?.userId) {
        console.error('No user ID found in request');
        res.status(401).json({ error: 'User ID not found in request' });
        return;
      }

      // First verify the user exists in our database
      const userQuery = 'SELECT clerk_id FROM users WHERE clerk_id = $1';
      const userResult = await pool.query(userQuery, [req.auth.userId]);

      if (!userResult.rows[0]) {
        console.error('User not found in database:', req.auth.userId);
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const { name, breed, birthdate } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Pet name is required' });
        return;
      }

      const image_url = req.file ? `/uploads/pets/${req.file.filename}` : null;

      console.log('Creating pet:', {
        name,
        breed,
        birthdate,
        image_url,
        user_id: req.auth.userId,
      });

      const pet = await petService.createPet({
        name,
        breed,
        birthdate: birthdate ? new Date(birthdate) : null,
        image_url,
        user_id: req.auth.userId,
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
      const petId = parseInt(req.params.id);
      const pet = await petService.getPetById(petId);

      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      if (pet.user_id !== req.auth?.userId) {
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
      const petId = parseInt(req.params.id);
      const pet = await petService.getPetById(petId);

      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      if (pet.user_id !== req.auth?.userId) {
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
      const petId = parseInt(req.params.id);
      const pet = await petService.getPetById(petId);

      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      if (pet.user_id !== req.auth?.userId) {
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
      const petId = parseInt(req.params.id);
      const pet = await petService.getPetById(petId);

      if (!pet) {
        res.status(404).json({ error: 'Pet not found' });
        return;
      }

      if (pet.user_id !== req.auth?.userId) {
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

export default router;
