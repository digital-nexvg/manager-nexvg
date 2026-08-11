import { useEffect, useMemo, useState } from 'react';
import { MonthlyPaymentForm } from '../components/pagamentos/MonthlyPaymentForm';
import { PaymentList } from '../components/pagamentos/PaymentList';
import { StructurePaymentForm } from '../components/pagamentos/StructurePaymentForm';
import { addPaymentsToClient, deletePaymentFromClient, getClients, updatePaymentInClient } from '../services/clientService';
import type { Client, Payment } from '../types';
import { generateId } from '../utils/id';

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getTodayLocal(): string {
  return formatLocalDate(new Date());
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function parseMoneyInput(value: string): number {
  const normalizedValue = value.replace(/\s/g, '').replace(',', '.');
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

const today = getTodayLocal();

const buildStructureSchedule = (startDate: string, quantity: number): string[] => {
  const baseDate = new Date(`${startDate}T00:00:00`);
  const schedule: string[] = [];

  for (let index = 0; index < quantity; index += 1) {
    const nextDate = new Date(baseDate);
    nextDate.setDate(baseDate.getDate() + index * 7);
    schedule.push(formatLocalDate(nextDate));
  }

  return schedule;
};

const buildYearlyMonthlySchedule = (baseDate: string, value: number): Payment[] => {
  const start = new Date(`${baseDate}T00:00:00`);
  const remainingMonths = 12 - start.getMonth();

  return Array.from({ length: remainingMonths }, (_, index) => {
    const dueDate = new Date(start);
    dueDate.setMonth(start.getMonth() + index);

    return {
      id: generateId(),
      description: 'Mensalidade',
      value,
      promotionalValue: value,
      fixedValue: value,
      dueDate: formatLocalDate(dueDate),
      month: formatLocalDate(dueDate).slice(0, 7),
      createdMonth: getCurrentMonthKey(),
      paymentDate: '',
      paid: false,
    };
  });
};

const isOnOrBeforeDueDate = (dueDate: string, paymentDate: string) => paymentDate <= dueDate;

const resolveMonthlyPaymentValue = (payment: Payment, paymentDate: string): number => {
  if (isOnOrBeforeDueDate(payment.dueDate, paymentDate)) {
    return payment.promotionalValue ?? payment.value;
  }

  return payment.fixedValue ?? payment.value;
};

export function PagamentosPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'structure' | 'monthly'>('structure');
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isFinanceVisible, setIsFinanceVisible] = useState(false);
  const [structureValue, setStructureValue] = useState(0);
  const [installmentsQuantity, setInstallmentsQuantity] = useState(1);
  const [startDate, setStartDate] = useState(today);
  const [scheduleDates, setScheduleDates] = useState<string[]>([today]);
  const [monthlyPromotionalValue, setMonthlyPromotionalValue] = useState(0);
  const [monthlyFixedValue, setMonthlyFixedValue] = useState(0);
  const [dueDate, setDueDate] = useState(today);

  useEffect(() => {
    const refreshClients = async () => {
      const nextClients = await getClients();
      setClients(nextClients);
    };

    refreshClients();
    window.addEventListener('nexvg-storage-update', refreshClients);

    return () => {
      window.removeEventListener('nexvg-storage-update', refreshClients);
    };
  }, []);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  const handleAddPayment = (clientId: string) => {
    setSelectedClientId(clientId);
    setPaymentMode('monthly');
  };

  const handleSubmitStructure = async () => {
    if (!selectedClientId || !scheduleDates.length) {
      return;
    }

    const payments: Payment[] = scheduleDates.map((date, index) => ({
      id: generateId(),
      description: `Cobrança da estrutura ${index + 1}`,
      value: Number(structureValue),
      dueDate: date,
      month: date.slice(0, 7),
      createdMonth: getCurrentMonthKey(),
      paymentDate: '',
      paid: false,
    }));

    const nextClients = await addPaymentsToClient(selectedClientId, payments);
    setClients(nextClients);
    setStructureValue(0);
    setInstallmentsQuantity(1);
    setStartDate(today);
    setScheduleDates([today]);
  };

  const handleSubmitMonthly = async () => {
    if (!selectedClientId) {
      alert('Selecione uma empresa antes de salvar a mensalidade.');
      return;
    }

    const promotionalValue = monthlyPromotionalValue;
    const fixedValue = monthlyFixedValue;
    const nextClients = await addPaymentsToClient(
      selectedClientId,
      buildYearlyMonthlySchedule(dueDate, promotionalValue).map((payment) => ({
        ...payment,
        promotionalValue,
        fixedValue,
        value: promotionalValue,
      })),
    );
    setClients(nextClients);
    setMonthlyPromotionalValue(0);
    setMonthlyFixedValue(0);
    setDueDate(today);
  };

  const handleTogglePayment = async (clientId: string, paymentId: string, paid: boolean, paymentDate?: string) => {
    const targetClient = clients.find((client) => client.id === clientId);
    const targetPayment = targetClient?.payments.find((payment) => payment.id === paymentId);
    const confirmedPaymentDate = paid ? paymentDate || today : '';

    const nextClients = await updatePaymentInClient(
      clientId,
      paymentId,
      targetPayment
        ? {
            paid,
            status: paid ? 'paid' : 'pending',
            paymentDate: confirmedPaymentDate,
            value: resolveMonthlyPaymentValue(targetPayment, confirmedPaymentDate || today),
          }
        : { paid, status: paid ? 'paid' : 'pending', paymentDate: confirmedPaymentDate },
    );
    setClients(nextClients);
  };

  const handleDeletePayment = async (clientId: string, paymentId: string) => {
    const previousClients = clients;
    const nextClients = previousClients.map((client) =>
      client.id === clientId
        ? { ...client, payments: client.payments.filter((payment) => payment.id !== paymentId) }
        : client,
    );

    setClients(nextClients);

    try {
      await deletePaymentFromClient(clientId, paymentId);
    } catch (error) {
      console.error('Erro ao excluir pagamento:', error);
      setClients(previousClients);
      alert('Não foi possível excluir a mensalidade. Tente novamente.');
    }
  };

  return (
    <section className="payments-page">
      <div className="payments-page__header">
        <div>
          <p className="section-tag">Financeiro</p>
          <h1>Controle de pagamentos</h1>
        </div>
      </div>

      <div className="payments-page__content">
        <div className="payments-page__hero">
          <div className="payments-page__hero-copy">
            <p className="section-tag">Financeiro</p>
            <h2>Resumo das empresas e cobranças</h2>
            <p>Acompanhe o financeiro das empresas com um clique, sem poluir a tela inicial.</p>
          </div>

          <button type="button" className="btn btn--primary" onClick={() => setIsFinanceVisible((current) => !current)}>
            {isFinanceVisible ? 'Fechar financeiro' : 'Financeiro'}
          </button>
        </div>

        {isFinanceVisible ? (
          <div className="payments-page__list-card">
            {clients.map((client) => (
              <PaymentList
                key={client.id}
                client={client}
                onAddPayment={handleAddPayment}
                onTogglePayment={handleTogglePayment}
                onDeletePayment={handleDeletePayment}
              />
            ))}
          </div>
        ) : null}

        <div className="payments-page__form-card">
          {!isBillingOpen ? (
            <div className="payments-page__empty-state">
              <div>
                <p className="section-tag">Cobranças</p>
                <h2>Inicie o fluxo de cobrança</h2>
                <p>Cadastre cobranças de estrutura ou mensalidade quando precisar.</p>
              </div>
              <button type="button" className="btn btn--primary" onClick={() => setIsBillingOpen(true)}>
                Iniciar cobrança
              </button>
            </div>
          ) : (
            <>
              <div className="payments-page__form-top">
                <div className="payments-page__tabs">
                  <button
                    type="button"
                    className={`btn ${paymentMode === 'structure' ? 'btn--primary' : 'btn--secondary'}`}
                    onClick={() => setPaymentMode('structure')}
                  >
                    Cobrança da estrutura
                  </button>
                  <button
                    type="button"
                    className={`btn ${paymentMode === 'monthly' ? 'btn--primary' : 'btn--secondary'}`}
                    onClick={() => setPaymentMode('monthly')}
                  >
                    Mensalidade
                  </button>
                </div>

                <button type="button" className="btn btn--ghost" onClick={() => setIsBillingOpen(false)}>
                  Fechar
                </button>
              </div>

              <div className="payments-page__form-head">
                <div>
                  <p className="section-tag">Criação</p>
                  <h2>{selectedClient ? `Registrar cobrança para ${selectedClient.companyName}` : 'Selecione um cliente'}</h2>
                </div>
                <div className="payments-page__form-badge">
                  {selectedClient ? 'Fluxo em tempo real' : 'Escolha o cliente'}
                </div>
              </div>

              {paymentMode === 'structure' ? (
                <StructurePaymentForm
                  clients={clients}
                  selectedClientId={selectedClientId}
                  installmentValue={structureValue}
                  installmentsQuantity={installmentsQuantity}
                  startDate={startDate}
                  scheduleDates={scheduleDates}
                  onSelectedClientIdChange={(clientId) => setSelectedClientId(clientId || null)}
                  onInstallmentValueChange={(value) => setStructureValue(Number(value))}
                  onInstallmentsQuantityChange={(value) => {
                    const parsed = Number(value);
                    setInstallmentsQuantity(parsed || 1);
                    setScheduleDates(buildStructureSchedule(startDate, parsed || 1));
                  }}
                  onStartDateChange={(value) => {
                    setStartDate(value);
                    setScheduleDates(buildStructureSchedule(value, installmentsQuantity));
                  }}
                  onScheduleDateChange={(index, value) => {
                    setScheduleDates((current) => {
                      const next = [...current];
                      next[index] = value;
                      return next;
                    });
                  }}
                  onGenerateSchedule={() => {
                    setScheduleDates(buildStructureSchedule(startDate, installmentsQuantity));
                  }}
                  onSubmit={handleSubmitStructure}
                />
              ) : (
                <MonthlyPaymentForm
                  clients={clients}
                  selectedClientId={selectedClientId}
                  dueDate={dueDate}
                  promotionalValue={monthlyPromotionalValue}
                  fixedValue={monthlyFixedValue}
                  onSelectedClientIdChange={(clientId) => setSelectedClientId(clientId || null)}
                  onDueDateChange={(value) => setDueDate(value)}
                  onPromotionalValueChange={(value) => setMonthlyPromotionalValue(parseMoneyInput(value))}
                  onFixedValueChange={(value) => setMonthlyFixedValue(parseMoneyInput(value))}
                  onSubmit={handleSubmitMonthly}
                />
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
