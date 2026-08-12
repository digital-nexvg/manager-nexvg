import { useEffect, useMemo, useState } from 'react';
import { SearchInput } from '../components/common/SearchInput';
import { getClients, updateClient } from '../services/clientService';
import type { Client, ClientJourneyStep } from '../types';
import { formatDate, parseDateOnly } from '../utils/formatters';
import { isTemplateJourneyStepId, normalizeClientJourney } from '../utils/clientJourney';

type TaskStatusFilter = 'all' | 'pending' | 'overdue' | 'no-due-date';
type TaskStatus = 'pending' | 'overdue' | 'completed' | 'no-due-date';

type TaskItem = {
  id: string;
  clientId: string;
  stepId: string;
  clientName: string;
  label: string;
  dueDate?: string;
  done: boolean;
  doneAt?: string;
  status: TaskStatus;
};

function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getTaskStatus(task: { done: boolean; dueDate?: string }, todayKey: string): TaskStatus {
  if (task.done) {
    return 'completed';
  }

  if (!task.dueDate) {
    return 'no-due-date';
  }

  return task.dueDate < todayKey ? 'overdue' : 'pending';
}

function getTaskStatusLabel(status: TaskStatus): string {
  if (status === 'completed') {
    return 'Concluida';
  }

  if (status === 'overdue') {
    return 'Atrasada';
  }

  if (status === 'pending') {
    return 'Pendente';
  }

  return 'Sem prazo';
}

function getTaskStatusClass(status: TaskStatus): string {
  if (status === 'completed') {
    return 'status-badge status-badge--active';
  }

  if (status === 'overdue') {
    return 'status-badge status-badge--inactive';
  }

  if (status === 'pending') {
    return 'status-badge status-badge--waiting-entry';
  }

  return 'status-badge';
}

function compareTasks(first: TaskItem, second: TaskItem): number {
  if (first.done !== second.done) {
    return first.done ? 1 : -1;
  }

  if (!first.dueDate && second.dueDate) {
    return 1;
  }

  if (first.dueDate && !second.dueDate) {
    return -1;
  }

  if (first.dueDate && second.dueDate) {
    const dueDiff = parseDateOnly(first.dueDate).getTime() - parseDateOnly(second.dueDate).getTime();

    if (dueDiff !== 0) {
      return dueDiff;
    }
  }

  const clientDiff = first.clientName.localeCompare(second.clientName, 'pt-BR');

  if (clientDiff !== 0) {
    return clientDiff;
  }

  return first.label.localeCompare(second.label, 'pt-BR');
}

export function TarefasPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TaskStatusFilter>('all');
  const [isTasksVisible, setIsTasksVisible] = useState(false);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [selectedCompletedTaskIds, setSelectedCompletedTaskIds] = useState<string[]>([]);

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

  const allTasks = useMemo(() => {
    const todayKey = getTodayKey();

    return clients
      .flatMap((client) => {
        const journey = normalizeClientJourney(client.journey);

        return journey.steps.map((step) => ({
          id: `${client.id}:${step.id}`,
          clientId: client.id,
          stepId: step.id,
          clientName: client.companyName,
          label: step.label,
          dueDate: step.dueDate || undefined,
          done: step.done,
          doneAt: step.doneAt,
          status: getTaskStatus({ done: step.done, dueDate: step.dueDate }, todayKey),
        }));
      })
      .sort(compareTasks);
  }, [clients]);

  const completedTasks = useMemo(() => allTasks.filter((task) => task.done), [allTasks]);

  const openTasks = useMemo(() => allTasks.filter((task) => !task.done), [allTasks]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return openTasks.filter((task) => {
      const matchesFilter = filter === 'all' ? true : task.status === filter;

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [task.clientName, task.label].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [filter, openTasks, search]);

  const metrics = useMemo(() => {
    const pending = allTasks.filter((task) => task.status === 'pending').length;
    const overdue = allTasks.filter((task) => task.status === 'overdue').length;
    const completed = allTasks.filter((task) => task.status === 'completed').length;
    const noDueDate = allTasks.filter((task) => task.status === 'no-due-date').length;

    return { pending, overdue, completed, noDueDate };
  }, [allTasks]);

  const areAllCompletedTasksSelected = completedTasks.length > 0 && completedTasks.every((task) => selectedCompletedTaskIds.includes(task.id));

  const refreshClients = async () => {
    const nextClients = await getClients();
    setClients(nextClients);
  };

  const updateTaskState = async (task: TaskItem, changes: { done?: boolean; doneAt?: string; dueDate?: string }) => {
    const targetClient = clients.find((client) => client.id === task.clientId);

    if (!targetClient) {
      return;
    }

    const currentJourney = targetClient.journey ?? { notes: '', steps: [], removedStepIds: [] };
    const normalizedJourney = normalizeClientJourney(targetClient.journey);
    const normalizedStep = normalizedJourney.steps.find((step) => step.id === task.stepId);
    const storedStepExists = currentJourney.steps.some((step) => step.id === task.stepId);

    if (!normalizedStep) {
      return;
    }

    const baseStep = (storedStepExists ? currentJourney.steps.find((step) => step.id === task.stepId) : normalizedStep) as ClientJourneyStep;
    const nextStep: ClientJourneyStep = {
      ...baseStep,
      ...changes,
    };

    const nextSteps: ClientJourneyStep[] = storedStepExists
      ? currentJourney.steps.map((step) => (step.id === task.stepId ? nextStep : step))
      : [...currentJourney.steps, nextStep];

    await updateClient({
      ...targetClient,
      journey: {
        notes: currentJourney.notes ?? '',
        removedStepIds: currentJourney.removedStepIds ?? [],
        steps: nextSteps,
      },
    });

    await refreshClients();
  };

  const handleToggleTaskCompletion = async (task: TaskItem, done: boolean) => {
    await updateTaskState(task, {
      done,
      doneAt: done ? new Date().toISOString() : undefined,
    });
  };

  const toggleCompletedTaskSelection = (taskId: string) => {
    setSelectedCompletedTaskIds((current) =>
      current.includes(taskId) ? current.filter((currentTaskId) => currentTaskId !== taskId) : [...current, taskId],
    );
  };

  const toggleAllCompletedTaskSelections = () => {
    setSelectedCompletedTaskIds((current) => {
      if (completedTasks.every((task) => current.includes(task.id))) {
        return [];
      }

      return completedTasks.map((task) => task.id);
    });
  };

  const handleDeleteSelectedCompletedTasks = async () => {
    if (!selectedCompletedTaskIds.length) {
      return;
    }

    const selectedSet = new Set(selectedCompletedTaskIds);
    const nextClients = await Promise.all(
      clients.map(async (client) => {
        const currentJourney = client.journey ?? { notes: '', steps: [], removedStepIds: [] };
        const completedForClient = completedTasks.filter((task) => task.clientId === client.id && selectedSet.has(task.id));

        if (!completedForClient.length) {
          return client;
        }

        const removedStepIds = new Set(currentJourney.removedStepIds ?? []);
        completedForClient.forEach((task) => {
          if (isTemplateJourneyStepId(task.stepId)) {
            removedStepIds.add(task.stepId);
          }
        });

        const nextClient = {
          ...client,
          journey: {
            notes: currentJourney.notes ?? '',
            removedStepIds: [...removedStepIds],
            steps: currentJourney.steps.filter((step) => !completedForClient.some((task) => task.stepId === step.id)),
          },
        };

        await updateClient(nextClient);
        return nextClient;
      }),
    );

    setSelectedCompletedTaskIds([]);
    setClients(nextClients);
    await refreshClients();

    if (completedTasks.length === selectedCompletedTaskIds.length) {
      setIsCompletedModalOpen(false);
    }
  };

  return (
    <section className="tasks-page">
      <div className="tasks-page__header">
        <div>
          <p className="section-tag">Tarefas</p>
          <h1>Gestao de tarefas por cliente</h1>
        </div>
      </div>

      <div className="tasks-page__content">
        <div className="tasks-page__hero">
          <div className="tasks-page__hero-copy">
            <p className="section-tag">Operacional</p>
            <h2>Todas as etapas em um unico lugar</h2>
            <p>Acompanhe prazos, atrasos e conclucoes sem abrir cliente por cliente.</p>
          </div>

          <button type="button" className="btn btn--primary" onClick={() => setIsTasksVisible((current) => !current)}>
            {isTasksVisible ? 'Ocultar tarefas' : 'Tarefas'}
          </button>
        </div>

        {isTasksVisible ? (
          <>
            <div className="tasks-page__filters">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Buscar por cliente ou etapa"
              />

              <button type="button" className="btn btn--ghost" onClick={() => setIsCompletedModalOpen(true)}>
                Concluidas ({metrics.completed})
              </button>

              <label className="tasks-page__filter-control">
                <span className="search-input__label">Status</span>
                <select value={filter} onChange={(event) => setFilter(event.target.value as TaskStatusFilter)}>
                  <option value="all">Todos</option>
                  <option value="pending">Pendentes</option>
                  <option value="overdue">Atrasadas</option>
                  <option value="no-due-date">Sem prazo</option>
                </select>
              </label>
            </div>

            <div className="tasks-page__stats">
              <div className="tasks-page__stat-card">
                <span>Pendentes</span>
                <strong>{metrics.pending}</strong>
              </div>
              <div className="tasks-page__stat-card">
                <span>Atrasadas</span>
                <strong>{metrics.overdue}</strong>
              </div>
              <div className="tasks-page__stat-card">
                <span>Concluidas</span>
                <strong>{metrics.completed}</strong>
              </div>
              <div className="tasks-page__stat-card">
                <span>Sem prazo</span>
                <strong>{metrics.noDueDate}</strong>
              </div>
            </div>

            <div className="tasks-page__list-card">
              <h2>Lista de tarefas</h2>
              {!filteredTasks.length ? (
                <p className="empty-state">Nenhuma tarefa encontrada.</p>
              ) : (
                <div className="client-table-wrapper">
                  <table className="client-table tasks-table">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Tarefa</th>
                        <th>Prazo</th>
                        <th>Status</th>
                        <th>Conclusao</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((task) => (
                        <tr key={task.id}>
                          <td>{task.clientName}</td>
                          <td>{task.label}</td>
                          <td>{task.dueDate ? formatDate(task.dueDate) : '—'}</td>
                          <td>
                            <span className={getTaskStatusClass(task.status)}>{getTaskStatusLabel(task.status)}</span>
                          </td>
                          <td>
                            <label className="tasks-page__check-toggle">
                              <input type="checkbox" checked={task.done} onChange={(event) => void handleToggleTaskCompletion(task, event.target.checked)} />
                              <span>Marcar</span>
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}

        {isCompletedModalOpen ? (
          <div className="tasks-page__modal-overlay">
            <div className="tasks-page__modal-card" role="dialog" aria-modal="true" aria-label="Tarefas concluidas">
              <div className="tasks-page__modal-header">
                <div>
                  <h3>Concluidas</h3>
                  <p>Veja o que foi feito e remova tarefas finalizadas quando necessario.</p>
                </div>

                <button
                  type="button"
                  className="btn btn--ghost btn--close"
                  onClick={() => {
                    setIsCompletedModalOpen(false);
                    setSelectedCompletedTaskIds([]);
                  }}
                  aria-label="Fechar tarefas concluidas"
                >
                  ×
                </button>
              </div>

              {completedTasks.length ? (
                <div className="tasks-page__modal-actions">
                  <label className="client-journey-modal__step-selector client-journey-modal__step-selector--all">
                    <input type="checkbox" checked={areAllCompletedTasksSelected} onChange={toggleAllCompletedTaskSelections} />
                    <span>Selecionar todas</span>
                  </label>

                  <button
                    type="button"
                    className="btn btn--secondary btn--small"
                    onClick={() => void handleDeleteSelectedCompletedTasks()}
                    disabled={!selectedCompletedTaskIds.length}
                  >
                    {selectedCompletedTaskIds.length ? `Apagar ${selectedCompletedTaskIds.length}` : 'Apagar selecionadas'}
                  </button>
                </div>
              ) : null}

              <div className="tasks-page__completed-list">
                {completedTasks.length ? (
                  completedTasks.map((task) => (
                    <div key={task.id} className={`tasks-page__completed-item${selectedCompletedTaskIds.includes(task.id) ? ' tasks-page__completed-item--selected' : ''}`}>
                      <div className="tasks-page__completed-main">
                        <label className="client-journey-modal__step-selector">
                          <input
                            type="checkbox"
                            checked={selectedCompletedTaskIds.includes(task.id)}
                            onChange={() => toggleCompletedTaskSelection(task.id)}
                          />
                          <span>Selecionar</span>
                        </label>
                        <strong>{task.label}</strong>
                        <p>{task.clientName}</p>
                        <p>{task.dueDate ? `Prazo: ${formatDate(task.dueDate)}` : 'Prazo nao definido'}</p>
                        <p>{task.doneAt ? `Concluida em ${new Date(task.doneAt).toLocaleDateString('pt-BR')}` : 'Concluida'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">Nenhuma tarefa concluida.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
