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

type PageType = 'home' | 'dashboard' | 'deferral' | 'appointments' | 'finding-detail';

interface PageState {
  page: PageType;
  data?: Record<string, any>;
}

function App() {
  const [donorId, setDonorId] = useState<string>('D-001'); // Mock donor ID
  const [currentPage, setCurrentPage] = useState<PageState>({ page: 'home' });

  // Mock authentication - in production, get from auth service
  useEffect(() => {
    // Check for donor ID in URL or local storage
    const storedDonorId = localStorage.getItem('donorId');
    if (storedDonorId) {
      setDonorId(storedDonorId);
    }
  }, []);

  const handleNavigate = (page: string, data?: any) => {
    setCurrentPage({
      page: page as PageType,
      data,
    });
    // Scroll to top
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    localStorage.removeItem('donorId');
    localStorage.removeItem('authToken');
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
          </div>
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
