/**
 * Counsellor Dashboard - Phase 4
 * For counsellors managing reactive findings and deferrals
 *
 * @file frontend/src/pages/CounsellorDashboard.tsx
 * @author Claude
 */

import React, { useState, useEffect } from 'react';

interface QueueItem {
  id: string;
  findingId: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  condition: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'claimed' | 'in_progress' | 'resolved' | 'escalated';
  assignedTo?: string;
  createdAt: string;
  contactAttempts: number;
  notes?: string;
}

interface CounsellorStats {
  queuedCount: number;
  inProgressCount: number;
  resolvedCount: number;
  avgResolutionTime: number;
  resolutionRate: number;
}

export const CounsellorDashboard: React.FC<{ counsellorId: string }> = ({ counsellorId }) => {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<CounsellorStats | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'in_progress' | 'resolved'>('new');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchQueue();
    fetchStats();
  }, [counsellorId]);

  const fetchQueue = async () => {
    try {
      // In production, fetch from API
      // const response = await fetch(`/api/counsellor/queue/${counsellorId}`);
      // const data = await response.json();
      // setItems(data.items);
      setItems(getDemoQueueItems());
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // In production, fetch from API
      setStats({
        queuedCount: 5,
        inProgressCount: 3,
        resolvedCount: 24,
        avgResolutionTime: 4.5,
        resolutionRate: 0.89,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleClaim = (item: QueueItem) => {
    console.log('Claiming item:', item.id);
    setSelectedItem({ ...item, status: 'claimed', assignedTo: counsellorId });
  };

  const handleResolve = async (itemId: string) => {
    if (!notes.trim()) {
      alert('Please add notes before resolving');
      return;
    }
    console.log('Resolving item:', itemId, 'Notes:', notes);
    // In production, call API
    setNotes('');
    setSelectedItem(null);
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === 'new') return item.status === 'new';
    if (activeTab === 'in_progress') return item.status === 'in_progress' || item.status === 'claimed';
    if (activeTab === 'resolved') return item.status === 'resolved';
    return true;
  });

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return '#d32f2f';
      case 'high':
        return '#ff6f00';
      case 'medium':
        return '#fbc02d';
      case 'low':
        return '#388e3c';
      default:
        return '#666';
    }
  };

  return (
    <div className="counsellor-dashboard">
      <div className="dashboard-header">
        <h1>Counsellor Queue Manager</h1>
        <p>Manage reactive findings and donor follow-ups</p>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="stats-bar">
          <div className="stat">
            <div className="stat-label">My Queue</div>
            <div className="stat-value">{stats.queuedCount}</div>
          </div>
          <div className="stat">
            <div className="stat-label">In Progress</div>
            <div className="stat-value">{stats.inProgressCount}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Resolved</div>
            <div className="stat-value">{stats.resolvedCount}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Avg Resolution</div>
            <div className="stat-value">{stats.avgResolutionTime.toFixed(1)}h</div>
          </div>
          <div className="stat">
            <div className="stat-label">Resolution Rate</div>
            <div className="stat-value">{(stats.resolutionRate * 100).toFixed(0)}%</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          New ({items.filter((i) => i.status === 'new').length})
        </button>
        <button
          className={`tab ${activeTab === 'in_progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('in_progress')}
        >
          In Progress ({items.filter((i) => i.status === 'in_progress' || i.status === 'claimed').length})
        </button>
        <button
          className={`tab ${activeTab === 'resolved' ? 'active' : ''}`}
          onClick={() => setActiveTab('resolved')}
        >
          Resolved ({items.filter((i) => i.status === 'resolved').length})
        </button>
      </div>

      {/* Queue Items */}
      <div className="queue-container">
        {loading ? (
          <div className="loading">Loading queue...</div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <p>No items in this category</p>
          </div>
        ) : (
          <div className="queue-list">
            {filteredItems.map((item) => (
              <div key={item.id} className="queue-item">
                <div className="item-header">
                  <div className="item-info">
                    <h3>{item.donorName}</h3>
                    <p className="donor-phone">{item.donorPhone}</p>
                  </div>
                  <div className="item-meta">
                    <span
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(item.priority) }}
                    >
                      {item.priority.toUpperCase()}
                    </span>
                    <span className="condition-badge">{item.condition}</span>
                  </div>
                </div>

                <div className="item-body">
                  <div className="item-detail">
                    <span className="label">Reason:</span>
                    <span className="value">{item.reason}</span>
                  </div>
                  <div className="item-detail">
                    <span className="label">Contact Attempts:</span>
                    <span className="value">{item.contactAttempts}</span>
                  </div>
                  <div className="item-detail">
                    <span className="label">Added:</span>
                    <span className="value">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="item-actions">
                  {item.status === 'new' && (
                    <button className="btn btn-primary" onClick={() => handleClaim(item)}>
                      Claim
                    </button>
                  )}
                  {(item.status === 'claimed' || item.status === 'in_progress') && (
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                      >
                        {selectedItem?.id === item.id ? 'Hide' : 'Contact'}
                      </button>
                      <button className="btn btn-danger">Escalate</button>
                    </>
                  )}
                  {item.status === 'resolved' && (
                    <span className="status-resolved">✓ Resolved</span>
                  )}
                </div>

                {/* Contact Form */}
                {selectedItem?.id === item.id && (item.status === 'claimed' || item.status === 'in_progress') && (
                  <div className="contact-form">
                    <textarea
                      placeholder="Document conversation and outcome..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                    <div className="form-actions">
                      <button className="btn btn-success" onClick={() => handleResolve(item.id)}>
                        Mark Resolved
                      </button>
                      <button className="btn btn-secondary" onClick={() => setSelectedItem(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .counsellor-dashboard {
          max-width: 900px;
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
          font-size: 14px;
        }

        .stats-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 30px;
        }

        .stat {
          background: white;
          border-radius: 6px;
          padding: 16px;
          text-align: center;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .stat-label {
          font-size: 11px;
          color: #666;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          border-bottom: 2px solid #e0e0e0;
        }

        .tab {
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

        .tab.active {
          color: #2196F3;
          border-bottom-color: #2196F3;
        }

        .tab:hover {
          color: #1a1a1a;
        }

        .queue-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .loading,
        .empty-state {
          padding: 40px 20px;
          text-align: center;
          color: #666;
        }

        .queue-list {
          display: flex;
          flex-direction: column;
        }

        .queue-item {
          padding: 16px;
          border-bottom: 1px solid #eee;
          transition: background 0.2s ease;
        }

        .queue-item:hover {
          background: #f9f9f9;
        }

        .queue-item:last-child {
          border-bottom: none;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .item-info h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          color: #1a1a1a;
          font-weight: 600;
        }

        .donor-phone {
          margin: 0;
          font-size: 13px;
          color: #666;
        }

        .item-meta {
          display: flex;
          gap: 8px;
        }

        .priority-badge,
        .condition-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .condition-badge {
          background: #2196F3;
        }

        .item-body {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 12px;
          padding: 12px 0;
          border-top: 1px solid #f0f0f0;
          border-bottom: 1px solid #f0f0f0;
        }

        .item-detail {
          display: flex;
          gap: 8px;
          font-size: 13px;
        }

        .item-detail .label {
          color: #666;
          font-weight: 600;
        }

        .item-detail .value {
          color: #1a1a1a;
        }

        .item-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .btn {
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #2196F3;
          color: white;
        }

        .btn-primary:hover {
          background: #1976D2;
        }

        .btn-secondary {
          background: #e0e0e0;
          color: #1a1a1a;
        }

        .btn-secondary:hover {
          background: #d0d0d0;
        }

        .btn-danger {
          background: #f44336;
          color: white;
        }

        .btn-danger:hover {
          background: #d32f2f;
        }

        .btn-success {
          background: #4CAF50;
          color: white;
        }

        .btn-success:hover {
          background: #388e3c;
        }

        .status-resolved {
          color: #4CAF50;
          font-weight: 600;
          font-size: 13px;
        }

        .contact-form {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }

        .contact-form textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          font-size: 13px;
          resize: vertical;
        }

        .form-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          margin-top: 8px;
        }

        @media (prefers-color-scheme: dark) {
          .counsellor-dashboard {
            background: #121212;
          }

          .dashboard-header h1 {
            color: #e0e0e0;
          }

          .stat {
            background: #1e1e1e;
          }

          .stat-value {
            color: #e0e0e0;
          }

          .tabs {
            border-bottom-color: #333;
          }

          .queue-container {
            background: #1e1e1e;
          }

          .queue-item:hover {
            background: #2a2a2a;
          }

          .queue-item {
            border-bottom-color: #333;
          }

          .item-info h3 {
            color: #e0e0e0;
          }

          .item-detail .value {
            color: #e0e0e0;
          }

          .item-body {
            border-top-color: #333;
            border-bottom-color: #333;
          }

          .contact-form {
            border-top-color: #333;
          }

          .contact-form textarea {
            background: #2a2a2a;
            color: #e0e0e0;
            border-color: #333;
          }
        }

        @media (max-width: 600px) {
          .item-meta {
            flex-direction: column;
            gap: 4px;
          }

          .item-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default CounsellorDashboard;

function getDemoQueueItems(): QueueItem[] {
  return [
    {
      id: '1',
      findingId: 'f1',
      donorId: 'd1',
      donorName: 'Rajesh Kumar',
      donorPhone: '+91 98765 43210',
      condition: 'TTI Reactive',
      reason: 'reactive_finding',
      priority: 'critical',
      status: 'new',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      contactAttempts: 0,
    },
    {
      id: '2',
      findingId: 'f2',
      donorId: 'd2',
      donorName: 'Priya Singh',
      donorPhone: '+91 98765 43211',
      condition: 'Low Hemoglobin',
      reason: 'high_risk',
      priority: 'high',
      status: 'claimed',
      assignedTo: 'c1',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      contactAttempts: 1,
    },
  ];
}
