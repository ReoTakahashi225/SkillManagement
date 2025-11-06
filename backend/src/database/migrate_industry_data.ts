import { initDatabase, dbAll, dbRun, dbGet, closeDatabase } from './db';

/**
 * Migrate existing industry text data to industry_id references
 */
async function migrateIndustryData() {
  try {
    console.log('Migrating existing industry data...');

    await initDatabase();

    // Get all work experiences with industry text
    const workExperiences = await dbAll<{ id: number; industry: string | null }>(
      'SELECT id, industry FROM work_experiences WHERE industry IS NOT NULL AND industry != ""'
    );

    console.log(`Found ${workExperiences.length} work experiences with industry data`);

    let migratedCount = 0;

    for (const we of workExperiences) {
      if (!we.industry) continue;

      // Try to find matching industry in master table
      let industry = await dbGet<{ id: number }>(
        'SELECT id FROM master_industries WHERE name = ?',
        [we.industry.trim()]
      );

      // If not found, create a new industry entry
      if (!industry) {
        console.log(`Creating new industry: ${we.industry}`);
        const result = await dbRun(
          'INSERT INTO master_industries (name, category, display_order) VALUES (?, ?, ?)',
          [we.industry.trim(), 'その他', 999]
        );
        industry = { id: result.lastID! };
      }

      // Update work_experience with industry_id
      await dbRun(
        'UPDATE work_experiences SET industry_id = ? WHERE id = ?',
        [industry.id, we.id]
      );

      migratedCount++;
    }

    console.log(`✓ Migrated ${migratedCount} industry references`);

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('Error migrating industry data:', error);
    await closeDatabase();
    process.exit(1);
  }
}

migrateIndustryData();
