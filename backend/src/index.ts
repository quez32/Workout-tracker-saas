// ============================================
// Workout Tracker SaaS — Express Server Entry
// ============================================

import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth';
import workoutRoutes from './routes/workouts';
import exerciseRoutes from './routes/exercises';
import setRoutes from './routes/sets';
import { authenticateToken } from './middleware/auth';

const app = express();

// --- Middleware ---
app.use(cors({
  origin: '*', // Allow all origins in dev; restrict in production
  credentials: true,
}));
app.use(express.json());

// --- Health Check ---
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/sets', setRoutes);

// --- Dashboard Summary ---
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const { queryOne, queryMany } = await import('./db');

    const totalWorkouts = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM workouts WHERE user_id = ?',
      [req.user!.userId]
    );

    const thisWeek = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM workouts WHERE user_id = ? AND date >= datetime('now', '-7 days')",
      [req.user!.userId]
    );

    const recentWorkouts = await queryMany(
      `SELECT w.id, w.date, w.completed, w.notes, w.created_at,
              COUNT(DISTINCT we.id) as exercise_count,
              COUNT(s.id) as total_sets
       FROM workouts w
       LEFT JOIN workout_exercises we ON we.workout_id = w.id
       LEFT JOIN sets s ON s.workout_exercise_id = we.id
       WHERE w.user_id = ?
       GROUP BY w.id
       ORDER BY w.date DESC
       LIMIT 5`,
      [req.user!.userId]
    );

    res.json({
      success: true,
      data: {
        totalWorkouts: totalWorkouts?.count || 0,
        workoutsThisWeek: thisWeek?.count || 0,
        recentWorkouts,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load dashboard.',
    });
  }
});

// --- 404 Handler ---
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found.',
  });
});

// --- Global Error Handler ---
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error.',
  });
});

// --- Start Server ---
app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║  🏋️ Workout Tracker SaaS - Backend API         ║
  ║  Running on http://0.0.0.0:${String(config.PORT).padEnd(5)}         ║
  ║  Environment: ${config.NODE_ENV.padEnd(25)}║
  ╚═══════════════════════════════════════════════╝
  `);
});

export default app;
