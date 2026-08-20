import { useEffect, useMemo, useState } from 'react';
import { DashboardCard } from '../components/dashboard/DashboardCard';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { SearchInput } from '../components/common/SearchInput';
import { convertLeadToClient, createLead, deleteLead, getLeads, updateLead } from '../services/leadService';
import { getClients } from '../services/clientService';
import {
  leadOriginOptions,
  leadStageOptions,
  type Lead,
  type LeadFormData,
  type LeadOrigin,
  type LeadStage,
} from '../types';

type LeadsPageProps = {
  notificationCount?: number;
  isMobile?: boolean;
  isCollapsible?: boolean;
  onAcknowledgeLead?: (leadId: string) => void;
};

const emptyLeadForm = (): LeadFormData => ({
  name: '',
  whatsapp: '',
  city: '',
  segment: '',
  origin: 'Manual',
  stage: 'Novo',
});

function formatLeadStatus(lead: Lead): string {
  if (lead.convertedClientId) {
    return 'Convertido em cliente';
  }

  return lead.stage;
}

function formatLeadCount(count: number): string {
  if (count === 1) {
    return '🔔 1 novo Lead';
  }

  return `🔔 ${count} novos Leads`;
}

export function LeadsPage({ notificationCount = 0, isMobile = false, isCollapsible = false, onAcknowledgeLead }: LeadsPageProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | LeadStage>('all');
  const [originFilter, setOriginFilter] = useState<'all' | LeadOrigin>('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState(() => !isMobile);
  const [showForm, setShowForm] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LeadFormData>(emptyLeadForm());
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [leadDetails, setLeadDetails] = useState<Lead | null>(null);
  const [isContentOpen, setIsContentOpen] = useState(() => !isCollapsible);

  useEffect(() => {
    let isMounted = true;

    const refreshLeads = async () => {
      const nextLeads = await getLeads();
      if (isMounted) {
        setLeads(nextLeads);
      }
    };

    refreshLeads();
    const timer = window.setInterval(refreshLeads, 30000);
    window.addEventListener('nexvg-storage-update', refreshLeads);
    window.addEventListener('focus', refreshLeads);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
      window.removeEventListener('nexvg-storage-update', refreshLeads);
      window.removeEventListener('focus', refreshLeads);
    };
  }, []);

  useEffect(() => {
    setIsFiltersOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    setIsContentOpen(!isCollapsible);
  }, [isCollapsible]);

  const segments = useMemo(
    () =>
      Array.from(new Set(leads.map((lead) => lead.segment.trim()).filter(Boolean))).sort((first, second) =>
        first.localeCompare(second, 'pt-BR'),
      ),
    [leads],
  );

  const filteredLeads = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesStage = stageFilter === 'all' ? true : lead.stage === stageFilter;
      const matchesOrigin = originFilter === 'all' ? true : lead.origin === originFilter;
      const matchesSegment = segmentFilter === 'all' ? true : lead.segment === segmentFilter;

      if (!matchesStage || !matchesOrigin || !matchesSegment) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [lead.name, lead.whatsapp, lead.city, lead.segment]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [leads, originFilter, search, segmentFilter, stageFilter]);

  const stats = useMemo(() => {
    const byStage = (stage: LeadStage) => leads.filter((lead) => lead.stage === stage).length;

    return {
      total: leads.length,
      novo: byStage('Novo'),
      interessado: byStage('Interessado'),
      diagnostico: byStage('Diagnóstico'),
      orcamento: byStage('Orçamento'),
      aguardando: byStage('Aguardando retorno'),
      possivel: byStage('Possível fechamento'),
      ganho: byStage('Ganho'),
      perdido: byStage('Perdido'),
    };
  }, [leads]);

  const resetForm = () => {
    setShowForm(false);
    setEditingLeadId(null);
    setFormData(emptyLeadForm());
  };

  const handleOpenCreate = () => {
    setEditingLeadId(null);
    setFormData(emptyLeadForm());
    setShowForm(true);
  };

  const handleOpenEdit = (lead: Lead) => {
    setEditingLeadId(lead.id);
    setFormData({
      name: lead.name,
      whatsapp: lead.whatsapp,
      city: lead.city,
      segment: lead.segment,
      origin: lead.origin,
      stage: lead.stage,
    });
    setShowForm(true);
  };

  const handleLeadNameClick = (lead: Lead) => {
    if (onAcknowledgeLead) {
      onAcknowledgeLead(lead.id);
    }

    handleOpenEdit(lead);
  };

  const handleChange = (field: keyof LeadFormData, value: string) => {
    setFormData((current) => {
      if (field === 'origin') {
        return { ...current, origin: value as LeadOrigin };
      }

      if (field === 'stage') {
        return { ...current, stage: value as LeadStage };
      }

      return { ...current, [field]: value } as LeadFormData;
    });
  };

  const handleSubmit = async () => {
    const payload: LeadFormData = {
      ...formData,
      name: formData.name.trim(),
      whatsapp: formData.whatsapp.trim(),
      city: formData.city.trim(),
      segment: formData.segment.trim(),
      origin: editingLeadId ? formData.origin : 'Manual',
      stage: editingLeadId ? formData.stage : 'Novo',
    };

    try {
      if (editingLeadId) {
        await updateLead(editingLeadId, payload);
      } else {
        await createLead(payload);
      }

      const nextLeads = await getLeads();
      setLeads(nextLeads);
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível salvar o lead.';
      alert(message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLead(id);
      const nextLeads = await getLeads();
      setLeads(nextLeads);
      setLeadToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível excluir o lead.';
      alert(message);
    }
  };

  const handleConvert = async (lead: Lead) => {
    try {
      await convertLeadToClient(lead.id);
      await getClients();
      const nextLeads = await getLeads();
      setLeads(nextLeads);
      setLeadToConvert(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível converter o lead.';
      alert(message);
    }
  };

  return (
    <section className="leads-page">
      <div className="leads-page__header">
        <div>
          <p className="section-tag">Leads</p>
          <h1>Controle simples de leads</h1>
        </div>

        <div className="leads-page__header-actions">
          <div className="leads-page__notification" aria-live="polite">
            {notificationCount > 0 ? formatLeadCount(notificationCount) : 'Sem novos Leads agora'}
          </div>
          {isCollapsible ? (
            <button type="button" className="btn btn--secondary" onClick={() => setIsContentOpen((current) => !current)}>
              {isContentOpen ? 'Fechar leads' : 'Abrir leads'}
            </button>
          ) : null}
        </div>
      </div>

      {isContentOpen ? (
        <>
      <DashboardGrid>
        <DashboardCard title="Total de Leads" value={String(stats.total)} icon="•" tone="neutral" />
        <DashboardCard title="Novos" value={String(stats.novo)} icon="1" tone="neutral" />
        <DashboardCard title="Interessados" value={String(stats.interessado)} icon="2" tone="warning" />
        <DashboardCard title="Diagnóstico" value={String(stats.diagnostico)} icon="3" tone="neutral" />
        <DashboardCard title="Orçamento" value={String(stats.orcamento)} icon="4" tone="warning" />
        <DashboardCard title="Aguardando retorno" value={String(stats.aguardando)} icon="5" tone="neutral" />
        <DashboardCard title="Possível fechamento" value={String(stats.possivel)} icon="6" tone="warning" />
        <DashboardCard title="Ganhos" value={String(stats.ganho)} icon="✓" tone="positive" />
        <DashboardCard title="Perdidos" value={String(stats.perdido)} icon="×" tone="danger" />
      </DashboardGrid>

      <div className="leads-page__hero">
        <div className="leads-page__hero-copy">
          <p className="section-tag">Operacional</p>
          <h2>Cadastre, classifique e converta leads sem complicação</h2>
          <p>Funciona com entrada manual e com o formulário público da NEXVG.</p>
        </div>

        <button type="button" className="btn btn--primary" onClick={handleOpenCreate}>
          + Novo Lead
        </button>
      </div>

      {showForm ? (
        <div className="leads-page__form-card">
          <div className="leads-page__form-head">
            <h2>{editingLeadId ? 'Editar Lead' : 'Novo Lead'}</h2>
            <button type="button" className="btn btn--ghost btn--close" onClick={resetForm} aria-label="Fechar formulário">
              ×
            </button>
          </div>

          <div className="client-form__grid leads-page__form-grid">
            <label>
              <span>Nome / nome da empresa</span>
              <input value={formData.name} onChange={(event) => handleChange('name', event.target.value)} />
            </label>

            <label>
              <span>WhatsApp</span>
              <input value={formData.whatsapp} onChange={(event) => handleChange('whatsapp', event.target.value)} />
            </label>

            <label>
              <span>Cidade</span>
              <input value={formData.city} onChange={(event) => handleChange('city', event.target.value)} />
            </label>

            <label>
              <span>Segmento</span>
              <input value={formData.segment} onChange={(event) => handleChange('segment', event.target.value)} />
            </label>

            {editingLeadId ? (
              <>
                <label>
                  <span>Origem</span>
                  <select value={formData.origin} onChange={(event) => handleChange('origin', event.target.value)}>
                    {leadOriginOptions.map((origin) => (
                      <option key={origin} value={origin}>
                        {origin}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Estágio</span>
                  <select value={formData.stage} onChange={(event) => handleChange('stage', event.target.value)}>
                    {leadStageOptions.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
          </div>

          <div className="leads-page__form-actions">
            <button type="button" className="btn btn--primary" onClick={handleSubmit}>
              Salvar
            </button>
            <button type="button" className="btn btn--secondary" onClick={resetForm}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      <div className="leads-page__filters-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome, empresa ou WhatsApp"
        />

        <button type="button" className="leads-page__filter-toggle btn btn--secondary" onClick={() => setIsFiltersOpen((current) => !current)}>
          <span className="leads-page__filter-toggle-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
          </span>
          Filtros
        </button>
      </div>

      {isFiltersOpen ? (
        <div className="leads-page__filters-panel">
          <label className="tasks-page__filter-control">
            <span className="search-input__label">Estágio</span>
            <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value as 'all' | LeadStage)}>
              <option value="all">Todos</option>
              {leadStageOptions.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>

          <label className="tasks-page__filter-control">
            <span className="search-input__label">Origem</span>
            <select value={originFilter} onChange={(event) => setOriginFilter(event.target.value as 'all' | LeadOrigin)}>
              <option value="all">Todas</option>
              {leadOriginOptions.map((origin) => (
                <option key={origin} value={origin}>
                  {origin}
                </option>
              ))}
            </select>
          </label>

          <label className="tasks-page__filter-control">
            <span className="search-input__label">Segmento</span>
            <select value={segmentFilter} onChange={(event) => setSegmentFilter(event.target.value)}>
              <option value="all">Todos</option>
              {segments.map((segment) => (
                <option key={segment} value={segment}>
                  {segment}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      <div className="leads-page__table-card">
        <h2>Leads cadastrados</h2>

        {filteredLeads.length ? (
          isMobile ? (
            <div className="leads-page__mobile-list">
              {filteredLeads.map((lead) => (
                <article key={lead.id} className="leads-page__mobile-card">
                  <div className="leads-page__mobile-card-head">
                    <button type="button" className="leads-page__mobile-name" onClick={() => handleLeadNameClick(lead)}>
                      {lead.name}
                    </button>
                    {lead.convertedClientId ? <span className="leads-page__converted-tag">Convertido</span> : null}
                  </div>

                  <div className="leads-page__mobile-meta">
                    <span>
                      <strong>WhatsApp:</strong> {lead.whatsapp}
                    </span>
                    <span>
                      <strong>Cidade:</strong> {lead.city || '—'}
                    </span>
                    <span>
                      <strong>Segmento:</strong> {lead.segment || '—'}
                    </span>
                    <span>
                      <strong>Origem:</strong> {lead.origin}
                    </span>
                    <span>
                      <strong>Estágio:</strong> {formatLeadStatus(lead)}
                    </span>
                  </div>

                  <div className="leads-page__mobile-actions">
                    <button type="button" className="btn btn--secondary" onClick={() => setLeadDetails(lead)}>
                      Ver detalhes
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={() => handleOpenEdit(lead)}>
                      Editar
                    </button>
                    {lead.stage === 'Ganho' && !lead.convertedClientId ? (
                      <button type="button" className="btn btn--primary" onClick={() => setLeadToConvert(lead)}>
                        Tornar cliente
                      </button>
                    ) : null}
                    <button type="button" className="btn btn--danger" onClick={() => setLeadToDelete(lead)}>
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
          <div className="client-table-wrapper">
            <table className="client-table leads-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>WhatsApp</th>
                  <th>Cidade</th>
                  <th>Segmento</th>
                  <th>Origem</th>
                  <th>Estágio</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <button type="button" className="leads-page__name-trigger" onClick={() => handleLeadNameClick(lead)}>
                        {lead.name}
                      </button>
                      {lead.convertedClientId ? <div className="leads-page__converted-tag">Convertido em cliente</div> : null}
                    </td>
                    <td>{lead.whatsapp}</td>
                    <td>{lead.city || '—'}</td>
                    <td>{lead.segment || '—'}</td>
                    <td>
                      <span className={`status-badge ${lead.origin === 'Formulário' ? 'status-badge--active' : 'status-badge--waiting-entry'}`}>
                        {lead.origin}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${lead.stage === 'Ganho' ? 'status-badge--active' : lead.stage === 'Perdido' ? 'status-badge--inactive' : 'status-badge--waiting-entry'}`}>
                        {formatLeadStatus(lead)}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn btn--secondary" onClick={() => setLeadDetails(lead)}>
                          Ver detalhes
                        </button>
                        <button type="button" className="btn btn--ghost" onClick={() => handleOpenEdit(lead)}>
                          Editar
                        </button>
                        {lead.stage === 'Ganho' && !lead.convertedClientId ? (
                          <button type="button" className="btn btn--primary" onClick={() => setLeadToConvert(lead)}>
                            Tornar cliente
                          </button>
                        ) : null}
                        <button type="button" className="btn btn--danger" onClick={() => setLeadToDelete(lead)}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )
        ) : (
          <p className="empty-state">Nenhum lead encontrado.</p>
        )}
      </div>

      {leadDetails ? (
        <div className="dashboard-metric-modal" role="dialog" aria-modal="true" aria-label={`Detalhes de ${leadDetails.name}`} onClick={() => setLeadDetails(null)}>
          <div className="dashboard-metric-modal__card" onClick={(event) => event.stopPropagation()}>
            <div className="dashboard-metric-modal__header">
              <div>
                <p className="section-tag">Lead</p>
                <h3>{leadDetails.name}</h3>
              </div>
              <button type="button" className="btn btn--ghost btn--close dashboard-metric-modal__close" onClick={() => setLeadDetails(null)} aria-label="Fechar detalhes do lead">
                ×
              </button>
            </div>
            <div className="dashboard-metric-modal__body">
              <div className="dashboard-metric-modal__list">
                <div className="dashboard-metric-modal__item"><span className="dashboard-metric-modal__label">WhatsApp</span><span className="dashboard-metric-modal__text">{leadDetails.whatsapp}</span></div>
                <div className="dashboard-metric-modal__item"><span className="dashboard-metric-modal__label">Cidade</span><span className="dashboard-metric-modal__text">{leadDetails.city || '—'}</span></div>
                <div className="dashboard-metric-modal__item"><span className="dashboard-metric-modal__label">Segmento</span><span className="dashboard-metric-modal__text">{leadDetails.segment || '—'}</span></div>
                <div className="dashboard-metric-modal__item"><span className="dashboard-metric-modal__label">Origem</span><span className="dashboard-metric-modal__text">{leadDetails.origin}</span></div>
                <div className="dashboard-metric-modal__item"><span className="dashboard-metric-modal__label">Estágio</span><span className="dashboard-metric-modal__text">{formatLeadStatus(leadDetails)}</span></div>
                <div className="dashboard-metric-modal__item"><span className="dashboard-metric-modal__label">Situação</span><span className="dashboard-metric-modal__text">{leadDetails.convertedClientId ? 'Convertido em cliente' : 'Em acompanhamento'}</span></div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {leadToDelete ? (
        <div className="confirmation-modal" role="dialog" aria-modal="true">
          <div className="confirmation-modal__card">
            <h3>Excluir lead?</h3>
            <p>Essa ação remove o lead selecionado.</p>
            <div className="confirmation-modal__actions">
              <button type="button" className="btn btn--secondary" onClick={() => setLeadToDelete(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn--danger" onClick={() => void handleDelete(leadToDelete.id)}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {leadToConvert ? (
        <div className="confirmation-modal" role="dialog" aria-modal="true">
          <div className="confirmation-modal__card">
            <h3>Tornar cliente?</h3>
            <p>Será criado um cliente a partir dos dados deste lead.</p>
            <div className="confirmation-modal__actions">
              <button type="button" className="btn btn--secondary" onClick={() => setLeadToConvert(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn--primary" onClick={() => void handleConvert(leadToConvert)}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}
        </>
      ) : null}
    </section>
  );
}
