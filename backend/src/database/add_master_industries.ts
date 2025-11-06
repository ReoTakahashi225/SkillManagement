import { initDatabase, dbRun, closeDatabase } from './db';

/**
 * Add master_industries table and industry_id column to work_experiences
 */
async function addMasterIndustries() {
  try {
    console.log('Creating master_industries table...');

    await initDatabase();

    // Create master_industries table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS master_industries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✓ master_industries table created');

    // Add industry_id column to work_experiences
    try {
      await dbRun(`
        ALTER TABLE work_experiences
        ADD COLUMN industry_id INTEGER REFERENCES master_industries(id)
      `);
      console.log('✓ industry_id column added to work_experiences');
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('✓ industry_id column already exists');
      } else {
        throw error;
      }
    }

    // Create index for better query performance
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_work_experiences_industry_id
      ON work_experiences(industry_id)
    `);

    console.log('✓ Index created');

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('Error creating master_industries table:', error);
    await closeDatabase();
    process.exit(1);
  }
}

addMasterIndustries();
