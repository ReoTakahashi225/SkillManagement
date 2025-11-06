import { initDatabase, dbRun, closeDatabase } from './db';

/**
 * Add role column to users table
 * This migration adds a 'role' column to support admin functionality
 */
async function addRoleColumn() {
  try {
    console.log('Starting migration: Adding role column to users table...');

    // Initialize database connection
    await initDatabase();

    // Add role column with default value 'user'
    await dbRun(`
      ALTER TABLE users
      ADD COLUMN role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin'))
    `);

    console.log('✓ Successfully added role column to users table');

    // Update existing users to have 'user' role
    await dbRun(`
      UPDATE users
      SET role = 'user'
      WHERE role IS NULL
    `);

    console.log('✓ Updated existing users with "user" role');
    console.log('Migration completed successfully!');

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    // If column already exists, that's fine
    if (error.message.includes('duplicate column name')) {
      console.log('✓ Role column already exists, skipping migration');
      await closeDatabase();
      process.exit(0);
    }

    console.error('Error during migration:', error);
    await closeDatabase();
    process.exit(1);
  }
}

addRoleColumn();
