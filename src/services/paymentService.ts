import type { Payment } from '../types';

export async function getPayments(): Promise<Payment[]> {
  return [];
}

export async function createPayment(payment: Payment): Promise<Payment> {
  return payment;
}
