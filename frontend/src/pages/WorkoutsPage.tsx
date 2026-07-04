// ============================================
// Workouts Page — Full workout logging UI
// ============================================

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { api } from '@/lib/api';
import type { Workout, WorkoutExercise, Exercise } from '@/lib/types';

type PageMode = 'list' | 'create' | 'detail';

export default function WorkoutsPage() {
  const [mode, setMode] = useState<PageMode>('list');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Fetch workouts list ---
  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ workouts: Workout[] }>('/workouts');
      setWorkouts(data.workouts);
    } catch (err) {
      console.error('Failed to fetch workouts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'list') fetchWorkouts();
  }, [mode, fetchWorkouts]);

  // --- Fetch single workout detail ---
  const fetchWorkoutDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await api.get<{ workout: Workout; exercises: WorkoutExercise[] }>(`/workouts/${id}`);
      setSelectedWorkout(data.workout);
      setWorkoutExercises(data.exercises);
    } catch (err) {
      console.error('Failed to fetch workout:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Delete workout ---
  const deleteWorkout = useCallback(async (id: string) => {
    if (!confirm('Delete this workout?')) return;
    try {
      await api.delete(`/workouts/${id}`);
      setWorkouts(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      console.error('Failed to delete workout:', err);
    }
  }, []);

  // --- Toggle workout complete ---
  const toggleComplete = useCallback(async (workout: Workout) => {
    try {
      const data = await api.put<{ workout: Workout }>(`/workouts/${workout.id}`, {
        completed: !workout.completed,
      });
      setSelectedWorkout(data.workout);
      setWorkouts(prev => prev.map(w => w.id === data.workout.id ? data.workout : w));
    } catch (err) {
      console.error('Failed to update workout:', err);
    }
  }, []);

  // --- Mode switching ---
  function openCreate() { setMode('create'); }
  function openDetail(workout: Workout) {
    setSelectedWorkout(workout);
    fetchWorkoutDetail(workout.id);
    setMode('detail');
  }
  function goBack() {
    setMode('list');
    setSelectedWorkout(null);
    setWorkoutExercises([]);
  }

  return (
    <div className="page-container">
      {mode === 'list' && (
        <WorkoutListView
          workouts={workouts}
          loading={loading}
          onCreate={openCreate}
          onSelect={openDetail}
          onDelete={deleteWorkout}
        />
      )}
      {mode === 'create' && (
        <WorkoutCreateView
          onCreated={() => { fetchWorkouts(); setMode('list'); }}
          onCancel={goBack}
        />
      )}
      {mode === 'detail' && selectedWorkout && (
        <WorkoutDetailView
          workout={selectedWorkout}
          exercises={workoutExercises}
          loading={loading}
          onBack={goBack}
          onRefresh={() => fetchWorkoutDetail(selectedWorkout.id)}
          onToggleComplete={() => toggleComplete(selectedWorkout)}
          onDeleted={() => { goBack(); fetchWorkouts(); }}
        />
      )}
    </div>
  );
}

// ============================================
// Workout List View
// ============================================
function WorkoutListView({
  workouts,
  loading,
  onCreate,
  onSelect,
  onDelete,
}: {
  workouts: Workout[];
  loading: boolean;
  onCreate: () => void;
  onSelect: (w: Workout) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Workouts</h1>
        <button onClick={onCreate} className="btn-primary !w-auto !px-4 !py-2 text-sm">
          + New
        </button>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-12">
          <p className="text-sm text-gray-500">Loading workouts...</p>
        </div>
      ) : workouts.length === 0 ? (
        <div className="card flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm text-gray-500">No workouts yet</p>
            <p className="text-xs text-gray-400 mt-1">Start by creating a new workout</p>
            <button onClick={onCreate} className="btn-primary !w-auto mt-4 !px-6">
              Create Workout
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map(workout => (
            <div
              key={workout.id}
              onClick={() => onSelect(workout)}
              className="card flex cursor-pointer items-center justify-between transition hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${workout.completed ? 'bg-green-100' : 'bg-blue-100'}`}>
                  <span className="text-lg">{workout.completed ? '✅' : '🏋️'}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(workout.date)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {workout.notes ? workout.notes.substring(0, 40) + (workout.notes.length > 40 ? '...' : '') : 'No notes'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {workout.completed ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Done</span>
                ) : null}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(workout.id); }}
                  className="rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ============================================
// Workout Create View
// ============================================
function WorkoutCreateView({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/workouts', { date, notes: notes || undefined });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workout');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onCancel} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-900">New Workout</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="workout-date" className="mb-1.5 block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            id="workout-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field"
            required
          />
        </div>

        <div>
          <label htmlFor="workout-notes" className="mb-1.5 block text-sm font-medium text-gray-700">
            Notes (optional)
          </label>
          <textarea
            id="workout-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Felt strong today..."
            className="input-field min-h-[80px] resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Creating...' : 'Create Workout'}
          </button>
        </div>
      </form>
    </>
  );
}

// ============================================
// Workout Detail View
// ============================================
function WorkoutDetailView({
  workout,
  exercises,
  loading,
  onBack,
  onRefresh,
  onToggleComplete,
  onDeleted,
}: {
  workout: Workout;
  exercises: WorkoutExercise[];
  loading: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onToggleComplete: () => void;
  onDeleted: () => void;
}) {
  const [showAddExercise, setShowAddExercise] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this workout permanently?')) return;
    try {
      await api.delete(`/workouts/${workout.id}`);
      onDeleted();
    } catch (err) {
      console.error('Failed to delete workout:', err);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {formatDate(workout.date)}
            </h1>
            <p className="text-xs text-gray-500">
              {workout.completed ? 'Completed' : 'In progress'}
              {workout.notes ? ` · ${workout.notes}` : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleComplete}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              workout.completed
                ? 'bg-gray-100 text-gray-600'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {workout.completed ? 'Reopen' : 'Complete'}
          </button>
          <button onClick={handleDelete} className="rounded-full px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600">
            Delete
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-12">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      ) : (
        <>
          {/* Exercises list with sets */}
          <div className="space-y-4 mb-6">
            {exercises.length === 0 ? (
              <div className="card flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-3xl mb-2">🏋️</p>
                  <p className="text-sm text-gray-500">No exercises yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add exercises to get started</p>
                </div>
              </div>
            ) : (
              exercises.map((we) => (
                <ExerciseCard
                  key={we.id}
                  workoutExercise={we}
                  onUpdate={onRefresh}
                />
              ))
            )}
          </div>

          {/* Add exercise button */}
          <button
            onClick={() => setShowAddExercise(true)}
            className="btn-secondary mb-4 flex items-center justify-center gap-2"
          >
            <span>+</span>
            <span>Add Exercise</span>
          </button>

          {showAddExercise && (
            <AddExerciseModal
              workoutId={workout.id}
              existingExerciseIds={exercises.map(e => e.exercise_id)}
              onAdded={() => { setShowAddExercise(false); onRefresh(); }}
              onClose={() => setShowAddExercise(false)}
            />
          )}
        </>
      )}
    </>
  );
}

// ============================================
// Exercise Card — Shows exercise + sets
// ============================================
function ExerciseCard({
  workoutExercise,
  onUpdate,
}: {
  workoutExercise: WorkoutExercise;
  onUpdate: () => void;
}) {
  const [showAddSet, setShowAddSet] = useState(false);

  async function addSet(reps: number, weight: number, rpe: number | null) {
    try {
      const nextSetNumber = (workoutExercise.sets?.length || 0) + 1;
      await api.post('/sets', {
        workout_exercise_id: workoutExercise.id,
        set_number: nextSetNumber,
        reps,
        weight,
        rpe,
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to add set:', err);
    }
  }

  async function updateSet(setId: string, data: { reps?: number; weight?: number; rpe?: number; completed?: boolean }) {
    try {
      await api.put(`/sets/${setId}`, data);
      onUpdate();
    } catch (err) {
      console.error('Failed to update set:', err);
    }
  }

  async function deleteSet(setId: string) {
    if (!confirm('Delete this set?')) return;
    try {
      await api.delete(`/sets/${setId}`);
      onUpdate();
    } catch (err) {
      console.error('Failed to delete set:', err);
    }
  }

  const sortedSets = [...(workoutExercise.sets || [])].sort((a, b) => a.set_number - b.set_number);

  return (
    <div className="card">
      {/* Exercise header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{workoutExercise.exercise_name}</p>
          {workoutExercise.muscle_group && (
            <span className="mt-0.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              {workoutExercise.muscle_group}
            </span>
          )}
        </div>
      </div>

      {/* Sets table */}
      {sortedSets.length > 0 && (
        <div className="mb-3 overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-xs font-medium text-gray-500">Set</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-500">Weight</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-500">Reps</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-500">RPE</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody>
              {sortedSets.map((set) => (
                <SetRow
                  key={set.id}
                  set={set}
                  onUpdate={(data) => updateSet(set.id, data)}
                  onDelete={() => deleteSet(set.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add set form */}
      {showAddSet ? (
        <AddSetForm
          onAdd={async (reps, weight, rpe) => {
            await addSet(reps, weight, rpe);
            setShowAddSet(false);
          }}
          onCancel={() => setShowAddSet(false)}
        />
      ) : (
        <button
          onClick={() => setShowAddSet(true)}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + Add Set
        </button>
      )}
    </div>
  );
}

// ============================================
// Set Row
// ============================================
function SetRow({
  set,
  onUpdate,
  onDelete,
}: {
  set: { id: string; set_number: number; reps: number | null; weight: number | null; rpe: number | null; completed: number };
  onUpdate: (data: { reps?: number; weight?: number; rpe?: number; completed?: boolean }) => void;
  onDelete: () => void;
}) {
  return (
    <tr className={`border-b border-gray-100 last:border-0 ${set.completed ? 'bg-green-50/50' : ''}`}>
      <td className="px-3 py-2 font-medium text-gray-700">{set.set_number}</td>
      <td className="px-3 py-2">
        <input
          type="number"
          defaultValue={set.weight ?? ''}
          onBlur={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val !== set.weight) onUpdate({ weight: val });
          }}
          className="w-16 rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
          placeholder="kg"
          min="0"
          step="0.5"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          defaultValue={set.reps ?? ''}
          onBlur={(e) => {
            const val = parseInt(e.target.value);
            if (!isNaN(val) && val !== set.reps) onUpdate({ reps: val });
          }}
          className="w-14 rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
          placeholder="reps"
          min="0"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          defaultValue={set.rpe ?? ''}
          onBlur={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val !== set.rpe) onUpdate({ rpe: val });
          }}
          className="w-14 rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
          placeholder="RPE"
          min="1"
          max="10"
          step="0.5"
        />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdate({ completed: !set.completed })}
            className={`rounded p-1 text-xs ${set.completed ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
            title={set.completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {set.completed ? '✅' : '○'}
          </button>
          <button onClick={onDelete} className="rounded p-1 text-xs text-gray-400 hover:text-red-500" title="Delete set">
            ✕
          </button>
        </div>
      </td>
    </tr>
  );
}

// ============================================
// Add Set Form
// ============================================
function AddSetForm({
  onAdd,
  onCancel,
}: {
  onAdd: (reps: number, weight: number, rpe: number | null) => Promise<void>;
  onCancel: () => void;
}) {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [rpe, setRpe] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const repsNum = parseInt(reps);
    const weightNum = parseFloat(weight);
    if (isNaN(repsNum) || isNaN(weightNum)) return;
    setSaving(true);
    try {
      await onAdd(repsNum, weightNum, rpe ? parseFloat(rpe) : null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 mt-3">
      <div className="flex-1 min-w-[60px]">
        <label className="mb-0.5 block text-xs text-gray-500">Weight</label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          placeholder="kg"
          min="0"
          step="0.5"
          required
          autoFocus
        />
      </div>
      <div className="flex-1 min-w-[50px]">
        <label className="mb-0.5 block text-xs text-gray-500">Reps</label>
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          placeholder="reps"
          min="0"
          required
        />
      </div>
      <div className="flex-1 min-w-[50px]">
        <label className="mb-0.5 block text-xs text-gray-500">RPE</label>
        <input
          type="number"
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          placeholder="RPE"
          min="1"
          max="10"
          step="0.5"
        />
      </div>
      <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
        {saving ? '...' : 'Add'}
      </button>
      <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
        Cancel
      </button>
    </form>
  );
}

// ============================================
// Add Exercise Modal
// ============================================
function AddExerciseModal({
  workoutId,
  existingExerciseIds,
  onAdded,
  onClose,
}: {
  workoutId: string;
  existingExerciseIds: string[];
  onAdded: () => void;
  onClose: () => void;
}) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<{ exercises: Exercise[] }>('/exercises');
        setExercises(data.exercises.filter((e) => !existingExerciseIds.includes(e.id)));
      } catch (err) {
        console.error('Failed to load exercises:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [existingExerciseIds]);

  async function addExercise(exerciseId: string) {
    try {
      await api.post(`/workouts/${workoutId}/exercises`, {
        exercise_id: exerciseId,
      });
      onAdded();
    } catch (err) {
      // Try to add using the sets endpoint approach — create workout_exercise via a workaround
      // Actually, we need to add an endpoint for this. Let me try a different approach
      console.error('Failed to add exercise:', err);
    }
  }

  const filtered = exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.muscle_group && e.muscle_group.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white p-5 max-h-[80vh] flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Add Exercise</h3>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
            ✕
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises..."
          className="input-field mb-3"
          autoFocus
        />

        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <p className="text-sm text-gray-500 text-center py-8">Loading exercises...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {search ? 'No exercises match your search' : 'No exercises available'}
            </p>
          ) : (
            filtered.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => addExercise(exercise.id)}
                className="w-full rounded-lg border border-gray-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
              >
                <p className="text-sm font-medium text-gray-900">{exercise.name}</p>
                <div className="mt-1 flex gap-2">
                  {exercise.muscle_group && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {exercise.muscle_group}
                    </span>
                  )}
                  {exercise.category && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {exercise.category}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Helpers
// ============================================
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}