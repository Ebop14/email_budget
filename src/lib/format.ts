/**
 * Format cents to a dollar string
 * @param cents Amount in cents (integer)
 * @returns Formatted string like "$12.34"
 */
export function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/**
 * Format cents to a compact dollar string (no cents for whole dollars)
 * @param cents Amount in cents (integer)
 * @returns Formatted string like "$12" or "$12.50"
 */
export function formatCurrencyCompact(cents: number): string {
  const dollars = cents / 100;
  if (dollars % 1 === 0) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(dollars);
  }
  return formatCurrency(cents);
}

/**
 * Parse a dollar string to cents
 * @param value String like "$12.34" or "12.34"
 * @returns Amount in cents (integer)
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const dollars = parseFloat(cleaned) || 0;
  return Math.round(dollars * 100);
}

/**
 * Format a date for display
 * @param date Date string in ISO format (YYYY-MM-DD) or Date object
 * @returns Formatted string like "Jan 15, 2024"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a date for short display
 * @param date Date string in ISO format (YYYY-MM-DD) or Date object
 * @returns Formatted string like "Jan 15"
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Format a date relative to today
 * @param date Date string in ISO format (YYYY-MM-DD) or Date object
 * @returns Formatted string like "Today", "Yesterday", or "Jan 15"
 */
export function formatDateRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - d.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return formatDateShort(d);
}

/**
 * Get the month name and year from a date
 * @param date Date string in ISO format (YYYY-MM-DD) or Date object
 * @returns Formatted string like "January 2024"
 */
export function formatMonthYear(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a percentage
 * @param value Decimal value (0.5 = 50%)
 * @returns Formatted string like "50%"
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
