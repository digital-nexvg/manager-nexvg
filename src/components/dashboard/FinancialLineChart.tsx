export type FinancialLineChartSeries = {
  key: string;
  label: string;
  color: string;
  values: number[];
  average: number;
};

type FinancialLineChartProps = {
  labels: string[];
  series: FinancialLineChartSeries[];
  visibleKeys: Set<string>;
};

const CHART_WIDTH = 720;
const CHART_HEIGHT = 280;
const PADDING_LEFT = 64;
const PADDING_RIGHT = 16;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 36;

function formatAxisValue(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toFixed(0);
}

export function FinancialLineChart({ labels, series, visibleKeys }: FinancialLineChartProps) {
  const visibleSeries = series.filter((item) => visibleKeys.has(item.key));
  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const allValues = visibleSeries.flatMap((item) => [...item.values, item.average]);
  const maxValue = allValues.length ? Math.max(...allValues, 0) : 0;
  const minValue = allValues.length ? Math.min(...allValues, 0) : 0;
  const range = maxValue - minValue || 1;

  const toX = (index: number) => (labels.length <= 1 ? PADDING_LEFT : PADDING_LEFT + (index / (labels.length - 1)) * plotWidth);
  const toY = (value: number) => PADDING_TOP + plotHeight - ((value - minValue) / range) * plotHeight;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => minValue + ratio * range);

  if (!labels.length) {
    return <p className="empty-state">Sem meses disponíveis para exibir o gráfico.</p>;
  }

  return (
    <div className="financial-line-chart">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label="Gráfico de evolução financeira mensal"
        className="financial-line-chart__svg"
      >
        {gridLines.map((value) => (
          <g key={value}>
            <line
              x1={PADDING_LEFT}
              x2={CHART_WIDTH - PADDING_RIGHT}
              y1={toY(value)}
              y2={toY(value)}
              className="financial-line-chart__grid-line"
            />
            <text x={PADDING_LEFT - 8} y={toY(value)} className="financial-line-chart__axis-label" textAnchor="end" dominantBaseline="middle">
              {formatAxisValue(value)}
            </text>
          </g>
        ))}

        {labels.map((label, index) => (
          <text
            key={label}
            x={toX(index)}
            y={CHART_HEIGHT - PADDING_BOTTOM + 20}
            className="financial-line-chart__axis-label"
            textAnchor="middle"
          >
            {label}
          </text>
        ))}

        {visibleSeries.map((item) => (
          <line
            key={`${item.key}-average`}
            x1={PADDING_LEFT}
            x2={CHART_WIDTH - PADDING_RIGHT}
            y1={toY(item.average)}
            y2={toY(item.average)}
            className="financial-line-chart__average-line"
            style={{ stroke: item.color }}
          />
        ))}

        {visibleSeries.map((item) => (
          <polyline
            key={item.key}
            className="financial-line-chart__line"
            style={{ stroke: item.color }}
            points={item.values.map((value, index) => `${toX(index)},${toY(value)}`).join(' ')}
          />
        ))}

        {visibleSeries.map((item) =>
          item.values.map((value, index) => (
            <circle
              key={`${item.key}-${index}`}
              cx={toX(index)}
              cy={toY(value)}
              r={3.5}
              className="financial-line-chart__point"
              style={{ fill: item.color }}
            />
          )),
        )}
      </svg>
    </div>
  );
}
