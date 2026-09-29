import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import {
  fetchCheatMealTemplates,
  fetchCheatMealOverview,
  fetchCheatMealsHistory,
  logCheatMeal,
  completeActiveRebalancePlan,
  deleteCheatMeal,
  CheatMealTemplate,
  CheatMealLog,
  AdaptiveRebalancePlan,
} from '../services/cheatMeal';

export default function CheatMealTracker() {
  const navigate = useNavigate();

  // State data
  const [templates, setTemplates] = useState<CheatMealTemplate[]>([]);
  const [history, setHistory] = useState<CheatMealLog[]>([]);
  const [activePlan, setActivePlan] = useState<AdaptiveRebalancePlan | null>(null);
  const [stats, setStats] = useState({ total_logged: 0, logged_month: 0, avg_cals: 0 });

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMsg, setActionMsg] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formMealType, setFormMealType] = useState<string>('Dinner');
  const [formCals, setFormCals] = useState<number>(850);
  const [formProtein, setFormProtein] = useState<number>(35);
  const [formCarbs, setFormCarbs] = useState<number>(90);
  const [formFats, setFormFats] = useState<number>(35);
  const [formNotes, setFormNotes] = useState<string>('');
  const [formFeeling, setFormFeeling] = useState<string>('Worth it 😋');
  const [formStrategy, setFormStrategy] = useState<string>('balanced');
  const [formDays, setFormDays] = useState<number>(3);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tplRes, ovRes, histRes] = await Promise.all([
        fetchCheatMealTemplates(),
        fetchCheatMealOverview(),
        fetchCheatMealsHistory(),
      ]);
      setTemplates(tplRes);
      setActivePlan(ovRes.current_active_plan || null);
      setStats({
        total_logged: ovRes.total_logged_all_time,
        logged_month: ovRes.logged_this_month,
        avg_cals: ovRes.avg_calories_per_meal,
      });
      setHistory(histRes);
    } catch (err: any) {
      console.error('Failed to load cheat meal telemetry:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 4500);
  };

  // Open modal pre-filled with template
  const handleSelectTemplate = (tpl: CheatMealTemplate) => {
    setFormName(tpl.name);
    setFormCals(tpl.calories);
    setFormProtein(tpl.protein_g);
    setFormCarbs(tpl.carbs_g);
    setFormFats(tpl.fats_g);
    setFormMealType('Dinner');
    setFormNotes(tpl.description);
    setFormFeeling('Worth it 😋');
    setFormStrategy('balanced');
    setFormDays(3);
    setShowModal(true);
  };

  // Open modal blank for custom
  const handleOpenCustom = () => {
    setFormName('');
    setFormCals(800);
    setFormProtein(30);
    setFormCarbs(85);
    setFormFats(35);
    setFormMealType('Dinner');
    setFormNotes('');
    setFormFeeling('Worth it 😋');
    setFormStrategy('balanced');
    setFormDays(3);
    setShowModal(true);
  };

  // Submit cheat meal log
  const handleSubmitMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setSubmitting(true);
    try {
      const created = await logCheatMeal({
        name: formName.trim(),
        meal_type: formMealType,
        estimated_calories: formCals,
        protein_g: formProtein,
        carbs_g: formCarbs,
        fats_g: formFats,
        notes: formNotes,
        feeling_tag: formFeeling,
        rebalance_strategy: formStrategy,
        rebalance_days: formDays,
      });

      setHistory((prev) => [created, ...prev]);
      if (created.active_plan) {
        setActivePlan(created.active_plan);
      }
      setStats((prev) => ({
        ...prev,
        total_logged: prev.total_logged + 1,
        logged_month: prev.logged_month + 1,
      }));

      setShowModal(false);
      showNotification(`Logged "${created.name}"! Adaptive rebalance plan activated.`);
    } catch (err) {
      console.error(err);
      showNotification('Failed to log cheat meal.');
    } finally {
      setSubmitting(false);
    }
  };

  // Mark plan completed
  const handleCompletePlan = async () => {
    if (!activePlan) return;
    try {
      await completeActiveRebalancePlan(activePlan.id);
      setActivePlan(null);
      showNotification('Adaptive rebalance plan completed! Trajectory restored.');
    } catch (err) {
      console.error(err);
      showNotification('Failed to complete plan.');
    }
  };

  // Delete cheat meal log
  const handleDeleteMeal = async (id: string) => {
    try {
      await deleteCheatMeal(id);
      setHistory((prev) => prev.filter((m) => m.id !== id));
      if (activePlan?.cheat_meal_log_id === id) {
        setActivePlan(null);
      }
      setStats((prev) => ({
        ...prev,
        total_logged: Math.max(0, prev.total_logged - 1),
      }));
      showNotification('Cheat meal log removed.');
    } catch (err) {
      console.error(err);
    }
  };

  const categories = ['All', 'Fast Food', 'Italian', 'South Asian', 'Mexican', 'Asian', 'Comfort Food', 'Dessert', 'Bakery', 'Japanese'];

  const filteredTemplates = templates.filter((tpl) => {
    if (categoryFilter === 'All') return true;
    return tpl.category.toLowerCase() === categoryFilter.toLowerCase();
  });

  const feelings = ['Worth it 😋', 'Social event 🥂', 'Cravings satisfied 🍕', 'High energy ⚡', 'Cheat weekend 🎉'];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Logo />
        <div className="loading-spinner" />
        <p>SYNCHRONIZING ADAPTIVE METABOLIC BALANCER...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      {/* Toast Notification */}
      {actionMsg && (
        <div className="diet-toast">
          <span>⚡</span>
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Navigation Header */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <Logo />
          <span className="nav-edition">ADAPTIVE METABOLIC BALANCER &bull; §6.6 &amp; §6.7</span>
          <span className="nav-live-indicator">
            <span className="live-dot" /> NON-PUNITIVE
          </span>
        </div>
        <div className="nav-actions">
          <Link to="/dashboard" className="nav-link-btn">
            &larr; Dashboard
          </Link>
          <Link to="/diet" className="nav-link-btn">
            🥫 Pantry &amp; Diet
          </Link>
          <Link to="/workouts/active" className="nav-link-btn accent">
            Focus HUD ⚡
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <main className="dashboard-main">
        {/* Header Bar */}
        <header className="dashboard-welcome-bar">
          <div>
            <div className="eyebrow">
              <span /> PROPOSAL &sect;6.6 &amp; &sect;6.7 &bull; ADAPTIVE CALORIC REBALANCER
            </div>
            <h1>Cheat Meal Tracker &amp; Adaptive Balancer</h1>
            <p className="intro">
              Log off-plan and social indulgence meals guilt-free. NutriSync calculates your net surplus and smoothly
              redistributes it over 2–4 days via safe dietary buffers and gentle step targets—without severe starvation diets.
            </p>
          </div>
          <div className="welcome-actions">
            <button onClick={handleOpenCustom} className="hero-cta-btn">
              + Log Custom Meal
            </button>
          </div>
        </header>

        {/* Top HUD Telemetry Ribbon */}
        <div className="dashboard-hud-ribbon">
          <div className="hud-card">
            <div className="hud-card-top">
              <span className="hud-label">Logged Meals</span>
              <span className="hud-pill volt">LIFETIME</span>
            </div>
            <div className="hud-metric">
              <strong>{stats.total_logged}</strong>
              <small>meals</small>
            </div>
            <div className="hud-sub">All-time tracked indulgences</div>
          </div>

          <div className="hud-card">
            <div className="hud-card-top">
              <span className="hud-label">This Month</span>
              <span className="hud-pill green">CALENDAR</span>
            </div>
            <div className="hud-metric">
              <strong>{stats.logged_month}</strong>
              <small>this month</small>
            </div>
            <div className="hud-sub">Healthy athletic flexibility</div>
          </div>

          <div className="hud-card">
            <div className="hud-card-top">
              <span className="hud-label">Active Strategy</span>
              <span className={`hud-pill ${activePlan ? 'volt' : 'green'}`}>
                {activePlan ? 'ACTIVE' : 'IDLE'}
              </span>
            </div>
            <div className="hud-metric">
              <strong style={{ fontSize: 18, textTransform: 'capitalize' }}>
                {activePlan ? activePlan.strategy.replace('_', ' ') : 'Neutral'}
              </strong>
            </div>
            <div className="hud-sub">
              {activePlan ? `${activePlan.rebalance_days}-day recovery window` : 'No surplus to rebalance'}
            </div>
          </div>

          <div className="hud-card">
            <div className="hud-card-top">
              <span className="hud-label">Daily Offset</span>
              <span className="hud-pill volt">TARGET</span>
            </div>
            <div className="hud-metric">
              <strong>
                {activePlan ? `${Math.round(activePlan.daily_calorie_offset)}` : '0'}
              </strong>
              <small>kcal/day</small>
            </div>
            <div className="hud-sub">
              {activePlan ? `+${activePlan.daily_extra_steps.toLocaleString()} daily steps` : 'On standard metabolic target'}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ACTIVE ADAPTIVE REBALANCE BANNER (Proposal §6.7)                         */}
        {/* ========================================================================= */}
        {activePlan ? (
          <div className="rebalance-active-banner">
            <div className="rebalance-banner-top">
              <div>
                <span className="rebalance-banner-badge">
                  <span>●</span> Active Adaptive Rebalance Plan in Progress
                </span>
                <h3 className="rebalance-banner-h">
                  Rebalancing: {activePlan.meal_name} (+{Math.round(activePlan.surplus_calories)} kcal surplus)
                </h3>
                <p className="rebalance-banner-sub">
                  Target window: {activePlan.target_date_start} &rarr; {activePlan.target_date_end} ({activePlan.rebalance_days} Days)
                </p>
              </div>

              <button onClick={handleCompletePlan} className="rebalance-complete-btn">
                <span>✓</span>
                <span>Mark Rebalance Completed</span>
              </button>
            </div>

            {/* Target Breakdown Cards */}
            <div className="rebalance-targets-grid">
              <div className="rebalance-target-box">
                <span className="rebalance-target-lbl">Daily Meal Buffer</span>
                <span className="rebalance-target-val">
                  {Math.round(activePlan.daily_calorie_offset)} kcal / day
                </span>
                <span className="rebalance-target-sub">Slightly lighter portions or swap dressings</span>
              </div>

              <div className="rebalance-target-box">
                <span className="rebalance-target-lbl">Extra Daily Steps</span>
                <span className="rebalance-target-val">
                  +{activePlan.daily_extra_steps.toLocaleString()} steps / day
                </span>
                <span className="rebalance-target-sub">
                  ~{Math.round(activePlan.daily_extra_active_burn_kcal)} kcal extra non-exercise burn
                </span>
              </div>

              <div className="rebalance-target-box">
                <span className="rebalance-target-lbl">Net Surplus to Clear</span>
                <span className="rebalance-target-val">
                  +{Math.round(activePlan.surplus_calories)} kcal
                </span>
                <span className="rebalance-target-sub">100% neutralized over recovery window</span>
              </div>
            </div>

            {/* Sports Science Explanation */}
            {activePlan.explanation && (
              <div className="rebalance-explanation-box">
                <strong>Sports Science Rationale: </strong>
                {activePlan.explanation}
              </div>
            )}

            {/* Glycogen PR Tip */}
            {activePlan.glycogen_tip && (
              <div className="rebalance-glycogen-box">
                {activePlan.glycogen_tip}
              </div>
            )}
          </div>
        ) : (
          <div className="pantry-empty-card" style={{ padding: '32px 24px' }}>
            <div className="pantry-empty-icon">⚖️</div>
            <h3 className="pantry-empty-title">All Metabolic Baselines Fully Balanced</h3>
            <p className="pantry-empty-desc">
              You currently have no active caloric surpluses. Whenever you enjoy a feast, dinner party, or high-calorie meal,
              log it below to generate a gentle multi-day compensation protocol!
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* QUICK-LOG INDULGENCE STAPLES SHELF                                        */}
        {/* ========================================================================= */}
        <div className="cheat-shelf-box">
          <div className="cheat-shelf-header">
            <div className="cheat-shelf-title">
              <span>🍕</span>
              <span>1-Tap Popular Indulgence Templates</span>
            </div>
            <span className="staples-box-sub">
              Select an item to auto-populate calories, macros, and configure your rebalance window
            </span>
          </div>

          {/* Category Chips */}
          <div className="staples-cat-chips">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`staples-cat-btn ${categoryFilter === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid of Templates */}
          <div className="cheat-grid">
            {filteredTemplates.map((tpl) => (
              <div key={tpl.name} className="cheat-card">
                <div>
                  <div className="cheat-card-top">
                    <div className="cheat-icon-name">
                      <span className="cheat-card-icon">{tpl.icon}</span>
                      <div>
                        <h4 className="cheat-card-name">{tpl.name}</h4>
                        <span className="cheat-card-cat">{tpl.category}</span>
                      </div>
                    </div>
                  </div>

                  <p className="cheat-card-desc" style={{ marginTop: 10 }}>
                    {tpl.description}
                  </p>
                </div>

                <div>
                  {/* Macros breakdown */}
                  <div className="cheat-card-macros">
                    <div className="cheat-macro-item">
                      <span className="cheat-macro-lbl">Energy</span>
                      <span className="cheat-macro-val">{Math.round(tpl.calories)}<small style={{ fontSize: 9 }}>kcal</small></span>
                    </div>
                    <div className="cheat-macro-item">
                      <span className="cheat-macro-lbl">Protein</span>
                      <span className="cheat-macro-val" style={{ color: '#15803d' }}>{tpl.protein_g}g</span>
                    </div>
                    <div className="cheat-macro-item">
                      <span className="cheat-macro-lbl">Carbs</span>
                      <span className="cheat-macro-val" style={{ color: '#0284c7' }}>{tpl.carbs_g}g</span>
                    </div>
                    <div className="cheat-macro-item">
                      <span className="cheat-macro-lbl">Fats</span>
                      <span className="cheat-macro-val" style={{ color: '#d97706' }}>{tpl.fats_g}g</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectTemplate(tpl)}
                    className="cheat-log-btn"
                    style={{ width: '100%', marginTop: 12 }}
                  >
                    <span>+</span>
                    <span>Quick-Log This Meal</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LOGGED INDULGENCE MEALS ARCHIVE                                           */}
        {/* ========================================================================= */}
        <div className="cheat-shelf-box">
          <div className="cheat-shelf-header">
            <div className="cheat-shelf-title">
              <span>📜</span>
              <span>Recent Indulgence Meals History ({history.length})</span>
            </div>
            <span className="staples-box-sub">
              Your logged meals and emotional context
            </span>
          </div>

          {history.length === 0 ? (
            <div className="pantry-empty-card" style={{ padding: '28px 16px' }}>
              <p className="pantry-empty-desc">
                No indulgence meals logged yet. When you celebrate or dine out, track it here with zero guilt.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map((meal) => (
                <div key={meal.id} className="cheat-history-card">
                  <div className="cheat-history-left">
                    <div className="cheat-history-icon">🍽️</div>
                    <div>
                      <h4 className="cheat-history-title">{meal.name}</h4>
                      <div className="cheat-history-meta">
                        <span>{new Date(meal.consumed_at).toLocaleDateString()}</span>
                        <span>&bull;</span>
                        <span>{meal.meal_type}</span>
                        {meal.feeling_tag && (
                          <span className="cheat-feeling-badge">{meal.feeling_tag}</span>
                        )}
                        {meal.notes && (
                          <>
                            <span>&bull;</span>
                            <span style={{ fontStyle: 'italic', color: '#88998d' }}>"{meal.notes}"</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="cheat-history-right">
                    <div className="cheat-history-cals">
                      <span>{Math.round(meal.estimated_calories)} kcal</span>
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#6a7e71' }}>
                        {meal.protein_g}g P &bull; {meal.carbs_g}g C &bull; {meal.fats_g}g F
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="pantry-del-btn"
                      title="Remove record"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* LOG CHEAT MEAL & CONFIGURE REBALANCE MODAL                                */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="diet-modal-overlay">
          <div className="diet-modal-box" style={{ maxWidth: 520 }}>
            <div className="diet-modal-header">
              <h3 className="diet-modal-title">Log Indulgence Meal &amp; Calibrate</h3>
              <button onClick={() => setShowModal(false)} className="diet-modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitMeal} className="diet-form">
              {/* Name & Meal Type */}
              <div className="diet-field">
                <label className="diet-label">Meal / Food Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Double Bacon Cheeseburger, Wood-fired Pizza..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="diet-input"
                />
              </div>

              {/* Energy & Meal Slot (Clean 2-Column Row for Perfect Alignment) */}
              <div className="diet-form-row">
                <div className="diet-field">
                  <label className="diet-label">Estimated Energy (kcal)</label>
                  <input
                    type="number"
                    min="100"
                    step="any"
                    required
                    value={formCals}
                    onChange={(e) => setFormCals(parseFloat(e.target.value) || 0)}
                    className="diet-input"
                  />
                </div>
                <div className="diet-field">
                  <label className="diet-label">Meal Slot</label>
                  <select
                    value={formMealType}
                    onChange={(e) => setFormMealType(e.target.value)}
                    className="diet-input"
                  >
                    <option value="Dinner">Dinner</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Late Night">Late Night</option>
                    <option value="Snack">Snack</option>
                    <option value="Feast">Feast / Social Event</option>
                  </select>
                </div>
              </div>

              {/* Macros Breakdown (3 Equal Columns) */}
              <div className="diet-form-row">
                <div className="diet-field">
                  <label className="diet-label">Protein (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={formProtein}
                    onChange={(e) => setFormProtein(parseFloat(e.target.value) || 0)}
                    className="diet-input"
                  />
                </div>
                <div className="diet-field">
                  <label className="diet-label">Carbohydrates (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={formCarbs}
                    onChange={(e) => setFormCarbs(parseFloat(e.target.value) || 0)}
                    className="diet-input"
                  />
                </div>
                <div className="diet-field">
                  <label className="diet-label">Fats (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={formFats}
                    onChange={(e) => setFormFats(parseFloat(e.target.value) || 0)}
                    className="diet-input"
                  />
                </div>
              </div>

              {/* Strategy Selector (Proposal §6.7) */}
              <div className="diet-field">
                <label className="diet-label">Choose Adaptive Rebalance Strategy</label>
                <div className="strategy-picker">
                  <div
                    onClick={() => setFormStrategy('balanced')}
                    className={`strategy-option ${formStrategy === 'balanced' ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="strategy"
                      checked={formStrategy === 'balanced'}
                      onChange={() => setFormStrategy('balanced')}
                    />
                    <div>
                      <span className="strategy-title">
                        ⚖️ Hybrid Balanced (Recommended)
                      </span>
                      <p className="strategy-desc">
                        Combines a gentle daily food buffer (-100 kcal) with light extra walking (+2,000 steps). Zero hunger.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormStrategy('step_cardio')}
                    className={`strategy-option ${formStrategy === 'step_cardio' ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="strategy"
                      checked={formStrategy === 'step_cardio'}
                      onChange={() => setFormStrategy('step_cardio')}
                    />
                    <div>
                      <span className="strategy-title">
                        🏃 Step &amp; Cardio Burn Only
                      </span>
                      <p className="strategy-desc">
                        Eat 100% normal calories; clears the entire surplus exclusively via extra steps (+3,500 steps/day).
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormStrategy('diet_buffer')}
                    className={`strategy-option ${formStrategy === 'diet_buffer' ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="strategy"
                      checked={formStrategy === 'diet_buffer'}
                      onChange={() => setFormStrategy('diet_buffer')}
                    />
                    <div>
                      <span className="strategy-title">
                        🥗 Dietary Buffer Only
                      </span>
                      <p className="strategy-desc">
                        Reduces daily meal intake by ~180 kcal across the window without extra steps.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rebalance Window / Duration Selector */}
              <div className="diet-field">
                <label className="diet-label">Rebalance Window</label>
                <div className="window-segment-bar">
                  <button
                    type="button"
                    className={`window-segment-btn ${formDays === 2 ? 'active' : ''}`}
                    onClick={() => setFormDays(2)}
                  >
                    <span>⚡ 2 Days</span>
                    <span className="sub-text">Faster Pace</span>
                  </button>
                  <button
                    type="button"
                    className={`window-segment-btn ${formDays === 3 ? 'active' : ''}`}
                    onClick={() => setFormDays(3)}
                  >
                    <span>⭐ 3 Days</span>
                    <span className="sub-text">Optimal Balance</span>
                  </button>
                  <button
                    type="button"
                    className={`window-segment-btn ${formDays === 4 ? 'active' : ''}`}
                    onClick={() => setFormDays(4)}
                  >
                    <span>🌿 4 Days</span>
                    <span className="sub-text">Gentle / Mild</span>
                  </button>
                </div>
              </div>

              {/* Feeling Chips (Full Width) */}
              <div className="diet-field">
                <label className="diet-label">How Did You Feel?</label>
                <div className="feeling-chips">
                  {feelings.map((f) => (
                    <span
                      key={f}
                      onClick={() => setFormFeeling(f)}
                      className={`feeling-chip ${formFeeling === f ? 'active' : ''}`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="diet-field">
                <label className="diet-label">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Birthday dinner with family, post-workout reward..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="diet-input"
                />
              </div>

              <div className="diet-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="diet-btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="diet-btn-submit">
                  {submitting ? 'Calibrating...' : '⚡ Generate Rebalance Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
