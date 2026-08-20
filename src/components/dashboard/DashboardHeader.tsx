type DashboardHeaderProps = {
  title?: string;
  subtitle?: string;
  logoSrc?: string;
  onToggleMenu?: () => void;
  isMobile?: boolean;
  mobileMenu?: React.ReactNode;
};

export function DashboardHeader({
  title = 'NEXVG Manager',
  subtitle = 'Resumo do desempenho financeiro',
  logoSrc,
  onToggleMenu,
  isMobile = false,
  mobileMenu,
}: DashboardHeaderProps) {
  const logo = logoSrc ? (
    <img src={logoSrc} alt={title} className="dashboard-header__logo" />
  ) : (
    <h1>{title}</h1>
  );

  const copy = (
    <div className="dashboard-header__copy">
      <div className="dashboard-header__text-stack">
        <p className="dashboard-header__eyebrow dashboard-header__eyebrow--inline">Dashboard</p>
        <h1 className="dashboard-header__title">{title}</h1>
        <p className="dashboard-header__subtitle">{subtitle}</p>
      </div>
    </div>
  );

  const status = (
    <div className="dashboard-header__status">
      <span className="dashboard-header__dot" aria-hidden="true" />
      Atualizado agora
    </div>
  );

  if (!isMobile) {
    return (
      <header className="dashboard-header">
        <div className="dashboard-header__content">
          <div className="dashboard-header__brand">
            <div className="dashboard-header__brand-main">{logo}</div>
            {copy}
          </div>
        </div>
        {status}
      </header>
    );
  }

  return (
    <>
      <header className="dashboard-header">
        <div className="dashboard-header__brand-main">
          {logo}

          {isMobile && onToggleMenu ? (
            <button type="button" className="dashboard-header__menu-button" onClick={onToggleMenu} aria-label="Abrir menu">
              ☰
            </button>
          ) : null}
        </div>

        {isMobile && mobileMenu ? <div className="dashboard-header__mobile-menu">{mobileMenu}</div> : null}
      </header>

      <section className="dashboard-header__summary">
        {copy}
        {status}
      </section>
    </>
  );
}
