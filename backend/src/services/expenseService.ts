import { prisma } from '../config/prisma';

const EXPENSE_REASONS = ['Passagem', 'Banco de dados', 'GitHub Chat', 'Outro'] as const;
type ExpenseReason = (typeof EXPENSE_REASONS)[number];

type ExpensePayload = {
  value?: unknown;
  expenseDate?: unknown;
  reason?: unknown;
  description?: unknown;
};

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isExpenseReason(value: unknown): value is ExpenseReason {
  return typeof value === 'string' && EXPENSE_REASONS.includes(value as ExpenseReason);
}

function serializeExpense(expense: {
  id: string;
  value: { toNumber(): number };
  expenseDate: Date;
  reason: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: expense.id,
    value: expense.value.toNumber(),
    expenseDate: expense.expenseDate.toISOString().slice(0, 10),
    reason: expense.reason,
    description: expense.description,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}

export const expenseService = {
  list: async () => {
    const expenses = await prisma.expense.findMany({ orderBy: { expenseDate: 'desc' } });
    return expenses.map(serializeExpense);
  },

  create: async (payload: ExpensePayload) => {
    const value = Number(payload.value);
    const expenseDate = normalizeText(payload.expenseDate);
    const reason = payload.reason;
    const description = normalizeText(payload.description);

    if (!Number.isFinite(value) || value <= 0) {
      throw new Error('Informe um valor de despesa maior que zero.');
    }

    if (!expenseDate || Number.isNaN(new Date(`${expenseDate}T00:00:00`).getTime())) {
      throw new Error('Informe uma data válida para a despesa.');
    }

    if (!isExpenseReason(reason)) {
      throw new Error('Informe um motivo válido para a despesa.');
    }

    if (reason === 'Outro' && !description) {
      throw new Error('Especifique o motivo da despesa.');
    }

    const expense = await prisma.expense.create({
      data: {
        value,
        expenseDate: new Date(`${expenseDate}T00:00:00`),
        reason,
        description: description || null,
      },
    });

    return serializeExpense(expense);
  },

  remove: async (id: string) => {
    if (!id) {
      throw new Error('Despesa não informada.');
    }

    await prisma.expense.delete({ where: { id } });
  },
};