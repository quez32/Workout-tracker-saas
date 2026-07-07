import { useState } from 'react';

type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  daysPerWeek: number;
  schedule: { day: Day; workout: string }[];
  isAdaptive: boolean;
  isPremium: boolean;
}

const MOCK_PLANS: WorkoutPlan[] = [
  {
    id: '1',
    name: 'Push / Pull / Legs',
    description: 'Classic PPL split for balanced muscle development',
    difficulty: 'Intermediate',
    daysPerWeek: 6,
    schedule: [
      { day: 'Mon', workout: 'Push (Chest, Shoulders, Triceps)' },
      { day: 'Tue', workout: 'Pull (Back, Biceps)' },
      { day: 'Wed', workout: 'Legs (Quads, Hamstrings, Glutes)' },
      { day: 'Thu', workout: 'Push (Chest, Shoulders, Triceps)' },
      { day: 'Fri', workout: 'Pull (Back, Biceps)' },
      { day: 'Sat', workout: 'Legs (Quads, Hamstrings, Glutes)' },
      { day: 'Sun', workout: 'Rest Day' },
    ],
    isAdaptive: true,
    isPremium: true,
  },
  {
    id: '2',
    name: 'Upper / Lower Split',
    description: '4-day upper/lower body split for strength & size',
    difficulty: 'Intermediate',
    daysPerWeek: 4,
    schedule: [
      { day: 'Mon', workout: 'Upper Body Strength' },
      { day: 'Tue', workout: 'Lower Body Strength' },
      { day: 'Wed', workout: 'Rest Day' },
      { day: 'Thu', workout: 'Upper Body Hypertrophy' },
      { day: 'Fri', workout: 'Lower Body Hypertrophy' },
      { day: 'Sat', workout: 'Rest Day' },
      { day: 'Sun', workout: 'Rest Day' },
    ],
    isAdaptive: true,
    isPremium: true,
  },
  {
    id: '3',
    name: 'Full Body 3x',
    description: 'Simple full-body routine, 3 days per week',
    difficulty: 'Beginner',
    daysPerWeek: 3,
    schedule: [
      { day: 'Mon', workout: 'Full Body A' },
      { day: 'Tue', workout: 'Rest Day' },
      { day: 'Wed', workout: 'Full Body B' },
      { day: 'Thu', workout: 'Rest Day' },
      { day: 'Fri', workout: 'Full Body C' },
      { day: 'Sat', workout: 'Rest Day' },
      { day: 'Sun', workout: 'Rest Day' },
    ],
    isAdaptive: false,
    isPremium: false,
  },
];

function DayCell({ day, workout }: { day: Day; workout: string }) {
  const isRest = workout.toLowerCase().includes('rest');
  return (
    <div className={`flex items-center gap-3 rounded-lg p-3 ${isRest ? 'bg-gray-50' : 'bg-blue-50'}`}>
      <div className={`flex h-8 w-10 items-center justify-center rounded-md text-xs font-bold ${
        isRest ? 'bg-gray-200 text-gray-500' : 'bg-blue-200 text-blue-700'
      }`}>
        {day}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${isRest ? 'text-gray-400' : 'text-gray-900'}`}>
          {workout}
        </p>
      </div>
      {isRest && (
        <span className="text-xs text-gray-400">🛌</span>
      )}
    </div>
  );
}

function PlanCard({ plan }: { plan: WorkoutPlan }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card mb-4 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">{plan.name}</h3>
            {plan.isPremium && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                PRO
              </span>
            )}
            {plan.isAdaptive && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                Adaptive
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">{plan.description}</p>
          <div className="mt-1 flex items-center gap-3">
            <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
              plan.difficulty === 'Beginner' ? 'bg-green-50 text-green-600' :
              plan.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-600' :
              'bg-red-50 text-red-600'
            }`}>
              {plan.difficulty}
            </span>
            <span className="text-[11px] text-gray-400">{plan.daysPerWeek} days/week</span>
          </div>
        </div>
        <span className={`ml-2 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
          {plan.schedule.map((item) => (
            <DayCell key={item.day} day={item.day} workout={item.workout} />
          ))}
          {plan.isPremium && (
            <div className="mt-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 p-3 text-center">
              <p className="text-xs font-medium text-amber-700">✨ Premium Adaptive Plan</p>
              <p className="mt-0.5 text-[11px] text-amber-600">
                Workouts adjust based on your progress
              </p>
              <button className="mt-2 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-600">
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PlansPage() {
  const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all');

  const filtered = MOCK_PLANS.filter((p) => {
    if (filter === 'free') return !p.isPremium;
    if (filter === 'premium') return p.isPremium;
    return true;
  });

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Workout Plans</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose a plan or let AI adapt one for you
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        {(['all', 'free', 'premium'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All Plans' : f === 'free' ? 'Free' : 'Premium'}
          </button>
        ))}
      </div>

      {/* Plans list */}
      {filtered.length === 0 ? (
        <div className="card flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-sm text-gray-500">No plans match this filter</p>
          </div>
        </div>
      ) : (
        filtered.map((plan) => <PlanCard key={plan.id} plan={plan} />)
      )}

      {/* Adaptive toggle info */}
      <div className="card mt-2 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start gap-3">
          <span className="text-xl">🤖</span>
          <div>
            <p className="text-sm font-medium text-gray-900">AI-Adaptive Plans</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Premium plans automatically adjust weights, reps, and exercises based on your performance and recovery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}