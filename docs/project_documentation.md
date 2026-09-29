# NutriSync Project Documentation

Welcome to the NutriSync project documentation! This document serves as a plain-English guide to everything we have built so far, the technologies we used, why we chose them, and how all components communicate from end to end.

---

## 🏗️ Overall Architecture: The Monorepo

We organized the project into a **Monorepo** (Monolithic Repository). This means that both the frontend (what the user sees) and the backend (the logic and data engine) live in the same repository but remain decoupled, modular, and independently testable.

### Folder Structure:
```
NutriSync/
├── frontend/             # React 19 + TypeScript + Vite Client Application
│   ├── src/
│   │   ├── components/   # Reusable UI (StudioPanel, Logo, Icons)
│   │   ├── pages/        # Auth (Login, Register), Onboarding Wizard, Dashboard
│   │   ├── services/     # Axios API instance with automatic JWT interceptors
│   │   ├── App.tsx       # Router & ProtectedRoute route guards
│   │   └── index.css     # Luxury design system & styling rules
├── backend/              # FastAPI Python Backend Application
│   ├── app/
│   │   ├── api/          # Endpoints (/auth, /profile)
│   │   ├── core/         # Security, JWT tokens, password hashing
│   │   ├── db/           # SQLAlchemy engine & session factory
│   │   ├── models/       # Database tables (User, UserProfile)
│   │   ├── schemas/      # Pydantic request/response validation schemas
│   │   └── main.py       # FastAPI application entrypoint & CORS middleware
│   ├── alembic/          # Database schema migration scripts
│   └── requirements.txt  # Python package dependencies
├── docs/                 # Engineering guides & documentation
│   ├── project_documentation.md
│   ├── biometrics_and_onboarding_guide.md
│   └── why_docker.md
└── docker-compose.yml    # Containerized PostgreSQL service
```

---

## 🎨 Layer 1: The Frontend (React + TypeScript)
**Goal:** Deliver a luxury, responsive, high-performance interface with confident typography and smooth micro-animations.

### Technologies Used:
1. **React 19 & React DOM 19:** Modern component-based rendering library.
2. **Vite:** Next-generation frontend bundler providing instantaneous Hot Module Replacement (HMR) and optimized production builds.
3. **TypeScript 5.7:** Strict static type safety that prevents runtime regressions across API payloads.
4. **Tailwind CSS v4 & Custom Design Tokens:** Curated color palette (`#132720` Forest Green, `#cbed3e` Electric Lime, `#f7f8f2` Studio White) paired with modern typography (`Libre Baskerville`, `DM Mono`, `Manrope`).
5. **React Router DOM v7:** Client-side routing with navigation guards (`ProtectedRoute`) that dynamically enforce authentication and profile completion.
6. **Axios:** HTTP client equipped with automatic Bearer token request interceptors.

---

## 🧠 Layer 2: The Backend (FastAPI + Pydantic)
**Goal:** Provide an asynchronous, lightning-fast REST API with strict payload validation and automatic OpenAPI documentation.

### Technologies Used:
1. **FastAPI:** Python web framework with native async support and automatic OpenAPI `/docs` generation.
2. **Uvicorn:** ASGI web server driving high-throughput concurrent request handling.
3. **Pydantic v2:** Type-enforcing data validation schemas (`ProfileCreate`, `ProfileResponse`, `UserCreate`) featuring dynamic computed fields (e.g. real-time BMI and clinical classification).
4. **FastAPI Dependency Injection:** Modular `get_db` and `get_current_user` dependencies that extract and verify JWT tokens securely on protected endpoints.

---

## 🗄️ Layer 3: The Database (PostgreSQL + SQLAlchemy + Alembic)
**Goal:** Permanent, structured, transactional data storage with relational integrity and automatic schema migrations.

### Technologies Used:
1. **PostgreSQL 15 (Dockerized):** Containerized relational database running on mapped port `5433` with persistent volume storage (`postgres_data`).
2. **SQLAlchemy 2.0 ORM:** Translates Python object operations into optimized SQL queries. Implements 1-to-1 relationships between `User` and `UserProfile` with a `CASCADE` delete constraint.
3. **Alembic:** Database migration tool managing version-controlled database revisions (`101354aa9e1e`, `70edf587c2b8_add_profile`).

---

## 🔐 Layer 4: Cryptography & Security
**Goal:** Zero-knowledge password storage and stateless JWT session management.

### Technologies Used:
1. **Bcrypt & Passlib:** Scrambles passwords into salted hashes before saving to the database.
2. **JSON Web Tokens (JWT) via `python-jose`:** Issues cryptographically signed Bearer tokens upon authentication containing user identity claims (`sub`).

---

## 🚀 Sprints & Progress Summary

### ✅ Sprint 0: Architecture & Design System
- Setup the monorepo structure with decoupled `frontend/` and `backend/`.
- Built the initial luxury dark-forest aesthetic, animated orbital studio panels, and typography framework.

### ✅ Sprint 1: Database & Containerization
- Spun up PostgreSQL 15 via Docker Compose on port `5433`.
- Configured SQLAlchemy database connections and initial Alembic migrations.

### ✅ Sprint 2: Authentication Engine
- Built `/api/v1/auth/register` and `/api/v1/auth/login` endpoints.
- Implemented Bcrypt password hashing and JWT token issuance.
- Built the interactive member sign-in and registration pages in React.

### ✅ Sprint 3: Biometric Foundation & Models
- Created `UserProfile` SQLAlchemy model with `CASCADE` foreign key to `users`.
- Created Alembic migration `70edf587c2b8_add_profile.py` and upgraded head.
- Built Pydantic schemas with real-time computed BMI properties.
- Built `POST /api/v1/profile`, `GET /api/v1/profile/me`, and `GET /api/v1/profile/status`.
- Implemented `get_current_user` Bearer authentication dependency.

### ✅ Sprint 4: 4-Phase Luxury Onboarding Wizard & Telemetry Dashboard
- Split onboarding into 4 focused phases to eliminate cognitive overload:
  1. **Phase 01: Baseline Metrics** (Age, Gender, Height, Weight, live BMI meter).
  2. **Phase 02: Performance Ambitions** (Objective cards, Target weight, Trajectory delta pill).
  3. **Phase 03: Nutritional Fuel** (6 dietary frameworks with high-contrast badge tags).
  4. **Phase 04: Energy & Cadence** (Activity tiers, live AI Macro Blueprint teaser, final calibration).
- **Route Guarding**: Configured `/login` to query profile status and route users without profiles to `/onboarding`, and users with completed profiles to `/dashboard`.
- **Typographic & Layout Overhaul**: Vertically centered the content column to eliminate empty bottom space, enlarged headings (`40px Libre Baskerville`), increased card breathing room and contrast.
- **Athlete Telemetry Dashboard**: Built [`Dashboard.tsx`](../frontend/src/pages/Dashboard.tsx) displaying full physical baselines, BMI status, and calculated daily calories/macro targets.

### ✅ Sprint 5: Fitness Engine, Exercise Catalog & Workout Logger
- **Master Exercise Catalog**: Created `Exercise` SQLAlchemy model with `JSONB` for instructions & secondary muscles and PostgreSQL `Enum` for equipment/difficulty.
- **Workout Logging Engine**: Built `WorkoutLog` and `WorkoutExerciseLog` models with binary `JSONB` set tracking (`reps`, `weight_kg`, `completed`) and automatic volume tonnage calculation ($\sum \text{reps} \times \text{weight}$).
- **Database Seeding**: Created and executed `backend/app/db/seed_exercises.py` to seed 25 foundational compound & isolation movements across all major muscle groups.
- **REST Endpoints**:
  - `GET /api/v1/exercises`: Filter by muscle, equipment, category, difficulty, or search keyword.
  - `POST /api/v1/workouts`: Create detailed workout sessions.
  - `GET /api/v1/workouts`: Chronological workout history for authenticated athlete.
  - `GET /api/v1/workouts/{id}` & `DELETE /api/v1/workouts/{id}`: Detailed session retrieval and cascade cleanup.

### ✅ Sprint 6: Interactive Workout Tracker & Focus Mode HUD
- **Focus Mode HUD (`/workouts/active`)**: Full-screen, distraction-free active training interface.
- **Sticky Telemetry Header**: Real-time volume tonnage ($\sum \text{reps} \times \text{weight}$ in electric lime `#cbed3e`), running elapsed session timer (`HH:MM:SS`), set completion counter, and "End Session" action.
- **Blueprint Sidebar (30%) & Action Zone (70%)**: Interactive queue with scroll-to-card navigation, dynamic set rows, numeric rep/weight inputs, and lime-glowing set completion toggles.
- **Exercise Catalog Picker Modal**: Searchable/filterable modal across 8 muscle groups (*Chest, Back, Quads, Hamstrings, Shoulders, Arms, Core, Calves*).
- **Workout History Archive (`/workouts/history`)**: Chronological past workouts with expandable drill-down into sets, reps, tonnage, duration, and session deletion.
- **Dashboard CTA**: Added "+ Start Workout" nav button, "History" link, and "Launch Workout" card.

---

## ⚙️ Complete End-to-End User Flow

```
[1. User Visits App]
        │
        ├──> New Member: /register ──> Account Created ──> /onboarding (Phase 01)
        │
        └──> Existing Member: /login
                 │
                 ├──> Has Profile?  ──> YES ──> /dashboard
                 └──> Has Profile?  ──> NO  ──> /onboarding (Phase 01)

[2. 4-Phase Onboarding Calibration]
        │
        ├── Phase 01: Baseline Metrics (Age, Gender, Height, Weight ──> Real-time BMI)
        ├── Phase 02: Ambitions (Goal, Target Weight ──> Trajectory Delta)
        ├── Phase 03: Nutrition (Dietary Mode & Badges)
        └── Phase 04: Activity (Movement Tier ──> Live AI Macro & Caloric Projection)
        │
        └──> Click "Complete Calibration"
                 │
                 ├──> POST /api/v1/profile (Saved to PostgreSQL)
                 └──> Redirects to /dashboard

[3. Athlete Dashboard & Training Center]
        │
        ├── Active Physical Matrix (Age, Height, Weight, Target Weight)
        ├── BMI Reference & Classification
        ├── Trajectory Delta & Dietary Mode
        ├── Daily Macro Blueprint (Calories, Protein, Carbs, Fats)
        ├── Focus Mode Workout Tracker (/workouts/active)
        └── Workout History Archive (/workouts/history)
```

---

## 📖 Related Technical Guides
- [Current Implementation Status & Technical Guide](./current_implementation_status.md) — Comprehensive overview of the full system, architecture, formulas, and proposal alignment.
- [Biometrics & Onboarding Architecture Guide](./biometrics_and_onboarding_guide.md) — Mathematical formulas (BMI, Mifflin-St Jeor, TDEE, Macros), API contracts, and ER diagrams.
- [Fitness & Workout Engine Architecture Guide](./fitness_and_workout_engine_guide.md) — Exercise catalog, JSONB set logging, and workout API contracts.
- [Smart Grocery & Diet Planner Guide](./smart_grocery_and_diet_planner_guide.md) — Pantry engine, deficiency algorithm, and shopping list lifecycle.
- [Cheat Meal, AI Workout & Biometrics Guide](./cheat_meal_and_biometrics_guide.md) — Adaptive rebalancer, AI routine generator, and biometrics tracking engine.
- [Why Docker Guide](./why_docker.md) — Explaining containerized PostgreSQL and volume persistence.

### 🚀 Sprint 7: Progress Analytics, Telemetry Visualizations & Dashboard Overhaul (Proposal §6.8)
- **Historical Charting via Recharts**:
  - Integrated interactive Recharts visualizations: **Volume Progression Tonnage AreaChart**, **Weekly Workout Consistency BarChart** (with $4\text{ sessions/week}$ target baseline), and **Caloric Expenditure AreaChart**.
  - Engineered custom dark athletic tooltips (`CustomTooltip`) featuring session titles, timestamps, and metric units.
  - Implemented view switcher tabs, KPI summary cards (Total Volume Lifted, Total Sessions, Avg Session Intensity, Total Energy Burned), and an adaptive empty state with a direct CTA to launch training.
- **Backend Analytics API (`GET /api/v1/progress/stats`)**:
  - Aggregates user workouts into chronological volume curves, weekly ISO frequency distributions, and metabolic expenditure trends.
  - Automatic caloric expenditure computation & legacy database backfill based on session duration, volume tonnage, and athlete body weight.
- **Focus Mode Live Calorie HUD**:
  - Added live metabolic burn calculation to the active workout HUD (`EST. BURN: XX kcal`) and End Session modal, persisting energy expenditure to PostgreSQL.
- **Dashboard Usability & Aesthetics Overhaul**:
  - **Fixed Viewport Scroll Lock**: Removed legacy global `overflow: hidden` on `#root` and `html, body`, restoring natural, smooth scrolling.
  - **Screen Utilization**: Expanded dashboard workspace from cramped $1040\text{px}$ to $1360\text{px}$, eliminating excessive margins and the need to zoom out.
  - **Top Executive 4-Card HUD Ribbon**: Glanceable metrics for Daily Caloric Target, Weight Trajectory, BMI, and Cumulative Training Volume.
  - **Asymmetric 2-Column Architecture**: Left column for Macro Engine & Progress Charts; right column for Elevated Workout Launch CTA, Biometric Matrix, and an interactive **Color-Coded Visual BMI Gauge**.

### 🚀 Sprint 8: Smart Grocery-Based Diet Planner, Deficiency Detection & Shopping List (Proposal §6.3, §6.4, §6.5)
- **Zero-Waste Pantry Inventory Engine (`PantryItem` model & `/api/v1/diet/pantry`)**:
  - PostgreSQL persistent storage for athlete grocery reserves with automatic nutritional density resolution from a 31-item Master Grocery Catalog.
  - 1-Tap Quick-Add chips for standard athletic staples (Eggs, Chicken, Oats, Rice, Milk, Spinach, Greek Yogurt, Tuna, Paneer, Bananas, Olive Oil) and custom item modal with real-time macro estimation.
- **Nutritional Deficiency Detector (Proposal §6.4 & `/api/v1/diet/deficiency-analysis`)**:
  - Systematically benchmarks aggregate pantry reserves against the user's clinical Mifflin-St Jeor daily protein, energy, and micronutrient targets.
  - Flags explicit shortages: *"You are approximately 50g short of your daily protein target"* and alerts on missing leafy greens or healthy fats.
  - Suggests targeted, budget-conscious grocery additions with expected protein/caloric impact.
- **Pantry-Constrained Meal Plan Generator (Proposal §6.3 & `/api/v1/diet/generate-meal-plan`)**:
  - Generates full daily meal plans (Breakfast, Lunch, Dinner, Snack) using **only** groceries present in the pantry.
  - Displays preparation time, step-by-step instructions, macro pills, and 100% pantry match badges.
  - Features an "Unlock More Recipes" drawer suggesting 2-3 key ingredients to expand meal variety.
- **Smart Shopping List & Instant Transfer (Proposal §6.5 & `/api/v1/diet/shopping-list`)**:
  - Dynamic shopping checklist with 1-click addition from deficiency recommendations.
  - **"Transfer to Pantry"** action automatically marks items as purchased and moves them directly into active pantry inventory with auto-calculated nutrition.
- **Full Frontend Integration (`/diet` & `DietPlanner.tsx`)**:
  - Luxury studio UI with high-contrast editorial typography (`Libre Baskerville`, `DM Mono`, `Manrope`), 4-card HUD telemetry ribbon, interactive 1-click Essential Athlete Kit empty state, and 4 dedicated views (Pantry, Deficiency Analysis, Meal Plan, Shopping List).

### 🚀 Sprint 9: Cheat Meal Tracker & Adaptive Calorie Balancer (Proposal §6.6, §6.7)
- **Database Models (`CheatMealLog` & `AdaptiveRebalancePlan`)**:
  - Relational tracking of off-plan indulgences with computed meal slot surplus.
  - Adaptive recovery plans offering 3 scientific pacing strategies: Hybrid (50/50 deficit + burn), Step Burn (100% NEAT cardio compensation), and Diet Buffer (calorie reduction over 1–3 days).
- **Curated Indulgence Templates**:
  - 10 pre-calibrated popular cheat meals (Double Cheeseburger & Fries, Pepperoni Pizza, Loaded Burrito, Biryani Feast, Artisan Pancakes, etc.) for sub-second 1-tap logging.
- **Sports Science Glycogen Advice**:
  - Real-time guidance recommending heavy compound training within 12–18 hours of high-carb indulgences to partition glycogen into skeletal muscle rather than adipose tissue.
- **Frontend Dashboard (`/cheat-meals` & `CheatMealTracker.tsx`)**:
  - 4-card executive HUD, interactive template picker, active rebalance progress card, and calibrated indulgence history with plan completion toggles.

### 🚀 Sprint 10: AI Personalized Workout Routine Recommendation Engine (Proposal §6.2)
- **Algorithmic Routine Generator (`/api/v1/workouts/recommendations`)**:
  - 5 science-backed training splits: Push, Pull, Legs, Full Body, and Metabolic HIIT.
  - Automatic daily rotation inspecting the athlete's last 5 logged sessions to balance volume and enforce 48-hour recovery windows.
  - Goal-calibrated volume presets: Hypertrophy (8–12 reps, 75s rest), Fat Loss (12–15 reps, 45s rest), Strength (3–6 reps, 150s rest), Endurance (15–20 reps).
  - Bodyweight-proportional starting load calculation based on `UserProfile.weight_kg`.
- **Focus Mode Direct Integration**:
  - AI Routine Generator modal inside active workout interface with 1-click queue population.
  - URL query parameter auto-fill (`/workouts/active?routine=auto` or `?routine=push`).

### 🚀 Sprint 11: Body Weight & Biometrics Trajectory Tracking (Proposal §6.8)
- **PostgreSQL `biometric_logs` Engine (`/api/v1/progress/biometrics`)**:
  - Permanent weigh-in logs with body fat %, waist/chest/arm circumferences, and athlete notes.
  - Real-time auto-synchronization with `UserProfile.weight_kg` that immediately updates Mifflin-St Jeor daily calories and macro targets.
- **Progress Charts Weight Trajectory View**:
  - Recharts `<LineChart>` tracking historical weigh-ins against the athlete's target weight reference line.
  - Starting, current, target, and dynamic progress % KPIs with a visual progress bar.
  - Log Weigh-In modal with instant live dashboard synchronization.

### 🚀 Sprint 12: Goal & Biometrics Quick Calibration Engine (Proposal §6.1)
- **Profile Partial Updates (`PUT /api/v1/profile`)**:
  - Allows athletes to update target weight, primary goal, activity tier, and dietary framework dynamically.
- **Dashboard Quick Calibration Modal**:
  - Accessible via "✎ Edit" buttons on the Weight Trajectory and Biometric Matrix cards.
  - Immediate client recalculation of BMR, TDEE, macro rings, and BMI delta.


