import api from './api';

export interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  created_at?: string;
  updated_at?: string;
}

export interface PantryItemCreate {
  name: string;
  quantity: number;
  unit?: string;
  category?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fats_g?: number;
}

export interface GroceryCatalogItem {
  name: string;
  category: string;
  default_unit: string;
  serving_size: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  is_pantry_staple: boolean;
  tags: string[];
}

export interface DeficiencyDetail {
  nutrient: string;
  status: string;
  daily_requirement: number;
  available_daily_est: number;
  daily_gap: number;
  unit: string;
  message: string;
}

export interface SuggestedAddition {
  name: string;
  category: string;
  reason: string;
  suggested_qty: number;
  unit: string;
  impact_protein_g: number;
  impact_calories: number;
}

export interface DeficiencyAnalysisResponse {
  daily_target_calories: number;
  daily_target_protein_g: number;
  daily_target_carbs_g: number;
  daily_target_fats_g: number;
  total_pantry_calories: number;
  total_pantry_protein_g: number;
  total_pantry_carbs_g: number;
  total_pantry_fats_g: number;
  estimated_pantry_days: number;
  deficiencies: DeficiencyDetail[];
  suggested_additions: SuggestedAddition[];
  overall_health_score: number;
}

export interface PlannedMeal {
  meal_type: string;
  recipe_id: string;
  title: string;
  ingredient_summary: string;
  instructions: string;
  prep_time_min: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  tags: string[];
  pantry_coverage_percent: number;
}

export interface GeneratedMealPlanResponse {
  title: string;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fats_g: number;
  plan_total_calories: number;
  plan_total_protein_g: number;
  plan_total_carbs_g: number;
  plan_total_fats_g: number;
  meals: PlannedMeal[];
  available_ingredients_used: string[];
  missing_ingredients_to_unlock_more: string[];
  message: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  is_purchased: boolean;
  reason?: string;
  created_at?: string;
}

export interface ShoppingListItemCreate {
  name: string;
  category?: string;
  quantity: number;
  unit: string;
  reason?: string;
}

// --- API Service Methods ---

export async function fetchPantryItems(): Promise<PantryItem[]> {
  const res = await api.get<PantryItem[]>('/diet/pantry');
  return res.data;
}

export async function addPantryItem(data: PantryItemCreate): Promise<PantryItem> {
  const res = await api.post<PantryItem>('/diet/pantry', data);
  return res.data;
}

export async function bulkAddPantryItems(items: PantryItemCreate[]): Promise<PantryItem[]> {
  const res = await api.post<PantryItem[]>('/diet/pantry/bulk', { items });
  return res.data;
}

export async function updatePantryItem(id: string, quantity: number, unit?: string): Promise<PantryItem> {
  const res = await api.put<PantryItem>(`/diet/pantry/${id}`, { quantity, unit });
  return res.data;
}

export async function deletePantryItem(id: string): Promise<void> {
  await api.delete(`/diet/pantry/${id}`);
}

export async function clearPantry(): Promise<void> {
  await api.delete('/diet/pantry');
}

export async function fetchGroceryCatalog(category?: string): Promise<GroceryCatalogItem[]> {
  const params = category ? { category } : {};
  const res = await api.get<GroceryCatalogItem[]>('/diet/catalog', { params });
  return res.data;
}

export async function fetchDeficiencyAnalysis(): Promise<DeficiencyAnalysisResponse> {
  const res = await api.get<DeficiencyAnalysisResponse>('/diet/deficiency-analysis');
  return res.data;
}

export async function generateMealPlan(): Promise<GeneratedMealPlanResponse> {
  const res = await api.post<GeneratedMealPlanResponse>('/diet/generate-meal-plan');
  return res.data;
}

export async function fetchShoppingList(): Promise<ShoppingListItem[]> {
  const res = await api.get<ShoppingListItem[]>('/diet/shopping-list');
  return res.data;
}

export async function addShoppingListItem(data: ShoppingListItemCreate): Promise<ShoppingListItem> {
  const res = await api.post<ShoppingListItem>('/diet/shopping-list', data);
  return res.data;
}

export async function bulkAddShoppingList(items: ShoppingListItemCreate[]): Promise<ShoppingListItem[]> {
  const res = await api.post<ShoppingListItem[]>('/diet/shopping-list/bulk', { items });
  return res.data;
}

export async function toggleShoppingListItem(id: string): Promise<ShoppingListItem> {
  const res = await api.patch<ShoppingListItem>(`/diet/shopping-list/${id}/toggle`);
  return res.data;
}

export async function transferShoppingItemToPantry(id: string): Promise<PantryItem> {
  const res = await api.post<PantryItem>(`/diet/shopping-list/${id}/transfer-to-pantry`);
  return res.data;
}

export async function deleteShoppingListItem(id: string): Promise<void> {
  await api.delete(`/diet/shopping-list/${id}`);
}
