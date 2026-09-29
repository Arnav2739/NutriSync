import api from './api';

export interface ProgressSummary {
  total_workouts: number;
  total_volume_kg: number;
  total_calories_burned: number;
  avg_volume_per_session: number;
}

export interface VolumeDataPoint {
  date: string;
  volume: number;
  title: string;
}

export interface CalorieDataPoint {
  date: string;
  calories: number;
}

export interface WeeklyStatPoint {
  week: string;
  workouts: number;
  volume: number;
}

export interface ProgressStatsResponse {
  summary: ProgressSummary;
  volume_over_time: VolumeDataPoint[];
  calories_over_time: CalorieDataPoint[];
  weekly_stats: WeeklyStatPoint[];
}

export async function fetchProgressStats(): Promise<ProgressStatsResponse> {
  const res = await api.get('/progress/stats');
  return res.data;
}