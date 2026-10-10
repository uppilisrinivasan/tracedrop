/**
 * TraceDrop Frontend App
 *
 * Main application component with routing.
 * Routes:
 * - / → Home
 * - /dashboard → Dashboard
 * - /deferral/:findingId → DeferralFlow
 * - /appointments → Appointments (placeholder)
 */

import React, { useState, useEffect } from 'react';
import './App.css';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import DeferralFlow from './pages/DeferralFlow';
import FunnelDashboard from './pages/FunnelDashboard';

type PageType = 'home' | 'dashboard' | 'deferral' | 'appointments' | 'finding-detail' | 'impact';

// Synthetic demo personas (data/generate.py)
const DEMO_DONORS = [
  { id: 'D-001', label: 'Arjun — rising BP' },
  { id: 'D-002', label: 'Meera — low hemoglobin' },
  { id: 'D-017', label: 'D-017 — urgent BP' },
  { id: 'D-050', label: 'D-050 — BP trend' },
  { id: 'D-003', label: 'D-003 — healthy' },
];

interface PageState {
  page: PageType;
  data?: Record<string, any>;
}

function App() {
  const [donorId, setDonorId] = useState<string>(DEMO_DONORS[0].id);
  const [currentPage, setCurrentPage] = useState<PageState>({ page: 'home' });

  // Demo sign-in: remember the selected donor between visits
  useEffect(() => {
    try {
      const storedDonorId = localStorage.getItem('donorId');
      if (storedDonorId) setDonorId(storedDonorId);
    } catch {
      // Storage unavailable (private mode) — keep the default donor
    }
  }, []);

  const handleDonorChange = (id: string) => {
    setDonorId(id);
    try {
      localStorage.setItem('donorId', id);
    } catch {
      // Ignore storage failures
    }
    setCurrentPage({ page: 'home' });
  };

  const handleNavigate = (page: string, data?: any) => {
    setCurrentPage({
      page: page as PageType,
      data,
    });
    // Scroll to top
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('donorId');
      localStorage.removeItem('authToken');
    } catch {
      // Ignore storage failures
    }
    setDonorId(DEMO_DONORS[0].id);
    setCurrentPage({ page: 'home' });
  };

  const renderPage = () => {
    switch (currentPage.page) {
      case 'home':
        return <Home donorId={donorId} onNavigate={handleNavigate} />;
      case 'dashboard':
        return <Dashboard donorId={donorId} onNavigate={handleNavigate} />;
      case 'deferral':
      case 'finding-detail':
        if (currentPage.data?.findingId) {
          return (
            <DeferralFlow
              donorId={donorId}
              findingId={currentPage.data.findingId}
              onNavigate={handleNavigate}
            />
          );
        }
        return <Home donorId={donorId} onNavigate={handleNavigate} />;
      case 'impact':
        return <FunnelDashboard />;
      case 'appointments':
        return (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
            <h2>Appointments Coming Soon</h2>
            <button
              onClick={() => handleNavigate('home')}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Back to Home
            </button>
          </div>
        );
      default:
        return <Home donorId={donorId} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-wrapper">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <span className="app-logo">🩸</span>
            <span className="app-name">TraceDrop</span>
          </div>
          <div className="navbar-nav">
            <button
              className={`nav-link ${currentPage.page === 'home' ? 'active' : ''}`}
              onClick={() => handleNavigate('home')}
            >
              Home
            </button>
            <button
              className={`nav-link ${currentPage.page === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavigate('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`nav-link ${currentPage.page === 'impact' ? 'active' : ''}`}
              onClick={() => handleNavigate('impact')}
            >
              Impact
            </button>
          </div>
          <select
            className="nav-donor-select"
            value={donorId}
            onChange={(e) => handleDonorChange(e.target.value)}
            aria-label="Demo donor"
          >
            {DEMO_DONORS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
          <button className="nav-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>&copy; 2024 TraceDrop. Your health. Your blood. Your data.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
