type EmptyStateProps = {
  message?: string;
};

export function EmptyState({ message = 'Nenhum item encontrado.' }: EmptyStateProps) {
  return <p>{message}</p>;
}
