import type { Client, Payment } from '../types';
import { normalizeClientJourney } from '../utils/clientJourney';
import { api } from './api';

export async function getClients(): Promise<Client[]> {
  try {
    const clients = await api.get<Client[]>('/api/clients');
    return (Array.isArray(clients) ? clients : []).map((client) => ({
      ...client,
      payments: client.payments ?? [],
      journey: normalizeClientJourney(client.journey),
    }));
  } catch {
    return [];
  }
}

export async function saveClients(clients: Client[]): Promise<void> {
  for (const client of clients) {
    await api.put(`/api/clients/${client.id}`, client);
  }
}

export async function createClient(client: Client): Promise<Client> {
  await api.post('/api/clients', client);
  return client;
}

export async function updateClient(client: Client): Promise<Client> {
  await api.put(`/api/clients/${client.id}`, client);
  return client;
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/api/clients/${id}`);
}

export async function addPaymentToClient(clientId: string, payment: Payment): Promise<Client[]> {
  const clients = await getClients();
  const targetClient = clients.find((client) => client.id === clientId);

  if (!targetClient) {
    return clients;
  }

  const nextClient = { ...targetClient, payments: [...targetClient.payments, payment] };
  await updateClient(nextClient);

  return (await getClients()).map((client) => (client.id === clientId ? nextClient : client));
}

export async function addPaymentsToClient(clientId: string, payments: Payment[]): Promise<Client[]> {
  const clients = await getClients();
  const targetClient = clients.find((client) => client.id === clientId);

  if (!targetClient) {
    return clients;
  }

  const nextClient = { ...targetClient, payments: [...targetClient.payments, ...payments] };
  await updateClient(nextClient);

  return (await getClients()).map((client) => (client.id === clientId ? nextClient : client));
}

export async function updatePaymentInClient(clientId: string, paymentId: string, changes: Partial<Payment>): Promise<Client[]> {
  const clients = await getClients();
  const targetClient = clients.find((client) => client.id === clientId);

  if (!targetClient) {
    return clients;
  }

  const nextClient = {
    ...targetClient,
    payments: targetClient.payments.map((payment) => (payment.id === paymentId ? { ...payment, ...changes } : payment)),
  };
  await updateClient(nextClient);

  return (await getClients()).map((client) => (client.id === clientId ? nextClient : client));
}

export async function deletePaymentFromClient(clientId: string, paymentId: string): Promise<Client[]> {
  const clients = await getClients();
  const targetClient = clients.find((client) => client.id === clientId);

  if (!targetClient) {
    return clients;
  }

  const nextClient = {
    ...targetClient,
    payments: targetClient.payments.filter((payment) => payment.id !== paymentId),
  };
  await updateClient(nextClient);

  return (await getClients()).map((client) => (client.id === clientId ? nextClient : client));
}
