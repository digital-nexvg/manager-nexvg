import type { PaymentFormData } from '../../types';

type PaymentFormProps = {
  formData: PaymentFormData;
  isEditing: boolean;
  onChange: (field: keyof PaymentFormData, value: string | boolean) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

export function PaymentForm({
  formData,
  isEditing,
  onChange,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  return (
    <form
      className="payment-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="payment-form__grid">
        <label>
          <span>Descrição</span>
          <input
            required
            value={formData.description}
            onChange={(event) => onChange('description', event.target.value)}
          />
        </label>

        <label>
          <span>Valor</span>
          <input
            required
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
            required
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

      <div className="payment-form__actions">
        <button type="submit" className="btn btn--primary">
          {isEditing ? 'Salvar pagamento' : 'Adicionar pagamento'}
        </button>

        {isEditing && onCancel ? (
          <button type="button" className="btn btn--secondary" onClick={onCancel}>
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}
