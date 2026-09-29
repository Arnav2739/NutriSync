import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import {
  fetchPantryItems,
  addPantryItem,
  bulkAddPantryItems,
  updatePantryItem,
  deletePantryItem,
  clearPantry,
  fetchGroceryCatalog,
  fetchDeficiencyAnalysis,
  generateMealPlan,
  fetchShoppingList,
  addShoppingListItem,
  toggleShoppingListItem,
  transferShoppingItemToPantry,
  deleteShoppingListItem,
  PantryItem,
  GroceryCatalogItem,
  DeficiencyAnalysisResponse,
  GeneratedMealPlanResponse,
  ShoppingListItem,
} from '../services/diet';

// Quick-Add Staples definition
const POPULAR_STAPLES = [
  { name: 'Eggs', quantity: 12, unit: 'pcs', category: 'Protein', icon: '🥚' },
  { name: 'Chicken Breast', quantity: 500, unit: 'g', category: 'Protein', icon: '🍗' },
  { name: 'Rolled Oats', quantity: 500, unit: 'g', category: 'Grains & Carbs', icon: '🌾' },
  { name: 'White Rice', quantity: 1000, unit: 'g', category: 'Grains & Carbs', icon: '🍚' },
  { name: 'Milk (Cow / Dairy)', quantity: 1000, unit: 'ml', category: 'Dairy', icon: '🥛' },
  { name: 'Spinach', quantity: 200, unit: 'g', category: 'Vegetables', icon: '🥬' },
  { name: 'Greek Yogurt', quantity: 400, unit: 'g', category: 'Dairy', icon: '🥣' },
  { name: 'Olive Oil', quantity: 250, unit: 'ml', category: 'Fats & Oils', icon: '🫒' },
  { name: 'Canned Tuna', quantity: 300, unit: 'g', category: 'Protein', icon: '🐟' },
  { name: 'Paneer (Cottage Cheese)', quantity: 250, unit: 'g', category: 'Protein', icon: '🧀' },
  { name: 'Bananas', quantity: 6, unit: 'pcs', category: 'Fruits', icon: '🍌' },
  { name: 'Tomatoes', quantity: 4, unit: 'pcs', category: 'Vegetables', icon: '🍅' },
  { name: 'Onions', quantity: 4, unit: 'pcs', category: 'Vegetables', icon: '🧅' },
];

export default function DietPlanner() {
  const navigate = useNavigate();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'pantry' | 'deficiency' | 'mealplan' | 'shopping'>('pantry');

  // State data
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [catalog, setCatalog] = useState<GroceryCatalogItem[]>([]);
  const [deficiency, setDeficiency] = useState<DeficiencyAnalysisResponse | null>(null);
  const [mealPlan, setMealPlan] = useState<GeneratedMealPlanResponse | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);

  // Loading & UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [planLoading, setPlanLoading] = useState<boolean>(false);
  const [actionMsg, setActionMsg] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [staplesFilter, setStaplesFilter] = useState<string>('All');

  // Custom Item Modal / Form State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customQty, setCustomQty] = useState<number>(100);
  const [customUnit, setCustomUnit] = useState<string>('g');
  const [customCategory, setCustomCategory] = useState<string>('Protein');

  // New Shopping item form state
  const [newShopName, setNewShopName] = useState<string>('');
  const [newShopQty, setNewShopQty] = useState<number>(1);
  const [newShopUnit, setNewShopUnit] = useState<string>('pcs');

  // Initial load
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
      const [pantryRes, catalogRes, deficiencyRes, shopRes] = await Promise.all([
        fetchPantryItems(),
        fetchGroceryCatalog(),
        fetchDeficiencyAnalysis(),
        fetchShoppingList(),
      ]);
      setPantry(pantryRes);
      setCatalog(catalogRes);
      setDeficiency(deficiencyRes);
      setShoppingList(shopRes);
    } catch (err: any) {
      console.error('Failed to load diet data:', err);
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
    setTimeout(() => setActionMsg(''), 4000);
  };

  // --- Pantry Actions ---
  const handleQuickAdd = async (staple: typeof POPULAR_STAPLES[0]) => {
    try {
      const added = await addPantryItem({
        name: staple.name,
        quantity: staple.quantity,
        unit: staple.unit,
        category: staple.category,
      });
      setPantry((prev) => {
        const idx = prev.findIndex((p) => p.name.toLowerCase() === added.name.toLowerCase());
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = added;
          return updated;
        }
        return [...prev, added];
      });
      const defRes = await fetchDeficiencyAnalysis();
      setDeficiency(defRes);
      showNotification(`Added ${staple.quantity} ${staple.unit} of ${staple.name} to pantry.`);
    } catch (err) {
      console.error(err);
      showNotification('Failed to add item to pantry.');
    }
  };

  const handleStockAthleteKit = async () => {
    try {
      const athleteKit = [
        { name: 'Eggs', quantity: 12, unit: 'pcs', category: 'Protein' },
        { name: 'Chicken Breast', quantity: 500, unit: 'g', category: 'Protein' },
        { name: 'Rolled Oats', quantity: 500, unit: 'g', category: 'Grains & Carbs' },
        { name: 'White Rice', quantity: 1000, unit: 'g', category: 'Grains & Carbs' },
        { name: 'Milk (Cow / Dairy)', quantity: 1000, unit: 'ml', category: 'Dairy' },
        { name: 'Spinach', quantity: 200, unit: 'g', category: 'Vegetables' },
      ];
      const items = await bulkAddPantryItems(athleteKit);
      setPantry(items);
      const defRes = await fetchDeficiencyAnalysis();
      setDeficiency(defRes);
      showNotification('Essential Athlete Kit stocked into your pantry!');
    } catch (err) {
      console.error(err);
      showNotification('Failed to stock athlete kit.');
    }
  };

  const handleCustomAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    try {
      const added = await addPantryItem({
        name: customName.trim(),
        quantity: customQty,
        unit: customUnit,
        category: customCategory,
      });
      setPantry((prev) => {
        const idx = prev.findIndex((p) => p.name.toLowerCase() === added.name.toLowerCase());
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = added;
          return updated;
        }
        return [...prev, added];
      });
      const defRes = await fetchDeficiencyAnalysis();
      setDeficiency(defRes);
      setShowAddModal(false);
      setCustomName('');
      showNotification(`Added ${added.name} (${added.quantity} ${added.unit}) to pantry.`);
    } catch (err) {
      console.error(err);
      showNotification('Failed to add custom item.');
    }
  };

  const handleUpdateQty = async (item: PantryItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    if (newQty === 0) {
      handleDeletePantry(item.id);
      return;
    }
    try {
      const updated = await updatePantryItem(item.id, newQty, item.unit);
      setPantry((prev) => prev.map((p) => (p.id === item.id ? updated : p)));
      const defRes = await fetchDeficiencyAnalysis();
      setDeficiency(defRes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePantry = async (id: string) => {
    try {
      await deletePantryItem(id);
      setPantry((prev) => prev.filter((p) => p.id !== id));
      const defRes = await fetchDeficiencyAnalysis();
      setDeficiency(defRes);
      showNotification('Item removed from pantry.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearPantry = async () => {
    if (!window.confirm('Are you sure you want to clear your entire pantry inventory?')) return;
    try {
      await clearPantry();
      setPantry([]);
      const defRes = await fetchDeficiencyAnalysis();
      setDeficiency(defRes);
      showNotification('Pantry inventory cleared.');
    } catch (err) {
      console.error(err);
    }
  };

  // --- Meal Plan Generation (Proposal §6.3) ---
  const handleGeneratePlan = async () => {
    setPlanLoading(true);
    try {
      const res = await generateMealPlan();
      setMealPlan(res);
      showNotification('Fresh meal plan generated from your pantry inventory!');
    } catch (err) {
      console.error(err);
      showNotification('Failed to generate meal plan.');
    } finally {
      setPlanLoading(false);
    }
  };

  // --- Shopping List Actions (Proposal §6.5) ---
  const handleAddShoppingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) return;

    try {
      const added = await addShoppingListItem({
        name: newShopName.trim(),
        quantity: newShopQty,
        unit: newShopUnit,
        reason: 'User Planned Purchase',
      });
      setShoppingList((prev) => [added, ...prev]);
      setNewShopName('');
      showNotification(`Added ${added.name} to shopping list.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSuggestionToShopping = async (suggestion: { name: string; category: string; suggested_qty: number; unit: string; reason: string }) => {
    try {
      const added = await addShoppingListItem({
        name: suggestion.name,
        category: suggestion.category,
        quantity: suggestion.suggested_qty,
        unit: suggestion.unit,
        reason: suggestion.reason,
      });
      setShoppingList((prev) => [added, ...prev]);
      showNotification(`Added ${suggestion.name} to shopping list!`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleShopItem = async (id: string) => {
    try {
      const updated = await toggleShoppingListItem(id);
      setShoppingList((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransferToPantry = async (item: ShoppingListItem) => {
    try {
      const pantryItem = await transferShoppingItemToPantry(item.id);
      setShoppingList((prev) => prev.filter((s) => s.id !== item.id));
      setPantry((prev) => {
        const idx = prev.findIndex((p) => p.name.toLowerCase() === pantryItem.name.toLowerCase());
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = pantryItem;
          return updated;
        }
        return [...prev, pantryItem];
      });
      const defRes = await fetchDeficiencyAnalysis();
      setDeficiency(defRes);
      showNotification(`Transferred ${item.name} into your pantry inventory!`);
    } catch (err) {
      console.error(err);
      showNotification('Failed to transfer item to pantry.');
    }
  };

  const handleDeleteShopItem = async (id: string) => {
    try {
      await deleteShoppingListItem(id);
      setShoppingList((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Pantry
  const filteredPantry = pantry.filter((item) => {
    if (selectedCategory === 'All') return true;
    return item.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const filteredStaples = POPULAR_STAPLES.filter((staple) => {
    if (staplesFilter === 'All') return true;
    return staple.category.toLowerCase() === staplesFilter.toLowerCase();
  });

  const categories = ['All', 'Protein', 'Grains & Carbs', 'Vegetables', 'Dairy', 'Fats & Oils', 'Fruits'];

  const totalCalories = pantry.reduce((acc, p) => acc + (p.calories || 0), 0);
  const totalProtein = pantry.reduce((acc, p) => acc + (p.protein_g || 0), 0);
  const unpurchasedCount = shoppingList.filter((s) => !s.is_purchased).length;
  const hasDeficiencies = deficiency?.deficiencies.some((d) => d.status.includes('Deficient') || d.status.includes('Shortage'));

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Logo />
        <div className="loading-spinner" />
        <p>CALIBRATING SMART GROCERY TELEMETRY...</p>
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
          <span className="nav-edition">SMART GROCERY &bull; DIET ENGINE</span>
          <span className="nav-live-indicator">
            <span className="live-dot" /> LIVE PANTRY
          </span>
        </div>
        <div className="nav-actions">
          <Link to="/dashboard" className="nav-link-btn">
            &larr; Dashboard
          </Link>
          <Link to="/cheat-meals" className="nav-link-btn" style={{ borderColor: 'rgba(251, 191, 36, 0.4)', color: '#fbbf24' }}>
            🍕 Cheat Balancer
          </Link>
          <Link to="/workouts/active" className="nav-link-btn accent">
            Focus HUD ⚡
          </Link>
        </div>
      </nav>

      {/* Main Main Content Container */}
      <main className="dashboard-main">
        {/* Header Bar */}
        <header className="dashboard-welcome-bar">
          <div>
            <div className="eyebrow">
              <span /> PROPOSAL &sect;6.3 &amp; &sect;6.4 &bull; ZERO-WASTE ATHLETIC NUTRITION
            </div>
            <h1>Smart Grocery &amp; Diet Planner</h1>
            <p className="intro">
              Stock what you have in your fridge and pantry. NutriSync computes aggregate macronutrient reserves,
              flags micronutrient deficiencies, and synthesizes balanced meals exclusively from ingredients on hand.
            </p>
          </div>
          <div className="welcome-actions">
            <button onClick={() => setShowAddModal(true)} className="hero-cta-btn">
              + Add Custom Item
            </button>
          </div>
        </header>

        {/* Top HUD Telemetry Ribbon */}
        <div className="dashboard-hud-ribbon">
          <div className="hud-card">
            <div className="hud-card-top">
              <span className="hud-label">Pantry Staples</span>
              <span className="hud-pill volt">{pantry.length} ITEMS</span>
            </div>
            <div className="hud-metric">
              <strong>{pantry.length}</strong>
              <small>stocked</small>
            </div>
            <div className="hud-sub">
              {filteredPantry.length} items shown in active filter
            </div>
          </div>

          <div className="hud-card">
            <div className="hud-card-top">
              <span className="hud-label">Total Calories</span>
              <span className="hud-pill green">ENERGY</span>
            </div>
            <div className="hud-metric">
              <strong>{Math.round(totalCalories)}</strong>
              <small>kcal</small>
            </div>
            <div className="hud-sub">
              ~{deficiency?.estimated_pantry_days || 0} days estimated pantry runway
            </div>
          </div>

          <div className="hud-card">
            <div className="hud-card-top">
              <span className="hud-label">Protein Reserve</span>
              <span className="hud-pill volt">SYNTHESIS</span>
            </div>
            <div className="hud-metric">
              <strong>{Math.round(totalProtein)}</strong>
              <small>g</small>
            </div>
            <div className="hud-sub">
              Target: {Math.round(deficiency?.daily_target_protein_g || 0)}g / day
            </div>
          </div>

          <div className="hud-card">
            <div className="hud-card-top">
              <span className="hud-label">Pantry Health</span>
              <span className={`hud-pill ${deficiency && deficiency.overall_health_score >= 80 ? 'green' : 'volt'}`}>
                SCORE
              </span>
            </div>
            <div className="hud-metric">
              <strong>{deficiency ? `${deficiency.overall_health_score}%` : 'N/A'}</strong>
            </div>
            <div className="hud-sub">
              {hasDeficiencies ? '⚠️ Micronutrient gaps detected' : '✓ Well balanced nutrition'}
            </div>
          </div>
        </div>

        {/* Elegant Tab Navigation Bar */}
        <div className="diet-tab-bar">
          <button
            onClick={() => setActiveTab('pantry')}
            className={`diet-tab-btn ${activeTab === 'pantry' ? 'active' : ''}`}
          >
            <span>🥫</span>
            <span>Pantry Inventory</span>
            <span className="diet-tab-count">{pantry.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('deficiency')}
            className={`diet-tab-btn ${activeTab === 'deficiency' ? 'active' : ''}`}
          >
            <span>⚖️</span>
            <span>Deficiency Analysis</span>
            {hasDeficiencies && <span className="diet-tab-alert-dot" />}
          </button>

          <button
            onClick={() => setActiveTab('mealplan')}
            className={`diet-tab-btn ${activeTab === 'mealplan' ? 'active' : ''}`}
          >
            <span>🍳</span>
            <span>Pantry Meal Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('shopping')}
            className={`diet-tab-btn ${activeTab === 'shopping' ? 'active' : ''}`}
          >
            <span>🛒</span>
            <span>Shopping List</span>
            <span className="diet-tab-count">{unpurchasedCount}</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PANTRY INVENTORY MANAGER (Proposal §6.3)                           */}
        {/* ========================================================================= */}
        {activeTab === 'pantry' && (
          <div className="diet-section">
            {/* Quick-Add Athletic Staples Shelf */}
            <div className="staples-box">
              <div className="staples-box-header">
                <div className="staples-box-title">
                  <span>⚡</span>
                  <span>1-Tap Athletic Staples &bull; Quick Stock</span>
                </div>
                <span className="staples-box-sub">
                  Click any staple to immediately add standard portion into your pantry inventory
                </span>
              </div>

              {/* Staples Category Filter */}
              <div className="staples-cat-chips">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setStaplesFilter(cat)}
                    className={`staples-cat-btn ${staplesFilter === cat ? 'active' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Staples Grid */}
              <div className="staples-grid">
                {filteredStaples.map((staple) => (
                  <div
                    key={staple.name}
                    onClick={() => handleQuickAdd(staple)}
                    className="staple-card"
                    title={`Add ${staple.quantity}${staple.unit} of ${staple.name}`}
                  >
                    <div className="staple-left">
                      <span className="staple-icon">{staple.icon}</span>
                      <div className="staple-info">
                        <span className="staple-name">{staple.name}</span>
                        <span className="staple-qty">+{staple.quantity} {staple.unit}</span>
                      </div>
                    </div>
                    <div className="staple-add-action">+</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pantry List Toolbar */}
            <div className="pantry-toolbar">
              <div className="pantry-cat-filters">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`pantry-cat-btn ${selectedCategory === cat ? 'active' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {pantry.length > 0 && (
                <button onClick={handleClearPantry} className="pantry-clear-btn">
                  Clear All Pantry Items
                </button>
              )}
            </div>

            {/* Pantry Items Grid or Clean Empty State */}
            {filteredPantry.length === 0 ? (
              <div className="pantry-empty-card">
                <div className="pantry-empty-icon">🥫</div>
                <h3 className="pantry-empty-title">Your Kitchen Pantry is Ready</h3>
                <p className="pantry-empty-desc">
                  You haven't added any ingredients yet. Tap individual staples from the shelf above,
                  or load a recommended Athlete Starter Kit with a single click.
                </p>
                <button onClick={handleStockAthleteKit} className="pantry-kit-btn">
                  <span>⚡</span>
                  <span>Quick-Stock Essential Athlete Kit</span>
                </button>
              </div>
            ) : (
              <div className="pantry-grid">
                {filteredPantry.map((item) => (
                  <div key={item.id} className="pantry-card">
                    <div>
                      <div className="pantry-card-top">
                        <span className="pantry-cat-badge">{item.category}</span>
                        <button
                          onClick={() => handleDeletePantry(item.id)}
                          className="pantry-del-btn"
                          title="Remove from pantry"
                        >
                          ✕
                        </button>
                      </div>
                      <h4 className="pantry-card-title">{item.name}</h4>

                      {/* Nutrient Breakdown Strip */}
                      <div className="pantry-macro-strip">
                        <div className="pantry-macro-cell">
                          <span className="pantry-macro-lbl">Energy</span>
                          <span className="pantry-macro-val">{Math.round(item.calories)}<small style={{ fontWeight: 400, fontSize: 10 }}>kcal</small></span>
                        </div>
                        <div className="pantry-macro-cell">
                          <span className="pantry-macro-lbl">Protein</span>
                          <span className="pantry-macro-val protein">{item.protein_g}g</span>
                        </div>
                        <div className="pantry-macro-cell">
                          <span className="pantry-macro-lbl">Carbs</span>
                          <span className="pantry-macro-val carbs">{item.carbs_g}g</span>
                        </div>
                        <div className="pantry-macro-cell">
                          <span className="pantry-macro-lbl">Fats</span>
                          <span className="pantry-macro-val fats">{item.fats_g}g</span>
                        </div>
                      </div>
                    </div>

                    {/* Stepper Footer */}
                    <div className="pantry-card-footer">
                      <span className="pantry-qty-lbl">On hand:</span>
                      <div className="pantry-qty-ctrls">
                        <button
                          onClick={() => handleUpdateQty(item, item.unit === 'pcs' || item.unit === 'slices' ? -1 : -50)}
                          className="pantry-qty-btn"
                        >
                          &minus;
                        </button>
                        <span className="pantry-qty-num">
                          {item.quantity} {item.unit}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item, item.unit === 'pcs' || item.unit === 'slices' ? 1 : 50)}
                          className="pantry-qty-btn"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: NUTRITIONAL DEFICIENCY DETECTION (Proposal §6.4)                   */}
        {/* ========================================================================= */}
        {activeTab === 'deficiency' && deficiency && (
          <div className="diet-section">
            {/* Scientific Engine Callout */}
            <div className="deficiency-callout">
              <span className="deficiency-callout-tag">✦ SPORTS SCIENCE ENGINE &bull; PROPOSAL &sect;6.4</span>
              <h3>Comparing Current Pantry Supplies Against Calibrated Athlete Targets</h3>
              <p>
                Unlike generic calorie counters that assume limitless ingredients, NutriSync calculates the net available
                micronutrients and macronutrients in your kitchen and compares them with your calibrated Mifflin-St Jeor daily metabolic targets.
              </p>
            </div>

            {/* Target vs Available 4-Card Comparison Grid */}
            <div className="macro-compare-grid">
              {/* Protein Target */}
              <div className="macro-compare-card">
                <div className="macro-compare-top">
                  <span className="macro-compare-lbl">Daily Protein</span>
                  <span className="macro-compare-target">Target: {Math.round(deficiency.daily_target_protein_g)}g</span>
                </div>
                <div className="macro-compare-val">
                  <strong>{Math.round(deficiency.total_pantry_protein_g / Math.max(1, Math.min(7, deficiency.estimated_pantry_days || 3)))}</strong>
                  <span>g / day est.</span>
                </div>
                <div className="macro-compare-track">
                  <div
                    className="macro-compare-bar protein"
                    style={{
                      width: `${Math.min(
                        100,
                        ((deficiency.total_pantry_protein_g / Math.max(1, Math.min(7, deficiency.estimated_pantry_days || 3))) /
                          deficiency.daily_target_protein_g) *
                          100
                      )}%`,
                    }}
                  />
                </div>
                <span className="macro-compare-sub">
                  Total in pantry: {Math.round(deficiency.total_pantry_protein_g)}g
                </span>
              </div>

              {/* Energy Target */}
              <div className="macro-compare-card">
                <div className="macro-compare-top">
                  <span className="macro-compare-lbl">Daily Calories</span>
                  <span className="macro-compare-target">Target: {Math.round(deficiency.daily_target_calories)} kcal</span>
                </div>
                <div className="macro-compare-val">
                  <strong>{Math.round(deficiency.total_pantry_calories / Math.max(1, Math.min(7, deficiency.estimated_pantry_days || 3)))}</strong>
                  <span>kcal / day</span>
                </div>
                <div className="macro-compare-track">
                  <div
                    className="macro-compare-bar calories"
                    style={{
                      width: `${Math.min(
                        100,
                        ((deficiency.total_pantry_calories / Math.max(1, Math.min(7, deficiency.estimated_pantry_days || 3))) /
                          deficiency.daily_target_calories) *
                          100
                      )}%`,
                    }}
                  />
                </div>
                <span className="macro-compare-sub">
                  Total in pantry: {Math.round(deficiency.total_pantry_calories)} kcal
                </span>
              </div>

              {/* Carbs Target */}
              <div className="macro-compare-card">
                <div className="macro-compare-top">
                  <span className="macro-compare-lbl">Daily Carbs</span>
                  <span className="macro-compare-target">Target: {Math.round(deficiency.daily_target_carbs_g)}g</span>
                </div>
                <div className="macro-compare-val">
                  <strong>{Math.round(deficiency.total_pantry_carbs_g / Math.max(1, Math.min(7, deficiency.estimated_pantry_days || 3)))}</strong>
                  <span>g / day est.</span>
                </div>
                <div className="macro-compare-track">
                  <div
                    className="macro-compare-bar carbs"
                    style={{
                      width: `${Math.min(
                        100,
                        ((deficiency.total_pantry_carbs_g / Math.max(1, Math.min(7, deficiency.estimated_pantry_days || 3))) /
                          deficiency.daily_target_carbs_g) *
                          100
                      )}%`,
                    }}
                  />
                </div>
                <span className="macro-compare-sub">
                  Total in pantry: {Math.round(deficiency.total_pantry_carbs_g)}g
                </span>
              </div>

              {/* Fats Target */}
              <div className="macro-compare-card">
                <div className="macro-compare-top">
                  <span className="macro-compare-lbl">Daily Fats</span>
                  <span className="macro-compare-target">Target: {Math.round(deficiency.daily_target_fats_g)}g</span>
                </div>
                <div className="macro-compare-val">
                  <strong>{Math.round(deficiency.total_pantry_fats_g / Math.max(1, Math.min(7, deficiency.estimated_pantry_days || 3)))}</strong>
                  <span>g / day est.</span>
                </div>
                <div className="macro-compare-track">
                  <div
                    className="macro-compare-bar fats"
                    style={{
                      width: `${Math.min(
                        100,
                        ((deficiency.total_pantry_fats_g / Math.max(1, Math.min(7, deficiency.estimated_pantry_days || 3))) /
                          deficiency.daily_target_fats_g) *
                          100
                      )}%`,
                    }}
                  />
                </div>
                <span className="macro-compare-sub">
                  Total in pantry: {Math.round(deficiency.total_pantry_fats_g)}g
                </span>
              </div>
            </div>

            {/* Findings List */}
            <div className="deficiency-findings-card">
              <h3 className="deficiency-card-title">
                <span>🚨</span>
                <span>Nutrient Deficiency Diagnostic Findings</span>
              </h3>
              <div className="deficiency-items-list">
                {deficiency.deficiencies.map((item, idx) => (
                  <div
                    key={idx}
                    className={`deficiency-finding-item ${item.status === 'Optimal' ? 'optimal' : 'warning'}`}
                  >
                    <div className="finding-left">
                      <span className="finding-icon">{item.status === 'Optimal' ? '✅' : '⚠️'}</span>
                      <div>
                        <span className="finding-nutrient">
                          {item.nutrient} &bull; {item.status}
                        </span>
                        <p className="finding-msg">{item.message}</p>
                      </div>
                    </div>
                    {item.daily_gap > 0 && (
                      <span className="finding-gap-tag">
                        Deficit: -{Math.round(item.daily_gap)} {item.unit} / day
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Grocery Additions */}
            {deficiency.suggested_additions.length > 0 && (
              <div>
                <h3 className="deficiency-card-title">
                  <span>💡</span>
                  <span>Recommended Additions to Bridge Micronutrient Gaps</span>
                </h3>
                <div className="sug-grid">
                  {deficiency.suggested_additions.map((sug, idx) => (
                    <div key={idx} className="sug-card">
                      <div>
                        <div className="sug-top">
                          <span className="sug-cat-tag">{sug.category}</span>
                          <span className="sug-qty-tag">+{sug.suggested_qty} {sug.unit}</span>
                        </div>
                        <h4 className="sug-title">{sug.name}</h4>
                        <p className="sug-reason">{sug.reason}</p>
                      </div>

                      <div className="sug-footer">
                        <span className="sug-protein-tag">+{sug.impact_protein_g}g Protein</span>
                        <button
                          onClick={() => handleAddSuggestionToShopping(sug)}
                          className="sug-add-btn"
                        >
                          + Add to Shopping List
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SMART GROCERY MEAL PLAN GENERATOR (Proposal §6.3)                  */}
        {/* ========================================================================= */}
        {activeTab === 'mealplan' && (
          <div className="diet-section">
            {/* Meal Plan Generator Action Card */}
            <div className="mealplan-action-card">
              <div className="mealplan-action-text">
                <span className="mealplan-badge">Proposal &sect;6.3 &bull; Zero Food Waste Engine</span>
                <h3 className="mealplan-h">Generate Meals Exclusively from Your Pantry</h3>
                <p className="mealplan-desc">
                  NutriSync inspects your {pantry.length} stocked items and synthesizes delicious athletic meals
                  requiring <em>no extra grocery runs</em>. Every meal aligns with your caloric targets and macro split.
                </p>
              </div>

              <button
                onClick={handleGeneratePlan}
                disabled={planLoading || pantry.length === 0}
                className="mealplan-gen-btn"
              >
                {planLoading ? (
                  <>
                    <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    <span>Analyzing Pantry Recipes...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Generate Meal Plan</span>
                  </>
                )}
              </button>
            </div>

            {/* Rendered Meal Plan */}
            {mealPlan ? (
              <div className="diet-section">
                {/* Summary Bar */}
                <div className="mealplan-summary-bar">
                  <div>
                    <h4 className="mealplan-sum-title">{mealPlan.title}</h4>
                    <p className="mealplan-sum-msg">{mealPlan.message}</p>
                  </div>
                  <div className="mealplan-sum-stats">
                    <span>
                      Energy: <strong>{mealPlan.plan_total_calories}</strong> / {mealPlan.target_calories} kcal
                    </span>
                    <span>
                      Protein: <strong>{mealPlan.plan_total_protein_g}g</strong> / {mealPlan.target_protein_g}g
                    </span>
                  </div>
                </div>

                {/* Meals Grid */}
                <div className="meals-grid">
                  {mealPlan.meals.map((meal) => (
                    <div key={meal.recipe_id} className="meal-card">
                      <div>
                        <div className="meal-top">
                          <span className="meal-badge">{meal.meal_type}</span>
                          <span className="meal-coverage-pill">
                            {meal.pantry_coverage_percent >= 100 ? '✓ 100% Pantry Match' : `${meal.pantry_coverage_percent}% Match`}
                          </span>
                        </div>
                        <h4 className="meal-title">{meal.title}</h4>
                        <p className="meal-ingredients-italic">{meal.ingredient_summary}</p>

                        <div className="meal-recipe-box">
                          <strong>Cooking Instructions:</strong>
                          {meal.instructions}
                        </div>
                      </div>

                      <div className="meal-footer">
                        <span className="meal-prep-time">⏱️ {meal.prep_time_min} mins prep</span>
                        <div className="meal-macro-badges">
                          <strong>{Math.round(meal.calories)} kcal</strong>
                          <span className="p-val">{meal.protein_g}g P</span>
                          <span className="c-val">{meal.carbs_g}g C</span>
                          <span className="f-val">{meal.fats_g}g F</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Unlock More Recipes Shelf */}
                {mealPlan.missing_ingredients_to_unlock_more.length > 0 && (
                  <div className="meal-unlock-shelf">
                    <h4 className="meal-unlock-title">
                      <span>🔑</span>
                      <span>Unlock More Recipes with Just a Few Additions</span>
                    </h4>
                    <p className="meal-unlock-desc">
                      Adding these ingredients to your pantry unlocks additional high-protein recipe variations:
                    </p>
                    <div className="meal-unlock-chips">
                      {mealPlan.missing_ingredients_to_unlock_more.map((ing) => (
                        <button
                          key={ing}
                          onClick={() => handleAddSuggestionToShopping({ name: ing, category: 'Other', suggested_qty: 1, unit: 'pcs', reason: 'Recipe Unlock' })}
                          className="meal-unlock-btn"
                        >
                          <span>+</span>
                          <span>{ing}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="pantry-empty-card">
                <div className="pantry-empty-icon">🍳</div>
                <h3 className="pantry-empty-title">No Meal Plan Generated Yet</h3>
                <p className="pantry-empty-desc">
                  Click the button above to synthesize a customized daily breakfast, lunch, dinner, and snack based on your current pantry items.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SMART SHOPPING LIST (Proposal §6.5)                                */}
        {/* ========================================================================= */}
        {activeTab === 'shopping' && (
          <div className="shopping-container">
            {/* Quick Add Form */}
            <div className="shopping-add-card">
              <form onSubmit={handleAddShoppingItem} className="shopping-form">
                <input
                  type="text"
                  placeholder="Add item (e.g. Greek Yogurt, Lentils, Apples)..."
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  className="shop-input-text"
                />
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={newShopQty}
                  onChange={(e) => setNewShopQty(parseFloat(e.target.value) || 1)}
                  className="shop-input-num"
                />
                <select
                  value={newShopUnit}
                  onChange={(e) => setNewShopUnit(e.target.value)}
                  className="shop-select"
                >
                  <option value="pcs">pcs</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="slices">slices</option>
                  <option value="scoops">scoops</option>
                </select>
                <button type="submit" className="shop-submit-btn">
                  + Add Item
                </button>
              </form>
            </div>

            {/* Shopping List Items */}
            {shoppingList.length === 0 ? (
              <div className="pantry-empty-card">
                <div className="pantry-empty-icon">🛒</div>
                <h3 className="pantry-empty-title">Your Shopping List is Empty</h3>
                <p className="pantry-empty-desc">
                  Items suggested from the Deficiency Detector or recipe recommendations will appear here.
                  You can also add items manually above.
                </p>
              </div>
            ) : (
              <div className="diet-section">
                {shoppingList.map((item) => (
                  <div
                    key={item.id}
                    className={`shopping-item-card ${item.is_purchased ? 'purchased' : ''}`}
                  >
                    <div className="shop-item-left">
                      <input
                        type="checkbox"
                        checked={item.is_purchased}
                        onChange={() => handleToggleShopItem(item.id)}
                        className="shop-checkbox"
                      />
                      <div>
                        <h4 className="shop-item-name">{item.name}</h4>
                        <div className="shop-item-meta">
                          <span>{item.quantity} {item.unit}</span>
                          {item.reason && (
                            <>
                              <span>&bull;</span>
                              <span>{item.reason}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shop-item-right">
                      <button
                        onClick={() => handleTransferToPantry(item)}
                        className="shop-transfer-btn"
                        title="Move item into your Pantry Inventory"
                      >
                        <span>✓</span>
                        <span>Transfer to Pantry</span>
                      </button>
                      <button
                        onClick={() => handleDeleteShopItem(item.id)}
                        className="shop-del-btn"
                        title="Delete item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Custom Add Item Modal */}
      {showAddModal && (
        <div className="diet-modal-overlay">
          <div className="diet-modal-box">
            <div className="diet-modal-header">
              <h3 className="diet-modal-title">Add Custom Pantry Item</h3>
              <button onClick={() => setShowAddModal(false)} className="diet-modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleCustomAdd} className="diet-form">
              <div className="diet-field">
                <label className="diet-label">Ingredient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chicken Breast, Tofu, Basmati Rice..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="diet-input"
                />
              </div>

              <div className="diet-form-row">
                <div className="diet-field">
                  <label className="diet-label">Quantity</label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={customQty}
                    onChange={(e) => setCustomQty(parseFloat(e.target.value) || 0)}
                    className="diet-input"
                  />
                </div>
                <div className="diet-field">
                  <label className="diet-label">Unit</label>
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="diet-input"
                  >
                    <option value="g">grams (g)</option>
                    <option value="ml">milliliters (ml)</option>
                    <option value="pcs">pieces (pcs)</option>
                    <option value="slices">slices</option>
                    <option value="scoops">scoops</option>
                  </select>
                </div>
              </div>

              <div className="diet-field">
                <label className="diet-label">Category</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="diet-input"
                >
                  <option value="Protein">Protein</option>
                  <option value="Grains & Carbs">Grains & Carbs</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Fats & Oils">Fats & Oils</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="diet-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="diet-btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="diet-btn-submit">
                  + Add to Pantry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
