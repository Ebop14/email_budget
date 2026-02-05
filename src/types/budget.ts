export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number; // cents
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface BudgetWithProgress extends Budget {
  category_name: string;
  category_color: string;
  category_icon: string;
  spent: number; // cents
  remaining: number; // cents
  percentage: number; // 0.0 to 1.0+
  is_over_budget: boolean;
}

export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';
