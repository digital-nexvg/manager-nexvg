type DashboardGridProps = {
  children?: React.ReactNode;
};

export function DashboardGrid({ children }: DashboardGridProps) {
  return <section className="dashboard-grid">{children}</section>;
}
