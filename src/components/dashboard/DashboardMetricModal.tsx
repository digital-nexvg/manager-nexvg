import type { DashboardMetric } from '../../types';
import { formatDate } from '../../utils/formatters';

type DashboardMetricModalProps = {
  isOpen: boolean;
  metric: DashboardMetric | null;
  title: string;
  onClose: () => void;
};

export function DashboardMetricModal({ isOpen, metric, title, onClose }: DashboardMetricModalProps) {
  if (!isOpen || !metric) {
    return null;
  }

  return (
    <div className="dashboard-metric-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="dashboard-metric-modal__card" onClick={(event) => event.stopPropagation()}>
        <div className="dashboard-metric-modal__header">
          <div>
            <p className="section-tag">Resumo</p>
            <h3>{title}</h3>
          </div>

          <button type="button" className="btn btn--ghost btn--close dashboard-metric-modal__close" onClick={onClose} aria-label="Fechar detalhes do resumo">
            ×
          </button>
        </div>

        <div className="dashboard-metric-modal__body">
          <div className="dashboard-metric-modal__summary">
            <span className="dashboard-metric-modal__value">{String(metric.value)}</span>
            {metric.subtitle ? <p>{metric.subtitle}</p> : null}
          </div>

          {metric.title === 'Próximo Vencimento' && metric.paymentList?.length ? (
            <div className="dashboard-metric-modal__list">
              {metric.paymentList.map((payment, index) => (
                <div key={`${payment.clientName}-${payment.dueDate}-${index}`} className="dashboard-metric-modal__item">
                  <span className="dashboard-metric-modal__label">{payment.clientName}</span>
                  <span className="dashboard-metric-modal__text">
                    {payment.description} • {payment.paid ? 'Pago' : payment.status === 'overdue' ? 'Vencido' : 'Em aberto'} • {formatDate(payment.dueDate)} • R$ {payment.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : metric.details?.length ? (
            <div className="dashboard-metric-modal__list">
              {metric.details.map((detail, index) => (
                <div key={`${detail.label}-${index}`} className="dashboard-metric-modal__item">
                  <span className="dashboard-metric-modal__label">{detail.label}</span>
                  <span className="dashboard-metric-modal__text">{detail.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">Nenhum detalhe disponível para este resumo.</p>
          )}
        </div>
      </div>
    </div>
  );
}
