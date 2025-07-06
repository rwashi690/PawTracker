import { Pool } from 'pg';
import type { Pet, CreatePetDTO } from '../models/Pet';

export class PetService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getPetsByUserId(userId: number): Promise<Pet[]> {
    const query = `
      SELECT *
      FROM pets
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async getPetById(id: number): Promise<Pet | null> {
    const query = `
      SELECT *
      FROM pets
      WHERE id = $1
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async createPet(pet: CreatePetDTO): Promise<Pet> {
    const query = `
      INSERT INTO pets (name, breed, birthdate, user_id, image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      pet.name,
      pet.breed,
      pet.birthdate,
      pet.user_id,
      pet.image_url,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updatePet(
    petId: number,
    updates: Partial<CreatePetDTO>
  ): Promise<Pet | null> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [petId, ...Object.values(updates)];
    const query = `
      UPDATE pets
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deletePet(petId: number): Promise<boolean> {
    // Start a transaction
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Delete related task completions first
      await client.query(
        `DELETE FROM task_completions
         WHERE task_id IN (SELECT id FROM daily_tasks WHERE pet_id = $1)`,
        [petId]
      );

      // Delete related daily tasks
      await client.query(
        'DELETE FROM daily_tasks WHERE pet_id = $1',
        [petId]
      );

      // Finally delete the pet
      const query = `
        DELETE FROM pets
        WHERE id = $1
        RETURNING id
      `;
      const result = await client.query(query, [petId]);

      await client.query('COMMIT');
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
