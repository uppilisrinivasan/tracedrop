/**
 * Funnel Visualization Component - Phase 4
 * Displays multi-stage funnel showing donor progression through care pipeline
 *
 * @file frontend/src/components/FunnelVisualization.tsx
 * @author Claude
 */

import React from 'react';

interface FunnelStage {
  stage: number;
  name: string;
  description: string;
  count: number;
  percentage: number;
  dropoff: number;
  color: string;
}

interface Props {
  stages: FunnelStage[];
  title?: string;
}

export const FunnelVisualization: React.FC<Props> = ({
  stages,
  title = 'Care Access Funnel',
}) => {
  const maxCount = Math.max(...stages.map((s) => s.count), 100);

  return (
    <div className="funnel-container">
      <div className="funnel-header">
        <h3>{title}</h3>
        <p className="funnel-subtitle">
          Showing donor progression through care pipeline
        </p>
      </div>

      <div className="funnel-chart">
        {stages.map((stage) => {
          const width = (stage.count / maxCount) * 100;
          const dropoffPercent =
            stage.stage > 1 ? ((stage.dropoff / stages[stage.stage - 2].count) * 100).toFixed(1) : '0';

          return (
            <div key={stage.stage} className="funnel-stage-container">
              <div className="stage-row">
                <div className="stage-label">
                  <strong>{stage.name}</strong>
                  <span className="stage-description">{stage.description}</span>
                </div>

                <div className="stage-funnel">
                  <svg
                    width="100%"
                    height="60"
                    viewBox="0 0 400 60"
                    preserveAspectRatio="none"
                  >
                    {/* Funnel shape */}
                    <polygon
                      points={`${(100 - width) / 2},5 ${(100 - width) / 2 + width},5 ${(100 - width) / 2 + width * 0.95},55 ${(100 - width) / 2 + width * 0.05},55`}
                      fill={stage.color}
                      opacity="0.8"
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                    />
                  </svg>
                </div>

                <div className="stage-stats">
                  <div className="stat-box">
                    <div className="stat-label">Count</div>
                    <div className="stat-value">{stage.count}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Rate</div>
                    <div className="stat-value">{stage.percentage.toFixed(1)}%</div>
                  </div>
                  {stage.stage > 1 && (
                    <div className="stat-box dropoff">
                      <div className="stat-label">Dropoff</div>
                      <div className="stat-value stat-negative">
                        -{dropoffPercent}%
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {stage.stage < stages.length && (
                <div className="stage-connector">
                  <svg width="100%" height="20" viewBox="0 0 400 20">
                    <path
                      d="M 200 0 Q 200 10, 200 20"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      opacity="0.3"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .funnel-container {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
            sans-serif;
        }

        .funnel-header {
          margin-bottom: 20px;
        }

        .funnel-header h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #1a1a1a;
          font-weight: 600;
        }

        .funnel-subtitle {
          margin: 0;
          font-size: 13px;
          color: #666;
        }

        .funnel-chart {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .funnel-stage-container {
          display: flex;
          flex-direction: column;
        }

        .stage-row {
          display: grid;
          grid-template-columns: 180px 1fr 150px;
          gap: 16px;
          align-items: center;
          min-height: 70px;
        }

        .stage-label {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stage-label strong {
          font-size: 14px;
          color: #1a1a1a;
          font-weight: 600;
        }

        .stage-description {
          font-size: 12px;
          color: #999;
        }

        .stage-funnel {
          flex: 1;
          min-height: 60px;
        }

        .stage-funnel svg {
          width: 100%;
          height: 100%;
        }

        .stage-stats {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .stat-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 8px 12px;
          background: #f5f5f5;
          border-radius: 6px;
          min-width: 45px;
        }

        .stat-label {
          font-size: 11px;
          color: #666;
          font-weight: 500;
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .stat-negative {
          color: #d32f2f;
        }

        .stat-box.dropoff {
          background: #ffebee;
        }

        .stage-connector {
          height: 20px;
          display: flex;
          justify-content: center;
          color: #ddd;
        }

        @media (prefers-color-scheme: dark) {
          .funnel-container {
            background: #1e1e1e;
          }

          .funnel-header h3 {
            color: #e0e0e0;
          }

          .funnel-subtitle {
            color: #999;
          }

          .stage-label strong {
            color: #e0e0e0;
          }

          .stage-description {
            color: #666;
          }

          .stat-box {
            background: #2a2a2a;
            color: #e0e0e0;
          }

          .stat-value {
            color: #e0e0e0;
          }

          .stat-box.dropoff {
            background: #3a1a1a;
          }

          .stage-connector {
            color: #333;
          }
        }

        @media (max-width: 768px) {
          .stage-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .stage-stats {
            justify-content: flex-start;
          }

          .stage-funnel {
            min-height: 50px;
          }
        }
      `}</style>
    </div>
  );
};

export default FunnelVisualization;
