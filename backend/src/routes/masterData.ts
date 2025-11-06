import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getAllEnvironments, getAllLanguages, getAllIndustries } from '../controllers/masterDataController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all environments
router.get('/environments', getAllEnvironments);

// Get all languages
router.get('/languages', getAllLanguages);

// Get all industries
router.get('/industries', getAllIndustries);

export default router;
