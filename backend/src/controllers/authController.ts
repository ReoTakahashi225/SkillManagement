import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { dbRun, dbGet } from '../database/db';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';

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

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, email, full_name } = req.body;

    // Validation
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Check if user already exists
    const existingUser = await dbGet<User>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await dbGet<User>(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (existingEmail) {
        res.status(409).json({ error: 'Email already exists' });
        return;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await dbRun(
      'INSERT INTO users (username, password, email, full_name) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, email || null, full_name || null]
    );

    // Get created user
    const newUser = await dbGet<User>(
      'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?',
      [result.lastID]
    );

    if (!newUser) {
      res.status(500).json({ error: 'Failed to create user' });
      return;
    }

    // Generate token
    const token = generateToken({
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role
    });

    res.status(201).json({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    // Find user
    const user = await dbGet<User>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user (requires authentication)
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Get user details
    const user = await dbGet<User>(
      'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
