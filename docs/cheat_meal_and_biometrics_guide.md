# NutriSync Cheat Meal Tracker, AI Workout Recommender & Biometrics Architecture Guide
> **Sprint D, E, F Implementation Documentation (Project Proposal §6.1, §6.2, §6.6, §6.7, §6.8)**

This document details the database models, mathematical pacing algorithms, algorithmic routine recommender, biometrics trajectory engine, and REST API surface powering NutriSync's advanced sports science modules.

---

## 🏛️ 1. Database Schema & Relationships

```
┌─────────────────────────────────┐
│              users              │
│                                 │
├─────────────────────────────────┤
│ id: UUID (PK)                   │
│ email: VARCHAR (Unique)         │
│ ...                             │
└───────┬──────────────┬──────────┘
        │ 1            │ 1
        │              │
        │ *            │ *
┌───────▼─────────┐  ┌─▼──────────────────────┐
│  biometric_logs │  │    cheat_meal_logs     │
├─────────────────┤  ├────────────────────────┤
│ id: UUID (PK)   │  │ id: UUID (PK)          │
│ user_id: (FK)   │  │ user_id: UUID (FK)     │
│ weight_kg: FLOAT│  │ meal_name: VARCHAR     │
│ body_fat_pct    │  │ meal_slot: VARCHAR     │
│ waist_cm: FLOAT │  │ estimated_calories     │
│ chest_cm: FLOAT │  │ protein_g, carbs_g...  │
│ arms_cm: FLOAT  │  │ indulgence_type        │
│ logged_at: DATE │  │ logged_at: TIMESTAMP   │
└─────────────────┘  └───────────┬────────────┘
                                 │ 1
                                 │
                                 │ 0..1 (CASCADE)
                     ┌───────────▼────────────┐
                     │adaptive_rebalance_plans│
                     ├────────────────────────┤
                     │ id: UUID (PK)          │
                     │ cheat_meal_id: UUID(FK)│
                     │ user_id: UUID (FK)     │
                     │ surplus_calories: INT  │
                     │ rebalance_window_days  │
                     │ daily_calorie_deficit  │
                     │ daily_extra_burn_kcal  │
                     │ daily_step_target_add  │
                     │ status: VARCHAR        │
                     │ created_at: TIMESTAMP  │
                     └────────────────────────┘
```

---

## 🍔 2. Cheat Meal & Adaptive Calorie Balancer Engine (Proposal §6.6 & §6.7)

### Scientific Calorie Mitigation Algorithm:
When an athlete indulges in an off-plan meal, NutriSync calculates the net surplus relative to their scheduled meal slot allocation:

$$\text{Slot Allocation} = \begin{cases} 
0.25 \times \text{Daily Target} & \text{if Breakfast} \\
0.35 \times \text{Daily Target} & \text{if Lunch or Dinner} \\
0.15 \times \text{Daily Target} & \text{if Snack / Late Night} 
\end{cases}$$

$$\text{Surplus Calories} = \max\left(150, \text{Meal Calories} - \text{Slot Allocation}\right)$$

### Rebalance Window Pacing Strategies:
Athletes select a recovery window ($1$ to $3$ days):
1. **Hybrid Pacing (Recommended)**: Splits the surplus $50\%$ into a mild daily dietary deficit and $50\%$ into additional physical expenditure (steps + NEAT).
2. **Step Burn Focus**: Preserves $100\%$ of dietary food volume; compensates entirely via structured cardio ($1\text{ kcal} \approx 20\text{ steps}$).
3. **Dietary Buffer**: Offsets the surplus entirely across upcoming meal budgets without requiring additional workout volume.

### Glycogen Supercompensation Guidance:
The engine provides contextual sports science feedback:
- High-carb meals (pizza, sushi, pasta) trigger **glycogen replenishment** cues: recommend training heavy legs or back within $12\text{--}18$ hours to partition glucose into skeletal muscle.
- High-sodium/high-fat meals trigger hydration and potassium balance protocols ($3.5\text{--}4.0\text{ L}$ water intake) to alleviate temporary cellular water retention.

---

## 🏋️ 3. AI Workout Routine Recommendation Engine (Proposal §6.2)

### Algorithmic Daily Rotation:
The recommender inspects the athlete's last $5$ logged sessions in PostgreSQL:
- Evaluates recent muscle group volume distribution.
- Automatically selects the next optimal training split: **Push**, **Pull**, **Legs**, **Full Body**, or **Metabolic HIIT**.
- Prevents overtraining by enforcing a 48-hour recovery buffer on heavily taxed muscle groups.

### Goal-Calibrated Repetition & Rest Presets:
| User Goal | Target Reps | Sets | Rest Period | Focus Cue |
| :--- | :---: | :---: | :---: | :--- |
| **Hypertrophy** | 8 – 12 reps | 3 – 4 | 75s – 90s | Moderate tempo, 3-second eccentric contraction |
| **Fat Loss / Cut** | 12 – 15 reps | 3 | 45s – 60s | Short rest, elevated heart rate, superset pacing |
| **Strength / Power** | 3 – 6 reps | 4 – 5 | 120s – 180s | Explosive concentric drive, near-maximal loading |
| **Endurance** | 15 – 20 reps | 3 | 45s | High-density metabolic conditioning |

### Bodyweight-Proportional Starting Weight Formulas:
Starting weights are calculated dynamically from `UserProfile.weight_kg`:
- **Barbell Bench Press**: $\approx 0.65 \times \text{Bodyweight}$
- **Barbell Back Squat**: $\approx 0.85 \times \text{Bodyweight}$
- **Conventional Deadlift**: $\approx 1.05 \times \text{Bodyweight}$
- **Military Press**: $\approx 0.45 \times \text{Bodyweight}$
- **Dumbbell Rows / Curls**: $\approx 0.15\text{--}0.20 \times \text{Bodyweight}$

### Seamless Focus Mode Launch:
The recommendation payload can be launched directly into the active training tracker via:
`http://localhost:8443/workouts/active?routine=auto` or `?routine=push`.

---

## ⚖️ 4. Body Weight & Biometrics Trajectory Tracking (Proposal §6.8)

### PostgreSQL `biometric_logs` Engine:
- **Metrics Tracked**: `weight_kg`, `body_fat_pct`, `waist_cm`, `chest_cm`, `arms_cm`, `notes`, `logged_at`.
- **Live Metabolic Sync**: Whenever a weigh-in is logged via `POST /api/v1/progress/biometrics`, the backend automatically synchronizes `UserProfile.weight_kg`.
- **Instant TDEE & Macro Recalibration**: Mifflin-St Jeor BMR and macro blueprints update in real time without manual re-onboarding.
- **Interactive Trajectory Curves**:
  - Recharts `<LineChart>` visualizes historical weigh-ins against the athlete's target weight reference line (`<ReferenceLine y={target} />`).
  - Progress percentage computed:
  $$\text{Progress \%} = \min\left(100, \max\left(0, \frac{|\text{Starting Weight} - \text{Current Weight}|}{|\text{Starting Weight} - \text{Target Weight}|} \times 100\right)\right)$$

---

## 🎯 5. Goal & Quick Profile Calibration (Proposal §6.1)

### `PUT /api/v1/profile`
Allows athletes to adjust their fitness goals, target weight, activity tier, and dietary framework dynamically from the Dashboard without wiping historical training data.
- **Modifiable Fields**: `target_weight_kg`, `primary_goal`, `activity_level`, `dietary_preference`.
- **Immediate Feedback**: Updates live dashboard calorie targets, macro rings, and BMI delta instantly.
