// EXPORTS: ITask, Priority, PRIORITY_LABELS, PRIORITY_VALUES, SupabaseConfig

export type Priority = '高' | '中' | '低';

export const PRIORITY_VALUES: Priority[] = ['高', '中', '低'];

export const PRIORITY_LABELS: Record<Priority, string> = {
  '高': '高',
  '中': '中',
  '低': '低',
};

export interface ITask {
  id: number;
  title: string;
  priority: Priority;
  completed: boolean;
  created_at: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}
