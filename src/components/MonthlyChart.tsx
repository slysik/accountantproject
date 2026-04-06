'use client';

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/expense-processor';
import type { CategorizedExpense } from '@/types';

interface MonthlyChartProps {
  expenses: CategorizedExpense[];
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MonthlyChart({ expenses }: MonthlyChartProps) {
  const monthlyData = useMemo(() => {
    if (expenses.length === 0) return [];

    const totals: Record<string, number> = {};
    for (const e of expenses) {
      totals[e.month] = (totals[e.month] || 0) + e.amount;
    }

    return Object.entries(totals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => {
        const [, m] = month.split('-');
        const monthIndex = parseInt(m, 10) - 1;
        return {
          month,
          label: SHORT_MONTHS[monthIndex] ?? m,
          total,
        };
      });
  }, [expenses]);

  if (monthlyData.length < 2) return null;

  // Chart dimensions
  const width = 600;
  const height = 250;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxValue = Math.max(...monthlyData.map(d => d.total));
  const minValue = 0;
  const valueRange = maxValue - minValue || 1;

  // Grid lines (4 horizontal)
  const gridLineCount = 4;
  const gridLines = Array.from({ length: gridLineCount + 1 }, (_, i) => {
    const value = minValue + (valueRange / gridLineCount) * i;
    const y = paddingTop + chartHeight - (chartHeight * (value - minValue)) / valueRange;
    return { value, y };
  });

  // Data points
  const points = monthlyData.map((d, i) => {
    const x = paddingLeft + (chartWidth / (monthlyData.length - 1)) * i;
    const y = paddingTop + chartHeight - (chartHeight * (d.total - minValue)) / valueRange;
    return { x, y, ...d };
  });

  // SVG line path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Area path (filled below line)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  return (
    <div className="w-full overflow-hidden rounded-[24px] border border-border-primary/60 bg-bg-tertiary/40 p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="chartStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-primary)" />
            <stop offset="100%" stopColor="var(--success)" />
          </linearGradient>
          <linearGradient id="chartFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {gridLines.map((gl, i) => (
          <g key={i}>
            <line
              x1={paddingLeft}
              y1={gl.y}
              x2={width - paddingRight}
              y2={gl.y}
              stroke="var(--border-primary)"
              strokeOpacity={i === 0 ? 0.65 : 0.32}
              strokeWidth={0.75}
              strokeDasharray={i === 0 ? 'none' : '4 4'}
            />
            <text
              x={paddingLeft - 8}
              y={gl.y + 4}
              textAnchor="end"
              fill="var(--text-muted)"
              fontSize={10}
              fontFamily="var(--font-sans), sans-serif"
            >
              {formatCurrency(gl.value)}
            </text>
          </g>
        ))}

        {/* Filled area under line */}
        <path d={areaPath} fill="url(#chartFill)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="url(#chartStroke)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />

        {/* Data points and X-axis labels */}
        {points.map((p, i) => (
          <g key={i}>
            {/* Dot */}
            <circle cx={p.x} cy={p.y} r={5} fill="var(--bg-secondary)" stroke="var(--accent-primary)" strokeWidth={2.5} />
            <circle cx={p.x} cy={p.y} r={2} fill="var(--accent-primary)" />
            {/* X label */}
            <text
              x={p.x}
              y={height - 10}
              textAnchor="middle"
              fill="var(--text-secondary)"
              fontSize={11}
              fontFamily="var(--font-sans), sans-serif"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
