import { Pool } from 'pg';

export class UserService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createUser(id: string, email: string, firstName?: string, lastName?: string): Promise<void> {
    const query = `
      INSERT INTO users (id, email, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
    `;
    
    await this.pool.query(query, [id, email, firstName || null, lastName || null]);
  }

  async getUser(id: string): Promise<any | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }
}
