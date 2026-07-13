export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  status: 'active' | 'done' | 'deleted';
  allocated_amount: number | null;
  created_at: string;
}

export interface BudgetEntry {
  id: string;
  user_id: string;
  amount: number;
  note: string | null;
  date: string; // yyyy-mm-dd
}

export interface Expense {
  id: string;
  user_id: string;
  project_id: string;
  category_id: string | null;
  amount: number;
  description: string | null;
  vendor: string | null;
  date: string; // yyyy-mm-dd
}

export interface PlannedBudget {
  id: string;
  user_id: string;
  project_id: string;
  category_id: string;
  planned_amount: number;
}

export type Period = 'week' | 'month' | 'year' | 'all' | 'custom';

export interface PeriodFilter {
  period: Period;
  from?: string;
  to?: string;
}
