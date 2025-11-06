import bcrypt from 'bcrypt';
import { initDatabase, dbRun, closeDatabase } from './db';

const seedData = async () => {
  try {
    console.log('Starting database seeding...');

    // Initialize database connection
    await initDatabase();
    console.log('Database initialized');

    // Hash passwords
    const password1 = await bcrypt.hash('password123', 10);
    const password2 = await bcrypt.hash('password456', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Insert admin user
    const adminUser = await dbRun(
      `INSERT INTO users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)`,
      ['admin', adminPassword, 'admin@example.com', '管理者', 'admin']
    );
    console.log('Admin user created with ID:', adminUser.lastID);

    // Insert user 1
    const user1 = await dbRun(
      `INSERT INTO users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)`,
      ['yamada_taro', password1, 'yamada@example.com', '山田太郎', 'user']
    );
    console.log('User 1 created with ID:', user1.lastID);

    // Insert user 2
    const user2 = await dbRun(
      `INSERT INTO users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)`,
      ['sato_hanako', password2, 'sato@example.com', '佐藤花子', 'user']
    );
    console.log('User 2 created with ID:', user2.lastID);

    // Insert profile for user 1
    await dbRun(
      `INSERT INTO user_profiles (user_id, age, address, education, major, certifications)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user1.lastID,
        28,
        '東京都渋谷区',
        '東京大学 工学部',
        '情報工学',
        '基本情報技術者、応用情報技術者'
      ]
    );
    console.log('Profile for user 1 created');

    // Insert profile for user 2
    await dbRun(
      `INSERT INTO user_profiles (user_id, age, address, education, major, certifications)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user2.lastID,
        32,
        '大阪府大阪市',
        '京都大学 理学部',
        '数学',
        'AWS認定ソリューションアーキテクト、PMP'
      ]
    );
    console.log('Profile for user 2 created');

    // Insert work experience 1 for user 1
    await dbRun(
      `INSERT INTO work_experiences (
        user_id, start_date, end_date, industry, system_name,
        requirement_analysis, basic_design, detail_design, development, testing, operation,
        environment, languages
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user1.lastID,
        '2020-04',
        '2022-03',
        '金融',
        'オンラインバンキングシステム',
        1, 1, 1, 1, 1, 0,
        'AWS, Docker, Kubernetes',
        'Java, Spring Boot, PostgreSQL'
      ]
    );
    console.log('Work experience 1 for user 1 created');

    // Insert work experience 2 for user 1
    await dbRun(
      `INSERT INTO work_experiences (
        user_id, start_date, end_date, industry, system_name,
        requirement_analysis, basic_design, detail_design, development, testing, operation,
        environment, languages
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user1.lastID,
        '2022-04',
        null,
        'EC',
        'ECサイトリニューアル',
        1, 1, 1, 1, 1, 1,
        'AWS, Terraform, GitHub Actions',
        'TypeScript, React, Node.js, MongoDB'
      ]
    );
    console.log('Work experience 2 for user 1 created');

    // Insert work experience 1 for user 2
    await dbRun(
      `INSERT INTO work_experiences (
        user_id, start_date, end_date, industry, system_name,
        requirement_analysis, basic_design, detail_design, development, testing, operation,
        environment, languages
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user2.lastID,
        '2018-04',
        '2021-03',
        '製造',
        '生産管理システム',
        1, 1, 1, 1, 1, 1,
        'オンプレミス, VMware',
        'C#, .NET Framework, SQL Server'
      ]
    );
    console.log('Work experience 1 for user 2 created');

    // Insert work experience 2 for user 2
    await dbRun(
      `INSERT INTO work_experiences (
        user_id, start_date, end_date, industry, system_name,
        requirement_analysis, basic_design, detail_design, development, testing, operation,
        environment, languages
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user2.lastID,
        '2021-04',
        null,
        '医療',
        '電子カルテシステム',
        1, 1, 0, 1, 1, 0,
        'AWS, ECS, CloudFormation',
        'Python, Django, Vue.js, PostgreSQL'
      ]
    );
    console.log('Work experience 2 for user 2 created');

    // Insert profile for admin user
    await dbRun(
      `INSERT INTO user_profiles (user_id, age, address, education, major, certifications)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        adminUser.lastID,
        35,
        '東京都千代田区',
        '東京工業大学 情報工学部',
        '情報科学',
        'IPA 情報処理安全確保支援士、PMP、AWS認定'
      ]
    );
    console.log('Profile for admin user created');

    console.log('\nSeed data inserted successfully!');
    console.log('Test users:');
    console.log('  1. username: admin, password: admin123 (ADMIN)');
    console.log('  2. username: yamada_taro, password: password123');
    console.log('  3. username: sato_hanako, password: password456');

    // Close database connection
    await closeDatabase();
    console.log('Database connection closed');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
