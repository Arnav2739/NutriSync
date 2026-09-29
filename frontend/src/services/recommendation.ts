import api from './api';

export interface RecommendedExerciseItem {
  exercise_id: string;
  name: string;
  primary_muscle: string;
  category: string;
  equipment: string;
  difficulty: string;
  target_sets: number;
  target_reps: number;
  target_reps_label: string;
  target_rest_seconds: number;
  suggested_weight_kg: number;
  coaching_cue: string;
  gif_url?: string | null;
}

export interface RecommendedRoutineResponse {
  routine_id: string;
  routine_title: string;
  split_category: string;
  primary_goal: string;
  goal_alignment_badge: string;
  estimated_duration_min: number;
  estimated_calories_burned: number;
  intensity_level: string;
  coaching_summary: string;
  exercises: RecommendedExerciseItem[];
}

export interface RoutineOptionSummary {
  split_key: string;
  title: string;
  target_muscles: string;
  icon: string;
  description: string;
}

export const recommendationService = {
  getSplits: async (): Promise<RoutineOptionSummary[]> => {
    const res = await api.get<RoutineOptionSummary[]>('/workouts/recommendations/splits');
    return res.data;
  },

  getRecommendation: async (split: string = 'auto'): Promise<RecommendedRoutineResponse> => {
    const res = await api.get<RecommendedRoutineResponse>(`/workouts/recommendations?split=${split}`);
    return res.data;
  },
};
