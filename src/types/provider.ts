export interface Provider {
  id: string;
  name: string;
  icon: string;
  defaultCategory: string;
  complexity: 'low' | 'medium' | 'high';
}

export interface SelectedProvider {
  id: string;
  user_id: string;
  provider_id: string;
  created_at: string;
}
