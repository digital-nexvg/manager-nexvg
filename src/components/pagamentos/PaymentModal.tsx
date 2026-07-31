import type { Client, PaymentFormData } from '../../types';

type PaymentModalProps = {
  isOpen: boolean;
  client: Client | null;
  formData: PaymentFormData;
  onChange: (field: keyof PaymentFormData, value: string | boolean) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function PaymentModal({
  isOpen,
  client,
  formData,
  onChange,
  onSubmit,
  onClose,
}: PaymentModalProps) {
  if (!isOpen || !client) {
    return null;
  }

  return (
    <div className="payment-modal">
      <div className="payment-modal__card">
        <div className="payment-modal__header">
          <div>
            <p className="section-tag">Pagamento</p>
            <h3>{client.companyName}</h3>
          </div>
          <button type="button" className="btn btn--close" onClick={onClose} aria-label="Fechar pagamento">
            ×
          </button>
        </div>

        <div className="payment-modal__form">
          <label>
            <span>Descrição</span>
            <input
              value={formData.description}
              onChange={(event) => onChange('description', event.target.value)}
            />
          </label>

          <label>
            <span>Valor</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.value}
              onChange={(event) => onChange('value', event.target.value)}
            />
          </label>

          <label>
            <span>Data do pagamento</span>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(event) => onChange('paymentDate', event.target.value)}
            />
          </label>

          <label>
            <span>Data de vencimento</span>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(event) => onChange('dueDate', event.target.value)}
            />
          </label>

          <label>
            <span>Mês da primeira mensalidade</span>
            <input
              type="month"
              value={formData.month}
              onChange={(event) => onChange('month', event.target.value)}
            />
          </label>

          <label className="payment-form__checkbox">
            <input
              type="checkbox"
              checked={formData.paid}
              onChange={(event) => onChange('paid', event.target.checked)}
            />
            <span>Pago</span>
          </label>
        </div>

        <div className="payment-modal__actions">
          <button type="button" className="btn btn--primary" onClick={onSubmit}>
            Salvar pagamento
          </button>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
