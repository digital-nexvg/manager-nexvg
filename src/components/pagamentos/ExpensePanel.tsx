import { useEffect, useState } from 'react';
import { createExpense, deleteExpense, getExpenses } from '../../services/expenseService';
import { expenseReasonOptions, type Expense, type ExpenseReason } from '../../types';
import { formatDate } from '../../utils/formatters';

function getToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function ExpensePanel() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [value, setValue] = useState('');
  const [expenseDate, setExpenseDate] = useState(getToday);
  const [reason, setReason] = useState<ExpenseReason>('Passagem');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const refreshExpenses = async () => {
    try {
      setExpenses(await getExpenses());
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    }
  };

  useEffect(() => {
    void refreshExpenses();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const createdExpense = await createExpense({
        value: Number(value.replace(',', '.')),
        expenseDate,
        reason,
        description: reason === 'Outro' ? description : undefined,
      });
      setExpenses((current) => [createdExpense, ...current]);
      setValue('');
      setReason('Passagem');
      setDescription('');
      window.dispatchEvent(new Event('nexvg-expenses-update'));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível registrar a despesa.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (expense: Expense) => {
    if (!window.confirm(`Excluir a despesa de ${formatCurrency(expense.value)}?`)) {
      return;
    }

    try {
      await deleteExpense(expense.id);
      setExpenses((current) => current.filter((item) => item.id !== expense.id));
      window.dispatchEvent(new Event('nexvg-expenses-update'));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível excluir a despesa.');
    }
  };

  return (
    <section className="payments-page__form-card">
      <div className="payments-page__form-head">
        <div>
          <p className="section-tag">Despesas</p>
          <h2>Custos operacionais</h2>
        </div>
      </div>

      <form className="payment-form" onSubmit={handleSubmit}>
        <div className="payment-form__grid">
          <label>
            <span>Valor gasto</span>
            <input type="number" min="0.01" step="0.01" value={value} onChange={(event) => setValue(event.target.value)} required />
          </label>
          <label>
            <span>Data</span>
            <input type="date" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} required />
          </label>
          <label>
            <span>Motivo</span>
            <select value={reason} onChange={(event) => setReason(event.target.value as ExpenseReason)}>
              {expenseReasonOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          {reason === 'Outro' ? (
            <label>
              <span>Especifique o motivo</span>
              <input value={description} onChange={(event) => setDescription(event.target.value)} required />
            </label>
          ) : null}
        </div>
        <button type="submit" className="btn btn--primary" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Registrar despesa'}</button>
      </form>

      {expenses.length ? (
        <div className="payment-list">
          {expenses.map((expense) => (
            <div className="payment-list__item" key={expense.id}>
              <div>
                <strong>{expense.reason}{expense.description ? `: ${expense.description}` : ''}</strong>
                <span>{formatDate(expense.expenseDate)}</span>
              </div>
              <div className="payment-list__actions">
                <strong>{formatCurrency(expense.value)}</strong>
                <button type="button" className="btn btn--ghost" onClick={() => void handleDelete(expense)}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}