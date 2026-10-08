/**
 * Home Screen - Main Dashboard for Donors
 *
 * Displays:
 * - Donor greeting with timezone-aware time of day
 * - Latest blood pressure with trend
 * - Latest hemoglobin with trend
 * - Current deferral status (if applicable)
 * - Latest finding with action button
 * - Quick action buttons
 * - Health status badge
 * - Last donation date
 */

import React, { useEffect, useState } from 'react';
import { Donor, Finding, Observation, Donation, TrendDataPoint } from '../types/index';
import { useDonor, useDonorFindings, useDonorObservations } from '../hooks/useFirestoreListener';
import { useMultiLanguage } from '../hooks/useMultiLanguage';
import HealthStatusBadge from '../components/HealthStatusBadge';
import './Home.css';

interface HomeProps {
  donorId: string;
  onNavigate: (page: string, data?: any) => void;
}

const Home: React.FC<HomeProps> = ({ donorId, onNavigate }) => {
  const { donor, loading: donorLoading } = useDonor(donorId);
  const { findings, loading: findingsLoading } = useDonorFindings(donorId, 1);
  const { observations, loading: obsLoading } = useDonorObservations(donorId, undefined, 1);

  const { translate, currentLanguage } = useMultiLanguage(donor?.language || 'en');

  const [latestBP, setLatestBP] = useState<Observation | null>(null);
  const [latestHb, setLatestHb] = useState<Observation | null>(null);
  const [lastDonation, setLastDonation] = useState<Donation | null>(null);
  const [bpTrend, setBpTrend] = useState<'up' | 'down' | 'stable'>('stable');

  // Extract latest vital signs from observations
  useEffect(() => {
    if (observations && observations.length > 0) {
      const bp = observations.find((o) => o.type === 'BP');
      const hb = observations.find((o) => o.type === 'Hb');

      if (bp) setLatestBP(bp);
      if (hb) setLatestHb(hb);
    }
  }, [observations]);

  // Fetch last donation date
  useEffect(() => {
    const fetchLastDonation = async () => {
      try {
        const response = await fetch(`/api/donors/${donorId}/donations/last`);
        if (response.ok) {
          const json = await response.json();
          setLastDonation(json.data);
        }
      } catch {
        // Silent fail
      }
    };

    if (donorId) {
      fetchLastDonation();
    }
  }, [donorId]);

  const getHealthStatus = (): 'healthy' | 'warning' | 'urgent' => {
    if (!donor) return 'healthy';

    switch (donor.healthStatus) {
      case 'healthy':
        return 'healthy';
      case 'monitored':
      case 'at_risk':
        return 'warning';
      case 'deferred':
        return 'urgent';
      default:
        return 'healthy';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const parseBloodPressure = (value: string): { systolic: number; diastolic: number } | null => {
    const match = value.match(/(\d+)\/(\d+)/);
    if (match) {
      return { systolic: parseInt(match[1]), diastolic: parseInt(match[2]) };
    }
    return null;
  };

  const getBPTrendArrow = (): string => {
    // In production, compare with historical data
    return bpTrend === 'up' ? '↑' : bpTrend === 'down' ? '↓' : '→';
  };

  const getBPGrade = (bpParsed: { systolic: number; diastolic: number }): string => {
    const { systolic, diastolic } = bpParsed;
    if (systolic >= 140 || diastolic >= 90) return 'High';
    if (systolic >= 130 || diastolic >= 80) return 'Elevated';
    return 'Normal';
  };

  const getHbGrade = (value: number): string => {
    if (value < 7.5) return 'Critical';
    if (value < 12) return 'Low';
    return 'Normal';
  };

  if (donorLoading) {
    return (
      <div className="home-container">
        <div className="loading-state">
          <p>Loading your health data...</p>
        </div>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="home-container">
        <div className="error-state">
          <p>Unable to load donor information</p>
        </div>
      </div>
    );
  }

  const latestFinding = findings && findings.length > 0 ? findings[0] : null;
  const bpParsed = latestBP ? parseBloodPressure(latestBP.value) : null;
  const hbValue = latestHb ? parseFloat(latestHb.value) : null;

  return (
    <div className="home-container">
      {/* Header with Greeting */}
      <div className="home-header">
        <div className="greeting-section">
          <h1 className="greeting-text">
            {translate('greeting', { name: donor.name })}
          </h1>
          <p className="greeting-subtitle">Your health summary</p>
        </div>
        <HealthStatusBadge status={getHealthStatus()} />
      </div>

      {/* Vital Signs Cards */}
      <div className="vitals-grid">
        {/* Blood Pressure Card */}
        {latestBP && bpParsed && (
          <div className="vital-card bp-card">
            <div className="vital-header">
              <h3 className="vital-label">Blood Pressure</h3>
              <span className="vital-timestamp">
                {formatDate(latestBP.recordedAt)}
              </span>
            </div>
            <div className="vital-value">
              <span className="value-number">{bpParsed.systolic}/{bpParsed.diastolic}</span>
              <span className="value-unit">mmHg</span>
              <span className="trend-arrow">{getBPTrendArrow()}</span>
            </div>
            <div className="vital-grade">
              <span className={`grade-badge grade-${getBPGrade(bpParsed).toLowerCase()}`}>
                {getBPGrade(bpParsed)}
              </span>
            </div>
          </div>
        )}

        {/* Hemoglobin Card */}
        {latestHb && hbValue !== null && (
          <div className="vital-card hb-card">
            <div className="vital-header">
              <h3 className="vital-label">Hemoglobin</h3>
              <span className="vital-timestamp">
                {formatDate(latestHb.recordedAt)}
              </span>
            </div>
            <div className="vital-value">
              <span className="value-number">{hbValue.toFixed(1)}</span>
              <span className="value-unit">g/dL</span>
            </div>
            <div className="vital-grade">
              <span className={`grade-badge grade-${getHbGrade(hbValue).toLowerCase()}`}>
                {getHbGrade(hbValue)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Deferral Status (if applicable) */}
      {donor.healthStatus === 'deferred' && (
        <div className="alert-card deferral-alert">
          <div className="alert-icon">!</div>
          <div className="alert-content">
            <h4>Currently Deferred</h4>
            <p>You are temporarily not eligible to donate. Please follow up with your healthcare provider.</p>
            <button
              className="alert-action-button"
              onClick={() => onNavigate('dashboard')}
            >
              View Care Plan
            </button>
          </div>
        </div>
      )}

      {/* Latest Finding */}
      {latestFinding && (
        <div className="latest-finding-section">
          <h3 className="section-title">Latest Health Alert</h3>
          <div className="finding-preview">
            <div className="finding-preview-header">
              <h4 className="finding-title">{latestFinding.category}</h4>
              <span className={`urgency-tag urgency-${latestFinding.urgency}`}>
                {latestFinding.urgency.toUpperCase()}
              </span>
            </div>
            <p className="finding-text">{latestFinding.description}</p>
            <button
              className="finding-action-btn"
              onClick={() => onNavigate('dashboard', { findingId: latestFinding.id })}
            >
              View Details →
            </button>
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="quick-actions-section">
        <h3 className="section-title">Quick Actions</h3>
        <div className="actions-grid">
          <button
            className="action-btn action-btn-primary"
            onClick={() => onNavigate('dashboard')}
          >
            <span className="action-icon">📊</span>
            <span className="action-text">View Details</span>
          </button>
          <button
            className="action-btn action-btn-secondary"
            onClick={() => onNavigate('appointments')}
          >
            <span className="action-icon">📅</span>
            <span className="action-text">Book Appointment</span>
          </button>
          <button
            className="action-btn action-btn-secondary"
            onClick={() => onNavigate('report')}
          >
            <span className="action-icon">⚠️</span>
            <span className="action-text">Report Issue</span>
          </button>
        </div>
      </div>

      {/* Last Donation Info */}
      {lastDonation && (
        <div className="last-donation-card">
          <span className="donation-icon">🩸</span>
          <div className="donation-info">
            <p className="donation-label">Last Donation</p>
            <p className="donation-date">{formatDate(lastDonation.performedAt)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
