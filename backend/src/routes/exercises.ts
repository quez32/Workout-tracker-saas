// ============================================
// Exercise Routes — Library of exercises
// ============================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryMany, queryOne } from '../db';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse, Exercise } from '../types';

const router = Router();

// All exercise routes require authentication
router.use(authenticateToken);

// ============================================
// GET /api/exercises — List all exercises (with optional filtering)
// ============================================
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { muscle_group, category, search } = req.query;

    let sql = 'SELECT id, name, description, muscle_group, category FROM exercises WHERE 1=1';
    const params: unknown[] = [];

    if (muscle_group) {
      sql += ' AND muscle_group = ?';
      params.push(muscle_group);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY name ASC';

    const exercises = await queryMany<Exercise>(sql, params);

    res.json({
      success: true,
      data: { exercises },
    } satisfies ApiResponse);
  } catch (error) {
    console.error('List exercises error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch exercises.',
    } satisfies ApiResponse);
  }
});

// ============================================
// GET /api/exercises/muscle-groups — Get distinct muscle groups
// ============================================
router.get('/muscle-groups', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await queryMany<{ muscle_group: string }>(
      'SELECT DISTINCT muscle_group FROM exercises WHERE muscle_group IS NOT NULL ORDER BY muscle_group'
    );
    const groups = result.map(r => r.muscle_group);

    res.json({
      success: true,
      data: { muscleGroups: groups },
    } satisfies ApiResponse);
  } catch (error) {
    console.error('List muscle groups error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch muscle groups.',
    } satisfies ApiResponse);
  }
});

// ============================================
// GET /api/exercises/:id — Get a single exercise
// ============================================
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const exercise = await queryOne<Exercise>(
      'SELECT id, name, description, muscle_group, category FROM exercises WHERE id = ?',
      [req.params.id]
    );

    if (!exercise) {
      res.status(404).json({
        success: false,
        error: 'Exercise not found.',
      } satisfies ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: { exercise },
    } satisfies ApiResponse);
  } catch (error) {
    console.error('Get exercise error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch exercise.',
    } satisfies ApiResponse);
  }
});

// ============================================
// POST /api/exercises — Create a custom exercise
// ============================================
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      muscle_group: z.string().max(50).optional(),
      category: z.string().max(50).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        data: parsed.error.flatten().fieldErrors,
      } satisfies ApiResponse);
      return;
    }

    const { name, description, muscle_group, category } = parsed.data;

    await query(
      'INSERT INTO exercises (name, description, muscle_group, category) VALUES (?, ?, ?, ?)',
      [name, description || null, muscle_group || null, category || null]
    );

    const exercise = await queryOne<Exercise>(
      'SELECT id, name, description, muscle_group, category FROM exercises ORDER BY id DESC LIMIT 1'
    );

    res.status(201).json({
      success: true,
      data: { exercise },
      message: 'Exercise created!',
    } satisfies ApiResponse);
  } catch (error) {
    console.error('Create exercise error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create exercise.',
    } satisfies ApiResponse);
  }
});

export default router;
