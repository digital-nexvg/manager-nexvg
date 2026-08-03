import type { Client, Payment } from '../types';
import { normalizeClientJourney } from '../utils/clientJourney';
import { api } from './api';

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

export async function getClients(): Promise<Client[]> {
  const clients = await api.get<Client[]>('/api/clients');
  return (Array.isArray(clients) ? clients : []).map(normalizeClient);
}

export async function saveClients(clients: Client[]): Promise<void> {
  const normalized = clients.map(normalizeClient);

  for (const client of normalized) {
    await api.put(`/api/clients/${client.id}`, client);
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

  const created = await api.post<{ id: string }>('/api/clients', payload);
  return { ...normalized, id: created?.id ?? normalized.id };
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

  await api.put(`/api/clients/${normalized.id}`, payload);
  return normalized;
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
