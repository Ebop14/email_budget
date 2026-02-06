import { invoke } from '@tauri-apps/api/core';
import type {
  TransactionWithCategory,
  TransactionFilters,
  ParsedTransaction,
  ImportResult,
  Category,
  CategorySpending,
  BudgetWithProgress,
  Budget,
  GmailConnectionStatus,
  SenderFilter,
  GmailSyncResult,
} from '../types';

// Import commands
export async function importReceipts(
  htmlContents: string[]
): Promise<{ transactions: ParsedTransaction[]; duplicates: number; errors: string[] }> {
  return invoke('import_receipts', { htmlContents });
}

export async function confirmImport(
  transactions: ParsedTransaction[],
  categoryAssignments: Record<number, string>
): Promise<ImportResult> {
  return invoke('confirm_import', { transactions, categoryAssignments });
}

// Transaction commands
export async function getTransactions(
  filters?: TransactionFilters
): Promise<TransactionWithCategory[]> {
  return invoke('get_transactions', { filters });
}

export async function updateTransactionCategory(
  transactionId: string,
  categoryId: string | null
): Promise<void> {
  return invoke('update_transaction_category', { transactionId, categoryId });
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  return invoke('delete_transaction', { transactionId });
}

// Category commands
export async function getCategories(): Promise<Category[]> {
  return invoke('get_categories');
}

export async function createCategory(
  name: string,
  icon: string,
  color: string
): Promise<Category> {
  return invoke('create_category', { name, icon, color });
}

export async function updateCategory(
  categoryId: string,
  name: string,
  icon: string,
  color: string
): Promise<void> {
  return invoke('update_category', { categoryId, name, icon, color });
}

export async function deleteCategory(categoryId: string): Promise<void> {
  return invoke('delete_category', { categoryId });
}

export async function getCategorySpending(
  startDate: string,
  endDate: string
): Promise<CategorySpending[]> {
  return invoke('get_category_spending', { startDate, endDate });
}

// Budget commands
export async function getBudgets(): Promise<BudgetWithProgress[]> {
  return invoke('get_budgets');
}

export async function setBudget(
  categoryId: string,
  amount: number,
  period: 'weekly' | 'monthly' | 'yearly'
): Promise<Budget> {
  return invoke('set_budget', { categoryId, amount, period });
}

export async function deleteBudget(budgetId: string): Promise<void> {
  return invoke('delete_budget', { budgetId });
}

// Dashboard commands
export interface DashboardStats {
  total_spent: number;
  transaction_count: number;
  category_count: number;
  budget_health: 'good' | 'warning' | 'over';
  category_spending: CategorySpending[];
  recent_transactions: TransactionWithCategory[];
  top_merchants: { merchant: string; total: number; count: number }[];
}

export async function getDashboardStats(
  month: number,
  year: number
): Promise<DashboardStats> {
  return invoke('get_dashboard_stats', { month, year });
}

// Platform commands
export async function getPlatform(): Promise<string> {
  return invoke('get_platform');
}

// Settings commands
export async function initializeDatabase(): Promise<void> {
  return invoke('initialize_database');
}

export async function setMerchantCategoryRule(
  merchantPattern: string,
  categoryId: string,
  isExactMatch: boolean
): Promise<void> {
  return invoke('set_merchant_category_rule', {
    merchantPattern,
    categoryId,
    isExactMatch,
  });
}

// OCR commands
export async function importReceiptFromOcr(
  ocrText: string,
  confidence: number
): Promise<ParsedTransaction> {
  return invoke('import_receipt_from_ocr', { ocrText, confidence });
}

export async function captureReceiptPhoto(
  source: 'camera' | 'library'
): Promise<{ text: string; confidence: number }> {
  return invoke('plugin:receipt-capture|capture_and_recognize', { source });
}

// Gmail commands
export async function gmailSaveCredentials(
  clientId: string,
  clientSecret: string
): Promise<void> {
  return invoke('gmail_save_credentials', { clientId, clientSecret });
}

export async function gmailHasCredentials(): Promise<boolean> {
  return invoke('gmail_has_credentials');
}

export async function gmailDeleteCredentials(): Promise<void> {
  return invoke('gmail_delete_credentials');
}

export async function gmailConnect(): Promise<string> {
  return invoke('gmail_connect');
}

export async function gmailDisconnect(): Promise<void> {
  return invoke('gmail_disconnect');
}

export async function gmailGetStatus(): Promise<GmailConnectionStatus> {
  return invoke('gmail_get_status');
}

export async function gmailStartPolling(): Promise<void> {
  return invoke('gmail_start_polling');
}

export async function gmailStopPolling(): Promise<void> {
  return invoke('gmail_stop_polling');
}

export async function gmailSyncNow(): Promise<GmailSyncResult> {
  return invoke('gmail_sync_now');
}

export async function gmailGetSenderFilters(): Promise<SenderFilter[]> {
  return invoke('gmail_get_sender_filters');
}

export async function gmailAddSenderFilter(
  email: string,
  label: string
): Promise<SenderFilter> {
  return invoke('gmail_add_sender_filter', { email, label });
}

export async function gmailRemoveSenderFilter(filterId: string): Promise<void> {
  return invoke('gmail_remove_sender_filter', { filterId });
}

export async function gmailToggleSenderFilter(filterId: string): Promise<void> {
  return invoke('gmail_toggle_sender_filter', { filterId });
}

export async function gmailExchangeCode(code: string): Promise<string> {
  return invoke('gmail_exchange_code', { code });
}
