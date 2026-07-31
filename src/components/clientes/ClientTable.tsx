import { useState } from 'react';
import type { Client } from '../../types';
import { formatDate } from '../../utils/formatters';
import { PaymentDetailsModal } from './PaymentDetailsModal';
import { ClientJourneyModal } from './ClientJourneyModal';
import { getClientJourneyCompletionStatus, getJourneyStatusLabel } from '../../utils/clientJourney';

type ClientTableProps = {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onSaveJourney: (client: Client) => void;
};

export function ClientTable({ clients, onEdit, onDelete, onSaveJourney }: ClientTableProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [journeyClient, setJourneyClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const handleConfirmDelete = () => {
    if (clientToDelete) {
      onDelete(clientToDelete.id);
      setClientToDelete(null);
    }
  };

  if (!clients.length) {
    return <p className="empty-state">Nenhum cliente encontrado.</p>;
  }

  return (
    <div className="client-table-wrapper">
      <table className="client-table">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Responsável</th>
            <th>Status</th>
            <th>Segmento</th>
            <th>Próximo pagamento</th>
            <th>Próxima etapa</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {clients.map((client) => {
            const pendingPayments = client.payments.filter((payment) => !payment.paid);
            const nextPayment = pendingPayments
              .slice()
              .sort((first, second) => new Date(first.dueDate).getTime() - new Date(second.dueDate).getTime())[0];

            return (
              <tr key={client.id}>
                <td>
                  <button
                    type="button"
                    className="btn btn--ghost client-table__name-trigger"
                    onClick={() => setJourneyClient(client)}
                  >
                    {client.companyName}
                  </button>
                </td>
                <td>{client.responsible}</td>
                <td>{getClientJourneyCompletionStatus(client.journey)}</td>
                <td>{client.segment || '—'}</td>
                <td>
                  {nextPayment ? (
                    <button
                      type="button"
                      className="btn btn--ghost payment-table__trigger"
                      onClick={() => setSelectedClient(client)}
                    >
                      {formatDate(nextPayment.dueDate)} • R${' '}
                      {nextPayment.value.toFixed(2)}
                    </button>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <span className="status-badge status-badge--waiting-entry">
                    {getJourneyStatusLabel(client.journey)}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="btn btn--ghost" onClick={() => onEdit(client)}>
                      Editar
                    </button>
                    <button type="button" className="btn btn--danger" onClick={() => setClientToDelete(client)}>
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {clientToDelete && (
        <div className="confirmation-modal" role="dialog" aria-modal="true">
          <div className="confirmation-modal__card">
            <h3>Tem certeza que quer remover?</h3>
            <p>Essa ação removerá o cliente e todos os dados associados.</p>
            <div className="confirmation-modal__actions">
              <button type="button" className="btn btn--secondary" onClick={() => setClientToDelete(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn--danger" onClick={handleConfirmDelete}>
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      <PaymentDetailsModal isOpen={Boolean(selectedClient)} client={selectedClient} onClose={() => setSelectedClient(null)} />

      <ClientJourneyModal
        isOpen={Boolean(journeyClient)}
        client={journeyClient}
        onClose={() => setJourneyClient(null)}
        onSave={onSaveJourney}
        onEditClient={onEdit}
      />
    </div>
  );
}
