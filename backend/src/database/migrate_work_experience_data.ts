import { initDatabase, dbAll, dbGet, dbRun, closeDatabase } from './db';

interface WorkExperience {
  id: number;
  environment: string | null;
  languages: string | null;
}

/**
 * Migrate existing work experience data from TEXT fields to junction tables
 */
async function migrateWorkExperienceData() {
  try {
    console.log('Starting work experience data migration...');

    await initDatabase();

    // Get all work experiences
    const workExperiences = await dbAll<WorkExperience>(
      'SELECT id, environment, languages FROM work_experiences'
    );

    console.log(`Found ${workExperiences.length} work experiences to migrate`);

    let envMigrated = 0;
    let langMigrated = 0;

    for (const we of workExperiences) {
      // Migrate environments
      if (we.environment && we.environment.trim()) {
        const envNames = we.environment
          .split(',')
          .map(e => e.trim())
          .filter(e => e.length > 0);

        for (const envName of envNames) {
          // Find or create environment
          let env = await dbGet<{ id: number }>(
            'SELECT id FROM master_environments WHERE name = ?',
            [envName]
          );

          if (!env) {
            // Create new environment with category 'other'
            const result = await dbRun(
              'INSERT INTO master_environments (name, category, display_order) VALUES (?, ?, ?)',
              [envName, 'other', 999]
            );
            env = { id: result.lastID };
            console.log(`  Created new environment: ${envName}`);
          }

          // Link to work experience
          await dbRun(
            'INSERT OR IGNORE INTO work_experience_environments (work_experience_id, environment_id) VALUES (?, ?)',
            [we.id, env.id]
          );
          envMigrated++;
        }
      }

      // Migrate languages
      if (we.languages && we.languages.trim()) {
        const langNames = we.languages
          .split(',')
          .map(l => l.trim())
          .filter(l => l.length > 0);

        for (const langName of langNames) {
          // Find or create language
          let lang = await dbGet<{ id: number }>(
            'SELECT id FROM master_languages WHERE name = ?',
            [langName]
          );

          if (!lang) {
            // Create new language with category 'other'
            const result = await dbRun(
              'INSERT INTO master_languages (name, category, display_order) VALUES (?, ?, ?)',
              [langName, 'other', 999]
            );
            lang = { id: result.lastID };
            console.log(`  Created new language: ${langName}`);
          }

          // Link to work experience
          await dbRun(
            'INSERT OR IGNORE INTO work_experience_languages (work_experience_id, language_id) VALUES (?, ?)',
            [we.id, lang.id]
          );
          langMigrated++;
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log(`   - Environment links created: ${envMigrated}`);
    console.log(`   - Language links created: ${langMigrated}`);
    console.log('\nNote: Old TEXT fields (environment, languages) are preserved for backward compatibility.');
    console.log('You can drop them later after verifying the migration.');

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('Error migrating data:', error);
    await closeDatabase();
    process.exit(1);
  }
}

migrateWorkExperienceData();
