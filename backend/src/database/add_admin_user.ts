import bcrypt from 'bcrypt';
import { initDatabase, dbRun, dbGet, closeDatabase } from './db';

/**
 * Add admin user to database
 */
async function addAdminUser() {
  try {
    console.log('Adding admin user...');

    // Initialize database connection
    await initDatabase();

    // Check if admin user already exists
    const existingAdmin = await dbGet(
      'SELECT id FROM users WHERE username = ? OR role = ?',
      ['admin', 'admin']
    );

    if (existingAdmin) {
      console.log('✓ Admin user already exists, skipping');
      await closeDatabase();
      process.exit(0);
    }

    // Hash admin password
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Insert admin user
    const adminUser = await dbRun(
      `INSERT INTO users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)`,
      ['admin', adminPassword, 'admin@example.com', '管理者', 'admin']
    );

    console.log('✓ Admin user created with ID:', adminUser.lastID);

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

    console.log('✓ Admin profile created');
    console.log('\nAdmin user created successfully!');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('  Role: admin');

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('Error adding admin user:', error);
    await closeDatabase();
    process.exit(1);
  }
}

addAdminUser();
