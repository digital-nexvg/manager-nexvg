import type { Client, Payment } from '../types';
import { normalizeClientJourney } from '../utils/clientJourney';
import { api } from './api';
import { readStorage, writeStorage } from './storage';

const CLIENTS_STORAGE_KEY = 'nexvg-clients';

function normalizeClient(client: Partial<Client> & { id?: string }): Client {
  return {
    id: client.id ?? crypto.randomUUID(),
    companyName: client.companyName ?? '',
    responsible: client.responsible ?? '',
    whatsapp: client.whatsapp ?? '',
    customStatus: client.customStatus ?? '',
    email: client.email ?? '',
    address: client.address ?? '',
    observations: client.observations ?? '',
    segment: client.segment ?? '',
    status: client.status ?? 'active',
    payments: (client.payments ?? []).map((payment) => ({
      id: payment.id ?? crypto.randomUUID(),
      description: payment.description ?? '',
      value: payment.value ?? 0,
      dueDate: payment.dueDate ?? '',
      paymentDate: payment.paymentDate ?? '',
      month: payment.month ?? '',
      createdMonth: payment.createdMonth ?? '',
      paid: Boolean(payment.paid),
      status: payment.status ?? (payment.paid ? 'paid' : 'pending'),
    })),
    journey: normalizeClientJourney(client.journey),
  };
}

function readCachedClients(): Client[] {
  const cached = readStorage<Client[]>(CLIENTS_STORAGE_KEY, []);
  return (Array.isArray(cached) ? cached : []).map(normalizeClient);
}

function writeCachedClients(clients: Client[]): void {
  writeStorage(CLIENTS_STORAGE_KEY, clients.map(normalizeClient));
}

export async function getClients(): Promise<Client[]> {
  try {
    const clients = await api.get<Client[]>('/api/clients');
    const normalized = (Array.isArray(clients) ? clients : []).map(normalizeClient);
    writeCachedClients(normalized);
    return normalized;
  } catch {
    return readCachedClients();
  }
}

export async function saveClients(clients: Client[]): Promise<void> {
  const normalized = clients.map(normalizeClient);
  writeCachedClients(normalized);

  for (const client of normalized) {
    try {
      await api.put(`/api/clients/${client.id}`, client);
    } catch {
      // fallback local-only persistence
    }
  }
}

export async function createClient(client: Client): Promise<Client> {
  const normalized = normalizeClient(client);
  const payload = {
    companyName: normalized.companyName,
    responsible: normalized.responsible,
    whatsapp: normalized.whatsapp ?? '',
    email: normalized.email ?? '',
    address: normalized.address ?? '',
    observations: normalized.observations ?? '',
    segment: normalized.segment ?? '',
    status: normalized.status,
    customStatus: normalized.customStatus ?? '',
    payments: (normalized.payments ?? []).map((payment) => ({
      id: payment.id,
      description: payment.description,
      value: payment.value,
      dueDate: payment.dueDate,
      paymentDate: payment.paymentDate ?? '',
      month: payment.month ?? '',
      createdMonth: payment.createdMonth ?? '',
      paid: payment.paid,
      status: payment.status ?? (payment.paid ? 'paid' : 'pending'),
    })),
    journey: {
      notes: normalized.journey?.notes ?? '',
      steps: (normalized.journey?.steps ?? []).map((step) => ({
        id: step.id,
        label: step.label,
        done: step.done,
        doneAt: step.doneAt ?? '',
      })),
    },
  };

  try {
    const created = await api.post<{ id: string }>('/api/clients', payload);
    const nextClient = { ...normalized, id: created?.id ?? normalized.id };
    const nextClients = [...readCachedClients(), nextClient];
    writeCachedClients(nextClients);
    return nextClient;
  } catch {
    const nextClients = [...readCachedClients(), normalized];
    writeCachedClients(nextClients);
    return normalized;
  }
}

export async function updateClient(client: Client): Promise<Client> {
  const normalized = normalizeClient(client);
  const payload = {
    companyName: normalized.companyName,
    responsible: normalized.responsible,
    whatsapp: normalized.whatsapp ?? '',
    email: normalized.email ?? '',
    address: normalized.address ?? '',
    observations: normalized.observations ?? '',
    segment: normalized.segment ?? '',
    status: normalized.status,
    customStatus: normalized.customStatus ?? '',
    payments: (normalized.payments ?? []).map((payment) => ({
      id: payment.id,
      description: payment.description,
      value: payment.value,
      dueDate: payment.dueDate,
      paymentDate: payment.paymentDate ?? '',
      month: payment.month ?? '',
      createdMonth: payment.createdMonth ?? '',
      paid: payment.paid,
      status: payment.status ?? (payment.paid ? 'paid' : 'pending'),
    })),
    journey: {
      notes: normalized.journey?.notes ?? '',
      steps: (normalized.journey?.steps ?? []).map((step) => ({
        id: step.id,
        label: step.label,
        done: step.done,
        doneAt: step.doneAt ?? '',
      })),
    },
  };

  try {
    await api.put(`/api/clients/${normalized.id}`, payload);
  } catch {
    // fallback local-only persistence
  }

  const nextClients = readCachedClients().map((current) => (current.id === normalized.id ? normalized : current));
  writeCachedClients(nextClients);
  return normalized;
}

export async function deleteClient(id: string): Promise<void> {
  try {
    await api.delete(`/api/clients/${id}`);
  } catch {
    // fallback local-only persistence
  }

  const nextClients = readCachedClients().filter((client) => client.id !== id);
  writeCachedClients(nextClients);
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
