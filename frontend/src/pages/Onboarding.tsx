import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';
import StudioPanel from '../components/StudioPanel';
import { ArrowLeftIcon, ArrowRightIcon, SparklesIcon, SuccessCheckmark } from '../components/icons';

export interface OnboardingData {
  age: string;
  gender: string;
  height_cm: string;
  weight_kg: string;
  primary_goal: string;
  target_weight_kg: string;
  dietary_preference: string;
  activity_level: string;
}

const GENDER_OPTIONS = [
  { id: 'Male', label: 'Male', icon: 'â™‚' },
  { id: 'Female', label: 'Female', icon: 'â™€' },
  { id: 'Non-Binary', label: 'Non-Binary', icon: 'âš¥' },
  { id: 'Prefer not to say', label: 'Prefer not to say', icon: 'ðŸ”’' },
];

const GOAL_OPTIONS = [
  {
    id: 'Build strength',
    title: 'Build Strength & Muscle',
    desc: 'Hypertrophy, progressive overload, and lean muscle mass accretion',
    badge: 'SURPLUS & HYPERTROPHY',
    icon: 'ðŸ‹ï¸â€â™‚ï¸'
  },
  {
    id: 'Lose weight',
    title: 'Fat Loss & Definition',
    desc: 'Targeted caloric deficit to shed body fat while preserving lean tissue',
    badge: 'LEAN DEFICIT',
    icon: 'ðŸ”¥'
  },
  {
    id: 'Move daily',
    title: 'Daily Movement & Health',
    desc: 'Metabolic conditioning, cardiovascular stamina, and vitality',
    badge: 'ENDURANCE & VITALITY',
    icon: 'ðŸƒ'
  },
  {
    id: 'Recover better',
    title: 'Mobility & Longevity',
    desc: 'Functional flexibility, joint resilience, and nervous system recovery',
    badge: 'RECOVERY & LONGEVITY',
    icon: 'ðŸ§˜'
  },
];

const DIET_OPTIONS = [
  {
    id: 'Standard Omnivore',
    title: 'Standard Omnivore',
    desc: 'Balanced whole foods, lean poultry, meats, produce, grains, and dairy',
    badge: 'BALANCED INTAKE',
    icon: 'ðŸ¥©'
  },
  {
    id: 'High-Protein / Athlete',
    title: 'High-Protein Athlete',
    desc: 'Optimized high-density amino acid profile for tissue repair and strength',
    badge: '2.0G+ / KG PROTEIN',
    icon: 'ðŸ—'
  },
  {
    id: 'Vegetarian',
    title: 'Vegetarian',
    desc: 'Plant-rich whole foods, legumes, dairy, eggs, and grains',
    badge: 'PLANT + DAIRY/EGGS',
    icon: 'ðŸ¥—'
  },
  {
    id: 'Vegan',
    title: '100% Plant-Based / Vegan',
    desc: 'Strictly plant-derived whole foods, grains, legumes, nuts, and seeds',
    badge: '100% PLANT FUEL',
    icon: 'ðŸŒ±'
  },
  {
    id: 'Pescatarian',
    title: 'Pescatarian',
    desc: 'Vegetarian foundation supplemented with wild fish and omega-3s',
    badge: 'SEAFOOD & GREENS',
    icon: 'ðŸŸ'
  },
  {
    id: 'Keto / Low Carb',
    title: 'Ketogenic / Low-Carb',
    desc: 'Healthy fats, moderate protein, and minimal refined carbohydrates',
    badge: '<50G NET CARBS',
    icon: 'ðŸ¥‘'
  },
];

const ACTIVITY_OPTIONS = [
  {
    id: 'Sedentary',
    title: 'Sedentary (Desk Life)',
    desc: 'Desk job, minimal structured daily exercise (< 5,000 steps)',
    multiplier: 1.2,
    icon: 'ðŸ›‹ï¸'
  },
  {
    id: 'Lightly Active',
    title: 'Lightly Active (1â€“2x/week)',
    desc: '1â€“2 light workouts per week or consistent 6,000â€“8,000 daily steps',
    multiplier: 1.375,
    icon: 'ðŸš¶'
  },
  {
    id: 'Moderately Active',
    title: 'Moderately Active (3â€“5x/week)',
    desc: '3â€“5 structured strength/cardio sessions per week with active lifestyle',
    multiplier: 1.55,
    icon: 'âš¡'
  },
  {
    id: 'Very Active',
    title: 'Very Active (6â€“7x/week)',
    desc: '6â€“7 intense training days weekly or physically demanding occupation',
    multiplier: 1.725,
    icon: 'ðŸ”¥'
  },
  {
    id: 'Extra Active',
    title: 'Athletic / High Performance',
    desc: 'Two-a-day training sessions or competitive endurance/strength athlete',
    multiplier: 1.9,
    icon: 'ðŸš€'
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();

  // Step index: 1 (Baseline), 2 (Ambitions), 3 (Diet), 4 (Activity & Telemetry)
  const [step, setStep] = useState<number>(1);

  // Single React state object holding all onboarding form data
  const [formData, setFormData] = useState<OnboardingData>({
    age: '24',
    gender: 'Male',
    height_cm: '178',
    weight_kg: '76',
    primary_goal: 'Build strength',
    target_weight_kg: '78',
    dietary_preference: 'High-Protein / Athlete',
    activity_level: 'Moderately Active',
  });

  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Generic field updater
  const updateField = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Helper conversions & metrics
  const heightVal = parseFloat(formData.height_cm) || 0;
  const weightVal = parseFloat(formData.weight_kg) || 0;
  const targetWeightVal = parseFloat(formData.target_weight_kg) || 0;
  const ageVal = parseInt(formData.age, 10) || 0;

  // Real-time BMI Calculation
  const bmiInfo = useMemo(() => {
    if (heightVal > 50 && weightVal > 20) {
      const heightM = heightVal / 100;
      const bmi = parseFloat((weightVal / (heightM * heightM)).toFixed(1));
      let category = 'Normal weight';
      let colorClass = 'bmi-normal';
      if (bmi < 18.5) {
        category = 'Underweight';
        colorClass = 'bmi-under';
      } else if (bmi < 25.0) {
        category = 'Optimal / Healthy';
        colorClass = 'bmi-normal';
      } else if (bmi < 30.0) {
        category = 'Overweight / Muscular';
        colorClass = 'bmi-over';
      } else {
        category = 'High BMI';
        colorClass = 'bmi-high';
      }
      return { bmi, category, colorClass };
    }
    return null;
  }, [heightVal, weightVal]);

  // Height helper in feet & inches
  const heightInFtIn = useMemo(() => {
    if (heightVal > 0) {
      const totalInches = heightVal / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return `${feet}' ${inches}"`;
    }
    return '';
  }, [heightVal]);

  // Weight helper in pounds
  const weightInLbs = useMemo(() => {
    if (weightVal > 0) {
      return (weightVal * 2.20462).toFixed(1);
    }
    return '';
  }, [weightVal]);

  // Target weight delta
  const weightDelta = useMemo(() => {
    if (weightVal > 0 && targetWeightVal > 0) {
      const delta = parseFloat((targetWeightVal - weightVal).toFixed(1));
      return delta;
    }
    return 0;
  }, [weightVal, targetWeightVal]);

  // Live BMR & Macro projection calculation (Mifflin-St Jeor equation)
  const macroProjection = useMemo(() => {
    if (ageVal > 0 && heightVal > 0 && weightVal > 0) {
      let bmr = 10 * weightVal + 6.25 * heightVal - 5 * ageVal;
      if (formData.gender === 'Male') {
        bmr += 5;
      } else if (formData.gender === 'Female') {
        bmr -= 161;
      } else {
        bmr -= 78;
      }

      const actObj = ACTIVITY_OPTIONS.find(a => a.id === formData.activity_level) || ACTIVITY_OPTIONS[2];
      const tdee = Math.round(bmr * actObj.multiplier);

      let targetCalories = tdee;
      if (formData.primary_goal === 'Build strength') {
        targetCalories = Math.round(tdee + 250);
      } else if (formData.primary_goal === 'Lose weight') {
        targetCalories = Math.round(tdee - 450);
      }

      const proteinGrams = Math.round(weightVal * 2.0);
      const fatGrams = Math.round((targetCalories * 0.25) / 9);
      const carbCalories = targetCalories - (proteinGrams * 4 + fatGrams * 9);
      const carbGrams = Math.max(50, Math.round(carbCalories / 4));

      return {
        bmr: Math.round(bmr),
        tdee,
        targetCalories,
        proteinGrams,
        carbGrams,
        fatGrams
      };
    }
    return null;
  }, [ageVal, heightVal, weightVal, formData.gender, formData.activity_level, formData.primary_goal]);

  // Step Validation
  const validateCurrentStep = (): boolean => {
    setError('');
    if (step === 1) {
      if (!ageVal || ageVal < 12 || ageVal > 110) {
        setError('Please enter a realistic age between 12 and 110.');
        return false;
      }
      if (!heightVal || heightVal < 90 || heightVal > 250) {
        setError('Please enter a valid height between 90 cm and 250 cm.');
        return false;
      }
      if (!weightVal || weightVal < 30 || weightVal > 300) {
        setError('Please enter a valid current weight between 30 kg and 300 kg.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!targetWeightVal || targetWeightVal < 30 || targetWeightVal > 300) {
        setError('Please enter a realistic target weight between 30 kg and 300 kg.');
        return false;
      }
      if (!formData.primary_goal) {
        setError('Please select your primary fitness ambition.');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!formData.dietary_preference) {
        setError('Please select your dietary preference.');
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (!formData.activity_level) {
        setError('Please select your weekly activity level.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setError('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleStepJump = (targetStep: number) => {
    if (targetStep < step) {
      setError('');
      setStep(targetStep);
    } else if (targetStep > step) {
      if (validateCurrentStep()) {
        setStep(targetStep);
      }
    }
  };

  // Submit complete profile to backend
  const handleSubmitProfile = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        height_cm: parseFloat(formData.height_cm),
        weight_kg: parseFloat(formData.weight_kg),
        target_weight_kg: parseFloat(formData.target_weight_kg),
        dietary_preference: formData.dietary_preference,
        primary_goal: formData.primary_goal,
        activity_level: formData.activity_level,
      };

      await api.post('/profile', payload);

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map(d => d.msg).join(', '));
      } else {
        setError('Failed to save biometric profile. Please check your inputs.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic StudioPanel copy for all 4 phases
  const studioCopy = useMemo(() => {
    switch (step) {
      case 1:
        return {
          edition: '03 â€” BASELINE METRICS',
          quote: <>Measure the foundation.<br />Every transformation starts here.</>,
          tag: 'BIOMETRIC CALIBRATION, IN SYNC'
        };
      case 2:
        return {
          edition: '04 â€” PERFORMANCE AMBITIONS',
          quote: <>Ambition with clear metrics<br />becomes inevitable progress.</>,
          tag: 'TARGET MATRIX, IN SYNC'
        };
      case 3:
        return {
          edition: '05 â€” NUTRITIONAL FUEL',
          quote: <>Food is information.<br />Fuel the engine with precision.</>,
          tag: 'DIETARY ALIGNMENT, IN SYNC'
        };
      case 4:
      default:
        return {
          edition: '06 â€” METABOLIC CADENCE',
          quote: <>Calculate the output.<br />Harmonize training with daily life.</>,
          tag: 'ENERGY EQUATION, IN SYNC'
        };
    }
  }, [step]);

  return (
    <main className="auth-shell">
      {/* â”€â”€ Left Studio Branding & Dynamic Artwork â”€â”€ */}
      <StudioPanel
        edition={studioCopy.edition}
        quote={studioCopy.quote}
        tag={studioCopy.tag}
      />

      {/* â”€â”€ Right Form / Wizard Panel â”€â”€ */}
      <section className="form-panel onboarding-panel">
        <div className="mobile-brand">
          <Logo />
        </div>

        <div className="onboarding-wrap">
          {/* Top Progress & Step Indicator (4 Phases) */}
          <header className="wizard-header">
            <div className="wizard-progress-track">
              <div
                className="wizard-progress-fill"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
            
            <div className="wizard-meta">
              <div className="step-badge">
                <span>PHASE</span> <strong>0{step}</strong> / 04
              </div>
              <div className="step-tags">
                <button
                  type="button"
                  onClick={() => handleStepJump(1)}
                  className={step === 1 ? "step-pill active" : step > 1 ? "step-pill done clickable" : "step-pill"}
                >
                  1. Baseline
                </button>
                <button
                  type="button"
                  onClick={() => handleStepJump(2)}
                  className={step === 2 ? "step-pill active" : step > 2 ? "step-pill done clickable" : "step-pill"}
                >
                  2. Ambitions
                </button>
                <button
                  type="button"
                  onClick={() => handleStepJump(3)}
                  className={step === 3 ? "step-pill active" : step > 3 ? "step-pill done clickable" : "step-pill"}
                >
                  3. Nutrition
                </button>
                <button
                  type="button"
                  onClick={() => handleStepJump(4)}
                  className={step === 4 ? "step-pill active" : "step-pill"}
                >
                  4. Activity
                </button>
              </div>
            </div>
          </header>

          {/* Wizard Content Container */}
          <div className="wizard-form-container">

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                STEP 1: BASELINE BIOMETRICS
               â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {step === 1 && (
              <div className="step-view fade-in">
                <div className="eyebrow"><span /> CALIBRATION &bull; BIOMETRICS</div>
                <h2>Your Baseline Metrics</h2>
                <p className="intro">
                  Input your exact physical markers so our engine can calculate your metabolic index and body composition target.
                </p>

                {/* Gender Selector */}
                <div className="metric-group">
                  <label className="section-label">GENDER IDENTITY</label>
                  <div className="gender-grid">
                    {GENDER_OPTIONS.map(g => (
                      <button
                        type="button"
                        key={g.id}
                        className={`gender-chip ${formData.gender === g.id ? 'active' : ''}`}
                        onClick={() => updateField('gender', g.id)}
                      >
                        <span className="gender-symbol">{g.icon}</span>
                        <span>{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age & Height */}
                <div className="field-row">
                  <label className="field-label">
                    <span>Age</span>
                    <div className="stepper-wrap">
                      <input
                        type="number"
                        min="12"
                        max="110"
                        placeholder="24"
                        value={formData.age}
                        onChange={(e) => updateField('age', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                      />
                      <span className="unit-label">yrs</span>
                    </div>
                  </label>

                  <label className="field-label">
                    <span>Height</span>
                    <div className="stepper-wrap">
                      <input
                        type="number"
                        min="90"
                        max="250"
                        step="0.5"
                        placeholder="178"
                        value={formData.height_cm}
                        onChange={(e) => updateField('height_cm', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                      />
                      <span className="unit-label">cm</span>
                    </div>
                    {heightInFtIn && (
                      <span className="helper-hint">â‰ˆ {heightInFtIn}</span>
                    )}
                  </label>
                </div>

                {/* Current Weight */}
                <div className="field-row">
                  <label className="field-label">
                    <span>Current Weight</span>
                    <div className="stepper-wrap">
                      <input
                        type="number"
                        min="30"
                        max="300"
                        step="0.1"
                        placeholder="76.0"
                        value={formData.weight_kg}
                        onChange={(e) => updateField('weight_kg', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                      />
                      <span className="unit-label">kg</span>
                    </div>
                    {weightInLbs && (
                      <span className="helper-hint">â‰ˆ {weightInLbs} lbs</span>
                    )}
                  </label>

                  {/* Real-time BMI readout card */}
                  <div className="bmi-preview-card">
                    <span className="preview-label">CALCULATED BMI</span>
                    {bmiInfo ? (
                      <div className="bmi-flex">
                        <strong className="bmi-number">{bmiInfo.bmi}</strong>
                        <span className={`bmi-badge ${bmiInfo.colorClass}`}>
                          {bmiInfo.category}
                        </span>
                      </div>
                    ) : (
                      <span className="bmi-waiting">Enter height & weight</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                STEP 2: AMBITIONS & TARGETS
               â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {step === 2 && (
              <div className="step-view fade-in">
                <div className="eyebrow"><span /> CALIBRATION &bull; AMBITIONS</div>
                <h2>Performance Ambitions</h2>
                <p className="intro">
                  Select your primary objective and target weight so we can architect your caloric deficit or surplus trajectory.
                </p>

                {/* Primary Goals Cards */}
                <div className="metric-group">
                  <label className="section-label">PRIMARY OBJECTIVE</label>
                  <div className="cards-grid">
                    {GOAL_OPTIONS.map(g => (
                      <button
                        type="button"
                        key={g.id}
                        className={`selection-card ${formData.primary_goal === g.id ? 'active' : ''}`}
                        onClick={() => updateField('primary_goal', g.id)}
                      >
                        <div className="card-header">
                          <span className="card-icon">{g.icon}</span>
                          <span className="card-badge">{g.badge}</span>
                        </div>
                        <h3>{g.title}</h3>
                        <p>{g.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Weight Field & Trajectory Chip */}
                <div className="field-row target-row">
                  <label className="field-label">
                    <span>Target Weight</span>
                    <div className="stepper-wrap">
                      <input
                        type="number"
                        min="30"
                        max="300"
                        step="0.5"
                        placeholder="78.0"
                        value={formData.target_weight_kg}
                        onChange={(e) => updateField('target_weight_kg', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                      />
                      <span className="unit-label">kg</span>
                    </div>
                  </label>

                  {/* Goal Delta Chip */}
                  <div className="target-delta-card">
                    <span className="preview-label">TRAJECTORY DELTA</span>
                    <div className="delta-content">
                      {weightDelta === 0 ? (
                        <span className="delta-pill delta-neutral">âš–ï¸ Weight Maintenance</span>
                      ) : weightDelta < 0 ? (
                        <span className="delta-pill delta-cut">
                          ðŸ“‰ {Math.abs(weightDelta)} kg Fat Loss Target
                        </span>
                      ) : (
                        <span className="delta-pill delta-bulk">
                          ðŸ“ˆ +{weightDelta} kg Muscle Gain Target
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                STEP 3: NUTRITIONAL FUEL & DIETARY PREFERENCE
               â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {step === 3 && (
              <div className="step-view fade-in">
                <div className="eyebrow"><span /> CALIBRATION &bull; NUTRITION</div>
                <h2>Dietary Preference</h2>
                <p className="intro">
                  Select your primary nutritional framework so we can tailor your meal composition, protein targets, and recipes.
                </p>

                {/* Dietary Preference Cards */}
                <div className="metric-group">
                  <label className="section-label">DIETARY FRAMEWORK</label>
                  <div className="diet-grid">
                    {DIET_OPTIONS.map(d => (
                      <button
                        type="button"
                        key={d.id}
                        className={`diet-card ${formData.dietary_preference === d.id ? 'active' : ''}`}
                        onClick={() => updateField('dietary_preference', d.id)}
                      >
                        <span className="diet-icon">{d.icon}</span>
                        <div className="diet-content">
                          <div className="diet-title-row">
                            <h4>{d.title}</h4>
                            <span className="diet-badge">{d.badge}</span>
                          </div>
                          <p>{d.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                STEP 4: WEEKLY ACTIVITY & METABOLIC FORECAST
               â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {step === 4 && (
              <div className="step-view fade-in">
                <div className="eyebrow"><span /> CALIBRATION &bull; ACTIVITY &amp; TARGETS</div>
                <h2>Weekly Activity &amp; Output</h2>
                <p className="intro">
                  Tell us about your physical movement routine to calculate your total daily energy expenditure (TDEE) and macro blueprint.
                </p>

                {/* Activity Level Cards */}
                <div className="metric-group">
                  <label className="section-label">TRAINING &amp; MOVEMENT CADENCE</label>
                  <div className="activity-list">
                    {ACTIVITY_OPTIONS.map(a => (
                      <button
                        type="button"
                        key={a.id}
                        className={`activity-row ${formData.activity_level === a.id ? 'active' : ''}`}
                        onClick={() => updateField('activity_level', a.id)}
                      >
                        <span className="act-icon">{a.icon}</span>
                        <div className="act-info">
                          <strong>{a.title}</strong>
                          <span>{a.desc}</span>
                        </div>
                        <span className="act-indicator" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Macro & Energy Forecast */}
                {macroProjection && (
                  <div className="macro-forecast-card">
                    <div className="forecast-header">
                      <SparklesIcon />
                      <span>PROJECTED DAILY BLUEPRINT (AI CALCULATED)</span>
                    </div>
                    <div className="forecast-stats">
                      <div className="stat-pill">
                        <strong>{macroProjection.targetCalories}</strong>
                        <span>kcal / day</span>
                      </div>
                      <div className="stat-pill">
                        <strong>{macroProjection.proteinGrams}g</strong>
                        <span>Protein</span>
                      </div>
                      <div className="stat-pill">
                        <strong>{macroProjection.carbGrams}g</strong>
                        <span>Carbs</span>
                      </div>
                      <div className="stat-pill">
                        <strong>{macroProjection.fatGrams}g</strong>
                        <span>Fats</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && <p className="error-message wizard-error">{error}</p>}

            {/* Wizard Navigation Footer */}
            <div className="wizard-actions">
              {step > 1 ? (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeftIcon /> Back
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  className="submit-button next-btn"
                  onClick={handleNext}
                >
                  Continue <ArrowRightIcon />
                </button>
              ) : (
                <button
                  type="button"
                  className="submit-button complete-btn"
                  onClick={handleSubmitProfile}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    'Syncing Profile...'
                  ) : (
                    <>Complete Calibration <SparklesIcon /></>
                  )}
                </button>
              )}
            </div>

            {/* Success Animation Notification */}
            {isSuccess && (
              <div className="success-banner fade-in">
                <SuccessCheckmark />
                <span>Biometric profile calibrated! Launching dashboard...</span>
              </div>
            )}
          </div>
        </div>

        <footer>
          NutriSync Engine &bull; HIPAA &amp; GDPR compliant biometric security.
        </footer>
      </section>
    </main>
  );
}
