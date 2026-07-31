import type { Client, Payment } from '../types';
import { readStorage, writeStorage } from './storage';
import { normalizeClientJourney } from '../utils/clientJourney';

const STORAGE_KEY = 'nexvg-clients';

export function getClients(): Client[] {
  const parsed = readStorage<Client[]>(STORAGE_KEY, []);
  const normalizedClients = (Array.isArray(parsed) ? parsed : []).map((client) => ({
    ...client,
    payments: client.payments ?? [],
    journey: normalizeClientJourney(client.journey),
  }));

  return normalizedClients;
}

export function saveClients(clients: Client[]): void {
  writeStorage(STORAGE_KEY, clients);
}

export function createClient(client: Client): Client {
  const clients = getClients();
  const nextClients = [...clients, client];
  saveClients(nextClients);
  return client;
}

export function updateClient(client: Client): Client {
  const clients = getClients();
  const nextClients = clients.map((item) => (item.id === client.id ? client : item));
  saveClients(nextClients);
  return client;
}

export function deleteClient(id: string): void {
  const clients = getClients();
  const nextClients = clients.filter((client) => client.id !== id);
  saveClients(nextClients);
}

export function addPaymentToClient(clientId: string, payment: Payment): Client[] {
  const clients = getClients();
  const nextClients = clients.map((client) => {
    if (client.id !== clientId) {
      return client;
    }

    return {
      ...client,
      payments: [...client.payments, payment],
    };
  });

  saveClients(nextClients);
  return nextClients;
}

export function addPaymentsToClient(clientId: string, payments: Payment[]): Client[] {
  const clients = getClients();
  const nextClients = clients.map((client) => {
    if (client.id !== clientId) {
      return client;
    }

    return {
      ...client,
      payments: [...client.payments, ...payments],
    };
  });

  saveClients(nextClients);
  return nextClients;
}

export function updatePaymentInClient(clientId: string, paymentId: string, changes: Partial<Payment>): Client[] {
  const clients = getClients();
  const nextClients = clients.map((client) => {
    if (client.id !== clientId) {
      return client;
    }

    return {
      ...client,
      payments: client.payments.map((payment) => {
        if (payment.id !== paymentId) {
          return payment;
        }

        return {
          ...payment,
          ...changes,
        };
      }),
    };
  });

  saveClients(nextClients);
  return nextClients;
}

export function deletePaymentFromClient(clientId: string, paymentId: string): Client[] {
  const clients = getClients();
  const nextClients = clients.map((client) => {
    if (client.id !== clientId) {
      return client;
    }

    return {
      ...client,
      payments: client.payments.filter((payment) => payment.id !== paymentId),
    };
  });

  saveClients(nextClients);
  return nextClients;
}
