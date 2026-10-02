import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';
import { SparklesIcon } from '../components/icons';
import ProgressCharts from '../components/ProgressCharts';
import { fetchProgressStats, ProgressStatsResponse } from '../services/progress';
import { biometricsService } from '../services/biometrics';

interface UserProfileData {
  id: string;
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  target_weight_kg: number;
  dietary_preference: string;
  primary_goal?: string;
  activity_level?: string;
  bmi?: number;
  bmi_category?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [progressStats, setProgressStats] = useState<ProgressStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [progressLoading, setProgressLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Goal & Biometrics Quick Calibration Modal 
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [editGoal, setEditGoal] = useState<string>('');
  const [editTargetWeight, setEditTargetWeight] = useState<string>('');
  const [editActivity, setEditActivity] = useState<string>('');
  const [editDiet, setEditDiet] = useState<string>('');
  const [savingGoal, setSavingGoal] = useState<boolean>(false);
  const [activeModuleTab, setActiveModuleTab] = useState<'diet' | 'cheat'>('diet');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const [profileRes, statsRes] = await Promise.allSettled([
          api.get('/profile/me'),
          fetchProgressStats(),
        ]);

        if (profileRes.status === 'fulfilled') {
          setProfile(profileRes.value.data);
        } else {
          const err: any = profileRes.reason;
          if (err.response?.status === 404) {
            navigate('/onboarding');
            return;
          } else if (err.response?.status === 401) {
            localStorage.removeItem('access_token');
            navigate('/login');
            return;
          } else {
            setError('Failed to fetch your biometric profile.');
          }
        }

        if (statsRes.status === 'fulfilled') {
          setProgressStats(statsRes.value);
        }
      } catch (err: any) {
        console.error('Failed to load dashboard telemetry:', err);
      } finally {
        setLoading(false);
        setProgressLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const openGoalModal = () => {
    if (profile) {
      setEditGoal(profile.primary_goal || 'Muscle Hypertrophy');
      setEditTargetWeight(String(profile.target_weight_kg));
      setEditActivity(profile.activity_level || 'Moderately Active');
      setEditDiet(profile.dietary_preference || 'High-Protein Athlete');
      setShowGoalModal(true);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingGoal(true);
    try {
      const updated = await biometricsService.updateProfile({
        primary_goal: editGoal,
        target_weight_kg: parseFloat(editTargetWeight) || profile.target_weight_kg,
        activity_level: editActivity,
        dietary_preference: editDiet,
      });
      setProfile(prev => prev ? { ...prev, ...updated } : null);
      setShowGoalModal(false);
    } catch (err) {
      console.error('Failed to update profile ambitions:', err);
    } finally {
      setSavingGoal(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Logo />
        <p>SYNCHRONIZING TELEMETRY PIPELINE...</p>
      </div>
    );
  }

  // Energy & Macronutrient calculation
  const bmr = profile
    ? Math.round(
        10 * profile.weight_kg +
          6.25 * profile.height_cm -
          5 * profile.age +
          (profile.gender === 'Male' ? 5 : profile.gender === 'Female' ? -161 : -78)
      )
    : 0;

  const multiplierMap: Record<string, number> = {
    'Sedentary': 1.2,
    'Lightly Active': 1.375,
    'Moderately Active': 1.55,
    'Very Active': 1.725,
    'Extra Active': 1.9,
  };

  const mult = (profile?.activity_level && multiplierMap[profile.activity_level]) || 1.55;
  const tdee = Math.round(bmr * mult);
  let targetCals = tdee;
  if (profile?.primary_goal === 'Build strength') targetCals += 250;
  if (profile?.primary_goal === 'Lose weight') targetCals -= 450;

  const protein = profile ? Math.round(profile.weight_kg * 2.0) : 0;
  const fats = Math.round((targetCals * 0.25) / 9);
  const carbs = Math.max(50, Math.round((targetCals - (protein * 4 + fats * 9)) / 4));

  const weightDelta = profile ? profile.target_weight_kg - profile.weight_kg : 0;

  return (
    <div className="dashboard-shell">
      {/* Navigation Header */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <Logo />
          <span className="nav-edition">ATHLETE DASHBOARD &bull; 01</span>
          <span className="nav-live-indicator">
            <span className="live-dot" /> LIVE SYNC
          </span>
        </div>
        <div className="nav-actions">
          <Link to="/diet" className="nav-link-btn" style={{ borderColor: 'rgba(203, 237, 62, 0.4)', color: '#cbed3e' }}>
            🥫 Pantry & Diet
          </Link>
          <Link to="/cheat-meals" className="nav-link-btn" style={{ borderColor: 'rgba(251, 191, 36, 0.4)', color: '#fbbf24' }}>
            🍕 Cheat Balancer
          </Link>
          <Link to="/workouts/active" className="nav-link-btn accent">
            + Start Workout
          </Link>
          <Link to="/workouts/history" className="nav-link-btn">
            History
          </Link>
          <Link to="/onboarding" className="nav-link-btn">
            Recalibrate
          </Link>
          <button type="button" onClick={handleLogout} className="logout-btn">
            Sign out
          </button>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        {/* Header Bar with Welcome & Status */}
        <header className="dashboard-welcome-bar">
          <div>
            <div className="eyebrow"><span /> ACTIVE SYNC &bull; TELEMETRY MATRIX</div>
            <h1>System Overview</h1>
            <p className="intro">
              Biometric telemetry calibrated. Nutritional targets, metabolic baselines, and workout progression synchronized.
            </p>
          </div>
          <div className="welcome-actions">
            <Link to="/workouts/active" className="hero-cta-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M6.5 6.5h11M12 3v3M4 12h2m12 0h2M6.5 17.5h11M12 18v3M7 12a5 5 0 0110 0" />
              </svg>
              Launch Focus Mode
            </Link>
          </div>
        </header>

        {error && <p className="error-message">{error}</p>}

        {profile && (
          <>
            {/* Top 4-Metric HUD Ribbon */}
            <section className="dashboard-hud-ribbon motion-stagger-1">
              <div className="hud-card">
                <div className="hud-card-top">
                  <span className="hud-label">DAILY CALORIC TARGET</span>
                  <span className="hud-pill volt">ACTIVE</span>
                </div>
                <div className="hud-metric">
                  <strong>{targetCals.toLocaleString()}</strong> <small>kcal</small>
                </div>
                <div className="hud-sub">
                  BMR: {bmr} &bull; TDEE: {tdee} kcal
                </div>
              </div>

              <div className="hud-card">
                <div className="hud-card-top">
                  <span className="hud-label">WEIGHT TRAJECTORY</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className="hud-pill">
                      {weightDelta > 0 ? 'Surplus' : weightDelta < 0 ? 'Deficit' : 'Maintenance'}
                    </span>
                    <button
                      type="button"
                      onClick={openGoalModal}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 4,
                        color: '#cbed3e',
                        fontSize: 10,
                        padding: '1px 5px',
                        cursor: 'pointer',
                        fontFamily: 'DM Mono, monospace',
                      }}
                    >
                      ✎ Edit
                    </button>
                  </div>
                </div>
                <div className="hud-metric">
                  <strong>{profile.weight_kg}</strong> <small>kg</small>
                </div>
                <div className="hud-sub">
                  Target: {profile.target_weight_kg} kg ({weightDelta > 0 ? `+${weightDelta.toFixed(1)}kg` : weightDelta < 0 ? `${weightDelta.toFixed(1)}kg` : '0kg'})
                </div>
              </div>

              <div className="hud-card">
                <div className="hud-card-top">
                  <span className="hud-label">BODY MASS INDEX</span>
                  <span className="hud-pill green">{profile.bmi_category}</span>
                </div>
                <div className="hud-metric">
                  <strong>{profile.bmi}</strong> <small>BMI</small>
                </div>
                <div className="hud-sub">Healthy Reference: 18.5 – 24.9</div>
              </div>

              <div className="hud-card">
                <div className="hud-card-top">
                  <span className="hud-label">TRAINING VOLUME</span>
                  <span className="hud-pill volt">
                    {progressStats?.summary.total_workouts || 0} SESSIONS
                  </span>
                </div>
                <div className="hud-metric">
                  <strong>
                    {progressStats?.summary.total_volume_kg ? progressStats.summary.total_volume_kg.toLocaleString() : 0}
                  </strong>{' '}
                  <small>kg moved</small>
                </div>
                <div className="hud-sub">
                  Avg {progressStats?.summary.avg_volume_per_session || 0} kg / session
                </div>
              </div>
            </section>

            {/* Asymmetric 2-Column Balanced Layout */}
            <div className="dashboard-content-layout">
              {/* PRIMARY COLUMN (Left / 63%): Nutrition Engine & Progress Charts */}
              <div className="dashboard-primary-column">
                {/* 1. Daily AI Macro Target Card */}
                <section className="dash-card macro-engine-card motion-stagger-2">
                  <div className="card-top">
                    <span className="card-tag">
                      <SparklesIcon /> DAILY MACRONUTRIENT TARGETS
                    </span>
                    <span className="card-live-pill">LIVE ENGINE</span>
                  </div>
                  <div className="macro-dashboard-grid">
                    <div className="macro-hero-box">
                      <span>TARGET DAILY INTAKE</span>
                      <h2>{targetCals} <small>kcal</small></h2>
                      <p>BMR Baseline: {bmr} kcal &bull; TDEE: {tdee} kcal</p>
                    </div>
                    <div className="macro-splits">
                      <div className="macro-split-card protein">
                        <span>PROTEIN (HIGH DENSITY)</span>
                        <strong>{protein}g</strong>
                        <div className="macro-bar"><div style={{ width: '35%' }} /></div>
                      </div>
                      <div className="macro-split-card carbs">
                        <span>CARBOHYDRATES</span>
                        <strong>{carbs}g</strong>
                        <div className="macro-bar"><div style={{ width: '45%' }} /></div>
                      </div>
                      <div className="macro-split-card fats">
                        <span>HEALTHY FATS</span>
                        <strong>{fats}g</strong>
                        <div className="macro-bar"><div style={{ width: '20%' }} /></div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Progress Analytics & Performance Visualizations */}
                <div className="motion-stagger-3">
                  <ProgressCharts
                    stats={progressStats}
                    loading={progressLoading}
                    onWeightLogged={(newWt) => setProfile(prev => prev ? { ...prev, weight_kg: newWt } : null)}
                  />
                </div>
              </div>

              {/* SIDEBAR COLUMN (Right / 37%): Quick Launch + Nutrition Deck + Unified Biometric Matrix */}
              <aside className="dashboard-sidebar-column">
                {/* 1. Ready to Train / Quick Launch Card */}
                <section className="dash-card workout-action-card motion-stagger-2">
                  <div className="action-card-glow" />
                  <div className="action-card-top">
                    <span className="card-tag volt">
                      <span className="pulse-dot" /> FOCUS MODE HUD
                    </span>
                    <span className="card-badge-pill">25+ EXERCISES</span>
                  </div>
                  <h3>Ready to Train?</h3>
                  <p className="action-card-desc">
                    Log sets, reps &amp; weight in real time. Track volume tonnage curves with automatic rest timers.
                  </p>
                  <div className="action-card-buttons">
                    <Link to="/workouts/active?routine=auto" className="workout-cta-primary" style={{ background: '#cbed3e', color: '#132720' }}>
                      <span>✨</span> Start AI Recommended Routine &rarr;
                    </Link>
                    <Link to="/workouts/active" className="workout-cta-secondary">
                      Launch Custom Session
                    </Link>
                  </div>
                </section>

                {/* 2. Unified Nutrition & Metabolic Balance Deck */}
                <section className="dash-card nutrition-deck-card motion-stagger-3">
                  <div className="deck-header">
                    <div className="deck-nav-pills">
                      <button
                        type="button"
                        className={`deck-pill-btn ${activeModuleTab === 'diet' ? 'active diet' : ''}`}
                        onClick={() => setActiveModuleTab('diet')}
                      >
                        <span>🥫</span> Smart Pantry Diet
                      </button>
                      <button
                        type="button"
                        className={`deck-pill-btn ${activeModuleTab === 'cheat' ? 'active cheat' : ''}`}
                        onClick={() => setActiveModuleTab('cheat')}
                      >
                        <span>🍕</span> Cheat Balancer
                      </button>
                    </div>
                  </div>

                  <div key={activeModuleTab} className="nutrition-deck-content">
                    {activeModuleTab === 'diet' ? (
                      <div className="deck-pane diet-pane">
                        <div className="card-top">
                          <span className="card-tag volt">
                            <span className="pulse-dot" /> SMART DIET PLANNER
                          </span>
                          <span className="card-badge-pill" style={{ color: '#cbed3e', borderColor: '#cbed3e' }}>PANTRY-AWARE</span>
                        </div>
                        <h3 style={{ color: '#ffffff' }}>Zero-Waste Nutrition</h3>
                        <p className="action-card-desc">
                          Generate healthy athletic meals using <i>only</i> groceries on hand in your pantry. Detect nutritional protein gaps automatically.
                        </p>
                        <div className="action-card-buttons">
                          <Link to="/diet" className="workout-cta-primary" style={{ background: '#cbed3e', color: '#0c1914' }}>
                            <span>🥫</span> Open Diet Planner &rarr;
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="deck-pane cheat-pane">
                        <div className="card-top">
                          <span className="card-tag" style={{ color: '#fbbf24' }}>
                            <span className="pulse-dot" style={{ background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }} /> ADAPTIVE METABOLIC BALANCER
                          </span>
                          <span className="card-badge-pill" style={{ color: '#fbbf24', borderColor: '#fbbf24' }}>NON-PUNITIVE</span>
                        </div>
                        <h3 style={{ color: '#ffffff' }}>Cheat Meal Balancer</h3>
                        <p className="action-card-desc" style={{ color: '#d4cebe' }}>
                          Track off-plan meals guilt-free. Automatically distributes surplus calories across 2–4 days via safe buffers and steps.
                        </p>
                        <div className="action-card-buttons">
                          <Link to="/cheat-meals" className="workout-cta-primary" style={{ background: '#fbbf24', color: '#132720' }}>
                            <span>🍕</span> Manage Indulgence &rarr;
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* 3. Unified Biometric Matrix & Baseline */}
                <section className="dash-card baseline-card motion-stagger-4">
                  <div className="card-top">
                    <span className="card-tag">BIOMETRIC MATRIX</span>
                    <button
                      type="button"
                      onClick={openGoalModal}
                      className="recalibrate-btn"
                    >
                      ✎ Edit Targets
                    </button>
                  </div>
                  <h3>Physical Baseline &amp; Ambition</h3>
                  <div className="metrics-row">
                    <div className="metric-box">
                      <span>AGE</span>
                      <strong>{profile.age} <small>yrs</small></strong>
                    </div>
                    <div className="metric-box">
                      <span>HEIGHT</span>
                      <strong>{profile.height_cm} <small>cm</small></strong>
                    </div>
                    <div className="metric-box">
                      <span>WEIGHT</span>
                      <strong>{profile.weight_kg} <small>kg</small></strong>
                    </div>
                    <div className="metric-box">
                      <span>TARGET</span>
                      <strong>{profile.target_weight_kg} <small>kg</small></strong>
                    </div>
                  </div>

                  {/* High-Density Lifestyle Chips */}
                  <div className="lifestyle-chips-row">
                    <div className="lifestyle-chip">
                      <span className="chip-k">Primary Goal</span>
                      <span className="chip-v">{profile.primary_goal || 'Build Strength'}</span>
                    </div>
                    <div className="lifestyle-chip">
                      <span className="chip-k">Dietary Framework</span>
                      <span className="chip-v">{profile.dietary_preference}</span>
                    </div>
                    <div className="lifestyle-chip">
                      <span className="chip-k">Activity Tier</span>
                      <span className="chip-v">{profile.activity_level || 'Moderately Active'}</span>
                    </div>
                    <div className="lifestyle-chip delta">
                      <span className="chip-k">Weight Delta</span>
                      <span className="chip-v highlight">
                        {weightDelta > 0
                          ? `+${weightDelta.toFixed(1)} kg Gain`
                          : weightDelta < 0
                          ? `${weightDelta.toFixed(1)} kg Cut`
                          : '0.0 kg Maintenance'}
                      </span>
                    </div>
                  </div>

                  {/* BMI Readout & Visual Meter */}
                  <div className="dash-bmi-bar">
                    <div className="bmi-title-row">
                      <span>BODY MASS INDEX (BMI)</span>
                      <span className="bmi-tag">{profile.bmi_category}</span>
                    </div>
                    <div className="bmi-big-num">
                      <strong>{profile.bmi}</strong>
                      <span className="bmi-scale-note">Reference: 18.5 – 24.9</span>
                    </div>
                    {/* Visual Color-Coded BMI Gauge */}
                    <div className="bmi-gauge-track">
                      <div className="bmi-gauge-segment under" title="Underweight (<18.5)" />
                      <div className="bmi-gauge-segment normal" title="Normal (18.5-24.9)" />
                      <div className="bmi-gauge-segment over" title="Overweight (25-29.9)" />
                      <div className="bmi-gauge-segment obese" title="Obese (30+)" />
                      <div
                        className="bmi-gauge-pin"
                        style={{
                          left: `${Math.min(97, Math.max(3, (((profile.bmi || 22) - 15) / (35 - 15)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      {/* ── GOAL & BIOMETRIC CALIBRATION MODAL  ── */}
      {showGoalModal && (
        <div className="diet-modal-overlay">
          <div className="diet-modal-box" style={{ maxWidth: 500 }}>
            <div className="diet-modal-header">
              <div>
                <h3 className="diet-modal-title">Edit Goals &amp; Biometrics</h3>
                <span style={{ font: '11px "DM Mono", monospace', color: '#6a7e71', display: 'block', marginTop: 2 }}>
                  RECALIBRATE METABOLIC TARGETS
                </span>
              </div>
              <button onClick={() => setShowGoalModal(false)} className="diet-modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="diet-form">
              <div className="diet-field">
                <label className="diet-label">Primary Fitness Goal</label>
                <select
                  value={editGoal}
                  onChange={(e) => setEditGoal(e.target.value)}
                  className="diet-input"
                >
                  <option value="Muscle Hypertrophy">Muscle Hypertrophy (Lean Bulk)</option>
                  <option value="Lose Weight">Lose Weight (Fat Loss Deficit)</option>
                  <option value="Build Strength">Build Strength (Heavy Power)</option>
                  <option value="Athletic Endurance">Athletic Endurance &amp; Stamina</option>
                  <option value="Maintenance">Maintenance &amp; Longevity</option>
                </select>
              </div>

              <div className="diet-form-row">
                <div className="diet-field">
                  <label className="diet-label">Target Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="250"
                    required
                    value={editTargetWeight}
                    onChange={(e) => setEditTargetWeight(e.target.value)}
                    className="diet-input"
                  />
                </div>
                <div className="diet-field">
                  <label className="diet-label">Activity Level</label>
                  <select
                    value={editActivity}
                    onChange={(e) => setEditActivity(e.target.value)}
                    className="diet-input"
                  >
                    <option value="Sedentary">Sedentary (Desk Job)</option>
                    <option value="Lightly Active">Lightly Active (1-3 days/wk)</option>
                    <option value="Moderately Active">Moderately Active (3-5 days/wk)</option>
                    <option value="Very Active">Very Active (6-7 days/wk)</option>
                    <option value="Extra Active">Extra Active (2x/day / Labor)</option>
                  </select>
                </div>
              </div>

              <div className="diet-field">
                <label className="diet-label">Dietary Preference</label>
                <select
                  value={editDiet}
                  onChange={(e) => setEditDiet(e.target.value)}
                  className="diet-input"
                >
                  <option value="High-Protein Athlete">High-Protein Athlete</option>
                  <option value="Omnivore">Omnivore</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Pescatarian">Pescatarian</option>
                  <option value="Keto">Keto / Low-Carb</option>
                </select>
              </div>

              <div className="diet-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="diet-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGoal}
                  className="diet-btn-submit"
                >
                  {savingGoal ? 'Calibrating...' : '✓ Recalibrate Targets'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}