import { query } from '../db/index.js';

const listUsers = async () => {
  try {
    const result = await query('SELECT * FROM users ORDER BY created_at DESC');
    console.log('\nUsers in database:');
    console.table(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    process.exit();
  }
};

listUsers();
