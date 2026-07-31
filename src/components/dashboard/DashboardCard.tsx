type DashboardCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string;
  tone?: 'positive' | 'neutral' | 'warning' | 'danger';
  onClick?: () => void;
};

export function DashboardCard({
  title,
  value,
  subtitle,
  icon = '•',
  tone = 'neutral',
  onClick,
}: DashboardCardProps) {
  return (
    <button type="button" className={`dashboard-card dashboard-card--${tone}`} onClick={onClick}>
      <div className="dashboard-card__top">
        <span className="dashboard-card__icon" aria-hidden="true">
          {icon}
        </span>
        <span className="dashboard-card__label">{title}</span>
      </div>

      <strong className="dashboard-card__value">{value}</strong>

      {subtitle ? <p className="dashboard-card__subtitle">{subtitle}</p> : null}
    </button>
  );
}
