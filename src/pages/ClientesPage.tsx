import { useEffect, useMemo, useState } from 'react';
import { ClientForm } from '../components/clientes/ClientForm';
import { ClientTable } from '../components/clientes/ClientTable';
import { SegmentForm } from '../components/clientes/SegmentForm';
import { SearchInput } from '../components/common/SearchInput';
import { createClient, deleteClient, getClients, updateClient } from '../services/clientService';
import type { Client, ClientFormData } from '../types';
import { getClientJourneyCompletionStatus } from '../utils/clientJourney';

const emptyForm: ClientFormData = {
  companyName: '',
  responsible: '',
  customStatus: 'Novo Cliente',
  whatsapp: '',
  email: '',
  address: '',
  observations: '',
  segment: '',
  status: 'active',
};

export function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState<ClientFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSegmentForm, setShowSegmentForm] = useState(false);
  const [isClientsVisible, setIsClientsVisible] = useState(false);

  useEffect(() => {
    const refreshClients = () => setClients(getClients());

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

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setShowSegmentForm(false);
  };

  const handleOpenAddClient = () => {
    setShowSegmentForm(false);
    setShowForm(true);
    setEditingId(null);
    setFormData(emptyForm);
    setIsClientsVisible(true);
  };

  const handleOpenSegmentForm = () => {
    setShowForm(false);
    setShowSegmentForm(true);
    setIsClientsVisible(true);
  };

  const handleSubmit = () => {
    const existingClient = clients.find((client) => client.id === editingId);

    const payload: Client = {
      id: editingId ?? crypto.randomUUID(),
      ...formData,
      payments: existingClient?.payments ?? [],
      journey: existingClient?.journey,
    };

    if (editingId) {
      updateClient(payload);
      setClients(getClients());
    } else {
      createClient(payload);
      setClients(getClients());
    }

    resetForm();
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
      email: client.email ?? '',
      address: client.address ?? '',
      observations: client.observations ?? '',
      segment: client.segment ?? '',
      status: client.status,
    });
    setIsClientsVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteClient(id);
    setClients(getClients());

    if (editingId === id) {
      resetForm();
    }
  };

  const handleSaveJourney = (client: Client) => {
    updateClient({
      ...client,
      customStatus: getClientJourneyCompletionStatus(client.journey),
    });
    setClients(getClients());
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
            placeholder="Buscar por empresa, responsável ou email"
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
                  <button type="button" className="btn btn--ghost btn--close" onClick={resetForm} aria-label="Fechar formulário">
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
