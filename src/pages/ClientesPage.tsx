import { useEffect, useMemo, useState } from 'react';
import { ClientForm } from '../components/clientes/ClientForm';
import { ClientTable } from '../components/clientes/ClientTable';
import { SegmentForm } from '../components/clientes/SegmentForm';
import { SearchInput } from '../components/common/SearchInput';
import { createClient, deleteClient, getClients, updateClient } from '../services/clientService';
import { getSegments } from '../services/segmentService';
import type { Client, ClientFormData } from '../types';
import { getClientJourneyCompletionStatus } from '../utils/clientJourney';
import { getClientStatusKey } from '../utils/clientStatus';
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'new' | 'inactive'>('all');
  const [segmentFilter, setSegmentFilter] = useState('');
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

  const searchedClients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return clients.filter((client) => {
      if (segmentFilter && (client.segment ?? '') !== segmentFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [client.companyName, client.responsible, client.email, client.whatsapp, client.address]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch));
    });
  }, [clients, search, segmentFilter]);

  const statusCounts = useMemo(() => {
    const counts = { all: searchedClients.length, active: 0, new: 0, inactive: 0 };

    searchedClients.forEach((client) => {
      const key = getClientStatusKey(client);

      if (key === 'inactive') counts.inactive += 1;
      else if (key === 'new') counts.new += 1;
      else if (key === 'active') counts.active += 1;
    });

    return counts;
  }, [searchedClients]);

  const segmentOptions = useMemo(
    () =>
      Array.from(new Set([...getSegments(), ...clients.map((client) => client.segment ?? '')]))
        .filter(Boolean)
        .sort((first, second) => first.localeCompare(second, 'pt-BR')),
    [clients],
  );

  const { activeClients, inactiveClients } = useMemo(() => {
    const inactive = searchedClients.filter((client) => getClientStatusKey(client) === 'inactive');
    const active = searchedClients.filter((client) => {
      const key = getClientStatusKey(client);

      if (key === 'inactive') return false;
      return statusFilter === 'all' || key === statusFilter;
    });

    return {
      activeClients: statusFilter === 'inactive' ? [] : active,
      inactiveClients: statusFilter === 'all' || statusFilter === 'inactive' ? inactive : [],
    };
  }, [searchedClients, statusFilter]);

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (segmentFilter ? 1 : 0);

  const statusFilterOptions = [
    { value: 'all', label: 'Todos', count: statusCounts.all },
    { value: 'active', label: 'Ativos', count: statusCounts.active },
    { value: 'new', label: 'Novos', count: statusCounts.new },
    { value: 'inactive', label: 'Inativos', count: statusCounts.inactive },
  ] as const;

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

    const now = new Date();
    const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const existingPayments = existingClient?.payments ?? [];
    // Inativo: mantém pagos e pendências de meses anteriores; remove cobranças do mês atual em diante.
    // Exceção: Porto (cancelou no mês passado) é ajustada manualmente.
    const isPortoException = formData.companyName.trim().toLowerCase().startsWith('porto');
    const payments =
      formData.status === 'inactive' && !isPortoException
        ? existingPayments.filter((payment) => payment.paid || payment.dueDate < currentMonthStart)
        : existingPayments;

    const payload: Client = {
      id: editingId ?? generateId(),
      ...formData,
      email: existingClient?.email,
      payments,
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
              <div className="clients-page__list-head">
                <h2>Clientes cadastrados</h2>
                <button
                  type="button"
                  className={`btn ${isFilterOpen || activeFiltersCount ? 'btn--primary' : 'btn--secondary'}`}
                  aria-expanded={isFilterOpen}
                  onClick={() => setIsFilterOpen((current) => !current)}
                >
                  Filtros{activeFiltersCount ? ` (${activeFiltersCount})` : ''}
                </button>
              </div>

              {isFilterOpen ? (
                <div className="clients-filter">
                  <div className="clients-filter__group" role="group" aria-label="Filtrar por situação">
                    {statusFilterOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`clients-filter__chip${statusFilter === option.value ? ' is-active' : ''}`}
                        aria-pressed={statusFilter === option.value}
                        onClick={() => setStatusFilter(option.value)}
                      >
                        {option.label} <span>{option.count}</span>
                      </button>
                    ))}
                  </div>

                  <label className="clients-filter__segment">
                    <span>Segmento</span>
                    <select value={segmentFilter} onChange={(event) => setSegmentFilter(event.target.value)}>
                      <option value="">Todos os segmentos</option>
                      {segmentOptions.map((segment) => (
                        <option key={segment} value={segment}>
                          {segment}
                        </option>
                      ))}
                    </select>
                  </label>

                  {activeFiltersCount ? (
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      onClick={() => {
                        setStatusFilter('all');
                        setSegmentFilter('');
                      }}
                    >
                      Limpar filtros
                    </button>
                  ) : null}
                </div>
              ) : null}

              {statusFilter !== 'inactive' ? (
                <ClientTable
                  clients={activeClients}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSaveJourney={handleSaveJourney}
                />
              ) : null}
            </div>

            {inactiveClients.length ? (
              <div className="clients-page__table-card clients-page__table-card--inactive">
                <div className="clients-page__list-head">
                  <h2>Clientes inativos</h2>
                  <span className="clients-page__count">{inactiveClients.length}</span>
                </div>
                <ClientTable
                  clients={inactiveClients}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSaveJourney={handleSaveJourney}
                />
              </div>
            ) : statusFilter === 'inactive' ? (
              <div className="clients-page__table-card">
                <p className="empty-state">Nenhum cliente inativo encontrado.</p>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
