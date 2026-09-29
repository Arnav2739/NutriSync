import api from './api';

export interface BiometricLogCreate {
  weight_kg: number;
  body_fat_pct?: number | null;
  waist_cm?: number | null;
  chest_cm?: number | null;
  arms_cm?: number | null;
  notes?: string | null;
  logged_at?: string | null;
}

export interface BiometricLogResponse {
  id: string;
  user_id: string;
  logged_at: string;
  weight_kg: number;
  body_fat_pct?: number | null;
  waist_cm?: number | null;
  chest_cm?: number | null;
  arms_cm?: number | null;
  notes?: string | null;
}

export interface TrajectoryPoint {
  date: string;
  weight: number;
  target: number;
}

export interface BiometricsProgressOverview {
  starting_weight_kg: number;
  current_weight_kg: number;
  target_weight_kg: number;
  weight_delta_kg: number;
  to_target_delta_kg: number;
  progress_pct: number;
  goal_direction: 'loss' | 'gain' | 'maintenance';
  height_cm: number;
  current_bmi: number;
  current_bmi_category: string;
  total_logs_count: number;
  logs: BiometricLogResponse[];
  trajectory_points: TrajectoryPoint[];
}

export interface ProfilePartialUpdate {
  target_weight_kg?: number;
  weight_kg?: number;
  primary_goal?: string;
  activity_level?: string;
  dietary_preference?: string;
}

export const biometricsService = {
  getOverview: async (): Promise<BiometricsProgressOverview> => {
    const res = await api.get<BiometricsProgressOverview>('/progress/biometrics');
    return res.data;
  },

  logEntry: async (entry: BiometricLogCreate): Promise<BiometricLogResponse> => {
    const res = await api.post<BiometricLogResponse>('/progress/biometrics', entry);
    return res.data;
  },

  deleteEntry: async (id: string): Promise<void> => {
    await api.delete(`/progress/biometrics/${id}`);
  },

  updateProfile: async (data: ProfilePartialUpdate) => {
    const res = await api.put('/profile', data);
    return res.data;
  },
};
