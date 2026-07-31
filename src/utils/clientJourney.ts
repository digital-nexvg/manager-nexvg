import type { ClientJourney, ClientJourneyStep } from '../types';

const CANCELED_STEP_ID = 'cancelled';

export const CLIENT_JOURNEY_STEPS_TEMPLATE: Array<Pick<ClientJourneyStep, 'id' | 'label'>> = [
  { id: 'collect-information', label: 'Pegar informacoes' },
  { id: 'reserve-domain', label: 'Reservar dominio' },
  { id: 'google-account', label: 'Acessar/criar Ct Google' },
  { id: 'create-project-base', label: 'Criar base projeto' },
  { id: 'finish-site', label: 'Finalizar site' },
  { id: 'payment-finished', label: 'Pagamento concluido' },
  { id: 'buy-domain', label: 'Comprar dominio' },
  { id: 'create-corporate-email', label: 'Criar email corporativo' },
  { id: 'connect-google-account', label: 'Conectar site a conta Google' },
  { id: CANCELED_STEP_ID, label: 'Cancelou' },
];

export function createDefaultClientJourneySteps(): ClientJourneyStep[] {
  return CLIENT_JOURNEY_STEPS_TEMPLATE.map((step) => ({
    ...step,
    done: false,
  }));
}

export function normalizeClientJourney(journey?: ClientJourney): ClientJourney {
  const currentSteps = Array.isArray(journey?.steps) ? journey.steps : [];

  return {
    notes: journey?.notes ?? '',
    steps: CLIENT_JOURNEY_STEPS_TEMPLATE.map((templateStep) => {
      const currentStep = currentSteps.find((step) => step.id === templateStep.id);

      return {
        ...templateStep,
        done: Boolean(currentStep?.done),
        doneAt: currentStep?.doneAt,
      };
    }),
  };
}

export function getNextPendingJourneyStep(steps: ClientJourneyStep[]): ClientJourneyStep | null {
  return steps.find((step) => step.id !== CANCELED_STEP_ID && !step.done) ?? null;
}

export function getJourneyStatusLabel(journey?: ClientJourney): string {
  const normalizedJourney = normalizeClientJourney(journey);
  const canceledStep = normalizedJourney.steps.find((step) => step.id === CANCELED_STEP_ID);

  if (canceledStep?.done) {
    return 'Cancelou';
  }

  const nextStep = getNextPendingJourneyStep(normalizedJourney.steps);

  return nextStep ? nextStep.label : 'Concluido';
}

export function getClientJourneyCompletionStatus(journey?: ClientJourney): string {
  const normalizedJourney = normalizeClientJourney(journey);
  const canceledStep = normalizedJourney.steps.find((step) => step.id === CANCELED_STEP_ID);

  if (canceledStep?.done) {
    return 'Cancelado';
  }

  const hasPendingSteps = normalizedJourney.steps.some((step) => step.id !== CANCELED_STEP_ID && !step.done);

  return hasPendingSteps ? 'Novo Cliente' : 'Cliente Ativo';
}
