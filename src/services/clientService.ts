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
  const payload = {
    companyName: client.companyName,
    responsible: client.responsible,
    whatsapp: client.whatsapp ?? '',
    email: client.email ?? '',
    address: client.address ?? '',
    observations: client.observations ?? '',
    segment: client.segment ?? '',
    status: client.status,
    customStatus: client.customStatus ?? '',
    payments: (client.payments ?? []).map((payment) => ({
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
      notes: client.journey?.notes ?? '',
      steps: (client.journey?.steps ?? []).map((step) => ({
        id: step.id,
        label: step.label,
        done: step.done,
        doneAt: step.doneAt ?? '',
      })),
    },
  };

  const created = await api.post<{ id: string }>('/api/clients', payload);
  return { ...client, id: created.id };
}

export async function updateClient(client: Client): Promise<Client> {
  const payload = {
    companyName: client.companyName,
    responsible: client.responsible,
    whatsapp: client.whatsapp ?? '',
    email: client.email ?? '',
    address: client.address ?? '',
    observations: client.observations ?? '',
    segment: client.segment ?? '',
    status: client.status,
    customStatus: client.customStatus ?? '',
    payments: (client.payments ?? []).map((payment) => ({
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
      notes: client.journey?.notes ?? '',
      steps: (client.journey?.steps ?? []).map((step) => ({
        id: step.id,
        label: step.label,
        done: step.done,
        doneAt: step.doneAt ?? '',
      })),
    },
  };

  await api.put(`/api/clients/${client.id}`, payload);
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
