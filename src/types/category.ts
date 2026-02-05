export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface MerchantCategoryRule {
  id: string;
  user_id: string;
  merchant_pattern: string;
  category_id: string;
  is_exact_match: boolean;
  created_at: string;
}

export interface CategorySpending {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  total: number; // cents
  transaction_count: number;
  percentage: number; // 0.0 to 1.0
}
