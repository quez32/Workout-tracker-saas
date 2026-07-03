// ============================================
// Sets Routes — CRUD for sets within workout exercises
// ============================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryMany, queryOne } from '../db';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse, Set, WorkoutExercise } from '../types';

const router = Router();

// All routes require auth
router.use(authenticateToken);

// --- Validation Schema ---

const createSetSchema = z.object({
  workout_exercise_id: z.string(),
  set_number: z.number().int().min(1),
  reps: z.number().int().min(0).optional(),
  weight: z.number().min(0).optional(),
  rpe: z.number().min(1).max(10).optional(),
  completed: z.boolean().optional(),
});

const updateSetSchema = z.object({
  set_number: z.number().int().min(1).optional(),
  reps: z.number().int().min(0).optional(),
  weight: z.number().min(0).optional(),
  rpe: z.number().min(1).max(10).optional(),
  completed: z.boolean().optional(),
});

// Helper to verify the workout_exercise belongs to the user
async function verifyWorkoutExerciseOwnership(
  weId: string, 
  userId: string
): Promise<boolean> {
  const result = await queryOne<{ id: string }>(
    `SELECT we.id FROM workout_exercises we
     JOIN workouts w ON w.id = we.workout_id
     WHERE we.id = ? AND w.user_id = ?`,
    [weId, userId]
  );
  return result !== null;
}

// ============================================
// GET /api/sets/:workoutExerciseId — Get all sets for a workout exercise
// ============================================
router.get('/:workoutExerciseId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { workoutExerciseId } = req.params;

    const owner = await verifyWorkoutExerciseOwnership(workoutExerciseId, req.user!.userId);
    if (!owner) {
      res.status(404).json({
        success: false,
        error: 'Workout exercise not found.',
      } satisfies ApiResponse);
      return;
    }

    const sets = await queryMany<Set>(
      'SELECT id, workout_exercise_id, set_number, reps, weight, rpe, completed FROM sets WHERE workout_exercise_id = ? ORDER BY set_number',
      [workoutExerciseId]
    );

    res.json({
      success: true,
      data: { sets },
    } satisfies ApiResponse);
  } catch (error) {
    console.error('List sets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sets.',
    } satisfies ApiResponse);
  }
});

// ============================================
// POST /api/sets — Create a set
// ============================================
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createSetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        data: parsed.error.flatten().fieldErrors,
      } satisfies ApiResponse);
      return;
    }

    const { workout_exercise_id, set_number, reps, weight, rpe, completed } = parsed.data;

    // Verify ownership
    const owner = await verifyWorkoutExerciseOwnership(workout_exercise_id, req.user!.userId);
    if (!owner) {
      res.status(404).json({
        success: false,
        error: 'Workout exercise not found.',
      } satisfies ApiResponse);
      return;
    }

    await query(
      'INSERT INTO sets (workout_exercise_id, set_number, reps, weight, rpe, completed) VALUES (?, ?, ?, ?, ?, ?)',
      [workout_exercise_id, set_number, reps ?? null, weight ?? null, rpe ?? null, completed ? 1 : 0]
    );

    const set = await queryOne<Set>(
      'SELECT id, workout_exercise_id, set_number, reps, weight, rpe, completed FROM sets ORDER BY id DESC LIMIT 1'
    );

    res.status(201).json({
      success: true,
      data: { set },
      message: 'Set logged!',
    } satisfies ApiResponse);
  } catch (error) {
    console.error('Create set error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create set.',
    } satisfies ApiResponse);
  }
});

// ============================================
// PUT /api/sets/:id — Update a set
// ============================================
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateSetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        data: parsed.error.flatten().fieldErrors,
      } satisfies ApiResponse);
      return;
    }

    // Get the set and verify ownership through the chain
    const setData = await queryOne<Set & { user_id: string }>(
      `SELECT s.*, w.user_id FROM sets s
       JOIN workout_exercises we ON we.id = s.workout_exercise_id
       JOIN workouts w ON w.id = we.workout_id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (!setData || setData.user_id !== req.user!.userId) {
      res.status(404).json({
        success: false,
        error: 'Set not found.',
      } satisfies ApiResponse);
      return;
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (parsed.data.set_number !== undefined) { updates.push('set_number = ?'); values.push(parsed.data.set_number); }
    if (parsed.data.reps !== undefined) { updates.push('reps = ?'); values.push(parsed.data.reps); }
    if (parsed.data.weight !== undefined) { updates.push('weight = ?'); values.push(parsed.data.weight); }
    if (parsed.data.rpe !== undefined) { updates.push('rpe = ?'); values.push(parsed.data.rpe); }
    if (parsed.data.completed !== undefined) { updates.push('completed = ?'); values.push(parsed.data.completed ? 1 : 0); }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No fields to update.',
      } satisfies ApiResponse);
      return;
    }

    values.push(req.params.id);
    await query(`UPDATE sets SET ${updates.join(', ')} WHERE id = ?`, values);

    const set = await queryOne<Set>(
      'SELECT id, workout_exercise_id, set_number, reps, weight, rpe, completed FROM sets WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      data: { set },
      message: 'Set updated!',
    } satisfies ApiResponse);
  } catch (error) {
    console.error('Update set error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update set.',
    } satisfies ApiResponse);
  }
});

// ============================================
// DELETE /api/sets/:id — Delete a set
// ============================================
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const setData = await queryOne<Set & { user_id: string }>(
      `SELECT s.*, w.user_id FROM sets s
       JOIN workout_exercises we ON we.id = s.workout_exercise_id
       JOIN workouts w ON w.id = we.workout_id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (!setData || setData.user_id !== req.user!.userId) {
      res.status(404).json({
        success: false,
        error: 'Set not found.',
      } satisfies ApiResponse);
      return;
    }

    await query('DELETE FROM sets WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Set deleted.',
    } satisfies ApiResponse);
  } catch (error) {
    console.error('Delete set error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete set.',
    } satisfies ApiResponse);
  }
});

export default router;
