/**
 * TrendChart Component
 *
 * Reusable trend visualization using Recharts.
 * Displays vital signs over time with color-coding by grade.
 * Used for BP and Hemoglobin trends on dashboard.
 */

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendChartProps, TrendDataPoint } from '../types/index';
import './TrendChart.css';

const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title,
  unit,
  lineColor,
  getColor,
}) => {
  // Process data for rendering
  const processedData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      displayDate: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
    }));
  }, [data]);

  // Get reference line values based on metric type
  const getReferenceLines = () => {
    if (title.includes('Blood Pressure')) {
      return [
        {
          y: 120,
          label: 'Normal',
          stroke: '#10B981',
          strokeDasharray: '5 5',
        },
        {
          y: 130,
          label: 'Elevated',
          stroke: '#F59E0B',
          strokeDasharray: '5 5',
        },
        {
          y: 140,
          label: 'High',
          stroke: '#EF4444',
          strokeDasharray: '5 5',
        },
      ];
    } else if (title.includes('Hemoglobin')) {
      return [
        {
          y: 13.5,
          label: 'Normal (Male)',
          stroke: '#10B981',
          strokeDasharray: '5 5',
        },
        {
          y: 12,
          label: 'Normal (Female)',
          stroke: '#06B6D4',
          strokeDasharray: '5 5',
        },
        {
          y: 7.5,
          label: 'Critical',
          stroke: '#EF4444',
          strokeDasharray: '5 5',
        },
      ];
    }
    return [];
  };

  const CustomTooltip: React.FC<any> = (props) => {
    const { active, payload } = props;
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    return (
      <div className="tooltip-content">
        <p className="tooltip-date">{data.displayDate}</p>
        <p className="tooltip-value">
          <strong>{data.value}</strong> {unit}
        </p>
        {data.reading && (
          <p className="tooltip-reading">{data.reading}</p>
        )}
        <p className="tooltip-grade">
          <span
            className="grade-badge"
            style={{ backgroundColor: getColor(data.grade) }}
          >
            {data.grade}
          </span>
        </p>
      </div>
    );
  };

  return (
    <div className="trend-chart-container">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <p className="chart-subtitle">Readings from each donation visit</p>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={processedData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="displayDate"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: unit, angle: -90, position: 'insideLeft' }}
              tick={{ fill: '#6b7280' }}
            />

            {/* Reference lines for clinical thresholds */}
            {getReferenceLines().map((ref, idx) => (
              <ReferenceLine
                key={idx}
                y={ref.y}
                stroke={ref.stroke}
                strokeDasharray={ref.strokeDasharray}
                label={{ value: ref.label, position: 'right', fill: ref.stroke, fontSize: 11 }}
              />
            ))}

            <Tooltip content={<CustomTooltip />} />

            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={getColor(payload.grade)}
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 7 }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#10B981' }}></span>
          <span>Normal</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#F59E0B' }}></span>
          <span>Elevated/Low</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#EF4444' }}></span>
          <span>Critical</span>
        </div>
      </div>
    </div>
  );
};

export default TrendChart;
