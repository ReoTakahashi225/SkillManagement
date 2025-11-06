import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getWorkExperiences,
  getWorkExperienceById,
  createWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
} from '../controllers/workExperienceController';

const router = Router();

// すべてのルートに認証を適用
router.use(authenticate);

// GET /api/work-experiences - ログイン中のユーザーの業務実績を全て取得
router.get('/', getWorkExperiences);

// POST /api/work-experiences - 新規業務実績を登録
router.post('/', createWorkExperience);

// GET /api/work-experiences/:id - 特定の業務実績の詳細を取得
router.get('/:id', getWorkExperienceById);

// PUT /api/work-experiences/:id - 業務実績を更新
router.put('/:id', updateWorkExperience);

// DELETE /api/work-experiences/:id - 業務実績を削除
router.delete('/:id', deleteWorkExperience);

export default router;
