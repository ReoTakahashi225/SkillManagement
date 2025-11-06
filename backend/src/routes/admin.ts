import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  getAllUsers,
  getUserById,
  getDashboardStats,
  createUser,
  updateUser,
  deleteUser,
  importWorkExperiences,
  importWorkExperiencesFromFile,
  changeUserPassword,
  searchUsers
} from '../controllers/adminController';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'work-exp-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// All routes require authentication AND admin role
router.use(authenticate, requireAdmin);

// Get all users with optional search
router.get('/users', getAllUsers);

// Create new user
router.post('/users', createUser);

// Get user detail by ID
router.get('/users/:id', getUserById);

// Update user
router.put('/users/:id', updateUser);

// Change user password
router.post('/users/:id/change-password', changeUserPassword);

// Delete user
router.delete('/users/:id', deleteUser);

// Import work experiences from JSON for a specific user
router.post('/users/:id/import', importWorkExperiences);

// Import work experiences from file (PDF/Excel) using Gemini API
router.post('/users/:id/import-file', upload.single('file'), importWorkExperiencesFromFile);

// Get dashboard statistics
router.get('/stats', getDashboardStats);

// Search users by language, environment, industry, certifications
router.post('/search', searchUsers);

export default router;
