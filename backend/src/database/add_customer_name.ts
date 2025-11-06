import { initDatabase, dbRun, closeDatabase } from './db';

/**
 * Add customer_name column to work_experiences table
 */
async function addCustomerNameColumn() {
  try {
    console.log('Adding customer_name column to work_experiences table...');

    await initDatabase();

    // Add customer_name column
    await dbRun(`
      ALTER TABLE work_experiences
      ADD COLUMN customer_name TEXT
    `);

    console.log('✓ customer_name column added successfully');

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('Error adding customer_name column:', error);
    await closeDatabase();
    process.exit(1);
  }
}

addCustomerNameColumn();
