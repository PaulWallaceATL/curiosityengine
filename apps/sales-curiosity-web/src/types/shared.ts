export interface User {
  id: string;
  email: string;
  organization_id: string;
  role: 'admin' | 'user';
  created_at?: string;
}

export type TaskType = 'research' | 'email' | 'briefing';

export interface Task {
  id: string;
  user_id: string;
  type: TaskType;
  description: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}


