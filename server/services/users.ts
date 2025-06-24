import { query } from '../db';

interface CreateUserParams {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export const createUser = async ({ clerkId, email, firstName, lastName }: CreateUserParams) => {
  const result = await query(
    `INSERT INTO users (clerk_id, email, first_name, last_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (clerk_id) DO UPDATE
     SET email = $2, first_name = $3, last_name = $4, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [clerkId, email, firstName, lastName]
  );
  return result.rows[0];
};
