import { useState } from 'react';
import type { Client, Payment } from '../../types';
import { formatDate } from '../../utils/formatters';

type PaymentListProps = {
  client: Client;
  onAddPayment: (clientId: string) => void;
  onTogglePayment: (clientId: string, paymentId: string, paid: boolean, paymentDate?: string) => void;
  onDeletePayment: (clientId: string, paymentId: string) => void;
};

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

export function PaymentList({ client, onTogglePayment, onDeletePayment }: PaymentListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [paymentToConfirm, setPaymentToConfirm] = useState<Payment | null>(null);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const pendingPayments = client.payments.filter((payment) => !payment.paid);
  const pendingValue = pendingPayments.reduce((sum, payment) => sum + payment.value, 0);
  const nextDuePayment = pendingPayments
    .slice()
    .sort((first, second) => new Date(first.dueDate).getTime() - new Date(second.dueDate).getTime())[0];

  return (
    <section className="payment-list">
      <div className="payment-list__header">
        <div className="payment-list__header-main">
          <div className="payment-list__company-line">
            <h3>{client.companyName}</h3>
            <p>{client.responsible}</p>
          </div>

          <div className="payment-list__summary-inline-group">
            <span className="payment-list__summary-inline">Valor pendente: R$ {pendingValue.toFixed(2)}</span>
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
            <div className="payment-list__rows">
              {client.payments.map((payment) => {
                const status = getStatus(payment);

                return (
                  <article key={payment.id} className={`payment-row payment-row--${status}`}>
                    <div className="payment-row__main">
                      <div>
                        <strong>{payment.description}</strong>
                        <p>{formatDate(payment.dueDate)}</p>
                      </div>

                      <span className="payment-row__value">R$ {payment.value.toFixed(2)}</span>
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
