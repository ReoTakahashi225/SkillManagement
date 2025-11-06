import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../database.sqlite');

const runMigration = () => {
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err);
      process.exit(1);
    }
  });

  // Function to check if a column exists
  const columnExists = (tableName: string, columnName: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      db.all(`PRAGMA table_info(${tableName})`, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const exists = rows.some((row) => row.name === columnName);
          resolve(exists);
        }
      });
    });
  };

  // Function to add a column if it doesn't exist
  const addColumnIfNotExists = async (tableName: string, columnName: string, columnDef: string) => {
    try {
      const exists = await columnExists(tableName, columnName);
      if (!exists) {
        await new Promise<void>((resolve, reject) => {
          db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`, (err) => {
            if (err) {
              reject(err);
            } else {
              console.log(`✓ Added column ${columnName} to ${tableName}`);
              resolve();
            }
          });
        });
      } else {
        console.log(`○ Column ${columnName} already exists in ${tableName}`);
      }
    } catch (err) {
      console.error(`✗ Error adding column ${columnName} to ${tableName}:`, err);
      throw err;
    }
  };

  // Run all migrations
  const runAllMigrations = async () => {
    try {
      console.log('Starting database migration...\n');

      // work_experiences table columns
      await addColumnIfNotExists('work_experiences', 'industry_id', 'INTEGER');
      await addColumnIfNotExists('work_experiences', 'customer_name', 'TEXT');
      await addColumnIfNotExists('work_experiences', 'team_size', 'INTEGER');
      await addColumnIfNotExists('work_experiences', 'role', 'TEXT');
      await addColumnIfNotExists('work_experiences', 'description', 'TEXT');

      // user_profiles table columns
      await addColumnIfNotExists('user_profiles', 'initials', 'TEXT');
      await addColumnIfNotExists('user_profiles', 'gender', 'INTEGER DEFAULT 0');
      await addColumnIfNotExists('user_profiles', 'birthdate', 'TEXT');
      await addColumnIfNotExists('user_profiles', 'remarks', 'TEXT');

      console.log('\n✓ Migration completed successfully!');

      db.close((closeErr) => {
        if (closeErr) {
          console.error('Error closing database:', closeErr);
        }
        process.exit(0);
      });
    } catch (err) {
      console.error('\n✗ Migration failed:', err);
      db.close((closeErr) => {
        if (closeErr) {
          console.error('Error closing database:', closeErr);
        }
        process.exit(1);
      });
    }
  };

  runAllMigrations();
};

runMigration();
