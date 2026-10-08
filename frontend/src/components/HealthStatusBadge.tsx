/**
 * HealthStatusBadge Component
 *
 * Displays donor's overall health status with color-coded indicator.
 * Used on Home screen and dashboard summaries.
 */

import React from 'react';
import { HealthStatusBadgeProps } from '../types/index';
import './HealthStatusBadge.css';

const HealthStatusBadge: React.FC<HealthStatusBadgeProps> = ({
  status,
  description,
}) => {
  const getStatusIcon = (): string => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'warning':
        return '⚠';
      case 'urgent':
        return '!';
      default:
        return '?';
    }
  };

  const getStatusText = (): string => {
    switch (status) {
      case 'healthy':
        return 'All Good';
      case 'warning':
        return 'Needs Attention';
      case 'urgent':
        return 'Urgent';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'healthy':
        return '#10B981'; // Green
      case 'warning':
        return '#F59E0B'; // Amber
      case 'urgent':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  return (
    <div className={`health-status-badge health-status-${status}`}>
      <div
        className="status-indicator"
        style={{ backgroundColor: getStatusColor() }}
      >
        <span className="status-icon">{getStatusIcon()}</span>
      </div>
      <div className="status-content">
        <p className="status-text">{getStatusText()}</p>
        {description && <p className="status-description">{description}</p>}
      </div>
    </div>
  );
};

export default HealthStatusBadge;
