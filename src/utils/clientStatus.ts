import type { Client } from '../types';
import { getClientJourneyCompletionStatus } from './clientJourney';

export type ClientStatusKey = 'active' | 'new' | 'inactive' | 'waiting-entry';

export const clientStatusLabels: Record<ClientStatusKey, string> = {
  active: 'Ativo',
  new: 'Novo',
  inactive: 'Inativo',
  'waiting-entry': 'Aguardando entrada',
};

// A situação interna editada no cadastro tem prioridade sobre a jornada.
export function getClientStatusKey(client: Client): ClientStatusKey {
  const journeyStatus = getClientJourneyCompletionStatus(client.journey);

  if (client.status === 'inactive' || journeyStatus === 'Cancelado') {
    return 'inactive';
  }

  if (client.status === 'waiting-entry') {
    return 'waiting-entry';
  }

  return journeyStatus === 'Novo Cliente' ? 'new' : 'active';
}

export function getClientStatusLabel(client: Client): string {
  return clientStatusLabels[getClientStatusKey(client)];
}
