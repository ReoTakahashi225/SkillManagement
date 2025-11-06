import { initDatabase, dbRun, closeDatabase } from './db';

/**
 * Add remarks column to user_profiles table
 */
async function addRemarksColumn() {
  try {
    console.log('Adding remarks column to user_profiles table...');

    await initDatabase();

    // Add remarks column
    await dbRun(`
      ALTER TABLE user_profiles
      ADD COLUMN remarks TEXT DEFAULT ''
    `);

    console.log('✓ remarks column added successfully');

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('Error adding remarks column:', error);
    await closeDatabase();
    process.exit(1);
  }
}

addRemarksColumn();
