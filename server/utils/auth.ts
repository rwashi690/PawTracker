import { pool } from '../db/db';

export async function getUserIdFromClerkId(clerkId: string): Promise<number> {
  const query = 'SELECT id FROM users WHERE clerk_id = $1';
  const result = await pool.query(query, [clerkId]);

  if (!result.rows[0]) {
    throw new Error('User not found');
  }

  return result.rows[0].id;
}
