export type ClientStatus = 'active' | 'inactive' | 'waiting-entry';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export type ClientJourneyStep = {
  id: string;
  label: string;
  done: boolean;
  doneAt?: string;
  dueDate?: string;
};

export type ClientJourney = {
  steps: ClientJourneyStep[];
  notes: string;
  removedStepIds?: string[];
};

export type Payment = {
  id: string;
  description: string;
  value: number;
  promotionalValue?: number;
  fixedValue?: number;
  dueDate: string;
  paymentDate?: string;
  month?: string;
  createdMonth?: string;
  paid: boolean;
  status?: PaymentStatus;
};

export type PaymentFormData = {
  description: string;
  value: number | string;
  dueDate: string;
  paymentDate: string;
  month: string;
  paid: boolean;
};

export type Client = {
  id: string;
  companyName: string;
  responsible: string;
  whatsapp?: string;
  customStatus?: string;
  email?: string;
  address?: string;
  observations?: string;
  segment?: string;
  status: ClientStatus;
  payments: Payment[];
  journey?: ClientJourney;
};

export type ClientFormData = Pick<
  Client,
  'companyName' | 'responsible' | 'customStatus' | 'whatsapp' | 'address' | 'observations' | 'segment' | 'status'
>;

export type DashboardMetricDetail = {
  label: string;
  value: string;
};

export type DashboardMetric = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  tone?: 'positive' | 'neutral' | 'warning' | 'danger';
  details?: DashboardMetricDetail[];
  paymentList?: Array<{
    clientName: string;
    description: string;
    value: number;
    dueDate: string;
    paid: boolean;
    status: PaymentStatus;
  }>;
};

export type DashboardSection = {
  title: string;
  metrics: DashboardMetric[];
};

export const leadStageOptions = [
  'Novo',
  'Interessado',
  'Diagnóstico',
  'Orçamento',
  'Aguardando retorno',
  'Possível fechamento',
  'Ganho',
  'Perdido',
] as const;

export const leadOriginOptions = ['Formulário', 'Manual'] as const;

export type LeadStage = (typeof leadStageOptions)[number];
export type LeadOrigin = (typeof leadOriginOptions)[number];

export type Lead = {
  id: string;
  name: string;
  whatsapp: string;
  city: string;
  segment: string;
  origin: LeadOrigin;
  stage: LeadStage;
  convertedAt?: string | null;
  convertedClientId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadFormData = Pick<Lead, 'name' | 'whatsapp' | 'city' | 'segment' | 'origin' | 'stage'>;

export type LeadConversionResult = {
  alreadyConverted: boolean;
  clientId: string;
  lead: Lead;
};
