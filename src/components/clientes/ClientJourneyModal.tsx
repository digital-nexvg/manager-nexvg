import { useEffect, useMemo, useState } from 'react';
import type { Client, ClientJourneyStep } from '../../types';
import { getNextPendingJourneyStep, isTemplateJourneyStepId, normalizeClientJourney } from '../../utils/clientJourney';
import { generateId } from '../../utils/id';

type ClientJourneyModalProps = {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSave: (client: Client) => Promise<void> | void;
  onEditClient: (client: Client) => void;
};

export function ClientJourneyModal({ isOpen, client, onClose, onSave, onEditClient }: ClientJourneyModalProps) {
  const [steps, setSteps] = useState<ClientJourneyStep[]>([]);
  const [notes, setNotes] = useState('');
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStepLabel, setNewStepLabel] = useState('');
  const [newStepDueDate, setNewStepDueDate] = useState('');
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepDueDate, setEditingStepDueDate] = useState('');
  const [isHiddenStepsModalOpen, setIsHiddenStepsModalOpen] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedStepIds, setSelectedStepIds] = useState<string[]>([]);
  const [removedStepIds, setRemovedStepIds] = useState<string[]>([]);

  useEffect(() => {
    if (!client) {
      return;
    }

    const normalizedJourney = normalizeClientJourney(client.journey);
    setSteps(normalizedJourney.steps);
    setNotes(normalizedJourney.notes);
    setIsReorderMode(false);
    setDraggedStepId(null);
    setIsAddingStep(false);
    setNewStepLabel('');
    setNewStepDueDate('');
    setEditingStepId(null);
    setEditingStepDueDate('');
    setIsHiddenStepsModalOpen(false);
    setIsDeleteMode(false);
    setSelectedStepIds([]);
    setRemovedStepIds(normalizedJourney.removedStepIds ?? []);
  }, [client]);

  const formatStepDate = (date?: string) => {
    if (!date) {
      return '';
    }

    const [year, month, day] = date.split('-').map(Number);

    if (!year || !month || !day) {
      return date;
    }

    return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
  };

  const nextStep = useMemo(() => getNextPendingJourneyStep(steps), [steps]);
  const pendingSteps = useMemo(() => steps.filter((step) => !step.done), [steps]);
  const completedSteps = useMemo(() => steps.filter((step) => step.done), [steps]);
  const areAllCompletedStepsSelected = completedSteps.length > 0 && completedSteps.every((step) => selectedStepIds.includes(step.id));

  if (!isOpen || !client) {
    return null;
  }

  const toggleStep = (stepId: string) => {
    setSteps((current) =>
      current.map((step) => {
        if (step.id !== stepId) {
          return step;
        }

        const nextDone = !step.done;

        return {
          ...step,
          done: nextDone,
          doneAt: nextDone ? new Date().toISOString() : undefined,
        };
      }),
    );
  };

  const moveStep = (sourceStepId: string, targetStepId: string) => {
    if (sourceStepId === targetStepId) {
      return;
    }

    setSteps((current) => {
      const sourceIndex = current.findIndex((step) => step.id === sourceStepId);
      const targetIndex = current.findIndex((step) => step.id === targetStepId);

      if (sourceIndex < 0 || targetIndex < 0) {
        return current;
      }

      const next = [...current];
      const [movedStep] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, movedStep);
      return next;
    });
  };

  const toggleStepSelection = (stepId: string) => {
    setSelectedStepIds((current) =>
      current.includes(stepId) ? current.filter((currentStepId) => currentStepId !== stepId) : [...current, stepId],
    );
  };

  const toggleAllCompletedStepSelections = () => {
    setSelectedStepIds((current) => {
      if (completedSteps.every((step) => current.includes(step.id))) {
        return current.filter((stepId) => !completedSteps.some((step) => step.id === stepId));
      }

      const selectedIds = new Set(current);
      completedSteps.forEach((step) => selectedIds.add(step.id));
      return [...selectedIds];
    });
  };

  const handleDeleteSelectedSteps = () => {
    if (!selectedStepIds.length) {
      return;
    }

    setRemovedStepIds((current) => {
      const next = new Set(current);

      selectedStepIds.filter((stepId) => isTemplateJourneyStepId(stepId)).forEach((stepId) => next.add(stepId));

      return [...next];
    });
    setSteps((current) => current.filter((step) => !selectedStepIds.includes(step.id)));
    setSelectedStepIds([]);
    setIsDeleteMode(false);
    setIsHiddenStepsModalOpen((current) => (completedSteps.length - selectedStepIds.length > 0 ? current : false));
  };

  const handleSave = async () => {
    await onSave({
      ...client,
      journey: {
        steps,
        notes,
        removedStepIds,
      },
    });
    alert('Tarefas atualizadas com sucesso!');
    onClose();
  };

  const handleAddStep = () => {
    const trimmedLabel = newStepLabel.trim();

    if (!trimmedLabel) {
      return;
    }

    const nextStep: ClientJourneyStep = {
      id: `custom-${generateId()}`,
      label: trimmedLabel,
      done: false,
      dueDate: newStepDueDate || undefined,
    };

    setSteps((current) => {
      const canceledIndex = current.findIndex((step) => step.id === 'cancelled');

      if (canceledIndex < 0) {
        return [...current, nextStep];
      }

      return [...current.slice(0, canceledIndex), nextStep, ...current.slice(canceledIndex)];
    });
    setIsAddingStep(false);
    setNewStepLabel('');
    setNewStepDueDate('');
  };

  const startEditingStep = (step: ClientJourneyStep) => {
    setEditingStepId(step.id);
    setEditingStepDueDate(step.dueDate ?? '');
    setIsAddingStep(false);
    setNewStepLabel('');
    setNewStepDueDate('');
  };

  const handleCancelStepEdit = () => {
    setEditingStepId(null);
    setEditingStepDueDate('');
  };

  const handleSaveStepEdit = () => {
    if (!editingStepId) {
      return;
    }

    setSteps((current) =>
      current.map((step) =>
        step.id === editingStepId
          ? {
              ...step,
              dueDate: editingStepDueDate || undefined,
            }
          : step,
      ),
    );

    setEditingStepId(null);
    setEditingStepDueDate('');
  };

  const handleEditClient = () => {
    onClose();
    onEditClient(client);
  };

  return (
    <div className="client-journey-modal" role="dialog" aria-modal="true" aria-label={`Etapas do cliente ${client.companyName}`}>
      <div className="client-journey-modal__card">
        <div className="client-journey-modal__header">
          <div>
            <p className="section-tag">Andamento do cliente</p>
            <h3>{client.companyName}</h3>
            <p>{client.responsible}</p>
          </div>

          <button type="button" className="btn btn--ghost btn--close" onClick={onClose} aria-label="Fechar etapas do cliente">
            ×
          </button>
        </div>

        <div className="client-journey-modal__status">
          <div className="client-journey-modal__status-line">
            <span>
              <strong>Proxima etapa:</strong> {nextStep ? nextStep.label : 'Fluxo concluido'}
            </span>
            <div className="client-journey-modal__status-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setIsAddingStep((current) => !current);
                  setNewStepLabel('');
                  setNewStepDueDate('');
                  setEditingStepId(null);
                  setEditingStepDueDate('');
                  setIsDeleteMode(false);
                  setSelectedStepIds([]);
                  setIsHiddenStepsModalOpen(false);
                }}
              >
                {isAddingStep ? 'Cancelar etapa' : 'Adicionar etapa'}
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => {
                  setIsHiddenStepsModalOpen(true);
                  setIsDeleteMode(false);
                  setSelectedStepIds([]);
                  setIsAddingStep(false);
                  setEditingStepId(null);
                  setEditingStepDueDate('');
                }}
              >
                Ocultados ({completedSteps.length})
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setIsReorderMode((current) => !current)}>
                {isReorderMode ? 'Finalizar reordenação' : 'Reordenar lista'}
              </button>
            </div>
          </div>
          {isAddingStep ? (
            <div className="client-journey-modal__add-step">
              <input
                type="text"
                value={newStepLabel}
                onChange={(event) => setNewStepLabel(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddStep();
                  }
                }}
                placeholder="Nome da nova etapa"
              />
              <input type="date" value={newStepDueDate} onChange={(event) => setNewStepDueDate(event.target.value)} aria-label="Prazo da etapa" />
              <button type="button" className="btn btn--primary" onClick={handleAddStep} disabled={!newStepLabel.trim()}>
                Incluir
              </button>
            </div>
          ) : null}
          {isReorderMode ? <p className="client-journey-modal__reorder-hint">Arraste e solte as etapas para posicionar.</p> : null}
        </div>

        <div className="client-journey-modal__steps">
          {pendingSteps.map((step) => (
            <div
              key={step.id}
              className={`client-journey-modal__step${isReorderMode ? ' client-journey-modal__step--reorder' : ''}${draggedStepId === step.id ? ' client-journey-modal__step--dragging' : ''}`}
              draggable={isReorderMode}
              onDragStart={() => {
                if (!isReorderMode) {
                  return;
                }

                setDraggedStepId(step.id);
              }}
              onDragOver={(event) => {
                if (!isReorderMode || !draggedStepId || draggedStepId === step.id) {
                  return;
                }

                event.preventDefault();
              }}
              onDrop={() => {
                if (!isReorderMode || !draggedStepId) {
                  return;
                }

                moveStep(draggedStepId, step.id);
                setDraggedStepId(null);
              }}
              onDragEnd={() => setDraggedStepId(null)}
            >
              {editingStepId === step.id ? (
                <div className="client-journey-modal__step-main">
                  <strong>{step.label}</strong>
                  <div className="client-journey-modal__step-edit">
                    <input
                      type="date"
                      value={editingStepDueDate}
                      onChange={(event) => setEditingStepDueDate(event.target.value)}
                      aria-label={`Prazo da tarefa ${step.label}`}
                    />
                    <button type="button" className="btn btn--primary btn--small" onClick={handleSaveStepEdit}>
                      Salvar prazo
                    </button>
                    <button type="button" className="btn btn--ghost btn--small" onClick={handleCancelStepEdit}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="client-journey-modal__step-main">
                  <strong>{step.label}</strong>
                  <p>{step.doneAt ? `Marcado em ${new Date(step.doneAt).toLocaleDateString('pt-BR')}` : 'Ainda nao concluida'}</p>
                  <p>{step.dueDate ? `Prazo: ${formatStepDate(step.dueDate)}` : 'Prazo nao definido'}</p>
                </div>
              )}

              <div className="client-journey-modal__step-actions">
                <button type="button" className="btn btn--ghost btn--small" onClick={() => startEditingStep(step)} disabled={isReorderMode}>
                  Editar
                </button>
                <button type="button" className="btn btn--primary" onClick={() => toggleStep(step.id)}>
                  OK
                </button>
              </div>
            </div>
          ))}
          {pendingSteps.length === 0 ? <p className="empty-state">Nao ha tarefas pendentes.</p> : null}
        </div>

        {isHiddenStepsModalOpen ? (
          <div className="client-journey-modal__hidden-overlay">
            <div className="client-journey-modal__hidden-card">
              <div className="client-journey-modal__hidden-header">
                <div>
                  <h4>Ocultados</h4>
                  <p>Tarefas marcadas como OK ficam aqui.</p>
                </div>

                <button
                  type="button"
                  className="btn btn--ghost btn--close"
                  onClick={() => {
                    setIsHiddenStepsModalOpen(false);
                    setIsDeleteMode(false);
                    setSelectedStepIds([]);
                  }}
                  aria-label="Fechar tarefas ocultadas"
                >
                  ×
                </button>
              </div>

              <div className="client-journey-modal__hidden-actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => {
                    setIsDeleteMode((current) => !current);
                    setSelectedStepIds([]);
                  }}
                  disabled={!completedSteps.length}
                >
                  {isDeleteMode ? 'Cancelar exclusão' : 'Apagar tarefas'}
                </button>
              </div>

              {isDeleteMode ? (
                <div className="client-journey-modal__delete-bar">
                  <label className="client-journey-modal__step-selector client-journey-modal__step-selector--all">
                    <input type="checkbox" checked={areAllCompletedStepsSelected} onChange={toggleAllCompletedStepSelections} />
                    <span>Selecionar todas</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn--secondary btn--small"
                    onClick={handleDeleteSelectedSteps}
                    disabled={!selectedStepIds.length}
                  >
                    {selectedStepIds.length ? `Apagar ${selectedStepIds.length}` : 'Apagar selecionadas'}
                  </button>
                </div>
              ) : null}

              <div className="client-journey-modal__steps client-journey-modal__steps--hidden">
                {completedSteps.map((step) => (
                  <div
                    key={step.id}
                    className={`client-journey-modal__step${isDeleteMode && selectedStepIds.includes(step.id) ? ' client-journey-modal__step--selected' : ''}`}
                  >
                    <div className="client-journey-modal__step-main">
                      {isDeleteMode ? (
                        <label className="client-journey-modal__step-selector">
                          <input type="checkbox" checked={selectedStepIds.includes(step.id)} onChange={() => toggleStepSelection(step.id)} />
                          <span>Selecionar</span>
                        </label>
                      ) : null}
                      <strong>{step.label}</strong>
                      <p>{step.doneAt ? `Marcado em ${new Date(step.doneAt).toLocaleDateString('pt-BR')}` : 'Concluida'}</p>
                      <p>{step.dueDate ? `Prazo: ${formatStepDate(step.dueDate)}` : 'Prazo nao definido'}</p>
                      {editingStepId === step.id ? (
                        <div className="client-journey-modal__step-edit">
                          <input
                            type="date"
                            value={editingStepDueDate}
                            onChange={(event) => setEditingStepDueDate(event.target.value)}
                            aria-label={`Prazo da tarefa ${step.label}`}
                          />
                          <button type="button" className="btn btn--primary btn--small" onClick={handleSaveStepEdit}>
                            Salvar prazo
                          </button>
                          <button type="button" className="btn btn--ghost btn--small" onClick={handleCancelStepEdit}>
                            Cancelar
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div className="client-journey-modal__step-actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        onClick={() => startEditingStep(step)}
                        disabled={isDeleteMode || isReorderMode}
                      >
                        Editar
                      </button>
                      <button type="button" className="btn btn--secondary" onClick={() => toggleStep(step.id)} disabled={isDeleteMode}>
                        Desfazer
                      </button>
                    </div>
                  </div>
                ))}
                {completedSteps.length === 0 ? <p className="empty-state">Nao ha tarefas ocultadas.</p> : null}
              </div>
            </div>
          </div>
        ) : null}

        <label className="client-journey-modal__notes">
          <span>Anotacoes</span>
          <textarea
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Escreva observacoes importantes sobre este cliente"
          />
        </label>

        <div className="client-journey-modal__actions">
          <button type="button" className="btn btn--ghost" onClick={handleEditClient}>
            Editar informacoes
          </button>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn--primary" onClick={handleSave}>
            Salvar andamento
          </button>
        </div>
      </div>
    </div>
  );
}
