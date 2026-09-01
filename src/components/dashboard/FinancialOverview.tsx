import { useEffect, useMemo, useState } from 'react';
import { formatCurrency, getOverviewFinancialData } from '../../services/dashboardService';
import type { OverviewFinancialData } from '../../services/dashboardService';
import { FinancialLineChart } from './FinancialLineChart';
import type { FinancialLineChartSeries } from './FinancialLineChart';

const SERIES_CONFIG = [
  { key: 'faturamento', label: 'Faturamento', color: '#4f8cff' },
  { key: 'receitaContratada', label: 'Receita contratada', color: '#f5a623' },
  { key: 'recebido', label: 'Valor recebido', color: '#2ecc71' },
  { key: 'despesas', label: 'Despesas', color: '#e74c3c' },
] as const;

type SeriesKey = (typeof SERIES_CONFIG)[number]['key'];

const EMPTY_DATA: OverviewFinancialData = {
  points: [],
  totals: { faturamento: 0, receitaContratada: 0, recebido: 0, despesas: 0, vencidos: 0, resultado: 0 },
  averages: { faturamento: 0, receitaContratada: 0, recebido: 0, despesas: 0, vencidos: 0, resultado: 0 },
  growth: null,
  maxFaturamento: null,
  minFaturamento: null,
};

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return '—';
  }

  const sign = value > 0 ? '↑' : value < 0 ? '↓' : '→';
  return `${sign} ${Math.abs(value).toFixed(1)}%`;
}

export function FinancialOverview() {
  const [data, setData] = useState<OverviewFinancialData>(EMPTY_DATA);
  const [visibleKeys, setVisibleKeys] = useState<Set<SeriesKey>>(
    () => new Set(SERIES_CONFIG.map((item) => item.key)),
  );

  useEffect(() => {
    const refresh = async () => {
      try {
        const nextData = await getOverviewFinancialData();
        setData(nextData);
      } catch (error) {
        console.warn('Falha ao carregar a Visão Geral:', error);
        setData(EMPTY_DATA);
      }
    };

    refresh();
    window.addEventListener('nexvg-storage-update', refresh);
    window.addEventListener('nexvg-expenses-update', refresh);

    return () => {
      window.removeEventListener('nexvg-storage-update', refresh);
      window.removeEventListener('nexvg-expenses-update', refresh);
    };
  }, []);

  const labels = useMemo(() => data.points.map((point) => point.shortLabel), [data.points]);
  const chartSeries: FinancialLineChartSeries[] = useMemo(
    () =>
      SERIES_CONFIG.map((config) => ({
        key: config.key,
        label: config.label,
        color: config.color,
        values: data.points.map((point) => point[config.key]),
        average: data.averages[config.key],
      })),
    [data],
  );

  const toggleSeries = (key: SeriesKey) => {
    setVisibleKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="financial-overview">
      <div className="financial-overview__cards">
        <div className="financial-overview__card financial-overview__card--positive">
          <span className="financial-overview__card-label">Faturamento acumulado</span>
          <strong className="financial-overview__card-value">{formatCurrency(data.totals.faturamento)}</strong>
        </div>
        <div className="financial-overview__card financial-overview__card--warning">
          <span className="financial-overview__card-label">Receita contratada acumulada</span>
          <strong className="financial-overview__card-value">{formatCurrency(data.totals.receitaContratada)}</strong>
        </div>
        <div className="financial-overview__card financial-overview__card--positive">
          <span className="financial-overview__card-label">Valor recebido acumulado</span>
          <strong className="financial-overview__card-value">{formatCurrency(data.totals.recebido)}</strong>
        </div>
        <div className="financial-overview__card financial-overview__card--danger">
          <span className="financial-overview__card-label">Custo de produção acumulado</span>
          <strong className="financial-overview__card-value">{formatCurrency(data.totals.despesas)}</strong>
        </div>
        <div className="financial-overview__card financial-overview__card--danger">
          <span className="financial-overview__card-label">Vencidos</span>
          <strong className="financial-overview__card-value">{formatCurrency(data.totals.vencidos)}</strong>
        </div>
        <div className="financial-overview__card">
          <span className="financial-overview__card-label">Resultado acumulado</span>
          <strong className="financial-overview__card-value">{formatCurrency(data.totals.resultado)}</strong>
        </div>
      </div>

      <div className="financial-overview__section">
        <h3 className="financial-overview__section-title">Evolução Financeira</h3>

        <div className="financial-overview__filters">
          {SERIES_CONFIG.map((config) => (
            <label key={config.key} className="financial-overview__filter">
              <input
                type="checkbox"
                checked={visibleKeys.has(config.key)}
                onChange={() => toggleSeries(config.key)}
              />
              <span className="financial-overview__filter-swatch" style={{ backgroundColor: config.color }} />
              {config.label}
            </label>
          ))}
        </div>

        <FinancialLineChart labels={labels} series={chartSeries} visibleKeys={visibleKeys} />

        <div className="financial-overview__averages">
          {SERIES_CONFIG.map((config) => (
            <div key={config.key} className="financial-overview__average-item">
              <span className="financial-overview__filter-swatch" style={{ backgroundColor: config.color }} />
              <span>Média de {config.label.toLowerCase()}: <strong>{formatCurrency(data.averages[config.key])}</strong></span>
            </div>
          ))}
        </div>
      </div>

      <div className="financial-overview__section">
        <h3 className="financial-overview__section-title">Crescimento</h3>

        <div className="financial-overview__growth">
          <div className="financial-overview__growth-item">
            <span className="financial-overview__card-label">Faturamento vs. mês anterior</span>
            <strong className="financial-overview__card-value">{data.growth ? formatPercent(data.growth.percent) : '—'}</strong>
            {data.growth ? (
              <span className="financial-overview__growth-detail">
                {data.growth.previousLabel.replace('Mês ', '')} → {data.growth.lastLabel.replace('Mês ', '')}
              </span>
            ) : null}
          </div>

          <div className="financial-overview__growth-item">
            <span className="financial-overview__card-label">Maior faturamento mensal</span>
            <strong className="financial-overview__card-value">
              {data.maxFaturamento ? formatCurrency(data.maxFaturamento.value) : '—'}
            </strong>
            {data.maxFaturamento ? (
              <span className="financial-overview__growth-detail">{data.maxFaturamento.monthLabel.replace('Mês ', '')}</span>
            ) : null}
          </div>

          <div className="financial-overview__growth-item">
            <span className="financial-overview__card-label">Menor faturamento mensal</span>
            <strong className="financial-overview__card-value">
              {data.minFaturamento ? formatCurrency(data.minFaturamento.value) : '—'}
            </strong>
            {data.minFaturamento ? (
              <span className="financial-overview__growth-detail">{data.minFaturamento.monthLabel.replace('Mês ', '')}</span>
            ) : null}
          </div>

          <div className="financial-overview__growth-item">
            <span className="financial-overview__card-label">Média mensal de faturamento</span>
            <strong className="financial-overview__card-value">{formatCurrency(data.averages.faturamento)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
