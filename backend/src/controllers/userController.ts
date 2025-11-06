import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dbGet, dbRun } from '../database/db';
import { UserProfile } from '../models/WorkExperience';
import bcrypt from 'bcrypt';

interface User {
  id: number;
  username: string;
  password: string;
  email: string | null;
  full_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/users/profile
 * ユーザープロフィール情報を取得
 */
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const profile = await dbGet<UserProfile>(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [req.user.userId]
    );

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({ profile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/users/profile
 * ユーザープロフィール情報を更新
 */
export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const {
      initials,
      gender,
      birthdate,
      age,
      address,
      education,
      major,
      certifications,
      remarks,
    } = req.body;

    // バリデーション
    const errors: string[] = [];

    if (gender !== undefined && gender !== null) {
      if (![0, 1, 2].includes(gender)) {
        errors.push('性別は0（未設定）、1（男性）、2（女性）のいずれかです');
      }
    }

    if (age !== undefined && age !== null) {
      if (typeof age !== 'number' || age < 0 || age > 150) {
        errors.push('年齢は0〜150の範囲で入力してください');
      }
    }

    if (remarks !== undefined && remarks !== null) {
      if (typeof remarks !== 'string' || remarks.length > 500) {
        errors.push('備考は500文字以内で入力してください');
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }

    // プロフィールが存在するか確認
    const existingProfile = await dbGet<UserProfile>(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [req.user.userId]
    );

    if (!existingProfile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // プロフィールを更新
    await dbRun(
      `UPDATE user_profiles
       SET initials = ?,
           gender = ?,
           birthdate = ?,
           age = ?,
           address = ?,
           education = ?,
           major = ?,
           certifications = ?,
           remarks = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [
        initials !== undefined ? initials : existingProfile.initials,
        gender !== undefined ? gender : existingProfile.gender,
        birthdate !== undefined ? birthdate : existingProfile.birthdate,
        age !== undefined ? age : existingProfile.age,
        address !== undefined ? address : existingProfile.address,
        education !== undefined ? education : existingProfile.education,
        major !== undefined ? major : existingProfile.major,
        certifications !== undefined ? certifications : existingProfile.certifications,
        remarks !== undefined ? remarks : existingProfile.remarks,
        req.user.userId,
      ]
    );

    // 更新後のプロフィールを取得
    const updatedProfile = await dbGet<UserProfile>(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [req.user.userId]
    );

    res.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/users/change-password
 * ユーザー自身のパスワードを変更
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // バリデーション
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: '現在のパスワードと新しいパスワードを入力してください' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: '新しいパスワードは6文字以上必要です' });
      return;
    }

    // ユーザー情報を取得
    const user = await dbGet<User>(
      'SELECT * FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (!user) {
      res.status(404).json({ error: 'ユーザーが見つかりません' });
      return;
    }

    // 現在のパスワードを検証
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      res.status(400).json({ error: '現在のパスワードが正しくありません' });
      return;
    }

    // 新しいパスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // パスワードを更新
    await dbRun(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, req.user.userId]
    );

    res.json({ message: 'パスワードを変更しました' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
