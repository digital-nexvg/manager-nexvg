import { useEffect, useMemo, useState } from 'react';
import type { Client, ClientJourneyStep } from '../../types';
import { getNextPendingJourneyStep, normalizeClientJourney } from '../../utils/clientJourney';

type ClientJourneyModalProps = {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSave: (client: Client) => void;
  onEditClient: (client: Client) => void;
};

export function ClientJourneyModal({ isOpen, client, onClose, onSave, onEditClient }: ClientJourneyModalProps) {
  const [steps, setSteps] = useState<ClientJourneyStep[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!client) {
      return;
    }

    const normalizedJourney = normalizeClientJourney(client.journey);
    setSteps(normalizedJourney.steps);
    setNotes(normalizedJourney.notes);
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

  const handleSave = () => {
    onSave({
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
          <strong>Proxima etapa:</strong> {nextStep ? nextStep.label : 'Fluxo concluido'}
        </div>

        <div className="client-journey-modal__steps">
          {steps.map((step) => (
            <div key={step.id} className="client-journey-modal__step">
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
