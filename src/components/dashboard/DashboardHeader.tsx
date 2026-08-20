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
  return (
    <>
      <header className="dashboard-header">
        <div className="dashboard-header__brand-main">
          {logoSrc ? (
            <img src={logoSrc} alt={title} className="dashboard-header__logo" />
          ) : (
            <h1>{title}</h1>
          )}

          {isMobile && onToggleMenu ? (
            <button type="button" className="dashboard-header__menu-button" onClick={onToggleMenu} aria-label="Abrir menu">
              ☰
            </button>
          ) : null}
        </div>

        {isMobile && mobileMenu ? <div className="dashboard-header__mobile-menu">{mobileMenu}</div> : null}
      </header>

      <section className="dashboard-header__summary">
        <div className="dashboard-header__copy">
            <div className="dashboard-header__text-stack">
              <p className="dashboard-header__eyebrow dashboard-header__eyebrow--inline">Dashboard</p>
              <h1 className="dashboard-header__title">{title}</h1>
              <p className="dashboard-header__subtitle">{subtitle}</p>
            </div>
        </div>

        <div className="dashboard-header__status">
          <span className="dashboard-header__dot" aria-hidden="true" />
          Atualizado agora
        </div>
      </section>
    </>
  );
}
