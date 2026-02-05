import type { Category, Provider } from '../types';

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  { name: 'Food & Dining', icon: 'utensils', color: '#ef4444', is_system: true },
  { name: 'Food Delivery', icon: 'bike', color: '#f97316', is_system: true },
  { name: 'Transportation', icon: 'car', color: '#eab308', is_system: true },
  { name: 'Rideshare', icon: 'map-pin', color: '#84cc16', is_system: true },
  { name: 'Shopping', icon: 'shopping-bag', color: '#22c55e', is_system: true },
  { name: 'Entertainment', icon: 'film', color: '#14b8a6', is_system: true },
  { name: 'Subscriptions', icon: 'repeat', color: '#06b6d4', is_system: true },
  { name: 'Utilities', icon: 'zap', color: '#0ea5e9', is_system: true },
  { name: 'Healthcare', icon: 'heart-pulse', color: '#3b82f6', is_system: true },
  { name: 'Personal Care', icon: 'sparkles', color: '#6366f1', is_system: true },
  { name: 'Travel', icon: 'plane', color: '#8b5cf6', is_system: true },
  { name: 'Gifts & Donations', icon: 'gift', color: '#a855f7', is_system: true },
  { name: 'Education', icon: 'graduation-cap', color: '#d946ef', is_system: true },
  { name: 'Peer Payment', icon: 'users', color: '#ec4899', is_system: true },
  { name: 'Uncategorized', icon: 'help-circle', color: '#6b7280', is_system: true },
];

export const SUPPORTED_PROVIDERS: Provider[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    icon: 'package',
    defaultCategory: 'Shopping',
    complexity: 'high',
  },
  {
    id: 'doordash',
    name: 'DoorDash',
    icon: 'bike',
    defaultCategory: 'Food Delivery',
    complexity: 'medium',
  },
  {
    id: 'uber_eats',
    name: 'Uber Eats',
    icon: 'utensils',
    defaultCategory: 'Food Delivery',
    complexity: 'medium',
  },
  {
    id: 'uber',
    name: 'Uber',
    icon: 'car',
    defaultCategory: 'Rideshare',
    complexity: 'low',
  },
  {
    id: 'venmo',
    name: 'Venmo',
    icon: 'credit-card',
    defaultCategory: 'Peer Payment',
    complexity: 'medium',
  },
];

export const CATEGORY_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#6b7280', // gray
];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
