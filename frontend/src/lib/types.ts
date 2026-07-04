// ============================================
// Shared types matching backend API responses
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  plan_id: string | null;
  date: string;
  notes: string | null;
  completed: number;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  muscle_group: string | null;
  category: string | null;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_name: string;
  muscle_group: string | null;
  order_index: number;
  notes: string | null;
  sets: Set[];
}

export interface Set {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  rpe: number | null;
  completed: number;
}

export interface DashboardData {
  totalWorkouts: number;
  workoutsThisWeek: number;
  recentWorkouts: (Workout & {
    exercise_count: number;
    total_sets: number;
  })[];
}