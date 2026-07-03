// ============================================
// Workout Tracker SaaS — Database Schema
// ============================================
// This file defines the database tables for the app.
// Run via: bun run src/db/migrate.ts
// ============================================

const schemaSql = `
-- Enable WAL mode for better concurrent access
PRAGMA journal_mode=WAL;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- WORKOUT PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workout_plans (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_adaptive INTEGER NOT NULL DEFAULT 0,
  is_premium INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id);

-- ============================================
-- WORKOUT SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT REFERENCES workout_plans(id) ON DELETE SET NULL,
  date TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);

-- ============================================
-- EXERCISES TABLE (shared library of exercises)
-- ============================================
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  muscle_group TEXT,
  category TEXT
);

CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);

-- ============================================
-- WORKOUT-EXERCISE JOIN TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workout_exercises (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON workout_exercises(exercise_id);

-- ============================================
-- SETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workout_exercise_id TEXT NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight REAL,
  rpe REAL,
  completed INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sets_workout_exercise_id ON sets(workout_exercise_id);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid')),
  plan_type TEXT NOT NULL DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'yearly')),
  current_period_start TEXT,
  current_period_end TEXT,
  trial_end TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- ============================================
-- SEED DEFAULT EXERCISES (only if table is empty)
-- ============================================
INSERT OR IGNORE INTO exercises (id, name, description, muscle_group, category) VALUES
  ('ex-bench-press', 'Bench Press', 'Barbell bench press for chest development', 'Chest', 'Strength'),
  ('ex-squat', 'Squat', 'Barbell back squat for leg development', 'Legs', 'Strength'),
  ('ex-deadlift', 'Deadlift', 'Conventional barbell deadlift', 'Back', 'Strength'),
  ('ex-overhead-press', 'Overhead Press', 'Standing barbell overhead press', 'Shoulders', 'Strength'),
  ('ex-barbell-row', 'Barbell Row', 'Bent-over barbell row', 'Back', 'Strength'),
  ('ex-pull-up', 'Pull Up', 'Bodyweight pull up', 'Back', 'Strength'),
  ('ex-dumbbell-curl', 'Dumbbell Curl', 'Standing dumbbell bicep curl', 'Arms', 'Strength'),
  ('ex-tricep-pushdown', 'Tricep Pushdown', 'Cable tricep pushdown', 'Arms', 'Strength'),
  ('ex-leg-press', 'Leg Press', 'Machine leg press', 'Legs', 'Strength'),
  ('ex-lateral-raise', 'Lateral Raise', 'Dumbbell lateral raise', 'Shoulders', 'Strength'),
  ('ex-running', 'Running', 'Cardio running on treadmill or outdoors', 'Cardio', 'Cardio'),
  ('ex-cycling', 'Cycling', 'Stationary or outdoor cycling', 'Cardio', 'Cardio');
`;

export { schemaSql };
