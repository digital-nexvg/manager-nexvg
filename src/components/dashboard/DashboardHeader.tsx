type DashboardHeaderProps = {
  title?: string;
  subtitle?: string;
  logoSrc?: string;
};

export function DashboardHeader({
  title = 'NEXVG Manager',
  subtitle = 'Resumo do desempenho financeiro',
  logoSrc,
}: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__content">
        <div className="dashboard-header__brand">
          {logoSrc ? (
            <img src={logoSrc} alt={title} className="dashboard-header__logo" />
          ) : (
            <h1>{title}</h1>
          )}

          <div className="dashboard-header__copy">
            <div className="dashboard-header__text-stack">
              <p className="dashboard-header__eyebrow dashboard-header__eyebrow--inline">Dashboard</p>
              <p className="dashboard-header__subtitle">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-header__status">
        <span className="dashboard-header__dot" aria-hidden="true" />
        Atualizado agora
      </div>
    </header>
  );
}
