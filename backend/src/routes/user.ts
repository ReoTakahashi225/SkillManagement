import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getUserProfile, updateUserProfile, changePassword } from '../controllers/userController';

const router = Router();

// すべてのルートに認証を適用
router.use(authenticate);

// GET /api/users/profile - ユーザープロフィール情報を取得
router.get('/profile', getUserProfile);

// PUT /api/users/profile - ユーザープロフィール情報を更新
router.put('/profile', updateUserProfile);

// POST /api/users/change-password - パスワード変更
router.post('/change-password', changePassword);

export default router;
