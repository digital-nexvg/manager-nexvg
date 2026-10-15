import type { DashboardMetric, DashboardSection, Expense, Payment } from '../types';
import { formatDate, parseDateOnly } from '../utils/formatters';
import { getClients } from './clientService';
import { getExpenses } from './expenseService';

function getPaymentStatus(payment: Payment): 'paid' | 'pending' | 'overdue' {
  if (payment.paid) {
    return 'paid';
  }

  const today = new Date();
  const dueDate = new Date(payment.dueDate);
  const diffInDays = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);

  return diffInDays < 0 ? 'overdue' : 'pending';
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isPaymentInCreatedMonth(payment: Payment, monthKey: string): boolean {
  const createdMonth = payment.createdMonth ?? payment.month;

  return createdMonth === monthKey;
}

function isMonthlyPayment(payment: Payment): boolean {
  return payment.description === 'Mensalidade';
}

function isResourcePayment(payment: Payment): boolean {
  return payment.description.startsWith('Adicionar Recurso');
}

function isStructurePayment(payment: Payment): boolean {
  return !isMonthlyPayment(payment) && !isResourcePayment(payment);
}

function isPaymentInDueMonth(payment: Payment, monthKey: string): boolean {
  const dueDate = parseDateOnly(payment.dueDate);
  const paymentMonth = getMonthKey(dueDate);

  return paymentMonth === monthKey;
}

function isPaymentInReceivedMonth(payment: Payment, monthKey: string): boolean {
  const baseDate = payment.paymentDate ? parseDateOnly(payment.paymentDate) : parseDateOnly(payment.dueDate);

  return getMonthKey(baseDate) === monthKey;
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function getMonthShortLabel(date: Date): string {
  const label = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Jun-Dez/2026: mesmo intervalo de meses usado pela visão mensal, reaproveitado pela Visão Geral.
function getMonthOptions(): Date[] {
  const startDate = new Date(2026, 5, 1);
  const endDate = new Date(2026, 11, 1);
  const monthOptions: Date[] = [];

  for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
    monthOptions.push(new Date(date));
  }

  return monthOptions;
}

type StructureGroup = {
  key: string;
  clientName: string;
  createdMonth: string;
  latestDueDate: string;
};

function buildStructureGroups(payments: Array<Payment & { clientName: string }>): StructureGroup[] {
  const groups = new Map<string, StructureGroup>();

  for (const payment of payments) {
    if (!isStructurePayment(payment)) {
      continue;
    }

    const createdMonth = payment.createdMonth ?? payment.month ?? getMonthKey(parseDateOnly(payment.dueDate));
    const key = `${payment.clientName.trim().toLowerCase()}::${createdMonth}`;
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        key,
        clientName: payment.clientName,
        createdMonth,
        latestDueDate: payment.dueDate,
      });
      continue;
    }

    if (parseDateOnly(payment.dueDate).getTime() > parseDateOnly(existing.latestDueDate).getTime()) {
      existing.latestDueDate = payment.dueDate;
    }
  }

  return Array.from(groups.values());
}

const STRUCTURE_PRODUCTION_COST = 40;
const PRODUCTION_COST_EXEMPT_CLIENTS = new Set(['nexus', 'victor repara']);

function hasStructureProductionCost(group: StructureGroup): boolean {
  const clientName = group.clientName.trim().replace(/\s+/g, ' ').toLowerCase();
  return !PRODUCTION_COST_EXEMPT_CLIENTS.has(clientName);
}

// Núcleo de cálculo financeiro mensal: única fonte de verdade usada pela visão mensal e pela Visão Geral.
function computeMonthFinancials(payments: Array<Payment & { clientName: string }>, expenses: Expense[], monthDate: Date) {
  const monthKey = getMonthKey(monthDate);
  const billingMonthPayments = payments.filter((payment) => isPaymentInDueMonth(payment, monthKey));
  // Mensalidades geradas junto (mesmo createdMonth) entram na receita contratada do mês de origem, mesmo vencendo em meses futuros.
  const contractedRevenuePayments = payments.filter((payment) => isPaymentInCreatedMonth(payment, monthKey));
  const paidMonthPayments = payments.filter((payment) => payment.paid && isPaymentInReceivedMonth(payment, monthKey));
  const pendingMonthPayments = payments.filter((payment) => !payment.paid && isPaymentInDueMonth(payment, monthKey));
  const overdueMonthPayments = pendingMonthPayments.filter((payment) => getPaymentStatus(payment) === 'overdue');

  const receivedValue = paidMonthPayments.reduce((sum, payment) => sum + payment.value, 0);
  const pendingValue = pendingMonthPayments.reduce((sum, payment) => sum + payment.value, 0);
  const overdueValue = overdueMonthPayments.reduce((sum, payment) => sum + payment.value, 0);
  const billingValue = billingMonthPayments.reduce((sum, payment) => sum + payment.value, 0);
  const monthlyBillingValue = billingMonthPayments
    .filter((payment) => isMonthlyPayment(payment))
    .reduce((sum, payment) => sum + payment.value, 0);
  const resourceBillingValue = billingMonthPayments
    .filter((payment) => isResourcePayment(payment))
    .reduce((sum, payment) => sum + payment.value, 0);
  const structureBillingValue = billingMonthPayments
    .filter((payment) => isStructurePayment(payment))
    .reduce((sum, payment) => sum + payment.value, 0);
  const contractedRevenueValue = contractedRevenuePayments.reduce((sum, payment) => sum + payment.value, 0);
  const contractedStructureValue = contractedRevenuePayments
    .filter((payment) => isStructurePayment(payment))
    .reduce((sum, payment) => sum + payment.value, 0);
  const contractedResourceValue = contractedRevenuePayments
    .filter((payment) => isResourcePayment(payment))
    .reduce((sum, payment) => sum + payment.value, 0);
  const contractedMonthlyValue = contractedRevenuePayments
    .filter((payment) => isMonthlyPayment(payment))
    .reduce((sum, payment) => sum + payment.value, 0);
  const structureGroups = buildStructureGroups(payments);
  const structureGroupsEndingInMonth = structureGroups.filter(
    (group) => getMonthKey(parseDateOnly(group.latestDueDate)) === monthKey,
  );
  const contractedStructureCompanies = new Set(
    contractedRevenuePayments
      .filter((payment) => isStructurePayment(payment))
      .map((payment) => payment.clientName.trim().toLowerCase()),
  );
  const monthExpenses = expenses.filter((expense) => getMonthKey(parseDateOnly(expense.expenseDate)) === monthKey);
  const chargeableStructureGroupsEndingInMonth = structureGroupsEndingInMonth.filter(hasStructureProductionCost);
  const structureProductionCostValue = chargeableStructureGroupsEndingInMonth.length * STRUCTURE_PRODUCTION_COST;
  const expensesValue = monthExpenses.reduce((sum, expense) => sum + expense.value, 0);
  const productionCostValue = structureProductionCostValue + expensesValue;
  const netBillingValue = billingValue - productionCostValue;

  const nextDuePayment = pendingMonthPayments
    .slice()
    .sort((first, second) => new Date(first.dueDate).getTime() - new Date(second.dueDate).getTime())[0];
  const monthPaymentList = pendingMonthPayments
    .slice()
    .sort((first, second) => new Date(first.dueDate).getTime() - new Date(second.dueDate).getTime());

  return {
    monthKey,
    billingMonthPayments,
    contractedRevenuePayments,
    paidMonthPayments,
    pendingMonthPayments,
    overdueMonthPayments,
    receivedValue,
    pendingValue,
    overdueValue,
    billingValue,
    monthlyBillingValue,
    resourceBillingValue,
    structureBillingValue,
    contractedRevenueValue,
    contractedStructureValue,
    contractedResourceValue,
    contractedMonthlyValue,
    structureGroupsEndingInMonth,
    contractedStructureCompanies,
    monthExpenses,
    chargeableStructureGroupsEndingInMonth,
    structureProductionCostValue,
    expensesValue,
    productionCostValue,
    netBillingValue,
    nextDuePayment,
    monthPaymentList,
  };
}

function buildMonthMetrics(
  payments: Array<Payment & { clientName: string }>,
  expenses: Expense[],
  monthDate: Date,
): DashboardMetric[] {
  const {
    billingMonthPayments,
    contractedRevenuePayments,
    paidMonthPayments,
    pendingMonthPayments,
    overdueMonthPayments,
    receivedValue,
    pendingValue,
    overdueValue,
    billingValue,
    monthlyBillingValue,
    resourceBillingValue,
    structureBillingValue,
    contractedRevenueValue,
    contractedStructureValue,
    contractedResourceValue,
    contractedMonthlyValue,
    chargeableStructureGroupsEndingInMonth,
    contractedStructureCompanies,
    monthExpenses,
    structureProductionCostValue,
    expensesValue,
    productionCostValue,
    netBillingValue,
    nextDuePayment,
    monthPaymentList,
  } = computeMonthFinancials(payments, expenses, monthDate);

  const buildPaymentDetails = (list: Array<Payment & { clientName: string }>) =>
    list.map((payment) => ({
      label: payment.description,
      value: `${payment.clientName} • ${formatCurrency(payment.value)} • ${formatDate(payment.dueDate)} • ${payment.paid ? 'Pago' : 'Em aberto'}`,
    }));

  return [
    {
      title: 'Faturamento',
      value: formatCurrency(billingValue),
      subtitle: `Mensalidades: ${formatCurrency(monthlyBillingValue)} • Estruturas: ${formatCurrency(structureBillingValue)} • Recursos: ${formatCurrency(resourceBillingValue)}\nFaturamento líquido: ${formatCurrency(netBillingValue)}`,
      tone: 'positive',
      icon: '↗',
      details: buildPaymentDetails(billingMonthPayments),
    },
    {
      title: 'Receita Contratada',
      value: formatCurrency(contractedRevenueValue),
      subtitle: `Estrutura: ${formatCurrency(contractedStructureValue)} • Recursos: ${formatCurrency(contractedResourceValue)} • Mensalidades: ${formatCurrency(contractedMonthlyValue)}\n${contractedStructureCompanies.size} empresas com estrutura gerada no mês`,
      tone: 'warning',
      icon: '📄',
      details: buildPaymentDetails(contractedRevenuePayments),
    },
    {
      title: 'Custo de Produção',
      value: formatCurrency(productionCostValue),
      subtitle: `${chargeableStructureGroupsEndingInMonth.length} estruturas com custo: ${formatCurrency(structureProductionCostValue)} • Despesas: ${formatCurrency(expensesValue)}`,
      tone: 'danger',
      icon: '⚙',
      details: [
        ...chargeableStructureGroupsEndingInMonth.map((group) => ({
          label: group.clientName,
          value: `Última parcela: ${formatDate(group.latestDueDate)} • ${formatCurrency(STRUCTURE_PRODUCTION_COST)}`,
        })),
        ...monthExpenses.map((expense) => ({
          label: expense.description ? `${expense.reason}: ${expense.description}` : expense.reason,
          value: `${formatDate(expense.expenseDate)} • ${formatCurrency(expense.value)}`,
        })),
      ],
    },
    {
      title: 'Recebido',
      value: formatCurrency(receivedValue),
      subtitle: `${paidMonthPayments.length} pagamentos confirmados`,
      tone: 'positive',
      icon: '✓',
      details: buildPaymentDetails(paidMonthPayments),
    },
    {
      title: 'Em Aberto',
      value: formatCurrency(pendingValue),
      subtitle: `${pendingMonthPayments.length} parcelas em aberto`,
      tone: 'neutral',
      icon: 'R$',
      details: buildPaymentDetails(pendingMonthPayments),
    },
    {
      title: 'Vencidos',
      value: formatCurrency(overdueValue),
      subtitle: `${overdueMonthPayments.length} parcelas vencidas`,
      tone: 'danger',
      icon: '⏳',
      details: buildPaymentDetails(overdueMonthPayments),
    },
    {
      title: 'Próximo Vencimento',
      value: nextDuePayment ? formatDate(nextDuePayment.dueDate) : '—',
      subtitle: nextDuePayment ? nextDuePayment.clientName : 'Sem vencimento em aberto',
      tone: 'neutral',
      icon: '🗓',
      details: nextDuePayment
        ? [
            { label: 'Cliente', value: nextDuePayment.clientName },
            { label: 'Descrição', value: nextDuePayment.description },
            { label: 'Valor', value: formatCurrency(nextDuePayment.value) },
            { label: 'Vencimento', value: formatDate(nextDuePayment.dueDate) },
          ]
        : [{ label: 'Status', value: 'Sem vencimentos pendentes' }],
      paymentList: monthPaymentList.map((payment) => ({
        clientName: payment.clientName,
        description: payment.description,
        value: payment.value,
        dueDate: payment.dueDate,
        paid: payment.paid,
        status: payment.paid ? 'paid' : getPaymentStatus(payment),
      })),
    },
  ];
}

export async function getDashboardSections(): Promise<DashboardSection[]> {
  const [clients, expenses] = await Promise.all([getClients(), getExpenses()]);
  const payments = clients.flatMap((client) => client.payments.map((payment) => ({ ...payment, clientName: client.companyName })));

  const activeClients = clients.filter((client) => client.status === 'active').length;
  const inactiveClients = clients.filter((client) => client.status === 'inactive' || client.status === 'waiting-entry').length;

  const monthOptions = getMonthOptions();

  const monthSections = monthOptions.map((monthDate) => ({
    title: `Mês ${getMonthLabel(monthDate)}`,
    metrics: buildMonthMetrics(payments, expenses, monthDate),
  }));

  return [
    {
      title: 'Resumo geral',
      metrics: [
        {
          title: 'Clientes Ativos',
          value: activeClients,
          subtitle: 'Em dia com o plano atual',
          tone: 'positive',
          icon: '✓',
          details: [
            { label: 'Quantidade', value: `${activeClients} clientes` },
            { label: 'Status', value: 'Ativos e com cobrança regular' },
          ],
        },
        {
          title: 'Clientes Inativos',
          value: inactiveClients,
          subtitle: 'Precisam de revisão',
          tone: 'warning',
          icon: '•',
          details: [
            { label: 'Quantidade', value: `${inactiveClients} clientes` },
            { label: 'Status', value: 'Clientes inativos ou em revisão' },
          ],
        },
      ],
    },
    ...monthSections,
  ];
}

export type MonthlyFinancialPoint = {
  monthKey: string;
  monthLabel: string;
  shortLabel: string;
  faturamento: number;
  receitaContratada: number;
  recebido: number;
  despesas: number;
  vencidos: number;
  resultado: number;
};

type FinancialTotals = Omit<MonthlyFinancialPoint, 'monthKey' | 'monthLabel' | 'shortLabel'>;

export type OverviewFinancialData = {
  points: MonthlyFinancialPoint[];
  totals: FinancialTotals;
  averages: FinancialTotals;
  growth: {
    percent: number | null;
    lastLabel: string;
    previousLabel: string;
    lastValue: number;
    previousValue: number;
  } | null;
  maxFaturamento: { monthLabel: string; value: number } | null;
  minFaturamento: { monthLabel: string; value: number } | null;
};

const FINANCIAL_TOTAL_KEYS = ['faturamento', 'receitaContratada', 'recebido', 'despesas', 'vencidos', 'resultado'] as const;

// Início oficial das operações financeiras da NEXVG: meses anteriores não entram em nenhum cálculo/indicador da Visão Geral.
const NEXVG_START_DATE = new Date(2026, 6, 1);
const NEXVG_ANNUAL_PERIOD_MONTHS = 6; // Julho a Dezembro

function getNexvgAnnualEndDate(): Date {
  return new Date(NEXVG_START_DATE.getFullYear(), NEXVG_START_DATE.getMonth() + NEXVG_ANNUAL_PERIOD_MONTHS - 1, 1);
}

function sumPoints(list: MonthlyFinancialPoint[], key: (typeof FINANCIAL_TOTAL_KEYS)[number]): number {
  return list.reduce((sum, point) => sum + point[key], 0);
}

// Consolida os mesmos dados/regras da visão mensal (computeMonthFinancials) para alimentar a Visão Geral, sem duplicar lógica financeira.
export async function getOverviewFinancialData(): Promise<OverviewFinancialData> {
  const [clients, expenses] = await Promise.all([getClients(), getExpenses()]);
  const payments = clients.flatMap((client) => client.payments.map((payment) => ({ ...payment, clientName: client.companyName })));
  const monthOptions = getMonthOptions();

  const points: MonthlyFinancialPoint[] = monthOptions.map((monthDate) => {
    const financials = computeMonthFinancials(payments, expenses, monthDate);

    return {
      monthKey: financials.monthKey,
      monthLabel: `Mês ${getMonthLabel(monthDate)}`,
      shortLabel: getMonthShortLabel(monthDate),
      faturamento: financials.billingValue,
      receitaContratada: financials.contractedRevenueValue,
      recebido: financials.receivedValue,
      despesas: financials.productionCostValue,
      vencidos: financials.overdueValue,
      resultado: financials.netBillingValue,
    };
  });

  // Meses anteriores a julho/2026 (ex: junho) continuam aparecendo no gráfico, mas ficam de fora de todo cálculo/indicador abaixo.
  const startKey = getMonthKey(NEXVG_START_DATE);
  const annualEndKey = getMonthKey(getNexvgAnnualEndDate());
  const todayKey = getMonthKey(new Date());
  const currentBoundKey = todayKey < annualEndKey ? todayKey : annualEndKey;

  const annualPeriodPoints = points.filter((point) => point.monthKey >= startKey && point.monthKey <= annualEndKey);
  // "Atual": julho até o mês vigente, sempre incluindo o mês vigente mesmo que ainda esteja zerado.
  const currentPeriodPoints = annualPeriodPoints.filter((point) => point.monthKey <= currentBoundKey);

  const totals = FINANCIAL_TOTAL_KEYS.reduce((acc, key) => {
    acc[key] = sumPoints(annualPeriodPoints, key);
    return acc;
  }, {} as FinancialTotals);

  const currentMonthCount = currentPeriodPoints.length || 1;
  const monthsWithReceipt = annualPeriodPoints.filter((point) => point.recebido > 0);

  const averages: FinancialTotals = {
    faturamento: sumPoints(currentPeriodPoints, 'faturamento') / currentMonthCount,
    receitaContratada: sumPoints(currentPeriodPoints, 'receitaContratada') / currentMonthCount,
    // Média de recebido só considera meses com recebimento efetivo > 0 (meses futuros/sem recebimento não entram no denominador).
    recebido: monthsWithReceipt.length ? sumPoints(monthsWithReceipt, 'recebido') / monthsWithReceipt.length : 0,
    despesas: sumPoints(annualPeriodPoints, 'despesas') / (annualPeriodPoints.length || 1),
    vencidos: sumPoints(annualPeriodPoints, 'vencidos') / (annualPeriodPoints.length || 1),
    resultado: sumPoints(annualPeriodPoints, 'resultado') / (annualPeriodPoints.length || 1),
  };

  let growth: OverviewFinancialData['growth'] = null;
  if (currentPeriodPoints.length >= 2) {
    const last = currentPeriodPoints[currentPeriodPoints.length - 1];
    const previous = currentPeriodPoints[currentPeriodPoints.length - 2];
    const percent = previous.faturamento !== 0 ? ((last.faturamento - previous.faturamento) / Math.abs(previous.faturamento)) * 100 : null;

    growth = {
      percent,
      lastLabel: last.monthLabel,
      previousLabel: previous.monthLabel,
      lastValue: last.faturamento,
      previousValue: previous.faturamento,
    };
  }

  const maxPoint = annualPeriodPoints.length
    ? annualPeriodPoints.reduce((max, point) => (point.faturamento > max.faturamento ? point : max))
    : null;
  const minPoint = annualPeriodPoints.length
    ? annualPeriodPoints.reduce((min, point) => (point.faturamento < min.faturamento ? point : min))
    : null;

  return {
    points,
    totals,
    averages,
    growth,
    maxFaturamento: maxPoint ? { monthLabel: maxPoint.monthLabel, value: maxPoint.faturamento } : null,
    minFaturamento: minPoint ? { monthLabel: minPoint.monthLabel, value: minPoint.faturamento } : null,
  };
}
