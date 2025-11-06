import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { generatePDF, generatePDFForUser } from '../controllers/exportController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/export/pdf - Generate PDF skillsheet with settings
router.post('/pdf', generatePDF);

// POST /api/export/pdf/:userId - Generate PDF for a specific user (admin only)
router.post('/pdf/:userId', generatePDFForUser);

export default router;
