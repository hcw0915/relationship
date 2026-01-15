export interface ImportantDate {
  id: string;
  user_id: string;
  title: string;
  date: string;
  type: 'birthday' | 'anniversary' | 'other';
  reminder_days_before: number;
  notes?: string;
  created_at: string;
}

export interface ActionMemo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  due_date?: string;
  completed_at?: string;
  created_at: string;
}

export interface PartnerPreference {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description?: string;
  tags?: string[];
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  partner_name?: string;
  theme_mode?: 'system' | 'light' | 'dark';
  theme_color?: string;
  created_at: string;
}

export interface RelationshipTag {
  id: string;
  user_id: string;
  value: string;
  label: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
