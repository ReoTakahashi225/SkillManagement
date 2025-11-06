import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, runMigrations } from './database/db';
import authRoutes from './routes/auth';
import workExperienceRoutes from './routes/workExperience';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import masterDataRoutes from './routes/masterData';
import analyticsRoutes from './routes/analytics';
import exportRoutes from './routes/export';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Skill Management System API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/work-experiences', workExperienceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/master', masterDataRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();
    console.log('Database initialized');

    // Run migrations
    await runMigrations();
    console.log('Database migrations completed');

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
