/**
 * Admin Dashboard - Phase 4
 * System administration and monitoring
 *
 * @file frontend/src/pages/AdminDashboard.tsx
 * @author Claude
 */

import React, { useState } from 'react';

interface AdminStats {
  totalDonors: number;
  totalAppointments: number;
  totalOutcomes: number;
  systemHealth: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats] = useState<AdminStats>({
    totalDonors: 2847,
    totalAppointments: 1923,
    totalOutcomes: 1456,
    systemHealth: 99.7,
  });

  const [activeView, setActiveView] = useState<'overview' | 'donors' | 'partners' | 'health'>('overview');

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>System administration and monitoring</p>
      </div>

      {/* Navigation */}
      <div className="nav-tabs">
        <button
          className={`nav-tab ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          Overview
        </button>
        <button
          className={`nav-tab ${activeView === 'donors' ? 'active' : ''}`}
          onClick={() => setActiveView('donors')}
        >
          Donors
        </button>
        <button
          className={`nav-tab ${activeView === 'partners' ? 'active' : ''}`}
          onClick={() => setActiveView('partners')}
        >
          Care Partners
        </button>
        <button
          className={`nav-tab ${activeView === 'health' ? 'active' : ''}`}
          onClick={() => setActiveView('health')}
        >
          System Health
        </button>
      </div>

      {/* Overview */}
      {activeView === 'overview' && (
        <div className="view-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-title">Total Donors</div>
              <div className="stat-value">{stats.totalDonors}</div>
              <div className="stat-change">+12% this month</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Appointments</div>
              <div className="stat-value">{stats.totalAppointments}</div>
              <div className="stat-change">+8% this month</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Outcomes Recorded</div>
              <div className="stat-value">{stats.totalOutcomes}</div>
              <div className="stat-change">+15% this month</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">System Health</div>
              <div className="stat-value">{stats.systemHealth}%</div>
              <div className="stat-change">Excellent</div>
            </div>
          </div>

          <div className="recent-activities">
            <h3>Recent Activities</h3>
            <div className="activity-list">
              <div className="activity">
                <span className="activity-type">Appointment Booked</span>
                <span className="activity-time">2 minutes ago</span>
              </div>
              <div className="activity">
                <span className="activity-type">Outcome Recorded</span>
                <span className="activity-time">5 minutes ago</span>
              </div>
              <div className="activity">
                <span className="activity-type">Finding Added to Queue</span>
                <span className="activity-time">12 minutes ago</span>
              </div>
              <div className="activity">
                <span className="activity-type">Care Plan Updated</span>
                <span className="activity-time">18 minutes ago</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Donors */}
      {activeView === 'donors' && (
        <div className="view-content">
          <div className="section">
            <h3>Donor Management</h3>
            <div className="table">
              <div className="table-header">
                <div>Name</div>
                <div>Status</div>
                <div>Findings</div>
                <div>Actions</div>
              </div>
              <div className="table-row">
                <div>Rajesh Kumar</div>
                <div><span className="badge badge-healthy">Healthy</span></div>
                <div>Low Hb, Cholesterol</div>
                <div><button className="action-btn">View</button></div>
              </div>
              <div className="table-row">
                <div>Priya Singh</div>
                <div><span className="badge badge-at-risk">At Risk</span></div>
                <div>TTI Reactive</div>
                <div><button className="action-btn">View</button></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Care Partners */}
      {activeView === 'partners' && (
        <div className="view-content">
          <div className="section">
            <h3>Care Partner Network</h3>
            <div className="table">
              <div className="table-header">
                <div>Partner Name</div>
                <div>Location</div>
                <div>Rating</div>
                <div>Appointments</div>
              </div>
              <div className="table-row">
                <div>Apollo Hospitals</div>
                <div>Bangalore</div>
                <div>⭐⭐⭐⭐⭐</div>
                <div>245</div>
              </div>
              <div className="table-row">
                <div>AAM Health Center</div>
                <div>Mumbai</div>
                <div>⭐⭐⭐⭐</div>
                <div>189</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Health */}
      {activeView === 'health' && (
        <div className="view-content">
          <div className="health-grid">
            <div className="health-card">
              <div className="health-title">API Uptime</div>
              <div className="health-status status-good">99.9%</div>
            </div>
            <div className="health-card">
              <div className="health-title">Database</div>
              <div className="health-status status-good">Healthy</div>
            </div>
            <div className="health-card">
              <div className="health-title">Queue Processing</div>
              <div className="health-status status-good">On Track</div>
            </div>
            <div className="health-card">
              <div className="health-title">Notifications</div>
              <div className="health-status status-good">Operational</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
          background: #f8f9fa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .dashboard-header {
          margin-bottom: 30px;
        }

        .dashboard-header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          color: #1a1a1a;
          font-weight: 700;
        }

        .dashboard-header p {
          margin: 0;
          color: #666;
        }

        .nav-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          border-bottom: 2px solid #e0e0e0;
        }

        .nav-tab {
          background: none;
          border: none;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s ease;
        }

        .nav-tab.active {
          color: #2196F3;
          border-bottom-color: #2196F3;
        }

        .view-content {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: #f9f9f9;
          padding: 16px;
          border-radius: 6px;
          border-left: 4px solid #2196F3;
        }

        .stat-title {
          font-size: 12px;
          color: #666;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .stat-change {
          font-size: 12px;
          color: #4CAF50;
        }

        .recent-activities {
          margin-top: 24px;
        }

        .recent-activities h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #1a1a1a;
          font-weight: 600;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .activity {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f9f9f9;
          border-radius: 4px;
        }

        .activity-type {
          font-size: 13px;
          color: #1a1a1a;
          font-weight: 500;
        }

        .activity-time {
          font-size: 12px;
          color: #999;
        }

        .section h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #1a1a1a;
          font-weight: 600;
        }

        .table {
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          padding: 12px;
          background: #f5f5f5;
          font-weight: 600;
          font-size: 13px;
          border-bottom: 1px solid #e0e0e0;
        }

        .table-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          padding: 12px;
          border-bottom: 1px solid #eee;
          align-items: center;
          font-size: 13px;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .badge-healthy {
          background: #c8e6c9;
          color: #2e7d32;
        }

        .badge-at-risk {
          background: #ffccbc;
          color: #d84315;
        }

        .action-btn {
          padding: 4px 8px;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
        }

        .health-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .health-card {
          padding: 16px;
          background: #f9f9f9;
          border-radius: 6px;
          text-align: center;
        }

        .health-title {
          font-size: 12px;
          color: #666;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .health-status {
          font-size: 18px;
          font-weight: 700;
        }

        .status-good {
          color: #4CAF50;
        }

        @media (prefers-color-scheme: dark) {
          .admin-dashboard {
            background: #121212;
          }

          .view-content {
            background: #1e1e1e;
          }

          .dashboard-header h1 {
            color: #e0e0e0;
          }

          .stat-card,
          .activity,
          .health-card {
            background: #2a2a2a;
          }

          .stat-value {
            color: #e0e0e0;
          }

          .table {
            border-color: #333;
          }

          .table-header {
            background: #2a2a2a;
            border-bottom-color: #333;
          }

          .table-row {
            border-bottom-color: #333;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
