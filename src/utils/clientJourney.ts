import type { ClientJourney, ClientJourneyStep } from '../types';

const CANCELED_STEP_ID = 'cancelled';

export const CLIENT_JOURNEY_STEPS_TEMPLATE: Array<Pick<ClientJourneyStep, 'id' | 'label'>> = [
  { id: 'collect-information', label: 'Pegar informacoes' },
  { id: 'reserve-domain', label: 'Reservar dominio' },
  { id: 'google-account', label: 'Acessar/criar Ct Google' },
  { id: 'create-project-base', label: 'Criar base projeto' },
  { id: 'finish-site', label: 'Finalizar site' },
  { id: 'create-github-repository', label: 'Criar repositorio GitHub' },
  { id: 'run-server-cloudflare', label: 'Rodar servidor no Cloudflare' },
  { id: 'publish-site', label: 'Publicar site' },
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

export function isTemplateJourneyStepId(stepId: string): boolean {
  return CLIENT_JOURNEY_STEPS_TEMPLATE.some((step) => step.id === stepId);
}

export function normalizeClientJourney(journey?: ClientJourney): ClientJourney {
  const currentSteps = Array.isArray(journey?.steps) ? journey.steps : [];
  const templateById = new Map(CLIENT_JOURNEY_STEPS_TEMPLATE.map((step) => [step.id, step]));
  const removedStepIds = new Set((journey?.removedStepIds ?? []).filter((stepId) => templateById.has(stepId)));
  const seenIds = new Set<string>();

  const normalizedCurrent = currentSteps
    .filter((step) => templateById.has(step.id) && !removedStepIds.has(step.id) && !seenIds.has(step.id))
    .map((step) => {
      seenIds.add(step.id);
      const templateStep = templateById.get(step.id)!;

      return {
        ...templateStep,
        done: Boolean(step.done),
        doneAt: step.doneAt,
      };
    });

  const customCurrentSteps = currentSteps
    .filter((step) => !templateById.has(step.id) && !seenIds.has(step.id) && step.label.trim())
    .map((step) => {
      seenIds.add(step.id);

      return {
        id: step.id,
        label: step.label.trim(),
        done: Boolean(step.done),
        doneAt: step.doneAt,
      };
    });

  const missingTemplateSteps = CLIENT_JOURNEY_STEPS_TEMPLATE.filter((step) => !removedStepIds.has(step.id) && !seenIds.has(step.id)).map((step) => ({
    ...step,
    done: false,
    doneAt: undefined,
  }));

  return {
    notes: journey?.notes ?? '',
    removedStepIds: [...removedStepIds],
    steps: [...normalizedCurrent, ...customCurrentSteps, ...missingTemplateSteps],
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

