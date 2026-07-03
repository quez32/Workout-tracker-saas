# 🏋️ Workout Tracker SaaS

A mobile-first workout tracking SaaS with AI-adaptive workout plans, ready to sell on the marketplace.

## ✨ Features

- **Workout Tracking** — Log sets, reps, weights, and exercises
- **Exercise Library** — Curated exercises with muscle group filtering
- **Adaptive Workout Plans** — AI-generated plans that adjust based on progress
- **User Dashboard** — Progress insights and recent activity
- **Authentication** — Secure signup/login with JWT
- **Premium Paywall** — Stripe-ready subscription system (monthly/yearly with trial)
- **Mobile-First** — Responsive design that works perfectly on mobile

## 🏗️ Architecture

```
├── package.json          # Root workspace config
├── backend/              # Express API server
│   ├── src/
│   │   ├── index.ts      # Server entry point
│   │   ├── config.ts     # Environment config
│   │   ├── db/
│   │   │   ├── index.ts  # Turso/libsql client
│   │   │   ├── schema.ts # Database schema
│   │   │   └── migrate.ts# Schema migration runner
│   │   ├── middleware/
│   │   │   └── auth.ts   # JWT authentication
│   │   ├── routes/
│   │   │   ├── auth.ts   # Signup/login endpoints
│   │   │   ├── workouts.ts   # Workout CRUD
│   │   │   ├── exercises.ts  # Exercise library
│   │   │   └── sets.ts   # Sets CRUD
│   │   └── types/
│   │       └── index.ts  # TypeScript types
│   └── .env.example      # Environment variables template
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3+ or Node.js v20+
- A [Turso](https://turso.tech) database (or any libsql-compatible DB)

### Setup

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd Workout-tracker-saas
   ```

2. **Install dependencies**
   ```bash
   cd backend && bun install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Turso credentials and JWT secret
   ```

4. **Run migrations**
   ```bash
   bun run migrate
   ```

5. **Start the server**
   ```bash
   bun run dev
   ```

The API will be available at `http://localhost:3001`.

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user (auth) |

### Workouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workouts` | List user's workouts (auth) |
| GET | `/api/workouts/:id` | Get workout with exercises/sets (auth) |
| POST | `/api/workouts` | Create workout (auth) |
| PUT | `/api/workouts/:id` | Update workout (auth) |
| DELETE | `/api/workouts/:id` | Delete workout (auth) |

### Exercises
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exercises` | List exercises (auth, supports ?muscle_group=, ?category=, ?search=) |
| GET | `/api/exercises/muscle-groups` | List distinct muscle groups (auth) |
| GET | `/api/exercises/:id` | Get exercise details (auth) |
| POST | `/api/exercises` | Create custom exercise (auth) |

### Sets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sets/:workoutExerciseId` | List sets for an exercise (auth) |
| POST | `/api/sets` | Log a set (auth) |
| PUT | `/api/sets/:id` | Update a set (auth) |
| DELETE | `/api/sets/:id` | Delete a set (auth) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | User progress summary (auth) |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

## 📊 Database Schema

- **users** — Account information and auth
- **workout_plans** — Reusable workout plan templates
- **workouts** — Individual workout sessions
- **exercises** — Exercise library (seeded with common exercises)
- **workout_exercises** — Join table linking workouts to exercises
- **sets** — Individual sets logged per exercise
- **subscriptions** — Stripe subscription tracking

## ⚙️ Configuration

All environment variables are documented in `backend/.env.example`. Key configuration:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001) |
| `TURSO_DATABASE_URL` | Turso/libsql database URL |
| `TURSO_AUTH_TOKEN` | Turso authentication token |
| `JWT_SECRET` | Secret key for JWT token signing |
| `JWT_EXPIRES_IN` | Token expiry (default: 7d) |

## 📝 License

MIT
