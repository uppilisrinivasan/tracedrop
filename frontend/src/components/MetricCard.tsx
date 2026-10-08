/**
 * Metric Card Component - Phase 4
 * Reusable KPI display component with sparkline chart
 *
 * @file frontend/src/components/MetricCard.tsx
 * @author Claude
 */

import React from 'react';

interface Props {
  title: string;
  value: string | number;
  unit?: string;
  change?: {
    percent: number;
    direction: 'up' | 'down';
    label?: string;
  };
  sparklineData?: number[];
  status?: 'positive' | 'neutral' | 'warning';
  icon?: React.ReactNode;
  footer?: string;
}

export const MetricCard: React.FC<Props> = ({
  title,
  value,
  unit,
  change,
  sparklineData = [],
  status = 'neutral',
  icon,
  footer,
}) => {
  // Generate sparkline SVG
  const generateSparkline = (data: number[]): string => {
    if (data.length < 2) return '';

    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;
    const width = 60;
    const height = 25;
    const pointWidth = width / (data.length - 1);

    const points = data
      .map((value, i) => {
        const x = i * pointWidth;
        const y = height - ((value - minValue) / range) * (height - 4) - 2;
        return `${x},${y}`;
      })
      .join(' ');

    return `<polyline points="${points}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  };

  const statusColors: Record<string, string> = {
    positive: '#4CAF50',
    neutral: '#2196F3',
    warning: '#FF9800',
  };

  const changeDirection = change?.direction === 'up' ? '↑' : '↓';
  const changeColor = change?.direction === 'up' ? '#4CAF50' : '#d32f2f';

  return (
    <div className="metric-card" data-status={status}>
      <div className="metric-header">
        {icon && <div className="metric-icon">{icon}</div>}
        <div className="metric-title">{title}</div>
      </div>

      <div className="metric-content">
        <div className="metric-value">
          <span className="main-value">{value}</span>
          {unit && <span className="unit">{unit}</span>}
        </div>

        {change && (
          <div className="metric-change" style={{ color: changeColor }}>
            <span className="change-direction">{changeDirection}</span>
            <span className="change-percent">{Math.abs(change.percent)}%</span>
            {change.label && <span className="change-label">{change.label}</span>}
          </div>
        )}
      </div>

      {sparklineData.length > 0 && (
        <div className="metric-sparkline">
          <svg
            width="60"
            height="25"
            viewBox="0 0 60 25"
            preserveAspectRatio="xMidYMid meet"
            style={{ color: statusColors[status] }}
          >
            {/* Background grid */}
            <line x1="0" y1="25" x2="60" y2="25" stroke="currentColor" opacity="0.1" />
            {/* Sparkline */}
            {React.createElement('g', {
              dangerouslySetInnerHTML: { __html: generateSparkline(sparklineData) },
            })}
            {/* Recent dot */}
            <circle
              cx="60"
              cy={25 - ((sparklineData[sparklineData.length - 1] - Math.min(...sparklineData)) / (Math.max(...sparklineData) - Math.min(...sparklineData))) * 21 - 2}
              r="2"
              fill="currentColor"
            />
          </svg>
        </div>
      )}

      {footer && <div className="metric-footer">{footer}</div>}

      <style>{`
        .metric-card {
          background: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
            sans-serif;
          border-left: 4px solid #2196F3;
        }

        .metric-card[data-status='positive'] {
          border-left-color: #4CAF50;
        }

        .metric-card[data-status='warning'] {
          border-left-color: #FF9800;
        }

        .metric-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .metric-icon {
          font-size: 20px;
          line-height: 1;
        }

        .metric-title {
          font-size: 12px;
          color: #666;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .metric-content {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .metric-value {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .main-value {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1;
        }

        .unit {
          font-size: 14px;
          color: #999;
          font-weight: 500;
        }

        .metric-change {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
        }

        .change-direction {
          font-size: 16px;
        }

        .change-percent {
          margin-right: 2px;
        }

        .change-label {
          font-size: 11px;
          font-weight: 400;
          color: #666;
          margin-left: 2px;
        }

        .metric-sparkline {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 12px;
          opacity: 0.7;
        }

        .metric-sparkline svg {
          display: block;
        }

        .metric-footer {
          font-size: 12px;
          color: #999;
          padding-top: 8px;
          border-top: 1px solid #eee;
        }

        @media (prefers-color-scheme: dark) {
          .metric-card {
            background: #1e1e1e;
          }

          .metric-title {
            color: #999;
          }

          .main-value {
            color: #e0e0e0;
          }

          .unit {
            color: #666;
          }

          .metric-footer {
            color: #666;
            border-top-color: #333;
          }
        }
      `}</style>
    </div>
  );
};

export default MetricCard;
