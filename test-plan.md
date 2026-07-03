# Workout Tracker SaaS — Comprehensive Test Plan

> **Version:** 1.0  
> **Phase:** Phase 1 — QA & Test Planning  
> **Author:** QA Engineer  
> **Last Updated:** 2026-07-03

---

## Table of Contents

1. [Scope & Objectives](#1-scope--objectives)
2. [Test Environment & Prerequisites](#2-test-environment--prerequisites)
3. [Auth Flow Tests](#3-auth-flow-tests)
4. [Workout CRUD Tests](#4-workout-crud-tests)
5. [Exercise Library Tests](#5-exercise-library-tests)
6. [Sets CRUD Tests](#6-sets-crud-tests)
7. [Adaptive Plan Engine Tests (Phase 3)](#7-adaptive-plan-engine-tests-phase-3)
8. [Stripe Paywall Tests (Phase 4)](#8-stripe-paywall-tests-phase-4)
9. [Mobile-First Responsive Design Tests](#9-mobile-first-responsive-design-tests)
10. [Edge Cases & Error Handling](#10-edge-cases--error-handling)
11. [Performance Expectations](#11-performance-expectations)
12. [Security Tests](#12-security-tests)
13. [Rebranding Configuration Tests](#13-rebranding-configuration-tests)
14. [Test Execution Strategy](#14-test-execution-strategy)
15. [Bug Severity Classification](#15-bug-severity-classification)

---

## 1. Scope & Objectives

### 1.1 Scope
This test plan covers the entire Workout Tracker SaaS application, including:
- **Backend API** (Express + Turso DB)
- **Frontend UI** (React + Vite — mobile-first)
- **Authentication system** (JWT-based)
- **Payment integration** (Stripe)
- **Adaptive workout plan engine**

### 1.2 Objectives
- Verify **100% of specified functionality** works correctly
- Ensure **zero P0/P1 bugs** at launch (non-negotiable per owner)
- Validate **mobile-first responsive design** across all device sizes
- Confirm **easy rebranding** via single config file
- Catch **edge cases** that would cause production failures

### 1.3 Out of Scope
- Load/stress testing (>100 concurrent users)
- Third-party API reliability testing (Stripe, Turso)
- Long-running subscription lifecycle testing (e.g., months-long trial expiry)

---

## 2. Test Environment & Prerequisites

### 2.1 Environments

| Environment | URL / Location | Purpose |
|-------------|----------------|---------|
| **Local Dev** | `http://localhost:3000` (frontend), `http://localhost:3001` (API) | Day-to-day testing |
| **Staging** | Published via `bun run publish` | Pre-launch verification |
| **Production** | Marketplace listing | Not tested directly |

### 2.2 Prerequisites
- Node.js ≥ 18 / Bun
- Turso database with schema migrated
- Stripe test keys configured
- `.env` file with all required variables
- Frontend dev server running

### 2.3 Test Data Setup
- Seed database with 12 default exercises (already in `schema.ts`)
- Create 2+ test user accounts
- Create workout sessions with exercises and sets
- Configure Stripe test mode products/prices

### 2.4 Testing Tools

| Layer | Tool | Purpose |
|-------|------|---------|
| API Integration | **Vitest + Supertest** | Test API endpoints against real DB |
| Frontend Components | **Vitest + React Testing Library** | Test component behavior |
| E2E / Mobile-Responsive | **Playwright** | Device emulation, viewport testing |
| Code Quality | **ESLint + Prettier** | Lint before every commit |
| Coverage Target | **≥ 80%** | Focus on business logic over UI scaffolding |

---

## 3. Auth Flow Tests

### 3.1 Signup

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| A1 | Successful signup | POST `/api/auth/signup` with valid `{email, password, name}` | Returns 201 with `{success: true, data: {user, token}}` |
| A2 | Duplicate email | Signup with an email that already exists | Returns 409 with `"An account with this email already exists."` |
| A3 | Invalid email format | Signup with `"not-an-email"` | Returns 400 with validation error for `email` |
| A4 | Short password | Signup with password < 8 characters | Returns 400 with validation error for `password` |
| A5 | Empty name | Signup with empty string name | Returns 400 with validation error for `name` |
| A6 | Missing fields | Signup with no body | Returns 400 validation errors for all fields |
| A7 | Name too long | Signup with name > 100 characters | Returns 400 with validation error |
| A8 | SQL injection attempt | Signup with email containing SQL injection patterns | Returns 400/409 gracefully; no SQL error leaked |
| A9 | XSS in name | Signup with name containing `<script>alert('xss')</script>` | Name stored as-is, no script execution on output |

### 3.2 Login

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| B1 | Successful login | POST `/api/auth/login` with correct credentials | Returns 200 with `{success: true, data: {user, token}}` |
| B2 | Wrong password | Login with correct email, wrong password | Returns 401 with `"Invalid email or password."` |
| B3 | Non-existent email | Login with email not in database | Returns 401 with `"Invalid email or password."` (no user enumeration) |
| B4 | Empty email | Login with empty email | Returns 400 validation error |
| B5 | Empty password | Login with empty password | Returns 400 validation error |

### 3.3 Token Handling

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| C1 | Valid token access | GET `/api/auth/me` with valid Bearer token | Returns 200 with user data |
| C2 | Missing token | GET `/api/auth/me` with no Authorization header | Returns 401 with `"Authentication required"` |
| C3 | Expired token | Use an expired JWT token | Returns 403 with `"Invalid or expired token."` |
| C4 | Malformed token | Use token `"abc.def.ghi"` (invalid JWT format) | Returns 403 with `"Invalid or expired token."` |
| C5 | Wrong signature | Token signed with different secret | Returns 403 with `"Invalid or expired token."` |
| C6 | Token for deleted user | Token referencing non-existent user | Returns 404 from `/me` endpoint |

### 3.4 Protected Routes

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| D1 | Workouts without auth | GET `/api/workouts` without token | Returns 401 |
| D2 | Exercises without auth | GET `/api/exercises` without token | Returns 401 |
| D3 | Sets without auth | POST `/api/sets` without token | Returns 401 |
| D4 | Dashboard without auth | GET `/api/dashboard` without token | Returns 401 |

---

## 4. Workout CRUD Tests

### 4.1 Create Workout

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| E1 | Create empty workout | POST `/api/workouts` with just date | Returns 201 with created workout |
| E2 | Create workout with notes | POST `/api/workouts` with `{notes: "Leg day"}` | Notes field populated |
| E3 | Create with plan_id | POST with valid `plan_id` | plan_id linked |
| E4 | Create with invalid plan_id | POST with non-existent `plan_id` | Succeeds (FK=SET NULL — verify behavior) |
| E5 | Notes too long | Notes > 1000 characters | Returns 400 validation error |

### 4.2 List Workouts

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| F1 | Empty workout list | User with no workouts | Returns 200 with empty `workouts` array |
| F2 | List with data | User with 3 workouts | Returns 200 with array of 3 workouts |
| F3 | Default pagination | GET `/api/workouts` | Returns up to 20 workouts |
| F4 | Custom limit | GET `/api/workouts?limit=5` | Returns up to 5 workouts |
| F5 | Pagination offset | GET `/api/workouts?limit=2&offset=2` | Returns records 3-4 |
| F6 | Max limit cap | GET `/api/workouts?limit=999` | Capped at 100 |
| F7 | Negative limit | GET `/api/workouts?limit=-5` | Clamped to minimum 1 |
| F8 | User data isolation | User A cannot access User B's workouts | Each user sees only own data |
| F9 | Ordering | Sorted by date DESC, then created_at DESC | Newest first |

### 4.3 Get Single Workout

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| G1 | Get existing workout | GET `/api/workouts/:id` for valid workout | Returns workout with exercises and sets |
| G2 | Get non-existent workout | GET with random UUID | Returns 404 |
| G3 | Wrong user's workout | User A requests User B's workout | Returns 404 (scoped to user) |
| G4 | Workout with no exercises | Workout with no exercises added | Returns empty `exercises` array |
| G5 | Full workout with multiple exercises | 4 exercises, 3 sets each | All nested data correct |

### 4.4 Update Workout

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| H1 | Update notes | PUT with `{notes: "Updated"}` | Notes updated |
| H2 | Complete workout | PUT with `{completed: true}` | completed set to true/1 |
| H3 | Clear notes | PUT with `{notes: null}` | Notes set to null |
| H4 | Non-existent workout | PUT with random UUID | Returns 404 |
| H5 | Another user's workout | User B updates User A's workout | Returns 404 |
| H6 | No fields to update | PUT with `{}` | Returns 400 |
| H7 | Invalid data type | PUT with `{completed: "yes"}` | Returns 400 validation error |

### 4.5 Delete Workout

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| I1 | Delete own workout | DELETE own workout | Returns 200 with `"Workout deleted."` |
| I2 | Non-existent workout | DELETE random UUID | Returns 404 |
| I3 | Another user's workout | User B deletes User A's | Returns 404 |
| I4 | Cascade delete | Verify exercises/sets also deleted | Related rows cascade-deleted |
| I5 | Double delete | Delete same workout twice | Second call returns 404 |

---

## 5. Exercise Library Tests

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| L1 | List all exercises | GET `/api/exercises` | Returns 12 seeded exercises |
| L2 | Filter by muscle group | `?muscle_group=Back` | Returns only Back exercises |
| L3 | Filter by category | `?category=Cardio` | Returns only Cardio exercises |
| L4 | Search by name | `?search=bench` | Matching exercises (case-insensitive) |
| L5 | Search by description | `?search=leg` | Exercises with "leg" in description |
| L6 | Combined filters | `?muscle_group=Back&category=Strength` | Intersection of filters |
| L7 | Non-matching filter | `?muscle_group=Nonexistent` | Empty array |
| L8 | Get muscle groups | GET `/api/exercises/muscle-groups` | `["Arms","Back","Cardio","Chest","Legs","Shoulders"]` |
| L9 | Get single exercise | GET `/api/exercises/ex-bench-press` | Returns bench press details |
| L10 | Non-existent exercise | GET `/api/exercises/nonexistent` | Returns 404 |
| L11 | Create custom exercise | POST valid data | Returns 201 |
| L12 | Duplicate exercise name | POST same name twice | Succeeds (no unique constraint on name) |
| L13 | Empty name | POST with empty name | Returns 400 |

---

## 6. Sets CRUD Tests

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| K1 | Create set | POST `/api/sets` with `{workout_exercise_id, set_number, reps, weight}` | Returns 201 |
| K2 | Create set with RPE | Include `rpe: 8.5` | RPE stored correctly |
| K3 | Create set without weight | Only reps (weight nullable) | Stored with null weight |
| K4 | Create set with completed flag | `completed: true` | Stored as 1 |
| K5 | Non-existent workout_exercise | Invalid `workout_exercise_id` | Returns 404 |
| K6 | Wrong user's workout_exercise | Set references another user's exercise | Returns 404 |
| K7 | List sets for exercise | GET `/api/sets/:workoutExerciseId` | Returns ordered sets |
| K8 | Empty set list | Exercise with no sets logged | Returns empty array |
| K9 | Update set | PUT `/api/sets/:id` with new reps | Updated |
| K10 | Update non-existent set | PUT random UUID | Returns 404 |
| K11 | Update another user's set | User B updates User A's set | Returns 404 |
| K12 | Delete set | DELETE `/api/sets/:id` | Returns 200 |
| K13 | Verify cascade | Delete workout_exercise containing sets | Sets cascade deleted |

---

## 7. Adaptive Plan Engine Tests (Phase 3)

*To be expanded when adaptive engine is implemented. High-level test areas:*

| # | Test Area | Description |
|---|-----------|-------------|
| M1 | Plan generation | AI generates workout plan based on user goals/experience |
| M2 | Progress-based adjustment | Plan updates when user logs progress |
| M3 | Deload weeks | Plan suggests deload after progressive overload period |
| M4 | Plan boundaries | Generated plan respects min/max sets, reps, frequency |
| M5 | User override | User can edit plan; auto-adjustments pause or merge |
| M6 | Premium gating | Adaptive plans require premium subscription |
| M7 | Input validation | Invalid inputs (negative reps, unrealistic weights) rejected |

---

## 8. Stripe Paywall Tests (Phase 4)

*To be expanded when Stripe integration is implemented. High-level test areas:*

| # | Test Area | Description |
|---|-----------|-------------|
| N1 | Checkout flow | User initiates subscription checkout |
| N2 | Monthly subscription | Subscribe to monthly plan; trial applied |
| N3 | Yearly subscription | Subscribe to yearly plan with discount |
| N4 | 7-day trial | New users receive 7-day trial; reflected in DB |
| N5 | Successful payment | Payment completes; status set to `active` |
| N6 | Failed payment | Payment fails; status set to `incomplete` or `past_due` |
| N7 | Cancellation | User cancels; status `canceled`; access until period end |
| N8 | Webhook handling | Stripe webhooks update subscription status correctly |
| N9 | Premium gating | Adaptive plans hidden for non-subscribers |
| N10 | Trial expiry | After trial, premium features locked; subscribe prompt shown |

---

## 9. Mobile-First Responsive Design Tests

### 9.1 Viewport Widths

| Breakpoint | Width | Devices |
|------------|-------|---------|
| Mobile S | 320px | iPhone SE, older Android |
| Mobile M/L | 375-425px | iPhone 12-15, Pixel 7 |
| Tablet | 768px | iPad Mini, iPad |
| Desktop | 1024px+ | Laptops, monitors |

### 9.2 Test Cases

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| O1 | Landing page at 375px | Render at mobile width | All elements visible; no horizontal scroll |
| O2 | Login at 320px | Render at smallest width | Form inputs full-width; button tappable |
| O3 | Signup at 425px | Mobile render | Fields stack vertically; no overlap |
| O4 | Dashboard at 375px | Workout list on mobile | Cards stack; action buttons accessible |
| O5 | Workout detail at 375px | Exercises listed on mobile | Sets scrollable; add-set button prominent |
| O6 | Tablet at 768px | Content at tablet width | Uses wider space; readable |
| O7 | Desktop at 1440px | Content at desktop width | Centered max-width container |
| O8 | Touch targets at 375px | All tappable elements | Minimum 44x44px (Apple HIG) |
| O9 | Number inputs on mobile | Input reps/weight | Numeric keyboard appears |
| O10 | Landscape at 375px | Rotate to landscape | No content cutoff; scroll works |
| O11 | Long content | Long notes or exercise names | Truncates/wraps gracefully |
| O12 | Font scaling | System font set to Large | Text doesn't overflow |
| O13 | Safe areas | iPhone notch/pill devices | Content respects safe-area-inset |

---

## 10. Edge Cases & Error Handling

### 10.1 Network & API Errors

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| P1 | Network failure | Disconnect during API call | User-friendly error; no blank screen |
| P2 | Server error (500) | Simulate backend crash | Frontend shows "Something went wrong" |
| P3 | Slow network (3G) | Throttle to 3G | Loading spinner/skeleton; timeout after reasonable period |
| P4 | Malformed JSON | Send garbage to API | Returns 400 parse error |

### 10.2 Form Validation

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| Q1 | Whitespace-only name | `"   "` | Trimmed; validation error |
| Q2 | Emoji/special chars | Name with Unicode | Accepted (UTF-8 safe) |
| Q3 | Extremely long input | 10,000 chars in notes | Truncated or rejected (max 1000) |
| Q4 | Negative values | Weight: -50 | Rejected |
| Q5 | Zero values | Reps: 0 | Accepted (valid warm-up set) |
| Q6 | Decimal precision | Weight: 123.456 | Stored with precision |
| Q7 | Double-click submit | Double-click form button | Only one request sent |

### 10.3 Empty States

| # | Page/Component | Expected Behavior |
|---|----------------|-------------------|
| R1 | Workout list (empty) | "No workouts yet. Start your first workout!" with CTA |
| R2 | Exercise library (no results) | "No exercises match your filter" with clear-filter |
| R3 | Workout detail (no exercises) | "Add exercises to this workout" prompt |
| R4 | Dashboard (no data) | "Complete your first workout to see progress" |
| R5 | Subscription (none) | "Upgrade to Premium" CTA with pricing |

### 10.4 Data Integrity

| # | Test Case | Expected Result |
|---|-----------|-----------------|
| S1 | Delete exercise used in workouts | FK cascade deletes related workout_exercises and sets |
| S2 | Delete plan with workouts | plan_id set to NULL (ON DELETE SET NULL) |
| S3 | User deletion | All user data cascade-deleted |
| S4 | Race condition (simultaneous PUT) | Last write wins; no corruption |
| S5 | UUID uniqueness | Each 32-char hex ID is unique |

---

## 11. Performance Expectations

| # | Metric | Threshold | Test Method |
|---|--------|-----------|-------------|
| T1 | Auth response time (p95) | < 500ms | 20 concurrent requests |
| T2 | List workouts (p95) | < 300ms | 50 workouts per user |
| T3 | Get workout detail (p95) | < 400ms | With nested exercises/sets |
| T4 | Initial page load (3G) | < 2s | Lighthouse audit |
| T5 | Subsequent load (3G) | < 1s | With caching |
| T6 | Time to Interactive | < 3s on 3G | Lighthouse |
| T7 | Bundle size | < 200kb gzipped | Bundle analyzer |
| T8 | API payload size | < 50kb | No unnecessary data |

---

## 12. Security Tests

| # | Test Case | Expected Result |
|---|-----------|-----------------|
| U1 | Password storage | bcrypt hash with 12 rounds |
| U2 | JWT not logged | No `console.log(token)` in code |
| U3 | CORS restricted | Unknown origins blocked |
| U4 | SQL injection | Parameterized queries prevent injection |
| U5 | Security headers | CSP, X-Frame-Options, etc. present |
| U6 | User data isolation | All queries filter by `user_id` |
| U7 | Secrets not in git | `.env` in `.gitignore` |

---

## 13. Rebranding Configuration Tests

| # | Config Field | Default | Test |
|---|-------------|---------|------|
| V1 | App name | `"Workout Tracker"` | Change and verify across all pages |
| V2 | App description | Short tagline | Change and verify meta tags |
| V3 | Primary color | Brand color (hex) | Change and verify UI |
| V4 | Logo text/URL | Logo config | Change and verify header |
| V5 | Monthly price | `$9.99` | Change and verify checkout + display |
| V6 | Yearly price | `$99.99` | Change and verify checkout + display |
| V7 | Trial duration | `7` days | Change and verify trial logic |
| V8 | Currency | `USD` | Change and verify pricing |
| V9 | Contact email | Support email | Change and verify pages |
| V10 | Domain URL | Production URL | Change and verify links/CORS |

---

## 14. Test Execution Strategy

### 14.1 Phase Breakdown

| Phase | What to Test | Priority |
|-------|-------------|----------|
| **Phase 1** (now) | Auth flow, Workout CRUD, Exercise library | **P0** — must pass |
| **Phase 2** | Adaptive plan engine (when implemented) | **P1** |
| **Phase 3** | Stripe paywall, subscriptions | **P0** — revenue-critical |
| **Phase 4** | Responsive design, polish, rebranding | **P1** |
| **Phase 5** | Full regression (all of above) | **P0** — zero bugs at launch |

### 14.2 Test Types
- **Unit tests:** Individual functions (validation, token gen, config parsing)
- **Integration tests:** API endpoints with real database
- **Component tests:** Frontend components (React Testing Library)
- **E2E tests:** Critical user journeys (Playwright with device emulation)
- **Manual QA:** Exploratory testing on mobile devices

### 14.3 Testing Cadence
- **Every PR:** Run unit + integration test suite (< 3 min)
- **Before merge to main:** Full test suite passes
- **Before launch:** Full regression + E2E + mobile QA pass

### 14.4 Bug Tracking
- Labels: `bug`, `P0`/`P1`/`P2`/`P3`, `area:auth`, `area:workouts`, `area:mobile`, etc.
- P0 = Blocker — launch-blocking; fix immediately
- P1 = Critical — major feature broken, no workaround
- P2 = Major — significant but not blocking
- P3 = Minor — cosmetic, nice-to-have

---

## 15. Bug Severity Classification

| Level | Label | Definition | Response |
|-------|-------|------------|----------|
| **P0** | Blocker | Complete feature broken, data loss, security flaw | Stop all work; fix immediately |
| **P1** | Critical | Major feature broken, no workaround | Fix before next release |
| **P2** | Major | Feature works but significant limitation | Fix before launch or document |
| **P3** | Minor | Cosmetic, edge case, minor UX annoyance | Fix if time allows |

---

## Appendix A: Test Data Samples

### Sample User
```json
{
  "email": "testuser@example.com",
  "password": "Password123!",
  "name": "Test User"
}
```

### Sample Workout
```json
{
  "date": "2026-07-03",
  "notes": "Push day - feeling strong"
}
```

### Sample Set
```json
{
  "workout_exercise_id": "<existing-we-id>",
  "set_number": 1,
  "reps": 10,
  "weight": 135,
  "completed": true
}
```

---

## Appendix B: Launch Readiness Checklist

- [ ] All P0 tests pass
- [ ] All P1 tests pass
- [ ] Mobile-responsive verified at 320px, 375px, 425px, 768px, 1024px+
- [ ] Auth flow complete (signup → login → protected access → logout → blocked)
- [ ] Workout CRUD complete (create → read → update → delete → verify)
- [ ] Exercise library functional (list, filter, search, create)
- [ ] Sets CRUD complete (create, read, update, delete, ownership verification)
- [ ] Stripe checkout + subscription working in test mode
- [ ] Premium gating enforced
- [ ] Adaptive plan generation works (if implemented)
- [ ] Privacy policy page accessible
- [ ] Account deletion works (cascade)
- [ ] Rebranding config changes applied across all pages
- [ ] 404 page and error states handled gracefully
- [ ] No console errors in production build
- [ ] Bundle size within limits
- [ ] README updated with setup instructions
- [ ] `.env.example` updated with all required variables

---

> **Document Status:** ✅ Completed  
> **Next Review:** After Phase 2 implementation (Workout CRUD frontend)