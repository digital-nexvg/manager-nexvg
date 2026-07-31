import type { DashboardMetric, DashboardSection, Payment } from '../types';
import { formatDate, parseDateOnly } from '../utils/formatters';
import { getClients } from './clientService';

function getPaymentStatus(payment: Payment): 'paid' | 'pending' | 'overdue' {
  if (payment.paid) {
    return 'paid';
  }

  const today = new Date();
  const dueDate = new Date(payment.dueDate);
  const diffInDays = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);

  return diffInDays < 0 ? 'overdue' : 'pending';
}

function formatCurrency(value: number): string {
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

function isPaymentInDueMonth(payment: Payment, monthKey: string): boolean {
  const dueDate = parseDateOnly(payment.dueDate);
  const paymentMonth = getMonthKey(dueDate);

  return paymentMonth === monthKey;
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function buildMonthMetrics(payments: Array<Payment & { clientName: string }>, monthDate: Date): DashboardMetric[] {
  const monthKey = getMonthKey(monthDate);
  const billingMonthPayments = payments.filter((payment) => {
    if (isMonthlyPayment(payment)) {
      return isPaymentInDueMonth(payment, monthKey);
    }

    return isPaymentInCreatedMonth(payment, monthKey);
  });
  const paidMonthPayments = payments.filter((payment) => payment.paid && isPaymentInDueMonth(payment, monthKey));
  const pendingMonthPayments = payments.filter((payment) => !payment.paid && isPaymentInDueMonth(payment, monthKey));
  const overdueMonthPayments = pendingMonthPayments.filter((payment) => getPaymentStatus(payment) === 'overdue');

  const receivedValue = paidMonthPayments.reduce((sum, payment) => sum + payment.value, 0);
  const pendingValue = pendingMonthPayments.reduce((sum, payment) => sum + payment.value, 0);
  const overdueValue = overdueMonthPayments.reduce((sum, payment) => sum + payment.value, 0);
  const billingValue = billingMonthPayments.reduce((sum, payment) => sum + payment.value, 0);

  const nextDuePayment = pendingMonthPayments
    .slice()
    .sort((first, second) => new Date(first.dueDate).getTime() - new Date(second.dueDate).getTime())[0];
  const monthPaymentList = pendingMonthPayments
    .slice()
    .sort((first, second) => new Date(first.dueDate).getTime() - new Date(second.dueDate).getTime());

  const buildPaymentDetails = (list: Array<Payment & { clientName: string }>) =>
    list.map((payment) => ({
      label: payment.description,
      value: `${payment.clientName} • ${formatCurrency(payment.value)} • ${formatDate(payment.dueDate)} • ${payment.paid ? 'Pago' : 'Em aberto'}`,
    }));

  return [
    {
      title: 'Faturamento',
      value: formatCurrency(billingValue),
      subtitle: `Cobranças de ${getMonthLabel(monthDate)}`,
      tone: 'positive',
      icon: '↗',
      details: buildPaymentDetails(billingMonthPayments),
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

export function getDashboardSections(): DashboardSection[] {
  const clients = getClients();
  const payments = clients.flatMap((client) => client.payments.map((payment) => ({ ...payment, clientName: client.companyName })));

  const activeClients = clients.filter((client) => client.status === 'active').length;
  const inactiveClients = clients.filter((client) => client.status === 'inactive' || client.status === 'waiting-entry').length;

  const startDate = new Date(2026, 5, 1);
  const endDate = new Date(2026, 11, 1);
  const monthOptions = [] as Date[];

  for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
    monthOptions.push(new Date(date));
  }

  const monthSections = monthOptions.map((monthDate) => ({
    title: `Mês ${getMonthLabel(monthDate)}`,
    metrics: buildMonthMetrics(payments, monthDate),
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
