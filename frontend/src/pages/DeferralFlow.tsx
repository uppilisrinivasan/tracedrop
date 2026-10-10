/**
 * Deferral Flow - Interactive Deferral Experience
 *
 * Step 1: Show deferral reason + why
 * Step 2: Interactive questionnaire
 * Step 3: Results with countdown
 * Step 4: Follow-up options
 */

import React, { useState, useEffect } from 'react';
import { Finding } from '../types/index';
import './DeferralFlow.css';

interface DeferralFlowProps {
  donorId: string;
  findingId: string;
  onNavigate: (page: string) => void;
}

interface FormData {
  feeling: number | null;
  symptoms: string[];
  duration: string;
}

const DeferralFlow: React.FC<DeferralFlowProps> = ({ donorId, findingId, onNavigate }) => {
  const [step, setStep] = useState(1);
  const [finding, setFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    feeling: null,
    symptoms: [],
    duration: '',
  });

  const SYMPTOMS = [
    { id: 'fatigue', label: 'Fatigue' },
    { id: 'dizziness', label: 'Dizziness' },
    { id: 'chest_pain', label: 'Chest Pain' },
    { id: 'shortness_breath', label: 'Shortness of Breath' },
    { id: 'headache', label: 'Headache' },
    { id: 'nausea', label: 'Nausea' },
  ];

  // Fetch finding details
  useEffect(() => {
    const fetchFinding = async () => {
      try {
        const response = await fetch(`/api/donors/${donorId}/findings/${findingId}`);
        if (response.ok) {
          const json = await response.json();
          setFinding(json.data);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };

    fetchFinding();
  }, [donorId, findingId]);

  const [reminderSet, setReminderSet] = useState(false);

  // Deferral lasts the protocol's follow-up period, counted from the finding date
  const calculateReeeligibilityDate = (): Date => {
    const date = finding ? new Date(finding.createdAt) : new Date();
    date.setDate(date.getDate() + (finding?.followUpDays ?? 14));
    return date;
  };

  const handleSymptomChange = (symptom: string) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  };

  const handleNext = () => {
    if (step < 4) {
      if (step === 2 && formData.feeling === null) {
        alert('Please rate how you are feeling');
        return;
      }
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const reeligibilityDate = calculateReeeligibilityDate();
  const daysUntilReeeligible = Math.max(
    0,
    Math.ceil((reeligibilityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  if (loading) {
    return (
      <div className="deferral-flow-container">
        <div className="loading-state">
          <p>Loading deferral information...</p>
        </div>
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="deferral-flow-container">
        <div className="error-state">
          <p>Unable to load deferral information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="deferral-flow-container">
      <div className="flow-header">
        <div className="progress-indicator">
          <div className="progress-steps">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`progress-step ${s === step ? 'active' : s < step ? 'completed' : ''}`}
              >
                <span className="step-number">{s < step ? '✓' : s}</span>
                <span className="step-label">
                  {s === 1 && 'Reason'}
                  {s === 2 && 'Check-in'}
                  {s === 3 && 'Results'}
                  {s === 4 && 'Follow-up'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flow-content">
        {/* Step 1: Deferral Reason */}
        {step === 1 && (
          <div className="flow-step step-1">
            <div className="step-icon">ℹ️</div>
            <h2>Why You're Deferred</h2>
            <p className="step-description">{finding.description}</p>
            <p className="step-description">
              <strong>Recommended:</strong> {finding.recommendedAction}
            </p>

            <div className="reason-details">
              <h3>What This Means</h3>
              <p>
                Your recent health measurements show a reading that requires temporary precaution.
                This is normal and temporary - most donors return to eligibility within 2-4 weeks.
              </p>
              <p>
                By taking time to monitor your health now, we ensure your safety and the safety of
                recipients of your blood.
              </p>
            </div>

            <div className="action-recommendations">
              <h3>Recommended Actions</h3>
              <ul>
                <li>Rest and get adequate sleep</li>
                <li>Stay hydrated throughout the day</li>
                <li>Follow any dietary recommendations</li>
                <li>Schedule a follow-up with your healthcare provider</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: Health Check-in */}
        {step === 2 && (
          <div className="flow-step step-2">
            <div className="step-icon">💭</div>
            <h2>How Are You Feeling?</h2>

            <div className="feeling-scale">
              <h3>Rate your current health (1 = Not good, 5 = Excellent)</h3>
              <div className="scale-buttons">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    className={`scale-button ${formData.feeling === rating ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, feeling: rating })}
                  >
                    <span className="button-number">{rating}</span>
                    <span className="button-label">
                      {rating === 1 && 'Poor'}
                      {rating === 2 && 'Fair'}
                      {rating === 3 && 'Ok'}
                      {rating === 4 && 'Good'}
                      {rating === 5 && 'Great'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="symptoms-section">
              <h3>Any of these symptoms?</h3>
              <div className="symptoms-grid">
                {SYMPTOMS.map((symptom) => (
                  <label key={symptom.id} className="symptom-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.symptoms.includes(symptom.id)}
                      onChange={() => handleSymptomChange(symptom.id)}
                    />
                    <span>{symptom.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="duration-section">
              <h3>How long have you had these symptoms?</h3>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="duration-select"
              >
                <option value="">Select duration...</option>
                <option value="less_than_day">Less than a day</option>
                <option value="1_3_days">1-3 days</option>
                <option value="4_7_days">4-7 days</option>
                <option value="over_week">Over a week</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && (
          <div className="flow-step step-3">
            <div className="step-icon">📋</div>
            <h2>Your Deferral Details</h2>

            <div className="countdown-card">
              <div className="countdown-header">You can donate again in</div>
              <div className="countdown-display">
                <span className="countdown-days">{daysUntilReeeligible}</span>
                <span className="countdown-label">days</span>
                <span className="countdown-date">({reeligibilityDate.toLocaleDateString()})</span>
              </div>
            </div>

            <div className="educational-content">
              <h3>Why This Timeline?</h3>
              <p>
                Based on your current health metrics and our clinical protocols, we recommend a
                temporary deferral. This allows your body to:
              </p>
              <ul>
                <li>Recover naturally from the measured condition</li>
                <li>Build up any deficient levels (e.g., hemoglobin)</li>
                <li>Stabilize vital signs back to normal ranges</li>
              </ul>
            </div>

            <div className="care-recommendations">
              <h3>Care Recommendations While You Wait</h3>
              <div className="recommendation-cards">
                <div className="rec-card">
                  <span className="rec-icon">🥗</span>
                  <h4>Nutrition</h4>
                  <p>Eat iron-rich foods like leafy greens, beans, and lean meats</p>
                </div>
                <div className="rec-card">
                  <span className="rec-icon">💧</span>
                  <h4>Hydration</h4>
                  <p>Drink plenty of water - aim for 8-10 glasses per day</p>
                </div>
                <div className="rec-card">
                  <span className="rec-icon">😴</span>
                  <h4>Rest</h4>
                  <p>Get 7-9 hours of quality sleep each night</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Follow-up */}
        {step === 4 && (
          <div className="flow-step step-4">
            <div className="step-icon">✅</div>
            <h2>Next Steps</h2>

            <div className="follow-up-actions">
              <button
                className="follow-up-btn follow-up-primary"
                onClick={() => onNavigate('appointments')}
              >
                📅 Schedule AAM Visit
              </button>
              <button
                className="follow-up-btn follow-up-secondary"
                onClick={() => setReminderSet(true)}
                disabled={reminderSet}
              >
                {reminderSet
                  ? `✓ Reminder set for ${reeligibilityDate.toLocaleDateString()}`
                  : `🔔 Set Reminder (${daysUntilReeeligible} days)`}
              </button>
            </div>

            <div className="follow-up-info">
              <h3>What Happens Next?</h3>
              <div className="info-timeline">
                <div className="timeline-item">
                  <div className="timeline-marker">1</div>
                  <div className="timeline-content">
                    <h4>Monitor Your Health</h4>
                    <p>Use the app to track your vital signs daily</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker">2</div>
                  <div className="timeline-content">
                    <h4>Visit Your Healthcare Provider</h4>
                    <p>Get a check-up before attempting to donate again</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker">3</div>
                  <div className="timeline-content">
                    <h4>Return to Donation</h4>
                    <p>Once cleared, you can donate blood again</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              className="back-to-home-btn"
              onClick={() => onNavigate('home')}
            >
              ← Back to Home
            </button>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flow-navigation">
        <button
          className="nav-btn nav-prev"
          onClick={handlePrevious}
          disabled={step === 1}
        >
          ← Previous
        </button>
        <button
          className="nav-btn nav-next"
          onClick={handleNext}
          disabled={step === 4}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default DeferralFlow;
