import { useEffect, useMemo, useState } from 'react';
import { SearchInput } from '../components/common/SearchInput';
import { getClients } from '../services/clientService';
import type { Client } from '../types';
import { formatDate, parseDateOnly } from '../utils/formatters';
import { normalizeClientJourney } from '../utils/clientJourney';

type TaskStatusFilter = 'all' | 'pending' | 'overdue' | 'completed' | 'no-due-date';

type TaskItem = {
  id: string;
  clientName: string;
  label: string;
  dueDate?: string;
  done: boolean;
  doneAt?: string;
  status: Exclude<TaskStatusFilter, 'all'>;
};

function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getTaskStatus(task: { done: boolean; dueDate?: string }, todayKey: string): Exclude<TaskStatusFilter, 'all'> {
  if (task.done) {
    return 'completed';
  }

  if (!task.dueDate) {
    return 'no-due-date';
  }

  return task.dueDate < todayKey ? 'overdue' : 'pending';
}

function getTaskStatusLabel(status: Exclude<TaskStatusFilter, 'all'>): string {
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

function getTaskStatusClass(status: Exclude<TaskStatusFilter, 'all'>): string {
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

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return allTasks.filter((task) => {
      const matchesFilter = filter === 'all' ? true : task.status === filter;

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [task.clientName, task.label].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [allTasks, filter, search]);

  const metrics = useMemo(() => {
    const pending = allTasks.filter((task) => task.status === 'pending').length;
    const overdue = allTasks.filter((task) => task.status === 'overdue').length;
    const completed = allTasks.filter((task) => task.status === 'completed').length;
    const noDueDate = allTasks.filter((task) => task.status === 'no-due-date').length;

    return { pending, overdue, completed, noDueDate };
  }, [allTasks]);

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

              <label className="tasks-page__filter-control">
                <span className="search-input__label">Status</span>
                <select value={filter} onChange={(event) => setFilter(event.target.value as TaskStatusFilter)}>
                  <option value="all">Todos</option>
                  <option value="pending">Pendentes</option>
                  <option value="overdue">Atrasadas</option>
                  <option value="completed">Concluidas</option>
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
                          <td>{task.doneAt ? new Date(task.doneAt).toLocaleDateString('pt-BR') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
