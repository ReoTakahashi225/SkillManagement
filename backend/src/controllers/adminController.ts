import { Response } from 'express';
import bcrypt from 'bcrypt';
import fs from 'fs';
import { dbGet, dbAll, dbRun } from '../database/db';
import { AuthRequest } from '../middleware/auth';
import { WorkExperience, UserProfile } from '../models/WorkExperience';
import { extractWorkExperienceFromFile, isSupportedFileType } from '../services/geminiService';
import { matchTechnologiesEnhanced } from '../services/technologyMatcher';

interface User {
  id: number;
  username: string;
  email: string | null;
  full_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

interface UserWithProfile extends User {
  profile: UserProfile | null;
  work_experience_count: number;
}

/**
 * Get all users (admin only)
 * Includes basic user info, profile, and work experience count
 */
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;

    let query = `
      SELECT
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.role,
        u.created_at,
        u.updated_at,
        COUNT(we.id) as work_experience_count
      FROM users u
      LEFT JOIN work_experiences we ON u.id = we.user_id
    `;

    const params: any[] = [];

    // Add search filter if provided
    if (search && typeof search === 'string') {
      query += ` WHERE (u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

    const users = await dbAll<User & { work_experience_count: number }>(query, params);

    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user detail by ID (admin only)
 * Includes full user info, profile, and all work experiences
 */
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get user basic info
    const user = await dbGet<User>(
      'SELECT id, username, email, full_name, role, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get user profile
    const profile = await dbGet<UserProfile>(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [id]
    );

    // Get all work experiences for this user
    const workExperiences = await dbAll<WorkExperience>(
      'SELECT * FROM work_experiences WHERE user_id = ? ORDER BY start_date DESC',
      [id]
    );

    res.json({
      user: {
        ...user,
        profile: profile || null,
        workExperiences
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get dashboard statistics (admin only)
 * Returns overall system statistics
 */
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Total users
    const totalUsersResult = await dbGet<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE role = ?',
      ['user']
    );

    // Total admins
    const totalAdminsResult = await dbGet<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE role = ?',
      ['admin']
    );

    // Total work experiences
    const totalWorkExperiencesResult = await dbGet<{ count: number }>(
      'SELECT COUNT(*) as count FROM work_experiences'
    );

    // Users with profiles
    const usersWithProfilesResult = await dbGet<{ count: number }>(
      'SELECT COUNT(DISTINCT user_id) as count FROM user_profiles'
    );

    res.json({
      stats: {
        totalUsers: totalUsersResult?.count || 0,
        totalAdmins: totalAdminsResult?.count || 0,
        totalWorkExperiences: totalWorkExperiencesResult?.count || 0,
        usersWithProfiles: usersWithProfilesResult?.count || 0
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new user (admin only)
 */
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password, email, full_name, role } = req.body;

    // Validation
    const errors: string[] = [];

    if (!username || username.trim().length === 0) {
      errors.push('ユーザー名は必須です');
    }

    if (!password || password.length < 6) {
      errors.push('パスワードは6文字以上必要です');
    }

    if (role && !['user', 'admin'].includes(role)) {
      errors.push('roleは"user"または"admin"である必要があります');
    }

    if (errors.length > 0) {
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }

    // Check if username already exists
    const existingUser = await dbGet(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      res.status(409).json({ error: 'ユーザー名は既に使用されています' });
      return;
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await dbGet(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingEmail) {
        res.status(409).json({ error: 'メールアドレスは既に使用されています' });
        return;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await dbRun(
      'INSERT INTO users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, email || null, full_name || null, role || 'user']
    );

    // Create default profile
    await dbRun(
      'INSERT INTO user_profiles (user_id) VALUES (?)',
      [result.lastID]
    );

    // Get created user
    const newUser = await dbGet<User>(
      'SELECT id, username, email, full_name, role, created_at, updated_at FROM users WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json({ user: newUser });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update user (admin only)
 * Can update username, email, full_name, and role
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, email, full_name, role } = req.body;

    // Check if user exists
    const existingUser = await dbGet<User>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Validation
    const errors: string[] = [];

    if (role && !['user', 'admin'].includes(role)) {
      errors.push('roleは"user"または"admin"である必要があります');
    }

    if (errors.length > 0) {
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }

    // Check if username is taken by another user
    if (username && username !== existingUser.username) {
      const usernameTaken = await dbGet(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, id]
      );

      if (usernameTaken) {
        res.status(409).json({ error: 'ユーザー名は既に使用されています' });
        return;
      }
    }

    // Check if email is taken by another user
    if (email && email !== existingUser.email) {
      const emailTaken = await dbGet(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );

      if (emailTaken) {
        res.status(409).json({ error: 'メールアドレスは既に使用されています' });
        return;
      }
    }

    // Update user
    await dbRun(
      `UPDATE users
       SET username = ?, email = ?, full_name = ?, role = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        username !== undefined ? username : existingUser.username,
        email !== undefined ? email : existingUser.email,
        full_name !== undefined ? full_name : existingUser.full_name,
        role !== undefined ? role : existingUser.role,
        id
      ]
    );

    // Get updated user
    const updatedUser = await dbGet<User>(
      'SELECT id, username, email, full_name, role, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete user (admin only)
 * Deletes user and all associated data (cascade)
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await dbGet<User>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prevent deleting self
    if (req.user && req.user.userId === parseInt(id)) {
      res.status(400).json({ error: '自分自身を削除することはできません' });
      return;
    }

    // Delete user (cascade will delete profile and work experiences)
    await dbRun('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Import work experiences from JSON (admin only)
 * Accepts an array of work experience objects and creates them for the specified user
 */
export const importWorkExperiences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { workExperiences } = req.body;

    // Validate request
    if (!Array.isArray(workExperiences)) {
      res.status(400).json({ error: 'workExperiences must be an array' });
      return;
    }

    // Check if user exists
    const user = await dbGet<User>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if user already has work experiences
    const existingCount = await dbGet<{ count: number }>(
      'SELECT COUNT(*) as count FROM work_experiences WHERE user_id = ?',
      [id]
    );

    if (existingCount && existingCount.count > 0) {
      res.status(400).json({
        error: 'このユーザーには既に業務実績が登録されています。インポートできません。'
      });
      return;
    }

    const errors: string[] = [];
    const imported: any[] = [];

    // Process each work experience
    for (let i = 0; i < workExperiences.length; i++) {
      const we = workExperiences[i];

      try {
        // Validate required fields
        if (!we.start_date) {
          errors.push(`項目${i + 1}: 開始年月は必須です`);
          continue;
        }

        // Insert work experience
        const result = await dbRun(
          `INSERT INTO work_experiences (
            user_id, start_date, end_date, industry, industry_id, customer_name, system_name,
            team_size, role, requirement_analysis, basic_design, detail_design,
            development, testing, operation, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            we.start_date,
            we.end_date || null,
            we.industry || null,
            we.industry_id || null,
            we.customer_name || null,
            we.system_name || null,
            we.team_size || null,
            we.role || null,
            we.requirement_analysis ? 1 : 0,
            we.basic_design ? 1 : 0,
            we.detail_design ? 1 : 0,
            we.development ? 1 : 0,
            we.testing ? 1 : 0,
            we.operation ? 1 : 0,
            we.description || null
          ]
        );

        const workExperienceId = result.lastID;

        // Insert environments
        if (we.environment_ids && Array.isArray(we.environment_ids)) {
          for (const envId of we.environment_ids) {
            await dbRun(
              'INSERT INTO work_experience_environments (work_experience_id, environment_id) VALUES (?, ?)',
              [workExperienceId, envId]
            );
          }
        }

        // Insert languages
        if (we.language_ids && Array.isArray(we.language_ids)) {
          for (const langId of we.language_ids) {
            await dbRun(
              'INSERT INTO work_experience_languages (work_experience_id, language_id) VALUES (?, ?)',
              [workExperienceId, langId]
            );
          }
        }

        imported.push({ index: i + 1, id: workExperienceId });
      } catch (error) {
        console.error(`Error importing work experience ${i + 1}:`, error);
        errors.push(`項目${i + 1}: インポートに失敗しました`);
      }
    }

    res.json({
      message: `${imported.length}件の業務実績をインポートしました`,
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Import work experiences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Import work experiences from file (PDF/Excel) using Gemini API (admin only)
 * Accepts a file upload, processes it with Gemini, and imports the extracted data
 */
export const importWorkExperiencesFromFile = async (req: AuthRequest, res: Response): Promise<void> => {
  let filePath: string | undefined;

  try {
    const { id } = req.params;
    const file = req.file;

    // Validate file upload
    if (!file) {
      res.status(400).json({ error: 'ファイルがアップロードされていません' });
      return;
    }

    filePath = file.path;

    // Check file type
    if (!isSupportedFileType(file.mimetype)) {
      res.status(400).json({
        error: 'サポートされていないファイル形式です。PDF、Excel、Wordファイルのみ対応しています。'
      });
      return;
    }

    console.log(`[File Import] Processing file: ${file.originalname} (${file.mimetype})`);

    // Check if user exists
    const user = await dbGet<User>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if user already has work experiences
    const existingCount = await dbGet<{ count: number }>(
      'SELECT COUNT(*) as count FROM work_experiences WHERE user_id = ?',
      [id]
    );

    if (existingCount && existingCount.count > 0) {
      res.status(400).json({
        error: 'このユーザーには既に業務実績が登録されています。インポートできません。'
      });
      return;
    }

    // Extract work experience data using Gemini
    console.log('[File Import] Calling Gemini API...');
    const workExperiences = await extractWorkExperienceFromFile(filePath, file.mimetype);
    console.log(`[File Import] Gemini extracted ${workExperiences.length} work experiences`);

    const errors: string[] = [];
    const imported: any[] = [];

    // Process each work experience
    for (let i = 0; i < workExperiences.length; i++) {
      const we = workExperiences[i];

      try {
        // Validate required fields
        if (!we.start_date) {
          errors.push(`項目${i + 1}: 開始年月は必須です`);
          continue;
        }

        // Insert work experience
        const result = await dbRun(
          `INSERT INTO work_experiences (
            user_id, start_date, end_date, industry, industry_id, customer_name, system_name,
            team_size, role, requirement_analysis, basic_design, detail_design,
            development, testing, operation, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            we.start_date,
            we.end_date || null,
            we.industry || null,
            we.industry_id || null,
            we.customer_name || null,
            we.system_name || null,
            we.team_size || null,
            we.role || null,
            we.requirement_analysis ? 1 : 0,
            we.basic_design ? 1 : 0,
            we.detail_design ? 1 : 0,
            we.development ? 1 : 0,
            we.testing ? 1 : 0,
            we.operation ? 1 : 0,
            we.description || null
          ]
        );

        const workExperienceId = result.lastID;

        // Auto-match technologies from description
        let environmentIds = we.environment_ids || [];
        let languageIds = we.language_ids || [];

        // If description exists and no IDs were provided, try auto-matching
        if (we.description && environmentIds.length === 0 && languageIds.length === 0) {
          const matched = await matchTechnologiesEnhanced(we.description);
          environmentIds = matched.environmentIds;
          languageIds = matched.languageIds;
          console.log(`[File Import] Auto-matched for work experience ${i + 1}: ${environmentIds.length} envs, ${languageIds.length} langs`);
        }

        // Insert environments
        if (environmentIds && Array.isArray(environmentIds)) {
          for (const envId of environmentIds) {
            await dbRun(
              'INSERT INTO work_experience_environments (work_experience_id, environment_id) VALUES (?, ?)',
              [workExperienceId, envId]
            );
          }
        }

        // Insert languages
        if (languageIds && Array.isArray(languageIds)) {
          for (const langId of languageIds) {
            await dbRun(
              'INSERT INTO work_experience_languages (work_experience_id, language_id) VALUES (?, ?)',
              [workExperienceId, langId]
            );
          }
        }

        imported.push({ index: i + 1, id: workExperienceId });
      } catch (error) {
        console.error(`Error importing work experience ${i + 1}:`, error);
        errors.push(`項目${i + 1}: インポートに失敗しました`);
      }
    }

    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      message: `${imported.length}件の業務実績をインポートしました`,
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Import work experiences from file error:', error);

    // Clean up uploaded file on error
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(500).json({
      error: 'ファイルの処理中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Change user password (admin only)
 * Admin can reset any user's password without knowing the current password
 */
export const changeUserPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validation
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: '新しいパスワードは6文字以上必要です' });
      return;
    }

    // Check if user exists
    const user = await dbGet<User>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      res.status(404).json({ error: 'ユーザーが見つかりません' });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await dbRun(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, id]
    );

    res.json({ message: 'パスワードを変更しました' });
  } catch (error) {
    console.error('Change user password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/admin/search
 * Search users by language, environment, industry, and certifications
 */
export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { languages, environments, industries, certifications } = req.body;

    console.log('[Admin Search] Search criteria:', { languages, environments, industries, certifications });

    // Build dynamic query
    let query = `
      SELECT DISTINCT
        u.id,
        u.username,
        u.full_name,
        up.birthdate,
        up.age,
        up.certifications as user_certifications
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN work_experiences we ON u.id = we.user_id
      LEFT JOIN work_experience_languages wel ON we.id = wel.work_experience_id
      LEFT JOIN work_experience_environments wee ON we.id = wee.work_experience_id
      WHERE u.role = 'user'
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    // Language filter
    if (languages && Array.isArray(languages) && languages.length > 0) {
      const languagePlaceholders = languages.map(() => '?').join(',');
      conditions.push(`wel.language_id IN (${languagePlaceholders})`);
      params.push(...languages);
    }

    // Environment filter
    if (environments && Array.isArray(environments) && environments.length > 0) {
      const envPlaceholders = environments.map(() => '?').join(',');
      conditions.push(`wee.environment_id IN (${envPlaceholders})`);
      params.push(...environments);
    }

    // Industry filter
    if (industries && Array.isArray(industries) && industries.length > 0) {
      const industryPlaceholders = industries.map(() => '?').join(',');
      conditions.push(`we.industry_id IN (${industryPlaceholders})`);
      params.push(...industries);
    }

    // Certifications filter (search in user_profiles.certifications text field)
    if (certifications && typeof certifications === 'string' && certifications.trim()) {
      conditions.push(`up.certifications LIKE ?`);
      params.push(`%${certifications}%`);
    }

    if (conditions.length > 0) {
      query += ' AND (' + conditions.join(' OR ') + ')';
    }

    query += ' ORDER BY u.full_name, u.username';

    console.log('[Admin Search] SQL Query:', query);
    console.log('[Admin Search] Parameters:', params);

    const results = await dbAll<any>(query, params);

    // Fetch detailed information for each user
    const usersWithDetails = await Promise.all(
      results.map(async (user) => {
        // Get work experiences
        const workExperiences = await dbAll<WorkExperience>(
          'SELECT * FROM work_experiences WHERE user_id = ? ORDER BY start_date DESC',
          [user.id]
        );

        // Get languages for each work experience
        for (const we of workExperiences) {
          const languages = await dbAll<any>(
            `SELECT l.id, l.name
             FROM master_languages l
             JOIN work_experience_languages wel ON l.id = wel.language_id
             WHERE wel.work_experience_id = ?`,
            [we.id]
          );
          (we as any).languages = languages;

          const environments = await dbAll<any>(
            `SELECT e.id, e.name
             FROM master_environments e
             JOIN work_experience_environments wee ON e.id = wee.environment_id
             WHERE wee.work_experience_id = ?`,
            [we.id]
          );
          (we as any).environments = environments;

          const industry = await dbGet<any>(
            'SELECT id, name FROM master_industries WHERE id = ?',
            [we.industry_id]
          );
          (we as any).industry = industry;
        }

        return {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          birthdate: user.birthdate,
          age: user.age,
          certifications: user.user_certifications,
          work_experiences: workExperiences,
        };
      })
    );

    console.log(`[Admin Search] Found ${usersWithDetails.length} users`);

    res.json({ users: usersWithDetails });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
