# NutriSync Fitness Engine & Workout Architecture Guide

This document details the database models, JSONB set structures, master exercise catalog, and REST API endpoints powering the NutriSync Fitness & Workout Engine.

---

## 🏛️ Database Schema & Relationships

```
┌─────────────────────────┐         ┌─────────────────────────┐
│          users          │         │        exercises        │
│                         │         │  (Master 25+ Catalog)   │
├─────────────────────────┤         ├─────────────────────────┤
│ id: UUID (PK)           │         │ id: UUID (PK)           │
│ email: VARCHAR (Unique) │         │ name: VARCHAR (Unique)  │
│ ...                     │         │ category: VARCHAR       │
└───────────┬─────────────┘         │ primary_muscle: VARCHAR │
            │ 1                     │ secondary_muscles: JSONB│
            │                       │ equipment: ENUM         │
            │ * (CASCADE DELETE)    │ difficulty: ENUM        │
┌───────────▼─────────────┐         │ instructions: JSONB     │
│      workout_logs       │         │ gif_url: VARCHAR        │
├─────────────────────────┤         │ calories_per_min: FLOAT │
│ id: UUID (PK)           │         └───────────┬─────────────┘
│ user_id: UUID (FK)      │                     │ 1
│ title: VARCHAR          │                     │
│ routine_tag: VARCHAR    │                     │ *
│ started_at: TIMESTAMP   │         ┌───────────▼─────────────┐
│ completed_at: TIMESTAMP │ 1     * │  workout_exercise_logs  │
│ total_volume_kg: FLOAT  ├─────────┤                         │
│ calories_burned: FLOAT  │         ├─────────────────────────┤
│ notes: TEXT             │         │ id: UUID (PK)           │
│ status: ENUM            │         │ workout_log_id: UUID(FK)│
└─────────────────────────┘         │ exercise_id: UUID (FK)  │
                                    │ order_index: INTEGER    │
                                    │ sets_data: JSONB        │
                                    │ target_rest_sec: INTEGER│
                                    └─────────────────────────┘
```

### Key Architectural Highlights:
1. **JSONB Binary Set Storage**: Instead of requiring a separate, high-overhead 1,000,000+ row relational `sets` table, `sets_data` uses PostgreSQL `JSONB`. This allows high-throughput querying, schema flexibility for drop sets / supersets, and microsecond retrieval speed.
2. **Native Enums for Strict Integrity**:
   - `EquipmentEnum`: `Barbell`, `Dumbbell`, `Bodyweight`, `Cable`, `Machine`, `Kettlebell`, `Bands`, `None`.
   - `DifficultyEnum`: `Beginner`, `Intermediate`, `Advanced`.
   - `SessionStatusEnum`: `in_progress`, `completed`, `skipped`.
3. **Automated Volume Calculation**: If `total_volume_kg` is not explicitly provided, the backend computes the exact tonnage:

$$\text{Total Volume (kg)} = \sum_{i=1}^{N} \left( \text{Reps}_i \times \text{Weight}_i \right) \quad \text{for completed sets}$$

---

## 🗃️ Master Exercise Catalog

The database is seeded with a comprehensive foundational catalog (`backend/app/db/seed_exercises.py`):
- **Chest**: Barbell Bench Press, Incline Dumbbell Press, Cable Chest Flye, Push-Up.
- **Back**: Conventional Barbell Deadlift, Barbell Bent-Over Row, Pull-Up, Lat Pulldown, Face Pull.
- **Legs**: Barbell Back Squat, Romanian Deadlift (RDL), Bulgarian Split Squat, Leg Press, Lying Leg Curl, Standing Calf Raise.
- **Shoulders**: Overhead Barbell Military Press, Dumbbell Lateral Raise.
- **Arms**: Barbell Bicep Curl, Incline Dumbbell Curl, Tricep Rope Pushdown, Dips.
- **Core**: Hanging Knee / Leg Raise, Plank.
- **Cardio & Functional**: Kettlebell Swing, Jump Rope.

---

## 📡 API Reference & Endpoints

All endpoints are prefixed with `/api/v1`.

### 1. `GET /api/v1/exercises`
Query and filter the master exercise library.

**Query Parameters:**
- `primary_muscle` (optional): e.g. `Chest`, `Back`, `Quads`, `Hamstrings`, `Shoulders`, `Arms`, `Core`.
- `equipment` (optional): `Barbell`, `Dumbbell`, `Bodyweight`, `Cable`, `Machine`, `Kettlebell`, `Bands`, `None`.
- `category` (optional): `Strength`, `Hypertrophy`, `Cardio`, `Mobility`.
- `difficulty` (optional): `Beginner`, `Intermediate`, `Advanced`.
- `q` (optional): Full-text keyword search across exercise names.

**Sample Response (`200 OK`):**
```json
[
  {
    "id": "af0b8335-127b-4555-b4ac-415ac2b0d8fd",
    "name": "Barbell Bench Press",
    "category": "Strength",
    "primary_muscle": "Chest",
    "secondary_muscles": ["Triceps", "Anterior Deltoid"],
    "equipment": "Barbell",
    "difficulty": "Intermediate",
    "instructions": [
      "Lie flat on the bench with your eyes under the bar.",
      "Grip the bar slightly wider than shoulder-width with wrists straight.",
      "Unrack the bar and lower it with control to the mid-chest.",
      "Press the bar back up explosively until arms are extended."
    ],
    "gif_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800",
    "calories_per_minute_est": 6.5
  }
]
```

---

### 2. `POST /api/v1/workouts` (JWT Protected)
Log a completed or active workout session with nested exercise logs and set breakdowns.

**Headers:**
```http
Authorization: Bearer <jwt_access_token>
Content-Type: application/json
```

**Request Payload:**
```json
{
  "title": "Push Day — Upper Body Hypertrophy",
  "routine_tag": "Push",
  "calories_burned": 380.0,
  "notes": "Felt strong on bench press today. Increased weight on 3rd set.",
  "status": "completed",
  "exercise_logs": [
    {
      "exercise_id": "af0b8335-127b-4555-b4ac-415ac2b0d8fd",
      "order_index": 1,
      "target_rest_seconds": 90,
      "sets_data": [
        { "set_number": 1, "reps": 12, "weight_kg": 70.0, "completed": true },
        { "set_number": 2, "reps": 10, "weight_kg": 80.0, "completed": true },
        { "set_number": 3, "reps": 8,  "weight_kg": 85.0, "completed": true }
      ]
    }
  ]
}
```

**Response (`201 Created`):**
Returns the created `WorkoutLog` populated with calculated `total_volume_kg`, timestamps, and nested exercise details.

---

### 3. `GET /api/v1/workouts` (JWT Protected)
Retrieves the athlete's complete workout history ordered chronologically (`started_at DESC`).

### 4. `GET /api/v1/workouts/{workout_id}` (JWT Protected)
Retrieves detailed breakdown of a single workout session.

### 5. `DELETE /api/v1/workouts/{workout_id}` (JWT Protected)
Deletes the workout log and automatically cascades deletion to its associated exercise logs.

---

### 6. `GET /api/v1/workouts/recommendations/splits` (JWT Protected)
Retrieves the 5 available training splits supported by the recommendation engine:
- `auto`: Automated daily rotation based on recent muscle volume and workout history.
- `push`: Chest, Shoulders, Triceps hypertrophy and pressing strength.
- `pull`: Back, Biceps, Rear Deltoids pulling power and posture.
- `legs`: Quads, Hamstrings, Glutes, Calves lower-body foundational strength.
- `full_body`: Balanced compound movements across all major kinetic chains.
- `metabolic_hiit`: High-density conditioning with short rest intervals and elevated heart rate.

---

### 7. `GET /api/v1/workouts/recommendations` (JWT Protected)
Generates an AI personalized workout routine tailored to the athlete's primary fitness goal (`Hypertrophy`, `Fat Loss`, `Strength`, `Endurance`) and current body weight.

**Query Parameters:**
- `split` (optional, default: `auto`): Target training split (`auto`, `push`, `pull`, `legs`, `full_body`, `metabolic_hiit`).

**Key Recommendation Features:**
1. **Dynamic Set & Rep Pacing:**
   - Hypertrophy: 3–4 sets of 8–12 reps with 75s–90s rest.
   - Fat Loss / Cutting: 3 sets of 12–15 reps with 45s–60s rest.
   - Strength / Power: 4–5 sets of 3–6 reps with 120s–180s rest.
   - Endurance: 3 sets of 15–20 reps with 45s rest.
2. **Bodyweight-Proportional Starting Loads:**
   - Automatically computes recommended starting weight in kg based on user's calibrated weight.
3. **Coaching & Execution Cues:**
   - Dynamic movement cues (e.g. *"Explosive drive off floor; lock out hips cleanly"* or *"Slow 3-second eccentric stretch"*).
4. **Seamless Focus Mode Launch:**
   - Athlete can launch the recommendation directly into the active training tracker via `/workouts/active?routine=auto` or `?routine=push`.
