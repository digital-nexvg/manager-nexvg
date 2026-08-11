import { useEffect, useMemo, useState } from 'react';
import { ClientForm } from '../components/clientes/ClientForm';
import { ClientTable } from '../components/clientes/ClientTable';
import { SegmentForm } from '../components/clientes/SegmentForm';
import { SearchInput } from '../components/common/SearchInput';
import { createClient, deleteClient, getClients, updateClient } from '../services/clientService';
import type { Client, ClientFormData } from '../types';
import { getClientJourneyCompletionStatus } from '../utils/clientJourney';
import { generateId } from '../utils/id';

const createEmptyForm = (segment = ''): ClientFormData => ({
  companyName: '',
  responsible: '',
  customStatus: 'Novo Cliente',
  whatsapp: '',
  address: '',
  observations: '',
  segment,
  status: 'active',
});

export function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState<ClientFormData>(createEmptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSegmentForm, setShowSegmentForm] = useState(false);
  const [isClientsVisible, setIsClientsVisible] = useState(false);

  useEffect(() => {
    const refreshClients = async () => {
      const nextClients = await getClients();
      setClients(nextClients);
    };

    refreshClients();
    window.addEventListener('nexvg-storage-update', refreshClients);

    return () => {
      window.removeEventListener('nexvg-storage-update', refreshClients);
    };
  }, []);

  const filteredClients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return clients;
    }

    return clients.filter((client) =>
      [client.companyName, client.responsible, client.email, client.whatsapp, client.address]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch)),
    );
  }, [clients, search]);

  const handleChange = (field: keyof ClientFormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const resetForm = (keepSegment = false) => {
    setFormData(createEmptyForm(keepSegment ? formData.segment ?? '' : ''));
    setEditingId(null);
    setShowForm(false);
    setShowSegmentForm(false);
  };

  const handleOpenAddClient = () => {
    setShowSegmentForm(false);
    setShowForm(true);
    setEditingId(null);
    setFormData(createEmptyForm(formData.segment ?? ''));
    setIsClientsVisible(true);
  };

  const handleOpenSegmentForm = () => {
    setShowForm(false);
    setShowSegmentForm(true);
    setIsClientsVisible(true);
  };

  const handleSubmit = async () => {
    const existingClient = clients.find((client) => client.id === editingId);

    const payload: Client = {
      id: editingId ?? generateId(),
      ...formData,
      email: existingClient?.email,
      payments: existingClient?.payments ?? [],
      journey: existingClient?.journey,
    };

    try {
      if (editingId) {
        await updateClient(payload);
      } else {
        await createClient(payload);
      }

      const nextClients = await getClients();
      setClients(nextClients);
      resetForm(true);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      const message = error instanceof Error ? error.message : 'Não foi possível salvar o cliente.';
      alert(`Não foi possível salvar o cliente. ${message}`);
    }
  };

  const handleEdit = (client: Client) => {
    setShowSegmentForm(false);
    setEditingId(client.id);
    setShowForm(true);
    setFormData({
      companyName: client.companyName,
      responsible: client.responsible,
      customStatus: client.customStatus ?? '',
      whatsapp: client.whatsapp ?? '',
      address: client.address ?? '',
      observations: client.observations ?? '',
      segment: client.segment ?? '',
      status: client.status,
    });
    setIsClientsVisible(true);
  };

  const handleDelete = async (id: string) => {
    await deleteClient(id);
    const nextClients = await getClients();
    setClients(nextClients);

    if (editingId === id) {
      resetForm();
    }
  };

  const handleSaveJourney = async (client: Client) => {
    await updateClient({
      ...client,
      customStatus: getClientJourneyCompletionStatus(client.journey),
    });
    const nextClients = await getClients();
    setClients(nextClients);
    return nextClients.find((nextClient) => nextClient.id === client.id) ?? client;
  };

  return (
    <section className="clients-page">
      <div className="clients-page__header">
        <div>
          <p className="section-tag">Clientes</p>
          <h1>Cadastro e gestão de clientes</h1>
        </div>

        <div className="clients-page__actions">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              if (value.trim()) {
                setIsClientsVisible(true);
              }
            }}
            placeholder="Buscar por empresa, responsável ou contato"
          />

          <button type="button" className="btn btn--secondary" onClick={handleOpenAddClient}>
            Adicionar cliente
          </button>

          <button type="button" className="btn btn--primary" onClick={handleOpenSegmentForm}>
            Criar segmento
          </button>
        </div>
      </div>

      <div className="clients-page__content clients-page__content--single">
        <div className="clients-page__hero">
          <div className="clients-page__hero-copy">
            <p className="section-tag">Gestão</p>
            <h2>Clientes cadastrados e cadastro</h2>
            <p>Visualize e gerencie os clientes somente quando precisar.</p>
          </div>

          <button type="button" className="btn btn--primary" onClick={() => setIsClientsVisible((current) => !current)}>
            {isClientsVisible ? 'Ocultar clientes' : 'Clientes'}
          </button>
        </div>

        {isClientsVisible ? (
          <>
            {showForm ? (
              <div className="clients-page__form-card clients-page__form-card--top">
                <div className="clients-page__form-head">
                  <h2>{editingId ? 'Editar cliente' : 'Adicionar cliente'}</h2>
                  <button type="button" className="btn btn--ghost btn--close" onClick={() => resetForm()} aria-label="Fechar formulário">
                    ×
                  </button>
                </div>
                <ClientForm
                  formData={formData}
                  isEditing={Boolean(editingId)}
                  onChange={handleChange}
                  onSubmit={handleSubmit}
                  onCancel={resetForm}
                />
              </div>
            ) : null}

            {showSegmentForm ? (
              <SegmentForm
                onClose={() => setShowSegmentForm(false)}
                onSaved={() => {
                  setShowSegmentForm(false);
                  setIsClientsVisible(true);
                }}
              />
            ) : null}

            <div className="clients-page__table-card">
              <h2>Clientes cadastrados</h2>
              <ClientTable
                clients={filteredClients}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSaveJourney={handleSaveJourney}
              />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
