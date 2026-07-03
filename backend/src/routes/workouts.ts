// ============================================
// Workout Routes — CRUD for workout sessions
// ============================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryMany, queryOne } from '../db';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse, Workout, WorkoutExercise } from '../types';

const router = Router();

// All workout routes require authentication
router.use(authenticateToken);

// --- Validation Schemas ---

const createWorkoutSchema = z.object({
  plan_id: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

const updateWorkoutSchema = z.object({
  notes: z.string().max(1000).optional(),
  completed: z.boolean().optional(),
  date: z.string().optional(),
});

// ============================================
// GET /api/workouts — List user's workouts
// ============================================
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit, offset } = req.query;
    const pageLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const pageOffset = Math.max(Number(offset) || 0, 0);

    const workouts = await queryMany<Workout>(
      'SELECT id, user_id, plan_id, date, notes, completed, created_at FROM workouts WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?',
      [req.user!.userId, pageLimit, pageOffset]
    );

    res.json({
      success: true,
      data: { workouts },
    } satisfies ApiResponse);
  } catch (error) {
    console.error('List workouts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workouts.',
    } satisfies ApiResponse);
  }
});

// ============================================
// GET /api/workouts/:id — Get a single workout with exercises and sets
// ============================================
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const workout = await queryOne<Workout>(
      'SELECT id, user_id, plan_id, date, notes, completed, created_at FROM workouts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user!.userId]
    );

    if (!workout) {
      res.status(404).json({
        success: false,
        error: 'Workout not found.',
      } satisfies ApiResponse);
      return;
    }

    // Get exercises in this workout
    const exercises = await queryMany<{
      id: string;
      exercise_id: string;
      exercise_name: string;
      muscle_group: string | null;
      order_index: number;
      notes: string | null;
    }>(
      `SELECT we.id, we.exercise_id, e.name as exercise_name, e.muscle_group, we.order_index, we.notes
       FROM workout_exercises we
       JOIN exercises e ON e.id = we.exercise_id
       WHERE we.workout_id = ?
       ORDER BY we.order_index`,
      [workout.id]
    );

    // Get sets for each exercise
    const exercisesWithSets = [];
    for (const ex of exercises) {
      const sets = await queryMany(
        'SELECT id, workout_exercise_id, set_number, reps, weight, rpe, completed FROM sets WHERE workout_exercise_id = ? ORDER BY set_number',
        [ex.id]
      );
      exercisesWithSets.push({ ...ex, sets });
    }

    res.json({
      success: true,
      data: { workout, exercises: exercisesWithSets },
    } satisfies ApiResponse);
  } catch (error) {
    console.error('Get workout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workout.',
    } satisfies ApiResponse);
  }
});

// ============================================
// POST /api/workouts — Create a new workout session
// ============================================
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createWorkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        data: parsed.error.flatten().fieldErrors,
      } satisfies ApiResponse);
      return;
    }

    const { plan_id, date, notes } = parsed.data;
    const workoutDate = date || new Date().toISOString().split('T')[0];

    const result = await query(
      'INSERT INTO workouts (user_id, plan_id, date, notes) VALUES (?, ?, ?, ?)',
      [req.user!.userId, plan_id || null, workoutDate, notes || null]
    );

    // Fetch the created workout
    const workout = await queryOne<Workout>(
      'SELECT id, user_id, plan_id, date, notes, completed, created_at FROM workouts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user!.userId]
    );

    res.status(201).json({
      success: true,
      data: { workout },
      message: 'Workout created!',
    } satisfies ApiResponse);
  } catch (error) {
    console.error('Create workout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create workout.',
    } satisfies ApiResponse);
  }
});

// ============================================
// PUT /api/workouts/:id — Update a workout
// ============================================
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateWorkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        data: parsed.error.flatten().fieldErrors,
      } satisfies ApiResponse);
      return;
    }

    // Verify ownership
    const existing = await queryOne<Workout>(
      'SELECT id FROM workouts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user!.userId]
    );

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Workout not found.',
      } satisfies ApiResponse);
      return;
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (parsed.data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(parsed.data.notes);
    }
    if (parsed.data.completed !== undefined) {
      updates.push('completed = ?');
      values.push(parsed.data.completed ? 1 : 0);
    }
    if (parsed.data.date !== undefined) {
      updates.push('date = ?');
      values.push(parsed.data.date);
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No fields to update.',
      } satisfies ApiResponse);
      return;
    }

    values.push(req.params.id);
    await query(
      `UPDATE workouts SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const workout = await queryOne<Workout>(
      'SELECT id, user_id, plan_id, date, notes, completed, created_at FROM workouts WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      data: { workout },
      message: 'Workout updated!',
    } satisfies ApiResponse);
  } catch (error) {
    console.error('Update workout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workout.',
    } satisfies ApiResponse);
  }
});

// ============================================
// DELETE /api/workouts/:id — Delete a workout
// ============================================
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await queryOne<Workout>(
      'SELECT id FROM workouts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user!.userId]
    );

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Workout not found.',
      } satisfies ApiResponse);
      return;
    }

    await query('DELETE FROM workouts WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Workout deleted.',
    } satisfies ApiResponse);
  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete workout.',
    } satisfies ApiResponse);
  }
});

export default router;
