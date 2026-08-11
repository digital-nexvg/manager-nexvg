import { useEffect, useMemo, useState } from 'react';
import type { Client, ClientJourneyStep } from '../../types';
import { getNextPendingJourneyStep, normalizeClientJourney } from '../../utils/clientJourney';

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

  useEffect(() => {
    if (!client) {
      return;
    }

    const normalizedJourney = normalizeClientJourney(client.journey);
    setSteps(normalizedJourney.steps);
    setNotes(normalizedJourney.notes);
    setIsReorderMode(false);
    setDraggedStepId(null);
  }, [client]);

  const nextStep = useMemo(() => getNextPendingJourneyStep(steps), [steps]);

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

  const handleSave = async () => {
    await onSave({
      ...client,
      journey: {
        steps,
        notes,
      },
    });
    onClose();
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
            <button type="button" className="btn btn--ghost" onClick={() => setIsReorderMode((current) => !current)}>
              {isReorderMode ? 'Finalizar reordenação' : 'Reordenar lista'}
            </button>
          </div>
          {isReorderMode ? <p className="client-journey-modal__reorder-hint">Arraste e solte as etapas para posicionar.</p> : null}
        </div>

        <div className="client-journey-modal__steps">
          {steps.map((step) => (
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
              <div>
                <strong>{step.label}</strong>
                <p>{step.doneAt ? `Marcado em ${new Date(step.doneAt).toLocaleDateString('pt-BR')}` : 'Ainda nao concluida'}</p>
              </div>

              <button type="button" className={`btn ${step.done ? 'btn--secondary' : 'btn--primary'}`} onClick={() => toggleStep(step.id)}>
                {step.done ? 'Desfazer' : 'OK'}
              </button>
            </div>
          ))}
        </div>

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
