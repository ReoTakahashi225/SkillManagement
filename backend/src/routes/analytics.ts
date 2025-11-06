import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getAnalytics, getAnalyticsForUser } from '../controllers/analyticsController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/analytics - Get analytics data for the logged-in user
router.get('/', getAnalytics);

// GET /api/analytics/user/:userId - Get analytics data for a specific user (admin only)
router.get('/user/:userId', getAnalyticsForUser);

export default router;
