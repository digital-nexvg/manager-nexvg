import type { Client } from '../../types';

type MonthlyPaymentFormProps = {
  clients: Client[];
  selectedClientId: string | null;
  dueDate: string;
  promotionalValue: number;
  fixedValue: number;
  onSelectedClientIdChange: (clientId: string) => void;
  onDueDateChange: (value: string) => void;
  onPromotionalValueChange: (value: string) => void;
  onFixedValueChange: (value: string) => void;
  onSubmit: () => void;
};

export function MonthlyPaymentForm({
  clients,
  selectedClientId,
  dueDate,
  promotionalValue,
  fixedValue,
  onSelectedClientIdChange,
  onDueDateChange,
  onPromotionalValueChange,
  onFixedValueChange,
  onSubmit,
}: MonthlyPaymentFormProps) {
  return (
    <form
      className="monthly-payment-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="monthly-payment-form__grid">
        <label>
          <span>Empresa</span>
          <select value={selectedClientId ?? ''} onChange={(event) => onSelectedClientIdChange(event.target.value)}>
            <option value="">Selecione a empresa</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.companyName}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Data de vencimento</span>
          <input type="date" value={dueDate} onChange={(event) => onDueDateChange(event.target.value)} />
        </label>

        <label>
          <span>Valor promocional</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={promotionalValue}
            onChange={(event) => onPromotionalValueChange(event.target.value)}
          />
        </label>

        <label>
          <span>Valor fixo após vencimento</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={fixedValue}
            onChange={(event) => onFixedValueChange(event.target.value)}
          />
        </label>
      </div>

      <div className="monthly-payment-form__actions">
        <button type="submit" className="btn btn--primary">
          Salvar mensalidade
        </button>
      </div>
    </form>
  );
}
