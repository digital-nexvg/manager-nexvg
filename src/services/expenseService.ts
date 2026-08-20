import type { Expense, ExpenseFormData } from '../types';
import { api } from './api';

export function getExpenses(): Promise<Expense[]> {
  return api.get<Expense[]>('/api/expenses');
}

export function createExpense(expense: ExpenseFormData): Promise<Expense> {
  return api.post<Expense>('/api/expenses', expense);
}

export function deleteExpense(id: string): Promise<void> {
  return api.delete<void>(`/api/expenses/${id}`);
}