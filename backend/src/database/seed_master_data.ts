import { initDatabase, dbRun, closeDatabase } from './db';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Seed master data for environments and languages
 */
async function seedMasterData() {
  try {
    console.log('Starting master data seeding...');

    await initDatabase();

    // Create master tables
    console.log('Creating master tables...');
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'add_master_tables.sql'),
      'utf-8'
    );
    const statements = schemaSQL.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await dbRun(statement);
      }
    }
    console.log('✓ Master tables created');

    // Seed environments
    console.log('Seeding environments...');
    const environments = [
      // Cloud
      { name: 'AWS', category: 'cloud', display_order: 1 },
      { name: 'Azure', category: 'cloud', display_order: 2 },
      { name: 'GCP', category: 'cloud', display_order: 3 },
      { name: 'Heroku', category: 'cloud', display_order: 4 },
      { name: 'Vercel', category: 'cloud', display_order: 5 },
      { name: 'Netlify', category: 'cloud', display_order: 6 },

      // Container & Orchestration
      { name: 'Docker', category: 'container', display_order: 10 },
      { name: 'Kubernetes', category: 'container', display_order: 11 },
      { name: 'Docker Compose', category: 'container', display_order: 12 },

      // CI/CD
      { name: 'GitHub Actions', category: 'ci-cd', display_order: 20 },
      { name: 'GitLab CI', category: 'ci-cd', display_order: 21 },
      { name: 'Jenkins', category: 'ci-cd', display_order: 22 },
      { name: 'CircleCI', category: 'ci-cd', display_order: 23 },
      { name: 'Travis CI', category: 'ci-cd', display_order: 24 },

      // Infrastructure as Code
      { name: 'Terraform', category: 'other', display_order: 30 },
      { name: 'Ansible', category: 'other', display_order: 31 },
      { name: 'CloudFormation', category: 'other', display_order: 32 },

      // Database
      { name: 'MySQL', category: 'database', display_order: 40 },
      { name: 'PostgreSQL', category: 'database', display_order: 41 },
      { name: 'MongoDB', category: 'database', display_order: 42 },
      { name: 'Redis', category: 'database', display_order: 43 },
      { name: 'Oracle Database', category: 'database', display_order: 44 },
      { name: 'SQL Server', category: 'database', display_order: 45 },
      { name: 'SQLite', category: 'database', display_order: 46 },

      // On-Premise
      { name: 'オンプレミス', category: 'on-premise', display_order: 50 },
      { name: 'Linux Server', category: 'on-premise', display_order: 51 },
      { name: 'Windows Server', category: 'on-premise', display_order: 52 },
    ];

    for (const env of environments) {
      await dbRun(
        'INSERT OR IGNORE INTO master_environments (name, category, display_order) VALUES (?, ?, ?)',
        [env.name, env.category, env.display_order]
      );
    }
    console.log(`✓ Seeded ${environments.length} environments`);

    // Seed programming languages
    console.log('Seeding programming languages...');
    const languages = [
      // Backend
      { name: 'JavaScript', category: 'backend', display_order: 1 },
      { name: 'TypeScript', category: 'backend', display_order: 2 },
      { name: 'Node.js', category: 'backend', display_order: 3 },
      { name: 'Python', category: 'backend', display_order: 4 },
      { name: 'Java', category: 'backend', display_order: 5 },
      { name: 'C#', category: 'backend', display_order: 6 },
      { name: 'Go', category: 'backend', display_order: 7 },
      { name: 'Ruby', category: 'backend', display_order: 8 },
      { name: 'PHP', category: 'backend', display_order: 9 },
      { name: 'Rust', category: 'backend', display_order: 10 },
      { name: 'Kotlin', category: 'backend', display_order: 11 },
      { name: 'Scala', category: 'backend', display_order: 12 },

      // Frontend
      { name: 'React', category: 'frontend', display_order: 20 },
      { name: 'Vue.js', category: 'frontend', display_order: 21 },
      { name: 'Angular', category: 'frontend', display_order: 22 },
      { name: 'Svelte', category: 'frontend', display_order: 23 },
      { name: 'Next.js', category: 'frontend', display_order: 24 },
      { name: 'Nuxt.js', category: 'frontend', display_order: 25 },
      { name: 'HTML/CSS', category: 'frontend', display_order: 26 },

      // Mobile
      { name: 'Swift', category: 'mobile', display_order: 30 },
      { name: 'Objective-C', category: 'mobile', display_order: 31 },
      { name: 'React Native', category: 'mobile', display_order: 32 },
      { name: 'Flutter', category: 'mobile', display_order: 33 },

      // Database/Query
      { name: 'SQL', category: 'database', display_order: 40 },
      { name: 'PL/SQL', category: 'database', display_order: 41 },
      { name: 'T-SQL', category: 'database', display_order: 42 },

      // Script/Shell
      { name: 'Bash', category: 'script', display_order: 50 },
      { name: 'PowerShell', category: 'script', display_order: 51 },
      { name: 'Perl', category: 'script', display_order: 52 },

      // Other
      { name: 'C', category: 'other', display_order: 60 },
      { name: 'C++', category: 'other', display_order: 61 },
      { name: 'COBOL', category: 'other', display_order: 62 },
      { name: 'VBA', category: 'other', display_order: 63 },
    ];

    for (const lang of languages) {
      await dbRun(
        'INSERT OR IGNORE INTO master_languages (name, category, display_order) VALUES (?, ?, ?)',
        [lang.name, lang.category, lang.display_order]
      );
    }
    console.log(`✓ Seeded ${languages.length} languages`);

    console.log('\n✅ Master data seeding completed successfully!');
    console.log(`   - Environments: ${environments.length} items`);
    console.log(`   - Languages: ${languages.length} items`);

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('Error seeding master data:', error);
    await closeDatabase();
    process.exit(1);
  }
}

seedMasterData();
