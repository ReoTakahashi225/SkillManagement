import { initDatabase, runMigrations, closeDatabase } from './db';

const runMigration = async () => {
  try {
    console.log('Starting database migration...');

    // Initialize database connection
    await initDatabase();
    console.log('Database initialized');

    // Run migrations
    await runMigrations();
    console.log('Migrations completed successfully');

    // Close database connection
    await closeDatabase();
    console.log('Database connection closed');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
