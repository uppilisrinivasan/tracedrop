/**
 * Health Dashboard - Detailed Health Trends & Care Plan
 *
 * Displays:
 * - 3-month BP trend line chart
 * - 3-month Hb trend line chart
 * - Findings timeline (reverse chronological)
 * - Care navigation section
 * - Impact badges
 */

import React, { useMemo } from 'react';
import { useDonorObservations, useDonorFindings, useCarePlans } from '../hooks/useFirestoreListener';
import { Finding, Observation, CarePlan, TrendDataPoint } from '../types/index';
import TrendChart from '../components/TrendChart';
import FindingCard from '../components/FindingCard';
import './Dashboard.css';

interface DashboardProps {
  donorId: string;
  onNavigate: (page: string, data?: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ donorId, onNavigate }) => {
  const { observations, loading: obsLoading } = useDonorObservations(donorId, undefined, 90);
  const { findings, loading: findingsLoading } = useDonorFindings(donorId, 50);
  const { carePlans, loading: carePlansLoading } = useCarePlans(donorId);

  // Transform observations into trend data
  const bpTrendData = useMemo(() => {
    return observations
      .filter((o) => o.type === 'BP')
      .map((o) => {
        const match = o.value.match(/(\d+)\/(\d+)/);
        const systolic = match ? parseInt(match[1]) : 0;

        let grade = 'Normal';
        if (systolic >= 140) grade = 'High';
        else if (systolic >= 130) grade = 'Elevated';

        return {
          date: o.recordedAt,
          value: systolic,
          grade,
          reading: o.value,
        } as TrendDataPoint;
      })
      .reverse();
  }, [observations]);

  const hbTrendData = useMemo(() => {
    return observations
      .filter((o) => o.type === 'Hb')
      .map((o) => {
        const value = parseFloat(o.value);
        let grade = 'Normal';
        if (value < 7.5) grade = 'Critical';
        else if (value < 12) grade = 'Low';

        return {
          date: o.recordedAt,
          value,
          grade,
        } as TrendDataPoint;
      })
      .reverse();
  }, [observations]);

  // Color mapping for grades
  const getColorForGrade = (grade: string): string => {
    switch (grade) {
      case 'Normal':
        return '#10B981'; // Green
      case 'Elevated':
      case 'Low':
        return '#F59E0B'; // Amber
      case 'High':
      case 'Critical':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  // Calculate impact badges
  const hasEarlyDetection = findings?.some(
    (f) => f.trend === 'declining' && f.status === 'active'
  ) ?? false;

  const isConsistentDonor = observations.filter(
    (o) => new Date(o.recordedAt).getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000
  ).length >= 3;

  const isHealthConscious = carePlans?.some((cp) => cp.status === 'active') ?? false;

  if (obsLoading && findingsLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <p>Loading your health dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Your Health Dashboard</h1>
        <p>Track your vital signs over time and manage your care</p>
      </div>

      {/* Trend Charts */}
      <div className="charts-section">
        <h2 className="section-title">3-Month Trends</h2>

        {bpTrendData.length > 0 && (
          <TrendChart
            data={bpTrendData}
            title="Blood Pressure Trend"
            unit="mmHg (Systolic)"
            lineColor="#3b82f6"
            getColor={getColorForGrade}
          />
        )}

        {hbTrendData.length > 0 && (
          <TrendChart
            data={hbTrendData}
            title="Hemoglobin Trend"
            unit="g/dL"
            lineColor="#8b5cf6"
            getColor={getColorForGrade}
          />
        )}

        {bpTrendData.length === 0 && hbTrendData.length === 0 && (
          <div className="no-data-message">
            <p>No vital signs recorded in the last 90 days</p>
          </div>
        )}
      </div>

      {/* Impact Badges */}
      <div className="impact-badges-section">
        <h2 className="section-title">Your Impact</h2>
        <div className="badges-grid">
          {hasEarlyDetection && (
            <div className="impact-badge badge-early-detection">
              <span className="badge-icon">🎯</span>
              <span className="badge-text">Early Detection</span>
              <span className="badge-description">Health trends identified early</span>
            </div>
          )}
          {isConsistentDonor && (
            <div className="impact-badge badge-consistent">
              <span className="badge-icon">⭐</span>
              <span className="badge-text">Consistent Donor</span>
              <span className="badge-description">3+ donations recorded</span>
            </div>
          )}
          {isHealthConscious && (
            <div className="impact-badge badge-health-conscious">
              <span className="badge-icon">💚</span>
              <span className="badge-text">Health Conscious</span>
              <span className="badge-description">Following care recommendations</span>
            </div>
          )}
          {!hasEarlyDetection && !isConsistentDonor && !isHealthConscious && (
            <div className="impact-badge badge-placeholder">
              <span className="badge-icon">📈</span>
              <span className="badge-text">Keep Going</span>
              <span className="badge-description">Continue tracking your health</span>
            </div>
          )}
        </div>
      </div>

      {/* Care Navigation */}
      <div className="care-navigation-section">
        <h2 className="section-title">Care Navigation</h2>
        <div className="care-actions">
          <button className="care-action-btn" onClick={() => onNavigate('appointments')}>
            <span className="action-icon">📅</span>
            <span className="action-text">Book AAM Visit</span>
          </button>
          <button className="care-action-btn" onClick={() => onNavigate('care-partner')}>
            <span className="action-icon">👥</span>
            <span className="action-text">Contact Care Partner</span>
          </button>
        </div>
      </div>

      {/* Findings Timeline */}
      <div className="findings-section">
        <h2 className="section-title">Health Findings</h2>
        {findings && findings.length > 0 ? (
          <div className="findings-timeline">
            {findings.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                onClick={() => onNavigate('finding-detail', { findingId: finding.id })}
              />
            ))}
          </div>
        ) : (
          <div className="no-findings-message">
            <p>No health findings recorded</p>
            <span className="message-subtitle">Your health looks great!</span>
          </div>
        )}
      </div>

      {/* Active Care Plans */}
      {carePlans && carePlans.length > 0 && (
        <div className="active-care-plans-section">
          <h2 className="section-title">Active Care Plans</h2>
          <div className="care-plans-list">
            {carePlans
              .filter((cp) => cp.status === 'active' || cp.status === 'pending')
              .map((plan) => (
                <div key={plan.id} className="care-plan-card">
                  <div className="plan-header">
                    <h4 className="plan-action">{plan.proposedAction}</h4>
                    <span className={`plan-status status-${plan.status}`}>
                      {plan.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="plan-notes">{plan.notes}</p>
                  {plan.expectedCompletionDate && (
                    <p className="plan-date">
                      Expected completion: {new Date(plan.expectedCompletionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
