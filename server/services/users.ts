import { query } from '../db';

interface CreateUserParams {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export const createUser = async ({
  clerkId,
  email,
  firstName,
  lastName,
}: CreateUserParams) => {
  // First try to find existing user
  const existingUser = await query(
    'SELECT * FROM users WHERE clerk_id = $1 OR email = $2',
    [clerkId, email]
  );

  if (existingUser.rows.length > 0) {
    // Update existing user
    const result = await query(
      `UPDATE users 
       SET email = $2, first_name = $3, last_name = $4, updated_at = CURRENT_TIMESTAMP
       WHERE clerk_id = $1
       RETURNING *`,
      [clerkId, email, firstName, lastName]
    );
    return result.rows[0];
  }

  // Create new user if none exists
  const result = await query(
    `INSERT INTO users (clerk_id, email, first_name, last_name)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [clerkId, email, firstName, lastName]
  );
  return result.rows[0];
};
