import { initDatabase, dbRun, dbGet, closeDatabase } from './db';

/**
 * Reset admin user's work experiences and add sample data
 */
async function resetAdminData() {
  try {
    console.log('Resetting admin data...');

    // Initialize database connection
    await initDatabase();

    // Find admin user
    const adminUser = await dbGet<{ id: number }>(
      'SELECT id FROM users WHERE username = ? OR role = ?',
      ['admin', 'admin']
    );

    if (!adminUser) {
      console.log('❌ Admin user not found');
      await closeDatabase();
      process.exit(1);
    }

    console.log(`✓ Admin user found with ID: ${adminUser.id}`);

    // Delete existing work experiences
    await dbRun(
      'DELETE FROM work_experiences WHERE user_id = ?',
      [adminUser.id]
    );
    console.log('✓ Existing work experiences deleted');

    // Add work experience 1
    await dbRun(
      `INSERT INTO work_experiences (
        user_id, start_date, end_date, industry, system_name,
        requirement_analysis, basic_design, detail_design, development, testing, operation,
        environment, languages
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminUser.id,
        '2018-04',
        '2020-03',
        'IT・通信',
        'クラウド基盤構築プロジェクト',
        1, 1, 1, 1, 1, 1,
        'AWS, Terraform, Ansible, Docker',
        'Python, Bash, Go'
      ]
    );
    console.log('✓ Work experience 1 created');

    // Add work experience 2
    await dbRun(
      `INSERT INTO work_experiences (
        user_id, start_date, end_date, industry, system_name,
        requirement_analysis, basic_design, detail_design, development, testing, operation,
        environment, languages
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminUser.id,
        '2020-04',
        '2022-12',
        'コンサルティング',
        'システム監査・セキュリティコンサルティング',
        1, 1, 0, 0, 1, 0,
        'オンプレミス, クラウド各種',
        'N/A (コンサルティング業務)'
      ]
    );
    console.log('✓ Work experience 2 created');

    // Add work experience 3
    await dbRun(
      `INSERT INTO work_experiences (
        user_id, start_date, end_date, industry, system_name,
        requirement_analysis, basic_design, detail_design, development, testing, operation,
        environment, languages
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminUser.id,
        '2023-01',
        null,
        'IT・通信',
        'スキル管理システム開発・運用',
        1, 1, 1, 1, 1, 1,
        'AWS, Docker, GitHub Actions',
        'TypeScript, React, Node.js, SQLite'
      ]
    );
    console.log('✓ Work experience 3 created (current project)');

    console.log('\n✅ Admin data reset successfully!');
    console.log('   - Profile: ✓');
    console.log('   - Work experiences: 3 items');

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('Error resetting admin data:', error);
    await closeDatabase();
    process.exit(1);
  }
}

resetAdminData();
