import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { ProgressStatsResponse } from '../services/progress';
import { Link } from 'react-router-dom';

interface ProgressChartsProps {
  stats: ProgressStatsResponse | null;
  loading: boolean;
}

type TabType = 'volume' | 'frequency' | 'calories';

// Custom dark athletic tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
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
            {payload[0].value.toLocaleString()} {payload[0].name === 'volume' ? 'kg' : payload[0].name === 'calories' ? 'kcal' : 'sessions'}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function ProgressCharts({ stats, loading }: ProgressChartsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('volume');

  if (loading) {
    return (
      <div className="progress-card-shell">
        <div className="progress-loading">
          <div className="progress-spinner" />
          <span>Synchronizing progress telemetry...</span>
        </div>
      </div>
    );
  }

  const hasData = stats && stats.summary.total_workouts > 0;

  return (
    <section className="dash-card progress-analytics-section">
      {/* Top Header & Telemetry Mode */}
      <div className="progress-header">
        <div className="progress-title-block">
          <div className="eyebrow" style={{ color: '#cbed3e' }}>
            <span style={{ background: '#cbed3e' }} /> TELEMETRY ANALYTICS &bull; Â§6.8
          </div>
          <h2>Performance & Volume Analytics</h2>
          <p className="progress-subtitle">
            Historical progression curves, cumulative tonnage, and metabolic output over time.
          </p>
        </div>

        {/* View Switcher Tabs */}
        {hasData && (
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
          </div>
        )}
      </div>

      {/* Summary KPI Badges */}
      {hasData && (
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

      {/* Main Chart Body */}
      {!hasData ? (
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
          <Link to="/workouts/active" className="progress-cta-btn">
            + Launch First Workout Session
          </Link>
        </div>
      ) : (
        <div className="progress-chart-container">
          {/* TAB 1: VOLUME TONNAGE */}
          {activeTab === 'volume' && (
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
                    data={stats.volume_over_time}
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
                      tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}kg`}
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

          {/* TAB 2: WEEKLY FREQUENCY */}
          {activeTab === 'frequency' && (
            <div className="chart-wrapper">
              <div className="chart-meta">
                <span className="chart-badge">WEEKLY WORKOUT FREQUENCY & VOLUME</span>
                <span className="chart-legend">
                  <span className="legend-dot" style={{ background: '#5ae4aa' }} /> Completed Sessions
                  <span className="legend-line" style={{ background: '#cbed3e' }} /> Target Baseline (4/wk)
                </span>
              </div>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.weekly_stats}
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
          {activeTab === 'calories' && (
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
                    data={stats.calories_over_time}
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
        </div>
      )}
    </section>
  );
}