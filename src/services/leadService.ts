import type { Lead, LeadConversionResult, LeadFormData } from '../types';
import { generateId } from '../utils/id';
import { api } from './api';
import { readStorage, writeStorage } from './storage';

const LEADS_STORAGE_KEY = 'nexvg-leads';

function normalizeWhitespace(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeLead(lead: Partial<Lead> & { id?: string }): Lead {
  return {
    id: lead.id ?? generateId(),
    name: lead.name ?? '',
    whatsapp: lead.whatsapp ?? '',
    city: lead.city ?? '',
    segment: lead.segment ?? '',
    origin: lead.origin ?? 'Formulário',
    stage: lead.stage ?? 'Novo',
    convertedAt: lead.convertedAt ?? null,
    convertedClientId: lead.convertedClientId ?? null,
    createdAt: lead.createdAt ?? new Date().toISOString(),
    updatedAt: lead.updatedAt ?? new Date().toISOString(),
  };
}

function readStoredLeads(): Lead[] {
  const leads = readStorage<Lead[]>(LEADS_STORAGE_KEY, []);
  return Array.isArray(leads) ? leads.map(normalizeLead) : [];
}

function persistLeads(leads: Lead[]): void {
  writeStorage(LEADS_STORAGE_KEY, leads.map(normalizeLead));
}

async function fetchLeadsFromApi(): Promise<Lead[]> {
  const leads = await api.get<Lead[]>('/api/leads');
  const normalized = (Array.isArray(leads) ? leads : []).map(normalizeLead);
  persistLeads(normalized);
  return normalized;
}

function buildPayload(data: LeadFormData) {
  return {
    name: normalizeWhitespace(data.name),
    whatsapp: normalizeWhitespace(data.whatsapp),
    city: normalizeWhitespace(data.city),
    segment: normalizeWhitespace(data.segment),
    origin: data.origin,
    stage: data.stage,
  };
}

export async function getLeads(): Promise<Lead[]> {
  const storedLeads = readStoredLeads();

  try {
    return await fetchLeadsFromApi();
  } catch (error) {
    console.warn('Falling back to stored lead data:', error);
    return storedLeads;
  }
}

export async function createLead(data: LeadFormData): Promise<Lead> {
  const created = await api.post<Lead>('/api/leads', buildPayload(data));

  try {
    const nextLeads = await fetchLeadsFromApi();
    return nextLeads.find((lead) => lead.id === created.id) ?? normalizeLead(created);
  } catch {
    const lead = normalizeLead(created);
    const nextLeads = [...readStoredLeads(), lead];
    persistLeads(nextLeads);
    return lead;
  }
}

export async function updateLead(id: string, data: LeadFormData): Promise<Lead> {
  const normalized = normalizeLead({ id, ...data });
  await api.put(`/api/leads/${id}`, buildPayload(data));

  try {
    const nextLeads = await fetchLeadsFromApi();
    return nextLeads.find((lead) => lead.id === id) ?? normalized;
  } catch {
    const nextLeads = readStoredLeads().map((lead) => (lead.id === id ? normalized : lead));
    persistLeads(nextLeads);
    return normalized;
  }
}

export async function deleteLead(id: string): Promise<void> {
  await api.delete(`/api/leads/${id}`);

  try {
    await fetchLeadsFromApi();
  } catch {
    const nextLeads = readStoredLeads().filter((lead) => lead.id !== id);
    persistLeads(nextLeads);
  }
}

export async function convertLeadToClient(id: string): Promise<LeadConversionResult> {
  const result = await api.post<LeadConversionResult>(`/api/leads/${id}/convert`);

  try {
    await fetchLeadsFromApi();
  } catch {
    const nextLeads = readStoredLeads().map((lead) => (lead.id === id ? { ...lead, convertedAt: new Date().toISOString(), convertedClientId: result.clientId } : lead));
    persistLeads(nextLeads);
  }
  return result;
}
