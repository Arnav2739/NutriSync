import api from './api';

export interface CheatMealTemplate {
  name: string;
  category: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  icon: string;
  description: string;
}

export interface AdaptiveRebalancePlan {
  id: string;
  user_id: string;
  cheat_meal_log_id?: string;
  meal_name: string;
  surplus_calories: number;
  rebalance_days: number;
  strategy: 'balanced' | 'step_cardio' | 'diet_buffer' | string;
  daily_calorie_offset: number;
  daily_extra_steps: number;
  daily_extra_active_burn_kcal: number;
  target_date_start: string;
  target_date_end: string;
  status: 'active' | 'completed' | 'dismissed' | string;
  explanation?: string;
  glycogen_tip?: string;
  created_at: string;
}

export interface CheatMealLog {
  id: string;
  user_id: string;
  name: string;
  meal_type: string;
  estimated_calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  consumed_at: string;
  notes?: string;
  feeling_tag?: string;
  created_at: string;
  active_plan?: AdaptiveRebalancePlan;
}

export interface CheatMealCreatePayload {
  name: string;
  meal_type: string;
  estimated_calories: number;
  protein_g?: number;
  carbs_g?: number;
  fats_g?: number;
  notes?: string;
  feeling_tag?: string;
  rebalance_days: number;
  rebalance_strategy: string;
}

export interface CheatMealOverview {
  total_logged_all_time: number;
  logged_this_month: number;
  avg_calories_per_meal: number;
  current_active_plan?: AdaptiveRebalancePlan | null;
  recent_meals: CheatMealLog[];
}

// API Service functions
export async function fetchCheatMealTemplates(): Promise<CheatMealTemplate[]> {
  const res = await api.get<CheatMealTemplate[]>('/cheat-meals/templates');
  return res.data;
}

export async function fetchCheatMealOverview(): Promise<CheatMealOverview> {
  const res = await api.get<CheatMealOverview>('/cheat-meals/overview');
  return res.data;
}

export async function fetchCheatMealsHistory(): Promise<CheatMealLog[]> {
  const res = await api.get<CheatMealLog[]>('/cheat-meals');
  return res.data;
}

export async function logCheatMeal(payload: CheatMealCreatePayload): Promise<CheatMealLog> {
  const res = await api.post<CheatMealLog>('/cheat-meals', payload);
  return res.data;
}

export async function fetchActiveRebalancePlan(): Promise<AdaptiveRebalancePlan | null> {
  const res = await api.get<AdaptiveRebalancePlan | null>('/cheat-meals/active-plan');
  return res.data;
}

export async function completeActiveRebalancePlan(planId: string): Promise<void> {
  await api.post(`/cheat-meals/active-plan/${planId}/complete`);
}

export async function deleteCheatMeal(mealId: string): Promise<void> {
  await api.delete(`/cheat-meals/${mealId}`);
}
