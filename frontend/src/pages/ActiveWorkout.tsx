import api from '../services/api';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  fetchExercises,
  submitWorkout,
  type Exercise,
  type SetDetail,
  type WorkoutExerciseLogCreate,
} from '../services/workout';
import {
  recommendationService,
  RecommendedRoutineResponse,
} from '../services/recommendation';

// ═══════════════════════════════════════════════════════════════
// Internal Types
// ═══════════════════════════════════════════════════════════════

interface ActiveExercise {
  exercise: Exercise;
  sets: SetDetail[];
  target_rest_seconds: number;
}

const DEFAULT_SETS: () => SetDetail[] = () => [
  { set_number: 1, reps: 0, weight_kg: 0, completed: false },
  { set_number: 2, reps: 0, weight_kg: 0, completed: false },
  { set_number: 3, reps: 0, weight_kg: 0, completed: false },
];

// Muscle group icons
const MUSCLE_ICONS: Record<string, string> = {
  Chest: '\u{1F4AA}',
  Back: '\u{1F9B4}',
  Quads: '\u{1F9B5}',
  Hamstrings: '\u{1F9B5}',
  Shoulders: '\u{1F3CB}',
  Arms: '\u{1F4AA}',
  Core: '\u{1F9D8}',
  Calves: '\u{1F9B6}',
};

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders', 'Arms', 'Core', 'Calves'];

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export default function ActiveWorkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Session state
  const [sessionTitle, setSessionTitle] = useState('Workout Session');
  const [routineTag, setRoutineTag] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<ActiveExercise[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');

  // AI Recommendation modal & preview state
  const [showRecModal, setShowRecModal] = useState<boolean>(false);
  const [recSplit, setRecSplit] = useState<string>('auto');
  const [previewRoutine, setPreviewRoutine] = useState<RecommendedRoutineResponse | null>(null);
  const [recLoading, setRecLoading] = useState<boolean>(false);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef(new Date());

  // Exercise picker modal
  const [pickerOpen, setPickerOpen] = useState(false);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // End session confirmation
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Card refs for scroll-into-view
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // ── Timer Effect ──
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // ── Live Volume Calculation ──
  const liveVolume = selectedExercises.reduce((total, ex) => {
    return total + ex.sets.reduce((exTotal, set) => {
      return exTotal + (set.completed ? set.reps * set.weight_kg : 0);
    }, 0);
  }, 0);

  const completedSetsCount = selectedExercises.reduce((total, ex) => {
    return total + ex.sets.filter(s => s.completed).length;
  }, 0);

  const totalSetsCount = selectedExercises.reduce((total, ex) => total + ex.sets.length, 0);

  // User weight for live caloric expenditure estimation
  const [userWeight, setUserWeight] = useState<number>(70);

  useEffect(() => {
    api.get('/profile/me').then(res => {
      if (res.data?.weight_kg) setUserWeight(Number(res.data.weight_kg));
    }).catch(() => {});
  }, []);

  // Live Caloric Expenditure Estimation
  const liveCalories = Math.max(
    completedSetsCount > 0 ? 15 : 0,
    Math.round(((elapsedSeconds / 60) * 5.5 * (userWeight / 70)) + (liveVolume * 0.04))
  );

  // ── Load Recommended Routine (Proposal §6.2) ──
  const loadRecommendedRoutine = useCallback(async (splitKey: string = 'auto') => {
    setRecLoading(true);
    try {
      const rec = await recommendationService.getRecommendation(splitKey);
      setSessionTitle(rec.routine_title);
      setRoutineTag(rec.split_category.toUpperCase());
      setSessionNotes(rec.coaching_summary);

      const activeList: ActiveExercise[] = rec.exercises.map(ex => ({
        exercise: {
          id: ex.exercise_id,
          name: ex.name,
          category: ex.category,
          primary_muscle: ex.primary_muscle,
          secondary_muscles: [],
          equipment: ex.equipment,
          difficulty: ex.difficulty,
          instructions: [ex.coaching_cue],
          gif_url: ex.gif_url || null,
          calories_per_minute_est: 6.0,
        },
        sets: Array.from({ length: ex.target_sets }, (_, i) => ({
          set_number: i + 1,
          reps: ex.target_reps,
          weight_kg: ex.suggested_weight_kg,
          completed: false,
        })),
        target_rest_seconds: ex.target_rest_seconds,
      }));

      setSelectedExercises(activeList);
      setShowRecModal(false);
    } catch (err) {
      console.error('Failed to load recommendation:', err);
    } finally {
      setRecLoading(false);
    }
  }, []);

  const fetchPreview = useCallback(async (splitKey: string) => {
    setRecLoading(true);
    try {
      const rec = await recommendationService.getRecommendation(splitKey);
      setPreviewRoutine(rec);
    } catch (err) {
      console.error('Failed to preview recommendation:', err);
    } finally {
      setRecLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showRecModal) {
      fetchPreview(recSplit);
    }
  }, [showRecModal, recSplit, fetchPreview]);

  // URL Query Param handler: /workouts/active?routine=push
  useEffect(() => {
    const routineParam = searchParams.get('routine');
    if (routineParam) {
      loadRecommendedRoutine(routineParam);
    }
  }, [searchParams, loadRecommendedRoutine]);

  // ── Load Exercise Catalog ──
  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (muscleFilter !== 'All') filters.primary_muscle = muscleFilter;
      if (searchQuery.trim()) filters.q = searchQuery.trim();
      const data = await fetchExercises(filters);
      setCatalog(data);
    } catch {
      setCatalog([]);
    } finally {
      setCatalogLoading(false);
    }
  }, [muscleFilter, searchQuery]);

  useEffect(() => {
    if (pickerOpen) loadCatalog();
  }, [pickerOpen, loadCatalog]);

  // ── Exercise Management ──
  const addExercise = (ex: Exercise) => {
    if (selectedExercises.some(s => s.exercise.id === ex.id)) return;
    setSelectedExercises(prev => [...prev, {
      exercise: ex,
      sets: DEFAULT_SETS(),
      target_rest_seconds: 90,
    }]);
    setPickerOpen(false);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index));
    if (activeCardIndex >= selectedExercises.length - 1 && activeCardIndex > 0) {
      setActiveCardIndex(activeCardIndex - 1);
    }
  };

  // ── Set Management ──
  const updateSet = (exIndex: number, setIndex: number, field: keyof SetDetail, value: number | boolean) => {
    setSelectedExercises(prev => {
      const next = [...prev];
      const ex = { ...next[exIndex] };
      const sets = [...ex.sets];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      ex.sets = sets;
      next[exIndex] = ex;
      return next;
    });
  };

  const addSet = (exIndex: number) => {
    setSelectedExercises(prev => {
      const next = [...prev];
      const ex = { ...next[exIndex] };
      ex.sets = [...ex.sets, {
        set_number: ex.sets.length + 1,
        reps: 0,
        weight_kg: 0,
        completed: false,
      }];
      next[exIndex] = ex;
      return next;
    });
  };

  const removeSet = (exIndex: number, setIndex: number) => {
    setSelectedExercises(prev => {
      const next = [...prev];
      const ex = { ...next[exIndex] };
      ex.sets = ex.sets.filter((_, i) => i !== setIndex).map((s, i) => ({ ...s, set_number: i + 1 }));
      next[exIndex] = ex;
      return next;
    });
  };

  // ── Scroll to card ──
  const scrollToCard = (index: number) => {
    setActiveCardIndex(index);
    cardRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Submit Workout ──
  const handleEndSession = async () => {
    if (selectedExercises.length === 0) return;
    setSubmitting(true);

    try {
      const exerciseLogs: WorkoutExerciseLogCreate[] = selectedExercises.map((ex, idx) => ({
        exercise_id: ex.exercise.id,
        order_index: idx + 1,
        sets_data: ex.sets.filter(s => s.reps > 0),
        target_rest_seconds: ex.target_rest_seconds,
      }));

      await submitWorkout({
        title: sessionTitle || 'Workout Session',
        routine_tag: routineTag || undefined,
        started_at: startTimeRef.current.toISOString(),
        completed_at: new Date().toISOString(),
        total_volume_kg: liveVolume,
        calories_burned: liveCalories,
        notes: sessionNotes || undefined,
        status: 'completed',
        exercise_logs: exerciseLogs,
      });

      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to submit workout:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="workout-shell">
      {/* ── TELEMETRY HEADER ── */}
      <header className="workout-header">
        <div className="wh-left">
          <button type="button" className="wh-back" onClick={() => navigate('/dashboard')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div className="wh-title-group">
            <input
              className="wh-title-input"
              value={sessionTitle}
              onChange={e => setSessionTitle(e.target.value)}
              placeholder="Session Title"
            />
            <input
              className="wh-tag-input"
              value={routineTag}
              onChange={e => setRoutineTag(e.target.value)}
              placeholder="Tag: Push / Pull / Legs"
            />
          </div>
        </div>

        <div className="wh-telemetry">
          <div className="wh-stat volume">
            <span>VOLUME</span>
            <strong>{liveVolume.toLocaleString()} <small>kg</small></strong>
          </div>
          <div className="wh-stat timer">
            <span>ELAPSED</span>
            <strong>{formatTime(elapsedSeconds)}</strong>
          </div>
          <div className="wh-stat sets">
            <span>SETS</span>
            <strong>{completedSetsCount} <small>/ {totalSetsCount}</small></strong>
          </div>
          <div className="wh-stat calories">
            <span>EST. BURN</span>
            <strong>{liveCalories} <small>kcal</small></strong>
          </div>
        </div>

        <button
          type="button"
          className="wh-end-btn"
          onClick={() => setShowEndConfirm(true)}
          disabled={selectedExercises.length === 0}
        >
          End Session
        </button>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div className="workout-body">
        {/* ── BLUEPRINT SIDEBAR ── */}
        <aside className="workout-blueprint">
          <div className="bp-label">EXERCISE BLUEPRINT</div>

          {selectedExercises.length === 0 ? (
            <div className="bp-empty">
              <p>No exercises queued.</p>
              <p>Add exercises to begin your session.</p>
            </div>
          ) : (
            <div className="bp-list">
              {selectedExercises.map((ex, idx) => {
                const exCompleted = ex.sets.every(s => s.completed) && ex.sets.length > 0;
                const exPartial = ex.sets.some(s => s.completed);
                return (
                  <button
                    key={ex.exercise.id}
                    type="button"
                    className={`bp-item ${idx === activeCardIndex ? 'active' : ''} ${exCompleted ? 'done' : exPartial ? 'partial' : ''}`}
                    onClick={() => scrollToCard(idx)}
                  >
                    <span className="bp-dot" />
                    <div className="bp-info">
                      <strong>{ex.exercise.name}</strong>
                      <span>{ex.exercise.primary_muscle} &bull; {ex.sets.filter(s => s.completed).length}/{ex.sets.length} sets</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              className="bp-add-btn"
              onClick={() => setShowRecModal(true)}
              style={{ background: '#1c362b', color: '#cbed3e', borderColor: '#2e5242' }}
            >
              ✨ AI Routine Generator
            </button>
            <button type="button" className="bp-add-btn" onClick={() => setPickerOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Add Exercise
            </button>
          </div>
        </aside>

        {/* ── ACTION ZONE ── */}
        <main className="workout-action-zone">
          {selectedExercises.length === 0 ? (
            <div className="az-empty-state">
              <div className="az-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6.5 6.5h11M12 3v3M4 12h2m12 0h2M6.5 17.5h11M12 18v3M7 12a5 5 0 0110 0"/></svg>
              </div>
              <h2>Ready to Train</h2>
              <p>Build your routine by adding exercises from the master catalog, or generate a tailored daily routine calibrated for your primary goal.</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="az-start-btn"
                  onClick={() => setShowRecModal(true)}
                  disabled={recLoading}
                >
                  ✨ AI Recommended Routine
                </button>
                <button
                  type="button"
                  className="az-start-btn"
                  style={{ background: 'transparent', border: '1px solid #d8e2d7', color: '#14221b' }}
                  onClick={() => setPickerOpen(true)}
                >
                  Browse Catalog
                </button>
              </div>
            </div>
          ) : (
            <div className="az-cards">
              {selectedExercises.map((activeEx, exIdx) => (
                <div
                  key={activeEx.exercise.id}
                  ref={el => { cardRefs.current[exIdx] = el; }}
                  className={`exercise-card ${exIdx === activeCardIndex ? 'focused' : ''}`}
                  onClick={() => setActiveCardIndex(exIdx)}
                >
                  {/* Card Header */}
                  <div className="ec-header">
                    <div className="ec-title-row">
                      <span className="ec-order">{String(exIdx + 1).padStart(2, '0')}</span>
                      <div>
                        <h3>{activeEx.exercise.name}</h3>
                        <div className="ec-tags">
                          <span className="ec-muscle-tag">{MUSCLE_ICONS[activeEx.exercise.primary_muscle] || '\u{1F3CB}'} {activeEx.exercise.primary_muscle}</span>
                          <span className="ec-equip-tag">{activeEx.exercise.equipment}</span>
                          <span className="ec-diff-tag">{activeEx.exercise.difficulty}</span>
                        </div>
                      </div>
                    </div>
                    <button type="button" className="ec-remove" onClick={(e) => { e.stopPropagation(); removeExercise(exIdx); }} title="Remove exercise">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>

                  {/* Instructions (collapsible) */}
                  {activeEx.exercise.instructions.length > 0 && (
                    <details className="ec-instructions">
                      <summary>View Instructions</summary>
                      <ol>
                        {activeEx.exercise.instructions.map((instr, i) => (
                          <li key={i}>{instr}</li>
                        ))}
                      </ol>
                    </details>
                  )}

                  {/* Sets Table */}
                  <div className="ec-sets-table">
                    <div className="ec-sets-header">
                      <span>SET</span>
                      <span>REPS</span>
                      <span>WEIGHT (KG)</span>
                      <span>STATUS</span>
                      <span></span>
                    </div>
                    {activeEx.sets.map((set, setIdx) => (
                      <div key={setIdx} className={`ec-set-row ${set.completed ? 'completed' : ''}`}>
                        <span className="set-num">{set.set_number}</span>
                        <input
                          type="number"
                          className="set-input"
                          value={set.reps || ''}
                          onChange={e => updateSet(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          min={0}
                        />
                        <input
                          type="number"
                          className="set-input"
                          value={set.weight_kg || ''}
                          onChange={e => updateSet(exIdx, setIdx, 'weight_kg', parseFloat(e.target.value) || 0)}
                          placeholder="0.0"
                          min={0}
                          step={0.5}
                        />
                        <button
                          type="button"
                          className={`set-complete-btn ${set.completed ? 'done' : ''}`}
                          onClick={() => updateSet(exIdx, setIdx, 'completed', !set.completed)}
                        >
                          {set.completed ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                          ) : (
                            <span className="set-check-empty" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="set-remove-btn"
                          onClick={() => removeSet(exIdx, setIdx)}
                          title="Remove set"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  <button type="button" className="ec-add-set" onClick={() => addSet(exIdx)}>
                    + Add Set
                  </button>
                </div>
              ))}

              {/* Session Notes */}
              <div className="session-notes-card">
                <label>SESSION NOTES</label>
                <textarea
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  placeholder="How did the session feel? Any PRs hit?"
                  rows={3}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── EXERCISE PICKER MODAL ── */}
      {pickerOpen && (
        <div className="picker-overlay" onClick={() => setPickerOpen(false)}>
          <div className="picker-modal" onClick={e => e.stopPropagation()}>
            <div className="picker-header">
              <h2>Exercise Catalog</h2>
              <button type="button" className="picker-close" onClick={() => setPickerOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Search */}
            <div className="picker-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search exercises..."
              />
            </div>

            {/* Muscle Group Tabs */}
            <div className="picker-tabs">
              {MUSCLE_GROUPS.map(group => (
                <button
                  key={group}
                  type="button"
                  className={`picker-tab ${muscleFilter === group ? 'active' : ''}`}
                  onClick={() => setMuscleFilter(group)}
                >
                  {group}
                </button>
              ))}
            </div>

            {/* Exercise List */}
            <div className="picker-list">
              {catalogLoading ? (
                <div className="picker-loading">Loading exercises...</div>
              ) : catalog.length === 0 ? (
                <div className="picker-loading">No exercises found.</div>
              ) : (
                catalog.map(ex => {
                  const alreadyAdded = selectedExercises.some(s => s.exercise.id === ex.id);
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      className={`picker-exercise ${alreadyAdded ? 'added' : ''}`}
                      onClick={() => !alreadyAdded && addExercise(ex)}
                      disabled={alreadyAdded}
                    >
                      <div className="pe-info">
                        <strong>{ex.name}</strong>
                        <div className="pe-meta">
                          <span>{ex.primary_muscle}</span>
                          <span>{ex.equipment}</span>
                          <span>{ex.difficulty}</span>
                        </div>
                      </div>
                      {alreadyAdded ? (
                        <span className="pe-added-badge">Added</span>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── END SESSION CONFIRMATION ── */}
      {showEndConfirm && (
        <div className="picker-overlay" onClick={() => setShowEndConfirm(false)}>
          <div className="end-confirm-modal" onClick={e => e.stopPropagation()}>
            <h2>End Workout Session?</h2>
            <div className="end-summary">
              <div className="end-stat">
                <span>DURATION</span>
                <strong>{formatTime(elapsedSeconds)}</strong>
              </div>
              <div className="end-stat">
                <span>VOLUME</span>
                <strong>{liveVolume.toLocaleString()} kg</strong>
              </div>
              <div className="end-stat">
                <span>EXERCISES</span>
                <strong>{selectedExercises.length}</strong>
              </div>
              <div className="end-stat">
                <span>SETS DONE</span>
                <strong>{completedSetsCount} / {totalSetsCount}</strong>
              </div>
              <div className="end-stat">
                <span>EST. BURN</span>
                <strong>{liveCalories} kcal</strong>
              </div>
            </div>
            <div className="end-actions">
              <button type="button" className="end-cancel" onClick={() => setShowEndConfirm(false)}>
                Keep Training
              </button>
              <button type="button" className="end-submit" onClick={handleEndSession} disabled={submitting}>
                {submitting ? 'Saving...' : 'Complete & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI WORKOUT RECOMMENDATION MODAL (Proposal §6.2) ── */}
      {showRecModal && (
        <div className="diet-modal-overlay">
          <div className="diet-modal-box" style={{ maxWidth: 580 }}>
            <div className="diet-modal-header">
              <div>
                <h3 className="diet-modal-title">AI Routine Generator</h3>
                <span style={{ font: '11px "DM Mono", monospace', color: '#6a7e71', display: 'block', marginTop: 2 }}>
                  CLINICALLY CALIBRATED TRAINING BLUEPRINT &bull; PROPOSAL §6.2
                </span>
              </div>
              <button onClick={() => setShowRecModal(false)} className="diet-modal-close">
                ✕
              </button>
            </div>

            <div className="diet-form" style={{ padding: '16px 24px 24px 24px' }}>
              {/* Split Category Selector */}
              <div className="diet-field">
                <label className="diet-label">Select Target Training Split</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { key: 'auto', label: '⚡ Daily Auto Pick', sub: 'Rotates Based on History' },
                    { key: 'push', label: '💥 Push Protocol', sub: 'Chest, Delts, Triceps' },
                    { key: 'pull', label: '⚡ Pull Protocol', sub: 'Back, Traps, Biceps' },
                    { key: 'legs', label: '🦵 Legs & Core', sub: 'Quads, Hams, Glutes' },
                    { key: 'full_body', label: '🔥 Full Body Surge', sub: 'Compound Athletic' },
                    { key: 'metabolic_hiit', label: '⚡ Metabolic Blitz', sub: 'Conditioning & Core' },
                  ].map(s => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setRecSplit(s.key)}
                      style={{
                        background: recSplit === s.key ? '#132720' : '#fbfcf9',
                        color: recSplit === s.key ? '#cbed3e' : '#14221b',
                        border: `1px solid ${recSplit === s.key ? '#132720' : '#d8e2d7'}`,
                        borderRadius: 8,
                        padding: '8px 10px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <strong style={{ fontSize: 12, display: 'block' }}>{s.label}</strong>
                      <span style={{ fontSize: 10, opacity: 0.75, fontFamily: 'DM Mono, monospace' }}>{s.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Routine Preview */}
              {recLoading ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#55675c', font: '13px "DM Mono", monospace' }}>
                  Calibrating biometric routine...
                </div>
              ) : previewRoutine ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Routine Header Card */}
                  <div style={{ background: '#f4f7f2', border: '1px solid #d8e2d7', borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: 0, font: '600 15px Manrope, sans-serif', color: '#14221b' }}>
                          {previewRoutine.routine_title}
                        </h4>
                        <span style={{ font: '11px "DM Mono", monospace', color: '#2d6a4f', display: 'block', marginTop: 2 }}>
                          {previewRoutine.goal_alignment_badge}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ font: '700 14px "DM Mono", monospace', color: '#14221b', display: 'block' }}>
                          ~{previewRoutine.estimated_calories_burned} kcal
                        </span>
                        <span style={{ font: '11px "DM Mono", monospace', color: '#71887b' }}>
                          ⏱️ {previewRoutine.estimated_duration_min} min
                        </span>
                      </div>
                    </div>
                    <p style={{ margin: '8px 0 0 0', font: '12px Manrope, sans-serif', color: '#55675c', lineHeight: 1.4 }}>
                      💡 {previewRoutine.coaching_summary}
                    </p>
                  </div>

                  {/* Exercises List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ font: '700 10px "DM Mono", monospace', color: '#55675c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Curated Movements &amp; Starting Weights
                    </span>
                    {previewRoutine.exercises.map((ex, i) => (
                      <div
                        key={ex.exercise_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#ffffff',
                          border: '1px solid #edf2eb',
                          borderRadius: 6,
                          padding: '8px 12px',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: 13, color: '#14221b' }}>{i + 1}. {ex.name}</strong>
                          <div style={{ fontSize: 11, color: '#71887b', display: 'flex', gap: 8, marginTop: 2 }}>
                            <span>{ex.primary_muscle}</span>
                            <span>&bull;</span>
                            <span>{ex.equipment}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ font: '700 12px "DM Mono", monospace', color: '#132720', display: 'block' }}>
                            {ex.target_sets} sets &times; {ex.target_reps} reps
                          </span>
                          <span style={{ fontSize: 11, color: '#2d6a4f', fontFamily: 'DM Mono, monospace' }}>
                            {ex.suggested_weight_kg > 0 ? `@ ${ex.suggested_weight_kg} kg` : 'Bodyweight'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="diet-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowRecModal(false)}
                  className="diet-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={recLoading || !previewRoutine}
                  onClick={() => loadRecommendedRoutine(recSplit)}
                  className="diet-btn-submit"
                >
                  ⚡ Load Routine into Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
