// ============================================
// Authentication Routes — Signup & Login
// ============================================

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, queryOne } from '../db';
import { generateToken } from '../middleware/auth';
import { ApiResponse, User } from '../types';

const router = Router();

// --- Validation Schemas ---

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ============================================
// POST /api/auth/signup
// ============================================
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        data: parsed.error.flatten().fieldErrors,
      } satisfies ApiResponse);
      return;
    }

    const { email, password, name } = parsed.data;

    // Check if user already exists
    const existingUser = await queryOne<User>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
      } satisfies ApiResponse);
      return;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    await query(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email, password_hash, name]
    );

    // Fetch the created user
    const user = await queryOne<User>(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      res.status(500).json({
        success: false,
        error: 'Failed to create user. Please try again.',
      } satisfies ApiResponse);
      return;
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
        token,
      },
      message: 'Account created successfully!',
    } satisfies ApiResponse);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again later.',
    } satisfies ApiResponse);
  }
});

// ============================================
// POST /api/auth/login
// ============================================
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        data: parsed.error.flatten().fieldErrors,
      } satisfies ApiResponse);
      return;
    }

    const { email, password } = parsed.data;

    // Find user
    const user = await queryOne<User>(
      'SELECT id, email, name, password_hash, created_at FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      } satisfies ApiResponse);
      return;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      } satisfies ApiResponse);
      return;
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
        token,
      },
      message: 'Login successful!',
    } satisfies ApiResponse);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again later.',
    } satisfies ApiResponse);
  }
});

// ============================================
// GET /api/auth/me — Get current user profile
// ============================================
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  // This route should use the authenticateToken middleware
  // The user is attached by the middleware
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required.',
    } satisfies ApiResponse);
    return;
  }

  try {
    const user = await queryOne<User>(
      'SELECT id, email, name, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found.',
      } satisfies ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: { user },
    } satisfies ApiResponse);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred.',
    } satisfies ApiResponse);
  }
});

export default router;
