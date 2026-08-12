import { prisma } from '../config/prisma';

export type BackupClient = {
  id?: string;
  companyName: string;
  responsible?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  observations?: string;
  segment?: string;
  status?: string;
  customStatus?: string;
  payments?: Array<{
    id?: string;
    description: string;
    value: number;
    dueDate?: string;
    month?: string;
    createdMonth?: string;
    paymentDate?: string;
    paid?: boolean;
    status?: string;
  }>;
  journey?: {
    notes?: string;
    steps?: Array<{
      id?: string;
      label: string;
      done?: boolean;
      doneAt?: string;
      dueDate?: string;
    }>;
  };
};

export async function importClientsFromBackup(payload: { clients: BackupClient[]; segments?: string[] }) {
  const createdClients = [] as Array<{ id: string; companyName: string }>;

  for (const clientData of payload.clients) {
    const client = await prisma.client.create({
      data: {
        externalId: clientData.id,
        companyName: clientData.companyName,
        responsible: clientData.responsible,
        whatsapp: clientData.whatsapp,
        email: clientData.email,
        address: clientData.address,
        observations: clientData.observations,
        segment: clientData.segment,
        status: clientData.status || 'active',
        customStatus: clientData.customStatus,
      },
    });

    if (clientData.payments?.length) {
      await prisma.payment.createMany({
        data: clientData.payments.map((payment) => ({
          externalId: payment.id,
          clientId: client.id,
          description: payment.description,
          value: payment.value,
          dueDate: payment.dueDate ? new Date(payment.dueDate) : null,
          month: payment.month,
          createdMonth: payment.createdMonth,
          paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : null,
          paid: Boolean(payment.paid),
          status: payment.status || (payment.paid ? 'paid' : 'pending'),
        })),
      });
    }

    if (clientData.journey?.steps?.length) {
      await prisma.journeyStep.createMany({
        data: clientData.journey.steps.map((step) => ({
          externalId: step.id,
          clientId: client.id,
          stepId: step.id || `${client.id}-step`,
          label: step.label,
          done: Boolean(step.done),
          doneAt: step.doneAt ? new Date(step.doneAt) : null,
          dueAt: step.dueDate ? new Date(step.dueDate) : null,
        })),
      });
    }

    if (clientData.journey?.notes) {
      await prisma.journeyNote.create({
        data: {
          clientId: client.id,
          notes: clientData.journey.notes,
        },
      });
    }

    createdClients.push({ id: client.id, companyName: client.companyName });
  }

  return { createdClients, total: createdClients.length };
}
