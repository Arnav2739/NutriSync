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
- **Athlete Telemetry Dashboard**: Built [`Dashboard.tsx`](file:///d:/MCA/NutriSync/frontend/src/pages/Dashboard.tsx) displaying full physical baselines, BMI status, and calculated daily calories/macro targets.

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
- [Current Implementation Status & Technical Guide](file:///d:/MCA/NutriSync/docs/current_implementation_status.md) — Comprehensive overview of the full system, architecture, formulas, and proposal alignment.
- [Biometrics & Onboarding Architecture Guide](file:///d:/MCA/NutriSync/docs/biometrics_and_onboarding_guide.md) — Mathematical formulas (BMI, Mifflin-St Jeor, TDEE, Macros), API contracts, and ER diagrams.
- [Fitness & Workout Engine Architecture Guide](file:///d:/MCA/NutriSync/docs/fitness_and_workout_engine_guide.md) — Exercise catalog, JSONB set logging, and workout API contracts.
- [Why Docker Guide](file:///d:/MCA/NutriSync/docs/why_docker.md) — Explaining containerized PostgreSQL and volume persistence.

### 🚀 Sprint 7: Progress Analytics, Telemetry Visualizations & Dashboard Overhaul (Proposal §6.8)
- **Historical Charting via Recharts**:
  - Integrated interactive Recharts visualizations: **Volume Progression Tonnage AreaChart**, **Weekly Workout Consistency BarChart** (with $4	ext{ sessions/week}$ target baseline), and **Caloric Expenditure AreaChart**.
  - Engineered custom dark athletic tooltips (`CustomTooltip`) featuring session titles, timestamps, and metric units.
  - Implemented view switcher tabs, KPI summary cards (Total Volume Lifted, Total Sessions, Avg Session Intensity, Total Energy Burned), and an adaptive empty state with a direct CTA to launch training.
- **Backend Analytics API (`GET /api/v1/progress/stats`)**:
  - Aggregates user workouts into chronological volume curves, weekly ISO frequency distributions, and metabolic expenditure trends.
  - Automatic caloric expenditure computation & legacy database backfill based on session duration, volume tonnage, and athlete body weight.
- **Focus Mode Live Calorie HUD**:
  - Added live metabolic burn calculation to the active workout HUD (`EST. BURN: XX kcal`) and End Session modal, persisting energy expenditure to PostgreSQL.
- **Dashboard Usability & Aesthetics Overhaul**:
  - **Fixed Viewport Scroll Lock**: Removed legacy global `overflow: hidden` on `#root` and `html, body`, restoring natural, smooth scrolling.
  - **Screen Utilization**: Expanded dashboard workspace from cramped $1040	ext{px}$ to $1360	ext{px}$, eliminating excessive margins and the need to zoom out.
  - **Top Executive 4-Card HUD Ribbon**: Glanceable metrics for Daily Caloric Target, Weight Trajectory, BMI, and Cumulative Training Volume.
  - **Asymmetric 2-Column Architecture**: Left column for Macro Engine & Progress Charts; right column for Elevated Workout Launch CTA, Biometric Matrix, and an interactive **Color-Coded Visual BMI Gauge**.
