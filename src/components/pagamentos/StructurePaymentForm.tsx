import type { Client } from '../../types';

type StructurePaymentFormProps = {
  mode?: 'structure' | 'resource';
  clients: Client[];
  selectedClientId: string | null;
  installmentValue: number;
  installmentsQuantity: number;
  startDate: string;
  scheduleDates: string[];
  onSelectedClientIdChange: (clientId: string) => void;
  onInstallmentValueChange: (value: string) => void;
  onInstallmentsQuantityChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onScheduleDateChange: (index: number, value: string) => void;
  onGenerateSchedule: () => void;
  onSubmit: () => void;
};

export function StructurePaymentForm({
  mode = 'structure',
  clients,
  selectedClientId,
  installmentValue,
  installmentsQuantity,
  startDate,
  scheduleDates,
  onSelectedClientIdChange,
  onInstallmentValueChange,
  onInstallmentsQuantityChange,
  onStartDateChange,
  onScheduleDateChange,
  onGenerateSchedule,
  onSubmit,
}: StructurePaymentFormProps) {
  const totalValue = installmentValue * installmentsQuantity;
  const isResource = mode === 'resource';

  return (
    <form
      className="structure-payment-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div
        className="structure-payment-form__table"
        role="table"
        aria-label={isResource ? 'Cadastro de recurso' : 'Cadastro de cobrança de estrutura'}
      >
        <div className="structure-payment-form__table-head" role="row">
          <span role="columnheader">Empresa</span>
          <span role="columnheader">Valor da parcela</span>
          <span role="columnheader">Qtd. parcelas</span>
          <span role="columnheader">Data inicial</span>
        </div>
        <div className="structure-payment-form__table-body" role="rowgroup">
          <label className="structure-payment-form__table-cell" role="row">
            <span className="structure-payment-form__mobile-label">Empresa</span>
            <select value={selectedClientId ?? ''} onChange={(event) => onSelectedClientIdChange(event.target.value)}>
            <option value="">Selecione a empresa</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.companyName}
              </option>
            ))}
          </select>
        </label>

          <label className="structure-payment-form__table-cell" role="row">
            <span className="structure-payment-form__mobile-label">Valor da parcela</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={installmentValue}
              onChange={(event) => onInstallmentValueChange(event.target.value)}
            />
          </label>

          <label className="structure-payment-form__table-cell" role="row">
            <span className="structure-payment-form__mobile-label">Quantidade de parcelas</span>
            <input
              type="number"
              min="1"
              step="1"
              value={installmentsQuantity}
              onChange={(event) => onInstallmentsQuantityChange(event.target.value)}
            />
          </label>

          <label className="structure-payment-form__table-cell" role="row">
            <span className="structure-payment-form__mobile-label">Data inicial</span>
            <input type="date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} />
          </label>
        </div>
      </div>

      <div className="structure-payment-form__summary">
        <div>
          <span className="structure-payment-form__label">Total previsto</span>
          <strong>R$ {totalValue.toFixed(2)}</strong>
        </div>

        <button type="button" className="btn btn--secondary" onClick={onGenerateSchedule}>
          Gerar calendário
        </button>
      </div>

      <div className="structure-payment-form__calendar">
        {scheduleDates.length ? (
          scheduleDates.map((date, index) => (
            <label key={`${date}-${index}`} className="structure-payment-form__date-field">
              <span>Parcela {index + 1}</span>
              <input
                type="date"
                value={date}
                onChange={(event) => onScheduleDateChange(index, event.target.value)}
              />
            </label>
          ))
        ) : (
          <p className="empty-state">Ainda não há calendário gerado para essa cobrança.</p>
        )}
      </div>

      <div className="structure-payment-form__actions">
        <button type="submit" className="btn btn--primary">
          {isResource ? 'Salvar recurso' : 'Salvar cobrança da estrutura'}
        </button>
      </div>
    </form>
  );
}
