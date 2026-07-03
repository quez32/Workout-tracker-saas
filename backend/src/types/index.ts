// === User Types ===
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

// === Workout Plan Types ===
export interface WorkoutPlan {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_adaptive: boolean;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

// === Workout Session Types ===
export interface Workout {
  id: string;
  user_id: string;
  plan_id: string | null;
  date: string;
  notes: string | null;
  completed: boolean;
  created_at: string;
}

// === Exercise Types ===
export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  muscle_group: string | null;
  category: string | null;
}

// === Workout-Exercise Join Types ===
export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number;
  notes: string | null;
}

// === Set Types ===
export interface Set {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  rpe: number | null;
  completed: boolean;
}

// === Subscription Types ===
export type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid';
export type PlanType = 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  plan_type: PlanType;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

// === Auth Types ===
export interface AuthPayload {
  userId: string;
  email: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// === API Response Types ===
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
