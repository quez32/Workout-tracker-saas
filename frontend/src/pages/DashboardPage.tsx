import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { DashboardData } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await api.get<DashboardData>('/dashboard');
        setData(result);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0] || 'Athlete'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Ready to crush today's workout?</p>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-12">
          <p className="text-sm text-gray-500">Loading your stats...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="card">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">This Week</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{data?.workoutsThisWeek ?? 0}</p>
              <p className="text-xs text-gray-400">workouts</p>
            </div>
            <div className="card">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{data?.totalWorkouts ?? 0}</p>
              <p className="text-xs text-gray-400">workouts</p>
            </div>
          </div>

          {/* Quick Start */}
          <button
            onClick={() => navigate('/workouts')}
            className="btn-primary mb-6 flex items-center justify-center gap-2"
          >
            <span>+</span>
            <span>Start Workout</span>
          </button>

          {/* Recent Workouts */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Recent Workouts</h2>
            {(data?.recentWorkouts?.length ?? 0) > 0 ? (
              <div className="space-y-2">
                {data!.recentWorkouts.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => navigate('/workouts')}
                    className="card flex cursor-pointer items-center justify-between transition hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${w.completed ? 'bg-green-100' : 'bg-blue-100'}`}>
                        <span className="text-lg">{w.completed ? '✅' : '🏋️'}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(w.date)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {w.exercise_count} exercises · {w.total_sets} sets
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {w.completed ? 'Done' : 'In progress'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-3xl mb-2">💪</p>
                  <p className="text-sm text-gray-500">No workouts yet</p>
                  <p className="text-xs text-gray-400 mt-1">Tap "Start Workout" to begin</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}