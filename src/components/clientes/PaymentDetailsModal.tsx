import type { Client, Payment } from '../../types';
import { formatDate } from '../../utils/formatters';

type PaymentDetailsModalProps = {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
};

function getPaymentStatus(payment: Payment) {
  if (payment.paid) {
    return 'Pago';
  }

  const diffInDays = Math.ceil((new Date(payment.dueDate).getTime() - new Date().getTime()) / 86400000);

  if (diffInDays < 0) {
    return 'Vencido';
  }

  return 'Em aberto';
}

export function PaymentDetailsModal({ isOpen, client, onClose }: PaymentDetailsModalProps) {
  if (!isOpen || !client) {
    return null;
  }

  const pendingPayments = client.payments.filter((payment) => !payment.paid);
  const nextPayment = pendingPayments
    .slice()
    .sort((first, second) => new Date(first.dueDate).getTime() - new Date(second.dueDate).getTime())[0];

  return (
    <div className="payment-details-modal">
      <div className="payment-details-modal__card">
        <div className="payment-details-modal__header">
          <div>
            <p className="section-tag">Próximo pagamento</p>
            <h3>{client.companyName}</h3>
            <p>{client.responsible}</p>
          </div>

          <button type="button" className="btn btn--ghost btn--close" onClick={onClose} aria-label="Fechar detalhes do pagamento">
            ×
          </button>
        </div>

        <div className="payment-details-modal__body">
          {nextPayment ? (
            <div className="payment-details-modal__summary">
              <span>Descrição: {nextPayment.description}</span>
              <span>Valor: R$ {nextPayment.value.toFixed(2)}</span>
              <span>Vencimento: {formatDate(nextPayment.dueDate)}</span>
              <span>Status: {getPaymentStatus(nextPayment)}</span>
              <span>Mês: {nextPayment.month ? new Date(`${nextPayment.month}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '—'}</span>
              <span>Pagamento: {nextPayment.paymentDate ? formatDate(nextPayment.paymentDate) : '—'}</span>
            </div>
          ) : (
            <p className="empty-state">Não há pagamentos pendentes para esta empresa.</p>
          )}

          <div className="payment-details-modal__list">
            {client.payments.map((payment) => (
              <div key={payment.id} className="payment-details-modal__item">
                <strong>{payment.description}</strong>
                <span>R$ {payment.value.toFixed(2)}</span>
                <span>{formatDate(payment.dueDate)}</span>
                <span>{payment.paid ? 'Pago' : 'Em aberto'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
