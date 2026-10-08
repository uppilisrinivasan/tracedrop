/**
 * FindingCard Component
 *
 * Displays individual clinical finding with status, date, and action button.
 * Used in findings timeline on dashboard.
 */

import React from 'react';
import { Finding, Observation, FindingCardProps } from '../types/index';
import './FindingCard.css';

const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  observation,
  onClick,
}) => {
  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'critical':
        return '#EF4444'; // Red
      case 'urgent':
        return '#F97316'; // Orange
      case 'soon':
        return '#F59E0B'; // Amber
      case 'routine':
        return '#10B981'; // Green
      default:
        return '#6B7280'; // Gray
    }
  };

  const getUrgencyBgColor = (urgency: string): string => {
    switch (urgency) {
      case 'critical':
        return '#FEF2F2'; // Light Red
      case 'urgent':
        return '#FFF7ED'; // Light Orange
      case 'soon':
        return '#FFFBEB'; // Light Amber
      case 'routine':
        return '#F0FDF4'; // Light Green
      default:
        return '#F9FAFB'; // Light Gray
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      BP_GRADE1: 'High Blood Pressure (Stage 1)',
      BP_GRADE2: 'High Blood Pressure (Stage 2)',
      Hb_LOW: 'Low Hemoglobin',
      Hb_CRITICAL: 'Critical Hemoglobin Level',
      HR_ELEVATED: 'Elevated Heart Rate',
      DEFERRED: 'Deferral from Donation',
      OTHER: 'Health Alert',
    };
    return labels[category] || category;
  };

  const getTrendIndicator = (trend: string): React.ReactNode => {
    const indicators: Record<string, { icon: string; text: string; color: string }> = {
      improving: { icon: '↓', text: 'Improving', color: '#10B981' },
      stable: { icon: '→', text: 'Stable', color: '#6B7280' },
      declining: { icon: '↑', text: 'Declining', color: '#EF4444' },
      first_time: { icon: 'new', text: 'New', color: '#3B82F6' },
    };

    const indicator = indicators[trend] || indicators['stable'];
    return (
      <span className="trend-badge" style={{ color: indicator.color }}>
        {indicator.icon} {indicator.text}
      </span>
    );
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  return (
    <div
      className="finding-card"
      style={{ borderLeftColor: getUrgencyColor(finding.urgency) }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onClick) onClick();
      }}
    >
      <div
        className="finding-header"
        style={{ backgroundColor: getUrgencyBgColor(finding.urgency) }}
      >
        <div className="finding-title-section">
          <h3 className="finding-category">{getCategoryLabel(finding.category)}</h3>
          <p className="finding-timestamp">
            {formatDate(finding.createdAt)} at {formatTime(finding.createdAt)}
          </p>
        </div>
        <div className="finding-urgency-badge" style={{ backgroundColor: getUrgencyColor(finding.urgency) }}>
          <span className="urgency-text">{finding.urgency.toUpperCase()}</span>
        </div>
      </div>

      <div className="finding-body">
        <p className="finding-description">{finding.description}</p>

        <div className="finding-meta">
          <div className="meta-item">
            {getTrendIndicator(finding.trend)}
          </div>
          {observation && (
            <div className="meta-item">
              <span className="meta-label">Reading:</span>
              <span className="meta-value">
                {observation.value} {observation.unit}
              </span>
            </div>
          )}
        </div>

        <div className="finding-status">
          <span className={`status-badge status-${finding.status}`}>
            {finding.status.charAt(0).toUpperCase() + finding.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="finding-footer">
        {finding.recommendedAction && (
          <p className="action-recommendation">
            {finding.recommendedAction
              .replace(/_/g, ' ')
              .charAt(0)
              .toUpperCase() +
              finding.recommendedAction.replace(/_/g, ' ').slice(1)}
          </p>
        )}
        <button
          className="action-button"
          onClick={handleActionClick}
          aria-label={`View details for ${finding.category}`}
        >
          View Details →
        </button>
      </div>
    </div>
  );
};

export default FindingCard;
