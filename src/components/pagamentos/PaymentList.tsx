import { useState } from 'react';
import type { Client, Payment } from '../../types';
import { formatDate } from '../../utils/formatters';

type PaymentListProps = {
  client: Client;
  onAddPayment: (clientId: string) => void;
  onTogglePayment: (clientId: string, paymentId: string, paid: boolean, paymentDate?: string) => void;
  onDeletePayment: (clientId: string, paymentId: string) => void;
  onUpdatePaymentReason: (clientId: string, paymentId: string, reason: string) => void;
};

type PaymentMonthGroup = {
  key: string;
  payments: Payment[];
  total: number;
};

function groupPaymentsByMonth(payments: Payment[]): PaymentMonthGroup[] {
  const groups = new Map<string, Payment[]>();

  payments.forEach((payment) => {
    const month = payment.month || payment.dueDate.slice(0, 7) || 'sem-mes';
    groups.set(month, [...(groups.get(month) ?? []), payment]);
  });

  return [...groups.entries()]
    .map(([key, monthlyPayments]) => ({
      key,
      payments: monthlyPayments,
      total: monthlyPayments.reduce((sum, payment) => sum + payment.value, 0),
    }))
    .sort((first, second) => second.key.localeCompare(first.key));
}

function formatMonth(month: string): string {
  if (month === 'sem-mes') {
    return 'Mês não informado';
  }

  return new Date(`${month}-01T00:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function getStatus(payment: Payment) {
  if (payment.paid) {
    return 'paid';
  }

  const today = new Date();
  const dueDate = new Date(payment.dueDate);
  const diffInDays = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);

  if (diffInDays < 0) {
    return 'overdue';
  }

  return 'pending';
}

export function PaymentList({ client, onTogglePayment, onDeletePayment, onUpdatePaymentReason }: PaymentListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [editedReasons, setEditedReasons] = useState<Record<string, string>>({});
  const [paymentToConfirm, setPaymentToConfirm] = useState<Payment | null>(null);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const pendingPayments = client.payments.filter((payment) => !payment.paid);
  const pendingValue = pendingPayments.reduce((sum, payment) => sum + payment.value, 0);
  const nextDuePayment = pendingPayments
    .slice()
    .sort((first, second) => new Date(first.dueDate).getTime() - new Date(second.dueDate).getTime())[0];
  const monthlyGroups = groupPaymentsByMonth(client.payments);

  return (
    <section className="payment-list">
      <div className="payment-list__header">
        <div className="payment-list__header-main">
          <div className="payment-list__company-line">
            <h3>{client.companyName}</h3>
            <p>{client.responsible}</p>
          </div>

          <div className="payment-list__summary-inline-group">
            <span className="payment-list__summary-inline">Valor pendente: {formatCurrency(pendingValue)}</span>
            <span className="payment-list__summary-inline">
              Proximo vencimento: {nextDuePayment ? formatDate(nextDuePayment.dueDate) : '—'}
            </span>
          </div>
        </div>

        <button type="button" className="btn btn--primary" onClick={() => setIsExpanded((current) => !current)}>
          {isExpanded ? 'Ocultar' : 'Acessar informações'}
        </button>
      </div>

      {isExpanded && (
        <div className="payment-list__body">
          {client.payments.length === 0 ? (
            <p className="empty-state">Este cliente ainda não possui pagamentos.</p>
          ) : (
            <div className="payment-list__months">
              {monthlyGroups.map((group) => (
                <section key={group.key} className="payment-month">
                  <div className="payment-month__summary">
                    <div>
                      <strong>{formatMonth(group.key)}</strong>
                      <span>{group.payments.length} {group.payments.length === 1 ? 'cobrança' : 'cobranças'}</span>
                    </div>
                    <strong className="payment-month__total">Total do mês: {formatCurrency(group.total)}</strong>
                    <button
                      type="button"
                      className="btn btn--secondary btn--small"
                      aria-expanded={selectedMonth === group.key}
                      onClick={() => setSelectedMonth((current) => (current === group.key ? null : group.key))}
                    >
                      {selectedMonth === group.key ? 'Ocultar detalhes' : 'Ver detalhes'}
                    </button>
                  </div>

                  {selectedMonth === group.key ? (
                    <div className="payment-list__rows">
                      {group.payments.map((payment) => {
                        const status = getStatus(payment);
                        const currentReason = payment.reason ?? '';
                        const editedReason = editedReasons[payment.id] ?? currentReason;

                        return (
                          <article key={payment.id} className={`payment-row payment-row--${status}`}>
                            <div className="payment-row__main">
                              <div>
                                <strong>{payment.description}</strong>
                                <p>{formatDate(payment.dueDate)}</p>
                              </div>

                              <span className="payment-row__value">{formatCurrency(payment.value)}</span>
                            </div>

                            <div className="payment-row__reason">
                              <label htmlFor={`payment-reason-${payment.id}`}>Motivo da cobrança</label>
                              <input
                                id={`payment-reason-${payment.id}`}
                                type="text"
                                value={editedReason}
                                placeholder="Adicione o motivo (opcional)"
                                onChange={(event) =>
                                  setEditedReasons((current) => ({ ...current, [payment.id]: event.target.value }))
                                }
                              />
                              <button
                                type="button"
                                className="btn btn--secondary btn--small"
                                disabled={editedReason === currentReason}
                                onClick={() => {
                                  onUpdatePaymentReason(client.id, payment.id, editedReason.trim());
                                  setEditedReasons((current) => {
                                    const next = { ...current };
                                    delete next[payment.id];
                                    return next;
                                  });
                                }}
                              >
                                Salvar motivo
                              </button>
                            </div>

                            <div className="payment-row__meta">
                              <label className="payment-row__checkbox">
                                <input
                                  type="checkbox"
                                  checked={payment.paid}
                                  onChange={(event) => {
                                    if (event.target.checked) {
                                      setPaymentToConfirm(payment);
                                      setPaymentDate(payment.paymentDate || new Date().toISOString().slice(0, 10));
                                      return;
                                    }

                                    onTogglePayment(client.id, payment.id, false);
                                  }}
                                />
                                <span>{payment.paid ? 'Pago' : 'Em aberto'}</span>
                              </label>

                              <span className="payment-row__status">
                                {status === 'paid' ? 'Pago' : status === 'pending' ? 'Em aberto' : 'Vencido'}
                              </span>

                              <button
                                type="button"
                                className="btn btn--danger btn--small"
                                onClick={() => onDeletePayment(client.id, payment.id)}
                              >
                                Excluir
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          )}
        </div>
      )}

      {paymentToConfirm ? (
        <div className="confirmation-modal" role="dialog" aria-modal="true">
          <div className="confirmation-modal__card">
            <h3>Confirmar pagamento</h3>
            <p>
              Informe a data em que o pagamento foi realmente recebido para calcular o mês correto do valor recebido.
            </p>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
              <span>Data do pagamento</span>
              <input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
            </label>

            <div className="confirmation-modal__actions">
              <button type="button" className="btn btn--secondary" onClick={() => setPaymentToConfirm(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  onTogglePayment(client.id, paymentToConfirm.id, true, paymentDate);
                  setPaymentToConfirm(null);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
