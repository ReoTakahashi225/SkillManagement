import { initDatabase, dbRun, closeDatabase } from './db';

/**
 * Add initials, gender, and birthdate columns to user_profiles table
 */
async function addProfileFields() {
  try {
    console.log('Adding initials, gender, and birthdate columns to user_profiles table...');

    await initDatabase();

    // Add initials column
    await dbRun(`
      ALTER TABLE user_profiles
      ADD COLUMN initials TEXT DEFAULT ''
    `);
    console.log('✓ initials column added');

    // Add gender column (0: not set, 1: male, 2: female)
    await dbRun(`
      ALTER TABLE user_profiles
      ADD COLUMN gender INTEGER DEFAULT 0
    `);
    console.log('✓ gender column added');

    // Add birthdate column
    await dbRun(`
      ALTER TABLE user_profiles
      ADD COLUMN birthdate TEXT DEFAULT NULL
    `);
    console.log('✓ birthdate column added');

    console.log('✓ All profile fields added successfully');

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('Error adding profile fields:', error);
    await closeDatabase();
    process.exit(1);
  }
}

addProfileFields();
