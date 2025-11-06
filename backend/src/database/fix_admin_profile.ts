import { initDatabase, dbRun, dbGet, closeDatabase } from './db';

/**
 * Ensure admin user has a profile
 */
async function fixAdminProfile() {
  try {
    console.log('Checking admin user profile...');

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

    // Check if profile exists
    const existingProfile = await dbGet(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [adminUser.id]
    );

    if (existingProfile) {
      console.log('✓ Admin profile already exists');
      await closeDatabase();
      process.exit(0);
    }

    // Create profile for admin user
    await dbRun(
      `INSERT INTO user_profiles (user_id, age, address, education, major, certifications)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        adminUser.id,
        35,
        '東京都千代田区',
        '東京工業大学 情報工学部',
        '情報科学',
        'IPA 情報処理安全確保支援士、PMP、AWS認定'
      ]
    );

    console.log('✓ Admin profile created successfully');

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('Error fixing admin profile:', error);
    await closeDatabase();
    process.exit(1);
  }
}

fixAdminProfile();
