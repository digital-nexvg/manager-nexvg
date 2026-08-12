import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

const REMOVED_STEP_PREFIX = '__removed__';

function createRemovedStepMarker(stepId: string) {
  return {
    stepId: `${REMOVED_STEP_PREFIX}${stepId}`,
    label: `Removed ${stepId}`,
    done: true,
    doneAt: null,
    dueAt: null,
  };
}

function normalizeJourneyPayload(journey: any) {
  const steps = Array.isArray(journey?.steps) ? journey.steps : [];
  const removedStepIds = Array.isArray(journey?.removedStepIds) ? journey.removedStepIds : [];

  const normalizedSteps = steps.map((step: any) => ({
    stepId: step.id || step.stepId,
    label: step.label,
    done: Boolean(step.done),
    doneAt: step.doneAt ? new Date(step.doneAt) : null,
    dueAt: step.dueDate ? new Date(step.dueDate) : null,
  }));

  const removedMarkers = removedStepIds
    .filter((stepId: unknown) => typeof stepId === 'string' && stepId.trim())
    .map((stepId: string) => createRemovedStepMarker(stepId));

  return {
    notes: journey?.notes || '',
    steps: [...normalizedSteps, ...removedMarkers],
  };
}

function parseJourneyFromDb(client: any) {
  const removedStepIds = client.journeySteps
    .filter((step: any) => step.stepId.startsWith(REMOVED_STEP_PREFIX))
    .map((step: any) => step.stepId.slice(REMOVED_STEP_PREFIX.length));

  const steps = client.journeySteps
    .filter((step: any) => !step.stepId.startsWith(REMOVED_STEP_PREFIX))
    .map((step: any) => ({
      id: step.stepId,
      label: step.label,
      done: step.done,
      doneAt: step.doneAt?.toISOString(),
      dueDate: step.dueAt ? step.dueAt.toISOString().slice(0, 10) : '',
    }));

  return {
    notes: client.journeyNotes?.notes || '',
    removedStepIds,
    steps,
  };
}

export const clientController = {
  list: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const clients = await prisma.client.findMany({
        include: {
          payments: true,
          journeySteps: true,
          journeyNotes: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const normalized = clients.map((client) => ({
        id: client.id,
        companyName: client.companyName,
        responsible: client.responsible,
        whatsapp: client.whatsapp,
        email: client.email,
        address: client.address,
        observations: client.observations,
        segment: client.segment,
        status: client.status as 'active' | 'inactive' | 'waiting-entry',
        customStatus: client.customStatus,
        payments: client.payments.map((payment) => ({
          id: payment.id,
          description: payment.description,
          value: Number(payment.value),
          dueDate: payment.dueDate ? payment.dueDate.toISOString().slice(0, 10) : '',
          paymentDate: payment.paymentDate ? payment.paymentDate.toISOString().slice(0, 10) : '',
          month: payment.month,
          createdMonth: payment.createdMonth,
          paid: payment.paid,
          status: payment.status || (payment.paid ? 'paid' : 'pending'),
        })),
        journey: parseJourneyFromDb(client),
      }));

      return res.json(normalized);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyName, responsible, whatsapp, email, address, observations, segment, status, customStatus, payments = [], journey } = req.body;
      const normalizedJourney = normalizeJourneyPayload(journey);

      const client = await prisma.client.create({
        data: {
          companyName,
          responsible,
          whatsapp,
          email,
          address,
          observations,
          segment,
          status: status || 'active',
          customStatus,
          payments: {
            create: payments.map((payment: any) => ({
              description: payment.description,
              value: payment.value,
              dueDate: payment.dueDate ? new Date(payment.dueDate) : null,
              month: payment.month,
              createdMonth: payment.createdMonth,
              paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : null,
              paid: Boolean(payment.paid),
              status: payment.status || (payment.paid ? 'paid' : 'pending'),
            })),
          },
          journeyNotes: normalizedJourney.notes
            ? {
                create: {
                  notes: normalizedJourney.notes,
                },
              }
            : undefined,
          journeySteps: {
            create: normalizedJourney.steps,
          },
        },
      });

      return res.status(201).json({ id: client.id });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { companyName, responsible, whatsapp, email, address, observations, segment, status, customStatus, payments = [], journey } = req.body;
      const normalizedJourney = normalizeJourneyPayload(journey);

      const client = await prisma.client.update({
        where: { id: id ?? '' },
        data: {
          companyName,
          responsible,
          whatsapp,
          email,
          address,
          observations,
          segment,
          status: status || 'active',
          customStatus,
          payments: {
            deleteMany: {},
            create: payments.map((payment: any) => ({
              description: payment.description,
              value: payment.value,
              dueDate: payment.dueDate ? new Date(payment.dueDate) : null,
              month: payment.month,
              createdMonth: payment.createdMonth,
              paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : null,
              paid: Boolean(payment.paid),
              status: payment.status || (payment.paid ? 'paid' : 'pending'),
            })),
          },
          journeyNotes: {
            upsert: {
              create: { notes: normalizedJourney.notes },
              update: { notes: normalizedJourney.notes },
            },
          },
          journeySteps: {
            deleteMany: {},
            create: normalizedJourney.steps,
          },
        },
      });

      return res.json({ id: client.id });
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await prisma.client.delete({ where: { id: id ?? '' } });
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
