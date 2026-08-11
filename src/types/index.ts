export type ClientStatus = 'active' | 'inactive' | 'waiting-entry';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export type ClientJourneyStep = {
  id: string;
  label: string;
  done: boolean;
  doneAt?: string;
};

export type ClientJourney = {
  steps: ClientJourneyStep[];
  notes: string;
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
