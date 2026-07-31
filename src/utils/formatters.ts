export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function parseDateOnly(date: string): Date {
  if (!date) {
    return new Date();
  }

  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(date: string): string {
  return parseDateOnly(date).toLocaleDateString('pt-BR');
}
