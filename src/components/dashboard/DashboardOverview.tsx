import { useEffect, useMemo, useState } from 'react';
import type { DashboardMetric } from '../../types';
import { DashboardCard } from './DashboardCard';
import { DashboardGrid } from './DashboardGrid';
import { DashboardHeader } from './DashboardHeader';
import { DashboardMetricModal } from './DashboardMetricModal';
import { getDashboardSections } from '../../services/dashboardService';

function getMonthTitle(date: Date): string {
  return `Mês ${date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
}

type DashboardOverviewProps = {
  onToggleMenu?: () => void;
  isMobile?: boolean;
  mobileMenu?: React.ReactNode;
};

export function DashboardOverview({ onToggleMenu, isMobile = false, mobileMenu }: DashboardOverviewProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState<{ sectionTitle: string; metric: DashboardMetric } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonthTitle(new Date()));
  const [isPreviousMonthsOpen, setIsPreviousMonthsOpen] = useState(false);
  const [isFutureMonthsOpen, setIsFutureMonthsOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setRefreshKey((value) => value + 1);
    window.addEventListener('nexvg-storage-update', refresh);

    return () => {
      window.removeEventListener('nexvg-storage-update', refresh);
    };
  }, []);

  const sections = useMemo(() => getDashboardSections(), [refreshKey]);
  const monthSections = useMemo(() => sections.filter((section) => section.title.startsWith('Mês ')), [sections]);
  const currentMonthTitle = useMemo(() => getMonthTitle(new Date()), [refreshKey]);
  const currentMonthIndex = useMemo(() => {
    const index = monthSections.findIndex((section) => section.title === currentMonthTitle);
    return index >= 0 ? index : 0;
  }, [currentMonthTitle, monthSections]);
  const visibleMonthSections = useMemo(() => monthSections.slice(currentMonthIndex, currentMonthIndex + 1), [currentMonthIndex, monthSections]);
  const previousMonthSections = useMemo(() => monthSections.slice(0, currentMonthIndex), [currentMonthIndex, monthSections]);
  const futureMonthSections = useMemo(() => monthSections.slice(currentMonthIndex + 1), [currentMonthIndex, monthSections]);
  const selectedSection = monthSections.find((section) => section.title === selectedMonth) ?? visibleMonthSections[0] ?? monthSections[0] ?? null;

  return (
    <section className="dashboard-shell" key={refreshKey}>
      <DashboardHeader
        title="NEXVG Manager"
        subtitle="Resumo financeiro e operacional em um só lugar."
        logoSrc="/logo.png"
        onToggleMenu={onToggleMenu}
        isMobile={isMobile}
        mobileMenu={mobileMenu}
      />

      <div className="dashboard-section">
        <div className="dashboard-month-nav__top">
          <div className="dashboard-month-nav__labels">
            <span className="dashboard-month-nav__label">Mês atual</span>
            {previousMonthSections.length ? (
              <button
                type="button"
                className="btn btn--ghost dashboard-month-nav__toggle"
                onClick={() => setIsPreviousMonthsOpen((current) => !current)}
              >
                Meses anteriores
              </button>
            ) : null}
            {futureMonthSections.length ? (
              <button
                type="button"
                className="btn btn--ghost dashboard-month-nav__toggle"
                onClick={() => setIsFutureMonthsOpen((current) => !current)}
              >
                Meses posteriores
              </button>
            ) : null}
          </div>
        </div>

        <div className="dashboard-month-nav">
          {visibleMonthSections.map((section) => (
            <button
              key={section.title}
              type="button"
              className={`btn ${selectedSection?.title === section.title ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setSelectedMonth(section.title)}
            >
              {section.title.replace('Mês ', '')}
            </button>
          ))}
        </div>
      </div>

      {isPreviousMonthsOpen ? (
        <div className="dashboard-month-modal__backdrop" onClick={() => setIsPreviousMonthsOpen(false)}>
          <div className="dashboard-month-modal" onClick={(event) => event.stopPropagation()}>
            <div className="dashboard-month-modal__header">
              <h3>Meses anteriores</h3>
              <button type="button" className="btn btn--ghost" onClick={() => setIsPreviousMonthsOpen(false)} aria-label="Fechar meses anteriores">
                ×
              </button>
            </div>

            <div className="dashboard-month-modal__list">
              {previousMonthSections.map((section) => (
                <button
                  key={section.title}
                  type="button"
                  className="dashboard-month-modal__item"
                  onClick={() => {
                    setSelectedMonth(section.title);
                    setIsPreviousMonthsOpen(false);
                  }}
                >
                  {section.title.replace('Mês ', '')}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {isFutureMonthsOpen ? (
        <div className="dashboard-month-modal__backdrop" onClick={() => setIsFutureMonthsOpen(false)}>
          <div className="dashboard-month-modal" onClick={(event) => event.stopPropagation()}>
            <div className="dashboard-month-modal__header">
              <h3>Meses posteriores</h3>
              <button type="button" className="btn btn--ghost" onClick={() => setIsFutureMonthsOpen(false)} aria-label="Fechar meses posteriores">
                ×
              </button>
            </div>

            <div className="dashboard-month-modal__list">
              {futureMonthSections.map((section) => (
                <button
                  key={section.title}
                  type="button"
                  className="dashboard-month-modal__item"
                  onClick={() => {
                    setSelectedMonth(section.title);
                    setIsFutureMonthsOpen(false);
                  }}
                >
                  {section.title.replace('Mês ', '')}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {selectedSection ? (
        <div className="dashboard-section">
          <h2 className="dashboard-section__title">{selectedSection.title}</h2>
          <DashboardGrid>
            {selectedSection.metrics.map((metric) => (
              <DashboardCard
                key={`${selectedSection.title}-${metric.title}`}
                title={metric.title}
                value={String(metric.value)}
                subtitle={metric.subtitle}
                icon={metric.icon}
                tone={metric.tone}
                onClick={() => setSelectedMetric({ sectionTitle: selectedSection.title, metric })}
              />
            ))}
          </DashboardGrid>
        </div>
      ) : null}

      <DashboardMetricModal
        isOpen={Boolean(selectedMetric)}
        metric={selectedMetric?.metric ?? null}
        title={selectedMetric?.sectionTitle ?? 'Resumo'}
        onClose={() => setSelectedMetric(null)}
      />
    </section>
  );
}
