import { prisma } from '../config/prisma';

const LEAD_ORIGINS = ['Formulário', 'Manual'] as const;
const LEAD_STAGES = [
  'Novo',
  'Interessado',
  'Diagnóstico',
  'Orçamento',
  'Aguardando retorno',
  'Possível fechamento',
  'Ganho',
  'Perdido',
] as const;

type LeadOrigin = (typeof LEAD_ORIGINS)[number];
type LeadStage = (typeof LEAD_STAGES)[number];

type LeadPayload = {
  name?: unknown;
  whatsapp?: unknown;
  city?: unknown;
  segment?: unknown;
  origin?: unknown;
  stage?: unknown;
};

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeWhatsapp(value: unknown): string {
  return normalizeText(value).replace(/\D/g, '');
}

function isLeadOrigin(value: unknown): value is LeadOrigin {
  return typeof value === 'string' && LEAD_ORIGINS.includes(value as LeadOrigin);
}

function isLeadStage(value: unknown): value is LeadStage {
  return typeof value === 'string' && LEAD_STAGES.includes(value as LeadStage);
}

function serializeLead(lead: {
  id: string;
  name: string;
  whatsapp: string;
  city: string | null;
  segment: string | null;
  origin: string;
  stage: string;
  convertedAt: Date | null;
  convertedClientId: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: lead.id,
    name: lead.name,
    whatsapp: lead.whatsapp,
    city: lead.city,
    segment: lead.segment,
    origin: lead.origin,
    stage: lead.stage,
    convertedAt: lead.convertedAt ? lead.convertedAt.toISOString() : null,
    convertedClientId: lead.convertedClientId,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

async function upsertLeadByWhatsapp(payload: LeadPayload, origin: LeadOrigin, stage: LeadStage) {
  const name = normalizeText(payload.name);
  const whatsapp = normalizeWhatsapp(payload.whatsapp);
  const city = normalizeText(payload.city) || null;
  const segment = normalizeText(payload.segment) || null;

  if (!name) {
    throw new Error('Nome é obrigatório.');
  }

  if (!whatsapp) {
    throw new Error('WhatsApp é obrigatório.');
  }

  const existingLead = await prisma.lead.findUnique({ where: { whatsapp } });

  if (existingLead) {
    const updatedLead = await prisma.lead.update({
      where: { id: existingLead.id },
      data: {
        name,
        whatsapp,
        city: city ?? existingLead.city,
        segment: segment ?? existingLead.segment,
      },
    });

    return updatedLead;
  }

  return prisma.lead.create({
    data: {
      name,
      whatsapp,
      city,
      segment,
      origin,
      stage,
    },
  });
}

export const leadService = {
  list: async () => {
    const leads = await prisma.lead.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return leads.map(serializeLead);
  },

  createManual: async (payload: LeadPayload) => {
    const lead = await upsertLeadByWhatsapp(payload, 'Manual', 'Novo');
    return serializeLead(lead);
  },

  createPublic: async (payload: LeadPayload) => {
    const lead = await upsertLeadByWhatsapp(payload, 'Formulário', 'Novo');
    return serializeLead(lead);
  },

  update: async (id: string, payload: LeadPayload) => {
    if (!id) {
      throw new Error('Lead não informado.');
    }

    const existingLead = await prisma.lead.findUnique({ where: { id } });

    if (!existingLead) {
      throw new Error('Lead não encontrado.');
    }

    const name = normalizeText(payload.name);
    const whatsapp = normalizeWhatsapp(payload.whatsapp);
    const city = normalizeText(payload.city) || null;
    const segment = normalizeText(payload.segment) || null;
    const origin = isLeadOrigin(payload.origin) ? payload.origin : existingLead.origin;
    const stage = isLeadStage(payload.stage) ? payload.stage : existingLead.stage;

    if (!name) {
      throw new Error('Nome é obrigatório.');
    }

    if (!whatsapp) {
      throw new Error('WhatsApp é obrigatório.');
    }

    const duplicateLead = await prisma.lead.findUnique({ where: { whatsapp } });

    if (duplicateLead && duplicateLead.id !== existingLead.id) {
      throw new Error('Já existe um lead com este WhatsApp.');
    }

    const lead = await prisma.lead.update({
      where: { id: existingLead.id },
      data: {
        name,
        whatsapp,
        city,
        segment,
        origin,
        stage,
      },
    });

    return serializeLead(lead);
  },

  remove: async (id: string) => {
    if (!id) {
      throw new Error('Lead não informado.');
    }

    await prisma.lead.delete({ where: { id } });
  },

  convertToClient: async (id: string) => {
    if (!id) {
      throw new Error('Lead não informado.');
    }

    const lead = await prisma.lead.findUnique({ where: { id } });

    if (!lead) {
      throw new Error('Lead não encontrado.');
    }

    if (lead.convertedClientId) {
      return {
        alreadyConverted: true,
        lead: serializeLead(lead),
        clientId: lead.convertedClientId,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          companyName: lead.name,
          responsible: lead.name,
          whatsapp: lead.whatsapp,
          address: lead.city,
          segment: lead.segment,
          status: 'waiting-entry',
          customStatus: 'Novo Cliente',
        },
      });

      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          convertedAt: new Date(),
          convertedClientId: client.id,
        },
      });

      return { client, updatedLead };
    });

    return {
      alreadyConverted: false,
      lead: serializeLead(result.updatedLead),
      clientId: result.client.id,
    };
  },
};
