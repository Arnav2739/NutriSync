import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { ProgressStatsResponse } from '../services/progress';
import { biometricsService, BiometricsProgressOverview, BiometricLogCreate } from '../services/biometrics';
import { Link } from 'react-router-dom';

interface ProgressChartsProps {
  stats: ProgressStatsResponse | null;
  loading: boolean;
  onWeightLogged?: (newWeight: number) => void;
}

type TabType = 'volume' | 'frequency' | 'calories' | 'biometrics';

// Custom dark athletic tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isWeight = payload[0].name === 'weight';
    return (
      <div style={{
        background: '#0d1a15',
        border: '1px solid rgba(203, 237, 62, 0.4)',
        borderRadius: '6px',
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        color: '#f1f7ee',
        fontFamily: 'DM Mono, monospace',
        fontSize: '12px',
      }}>
        <div style={{ color: '#8fa597', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label || data.date || data.week}
        </div>
        {data.title && (
          <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '6px', fontSize: '13px' }}>
            {data.title}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: payload[0].color || '#cbed3e' }} />
          <span style={{ color: '#cbed3e', fontWeight: 700, fontSize: '14px' }}>
            {payload[0].value.toLocaleString()} {isWeight ? 'kg' : payload[0].name === 'volume' ? 'kg' : payload[0].name === 'calories' ? 'kcal' : 'sessions'}
          </span>
        </div>
        {isWeight && data.target && (
          <div style={{ color: '#8fa597', marginTop: '4px', fontSize: '11px' }}>
            Goal Target: {data.target} kg
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function ProgressCharts({ stats, loading, onWeightLogged }: ProgressChartsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('volume');
  const [biometrics, setBiometrics] = useState<BiometricsProgressOverview | null>(null);
  const [bioLoading, setBioLoading] = useState<boolean>(true);

  // Modal states for logging weight
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [inputWeight, setInputWeight] = useState<string>('');
  const [inputBodyFat, setInputBodyFat] = useState<string>('');
  const [inputWaist, setInputWaist] = useState<string>('');
  const [inputChest, setInputChest] = useState<string>('');
  const [inputArms, setInputArms] = useState<string>('');
  const [inputNotes, setInputNotes] = useState<string>('');
  const [submittingBio, setSubmittingBio] = useState<boolean>(false);

  const fetchBiometrics = async () => {
    try {
      setBioLoading(true);
      const data = await biometricsService.getOverview();
      setBiometrics(data);
      if (data && inputWeight === '') {
        setInputWeight(String(data.current_weight_kg));
      }
    } catch (err) {
      console.error('Failed to load biometrics overview:', err);
    } finally {
      setBioLoading(false);
    }
  };

  useEffect(() => {
    fetchBiometrics();
  }, []);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wt = parseFloat(inputWeight);
    if (!wt || wt <= 20) return;

    setSubmittingBio(true);
    try {
      const payload: BiometricLogCreate = {
        weight_kg: wt,
        body_fat_pct: inputBodyFat ? parseFloat(inputBodyFat) : undefined,
        waist_cm: inputWaist ? parseFloat(inputWaist) : undefined,
        chest_cm: inputChest ? parseFloat(inputChest) : undefined,
        arms_cm: inputArms ? parseFloat(inputArms) : undefined,
        notes: inputNotes || undefined,
      };

      await biometricsService.logEntry(payload);
      await fetchBiometrics();
      if (onWeightLogged) {
        onWeightLogged(wt);
      }
      setShowLogModal(false);
      setInputNotes('');
    } catch (err) {
      console.error('Failed to log weigh-in:', err);
    } finally {
      setSubmittingBio(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this weigh-in entry?')) return;
    try {
      await biometricsService.deleteEntry(id);
      await fetchBiometrics();
    } catch (err) {
      console.error('Failed to delete weigh-in:', err);
    }
  };

  if (loading && bioLoading) {
    return (
      <div className="progress-card-shell">
        <div className="progress-loading">
          <div className="progress-spinner" />
          <span>Synchronizing progress telemetry...</span>
        </div>
      </div>
    );
  }

  const hasWorkoutData = stats && stats.summary.total_workouts > 0;

  return (
    <section className="dash-card progress-analytics-section">
      {/* Top Header & Telemetry Mode */}
      <div className="progress-header">
        <div className="progress-title-block">
          <div className="eyebrow" style={{ color: '#cbed3e' }}>
            <span style={{ background: '#cbed3e' }} /> TELEMETRY ANALYTICS
          </div>
          <h2>Performance & Biometric Analytics</h2>
          <p className="progress-subtitle">
            Historical progression curves, cumulative tonnage, metabolic expenditure, and body composition trajectories.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="progress-tabs">
          <button
            type="button"
            className={`progress-tab ${activeTab === 'volume' ? 'active' : ''}`}
            onClick={() => setActiveTab('volume')}
          >
            Volume Tonnage (kg)
          </button>
          <button
            type="button"
            className={`progress-tab ${activeTab === 'frequency' ? 'active' : ''}`}
            onClick={() => setActiveTab('frequency')}
          >
            Weekly Consistency
          </button>
          <button
            type="button"
            className={`progress-tab ${activeTab === 'calories' ? 'active' : ''}`}
            onClick={() => setActiveTab('calories')}
          >
            Caloric Expenditure
          </button>
          <button
            type="button"
            className={`progress-tab ${activeTab === 'biometrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('biometrics')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>⚖️</span> Weight Trajectory
          </button>
        </div>
      </div>

      {/* Summary KPI Badges (for workouts) */}
      {hasWorkoutData && activeTab !== 'biometrics' && (
        <div className="progress-kpi-grid">
          <div className="progress-kpi-box">
            <span className="kpi-label">TOTAL VOLUME LIFTED</span>
            <strong className="kpi-value">
              {stats.summary.total_volume_kg.toLocaleString()} <small>kg</small>
            </strong>
            <span className="kpi-sub">Cumulative load moved</span>
          </div>

          <div className="progress-kpi-box">
            <span className="kpi-label">COMPLETED SESSIONS</span>
            <strong className="kpi-value">
              {stats.summary.total_workouts} <small>sessions</small>
            </strong>
            <span className="kpi-sub">Full workout logs</span>
          </div>

          <div className="progress-kpi-box">
            <span className="kpi-label">AVG SESSION TONNAGE</span>
            <strong className="kpi-value">
              {stats.summary.avg_volume_per_session.toLocaleString()} <small>kg/session</small>
            </strong>
            <span className="kpi-sub">Mean workout intensity</span>
          </div>

          <div className="progress-kpi-box">
            <span className="kpi-label">METABOLIC EXPENDITURE</span>
            <strong className="kpi-value">
              {stats.summary.total_calories_burned.toLocaleString()} <small>kcal</small>
            </strong>
            <span className="kpi-sub">Estimated training burn</span>
          </div>
        </div>
      )}

      {/* Summary KPI Badges (for biometrics) */}
      {activeTab === 'biometrics' && biometrics && (
        <div className="progress-kpi-grid">
          <div className="progress-kpi-box">
            <span className="kpi-label">STARTING WEIGHT</span>
            <strong className="kpi-value">
              {biometrics.starting_weight_kg} <small>kg</small>
            </strong>
            <span className="kpi-sub">Baseline recorded</span>
          </div>

          <div className="progress-kpi-box">
            <span className="kpi-label">CURRENT WEIGHT</span>
            <strong className="kpi-value" style={{ color: '#cbed3e' }}>
              {biometrics.current_weight_kg} <small>kg</small>
            </strong>
            <span className="kpi-sub">
              {biometrics.weight_delta_kg > 0 ? `+${biometrics.weight_delta_kg}` : biometrics.weight_delta_kg} kg net change
            </span>
          </div>

          <div className="progress-kpi-box">
            <span className="kpi-label">TARGET GOAL</span>
            <strong className="kpi-value">
              {biometrics.target_weight_kg} <small>kg</small>
            </strong>
            <span className="kpi-sub">
              {Math.abs(biometrics.to_target_delta_kg)} kg {biometrics.to_target_delta_kg > 0 ? 'to shed' : 'to gain'}
            </span>
          </div>

          <div className="progress-kpi-box">
            <span className="kpi-label">GOAL PROGRESS</span>
            <strong className="kpi-value" style={{ color: '#5ae4aa' }}>
              {biometrics.progress_pct}%
            </strong>
            <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
              <div style={{ width: `${biometrics.progress_pct}%`, height: '100%', background: '#5ae4aa', borderRadius: 2 }} />
            </div>
          </div>
        </div>
      )}

      {/* Main Chart Body */}
      {activeTab !== 'biometrics' && !hasWorkoutData ? (
        <div className="progress-empty-state">
          <div className="empty-icon-wrap">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbed3e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <h3>Telemetry Pipeline Calibrating</h3>
          <p>
            No completed training sessions detected yet. Log and finalize your workouts in Focus Mode to populate real-time volume curves, weekly volume trends, and metabolic expenditure telemetry.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/workouts/active" className="progress-cta-btn">
              + Launch First Workout Session
            </Link>
            <button
              type="button"
              className="progress-cta-btn"
              style={{ background: 'transparent', border: '1px solid #cbed3e', color: '#cbed3e' }}
              onClick={() => setActiveTab('biometrics')}
            >
              ⚖️ View Weight Trajectory
            </button>
          </div>
        </div>
      ) : (
        <div key={activeTab} className="progress-chart-container chart-animated-view">
          {/* TAB 1: VOLUME TONNAGE */}
          {activeTab === 'volume' && hasWorkoutData && (
            <div className="chart-wrapper">
              <div className="chart-meta">
                <span className="chart-badge">SESSION TONNAGE TREND (KG)</span>
                <span className="chart-legend">
                  <span className="legend-dot" style={{ background: '#cbed3e' }} /> Tonnage Lifted
                </span>
              </div>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats!.volume_over_time}
                    margin={{ top: 20, right: 24, left: 0, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#cbed3e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#cbed3e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#71887b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                      fontFamily="DM Mono, monospace"
                    />
                    <YAxis
                      stroke="#71887b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val} kg`}
                      fontFamily="DM Mono, monospace"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      name="volume"
                      stroke="#cbed3e"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#volumeGrad)"
                      dot={{ r: 4, fill: '#cbed3e', stroke: '#132720', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#ffffff', stroke: '#cbed3e', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 2: FREQUENCY BAR CHART */}
          {activeTab === 'frequency' && hasWorkoutData && (
            <div className="chart-wrapper">
              <div className="chart-meta">
                <span className="chart-badge">WEEKLY WORKOUT CONSISTENCY (TARGET: 4 / WEEK)</span>
                <span className="chart-legend">
                  <span className="legend-dot" style={{ background: '#5ae4aa' }} /> Completed Workouts
                </span>
              </div>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats!.weekly_stats}
                    margin={{ top: 20, right: 24, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
                    <XAxis
                      dataKey="week"
                      stroke="#71887b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                      fontFamily="DM Mono, monospace"
                    />
                    <YAxis
                      stroke="#71887b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      fontFamily="DM Mono, monospace"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                      y={4}
                      stroke="#cbed3e"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{ value: 'Target: 4/wk', fill: '#cbed3e', fontSize: 10, position: 'right' }}
                    />
                    <Bar
                      dataKey="workouts"
                      name="workouts"
                      fill="#5ae4aa"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 3: CALORIC EXPENDITURE */}
          {activeTab === 'calories' && hasWorkoutData && (
            <div className="chart-wrapper">
              <div className="chart-meta">
                <span className="chart-badge">ENERGY EXPENDITURE (KCAL) PER WORKOUT</span>
                <span className="chart-legend">
                  <span className="legend-dot" style={{ background: '#f59e0b' }} /> Calories Burned
                </span>
              </div>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats!.calories_over_time}
                    margin={{ top: 20, right: 24, left: 0, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="calorieGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#71887b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                      fontFamily="DM Mono, monospace"
                    />
                    <YAxis
                      stroke="#71887b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val} kcal`}
                      fontFamily="DM Mono, monospace"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="calories"
                      name="calories"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#calorieGrad)"
                      dot={{ r: 4, fill: '#f59e0b', stroke: '#132720', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#ffffff', stroke: '#f59e0b', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 4: BIOMETRICS & WEIGHT TRAJECTORY */}
          {activeTab === 'biometrics' && (
            <div className="chart-wrapper">
              <div className="chart-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="chart-badge">WEIGHT TRAJECTORY VS GOAL TARGET</span>
                  <span className="chart-legend">
                    <span className="legend-dot" style={{ background: '#cbed3e' }} /> Measured Weight
                    <span className="legend-dot" style={{ background: '#fde68a', marginLeft: 12 }} /> Target Goal ({biometrics?.target_weight_kg} kg)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLogModal(true)}
                  style={{
                    background: '#cbed3e',
                    color: '#132720',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 14px',
                    font: '700 12px Manrope, sans-serif',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  + Log Weigh-In
                </button>
              </div>

              <div style={{ width: '100%', height: 320 }}>
                {biometrics && biometrics.trajectory_points.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={biometrics.trajectory_points}
                      margin={{ top: 20, right: 24, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#71887b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                        fontFamily="DM Mono, monospace"
                      />
                      <YAxis
                        stroke="#71887b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val} kg`}
                        fontFamily="DM Mono, monospace"
                        domain={['dataMin - 2', 'dataMax + 2']}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine
                        y={biometrics.target_weight_kg}
                        stroke="#fde68a"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{ value: `Goal: ${biometrics.target_weight_kg}kg`, fill: '#fde68a', fontSize: 10, position: 'right' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        name="weight"
                        stroke="#cbed3e"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#cbed3e', stroke: '#132720', strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: '#ffffff', stroke: '#cbed3e', strokeWidth: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8fa597' }}>
                    No weigh-in logs found. Click "+ Log Weigh-In" to record your weight today.
                  </div>
                )}
              </div>

              {/* Recent Weigh-In Log Archive */}
              {biometrics && biometrics.logs.length > 0 && (
                <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
                  <div style={{ font: '700 11px "DM Mono", monospace', color: '#cbed3e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                    RECENT WEIGH-IN LOGS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {biometrics.logs.slice(-5).reverse().map((log) => (
                      <div
                        key={log.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: 8,
                          padding: '10px 14px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <span style={{ font: '700 15px "DM Mono", monospace', color: '#cbed3e' }}>
                            {log.weight_kg} kg
                          </span>
                          {log.body_fat_pct && (
                            <span style={{ font: '11px "DM Mono", monospace', color: '#8fa597' }}>
                              BF: {log.body_fat_pct}%
                            </span>
                          )}
                          {log.waist_cm && (
                            <span style={{ font: '11px "DM Mono", monospace', color: '#8fa597' }}>
                              Waist: {log.waist_cm}cm
                            </span>
                          )}
                          {log.notes && (
                            <span style={{ font: '12px Manrope, sans-serif', color: '#b9ccbf', fontStyle: 'italic' }}>
                              "{log.notes}"
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ font: '11px "DM Mono", monospace', color: '#687d72' }}>
                            {new Date(log.logged_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteLog(log.id)}
                            style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, padding: '2px 6px' }}
                            title="Delete entry"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: LOG WEIGH-IN & BODY METRICS ── */}
      {showLogModal && (
        <div className="diet-modal-overlay">
          <div className="diet-modal-box" style={{ maxWidth: 480 }}>
            <div className="diet-modal-header">
              <h3 className="diet-modal-title">Log Today's Weigh-In</h3>
              <button onClick={() => setShowLogModal(false)} className="diet-modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="diet-form">
              <div className="diet-form-row">
                <div className="diet-field">
                  <label className="diet-label">Body Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="25"
                    max="300"
                    required
                    value={inputWeight}
                    onChange={(e) => setInputWeight(e.target.value)}
                    placeholder="e.g. 68.5"
                    className="diet-input"
                  />
                </div>
                <div className="diet-field">
                  <label className="diet-label">Body Fat % (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="60"
                    value={inputBodyFat}
                    onChange={(e) => setInputBodyFat(e.target.value)}
                    placeholder="e.g. 18.5"
                    className="diet-input"
                  />
                </div>
              </div>

              <div className="diet-form-row">
                <div className="diet-field">
                  <label className="diet-label">Waist Circumference (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="40"
                    max="200"
                    value={inputWaist}
                    onChange={(e) => setInputWaist(e.target.value)}
                    placeholder="e.g. 76.0"
                    className="diet-input"
                  />
                </div>
                <div className="diet-field">
                  <label className="diet-label">Chest (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="40"
                    max="200"
                    value={inputChest}
                    onChange={(e) => setInputChest(e.target.value)}
                    placeholder="e.g. 98.0"
                    className="diet-input"
                  />
                </div>
                <div className="diet-field">
                  <label className="diet-label">Arms (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="15"
                    max="70"
                    value={inputArms}
                    onChange={(e) => setInputArms(e.target.value)}
                    placeholder="e.g. 34.0"
                    className="diet-input"
                  />
                </div>
              </div>

              <div className="diet-field">
                <label className="diet-label">Notes (Optional)</label>
                <input
                  type="text"
                  value={inputNotes}
                  onChange={(e) => setInputNotes(e.target.value)}
                  placeholder="e.g. Morning fasted weigh-in, post leg day"
                  className="diet-input"
                />
              </div>

              <div className="diet-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="diet-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBio}
                  className="diet-btn-submit"
                >
                  {submittingBio ? 'Saving...' : '✓ Record Weigh-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}