export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  merchant: string;
  merchant_normalized: string;
  amount: number; // cents
  transaction_date: string; // YYYY-MM-DD
  provider: string;
  source_hash: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  name: string;
  quantity: number;
  unit_price: number; // cents
  total_price: number; // cents
}

export interface ParsedTransaction {
  merchant: string;
  amount: number; // cents
  transaction_date: string; // YYYY-MM-DD
  provider: string;
  items: ParsedItem[];
  raw_text?: string;
  confidence: number; // 0.0 to 1.0
}

export interface ParsedItem {
  name: string;
  quantity: number;
  unit_price: number; // cents
  total_price: number; // cents
}

export interface TransactionWithCategory extends Transaction {
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
}

export interface TransactionFilters {
  search?: string;
  categoryId?: string | null;
  provider?: string | null;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface ImportPreview {
  transactions: ParsedTransaction[];
  duplicates: number;
  errors: string[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}
