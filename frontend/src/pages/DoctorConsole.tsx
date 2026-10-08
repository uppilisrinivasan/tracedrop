/**
 * Doctor Console - Phase 4
 * For doctors reviewing care plans and monitoring donor progress
 *
 * @file frontend/src/pages/DoctorConsole.tsx
 * @author Claude
 */

import React, { useState } from 'react';

interface DonorCareData {
  id: string;
  name: string;
  age: number;
  condition: string;
  vitals: {
    bloodPressure: string;
    hemoglobin: number;
    glucose: number;
    timestamp: string;
  };
  appointments: {
    id: string;
    date: string;
    type: string;
    status: string;
  }[];
  outcomes: {
    id: string;
    date: string;
    description: string;
    improvement: number;
  }[];
  carePlan: string;
  notes: string;
}

export const DoctorConsole: React.FC<{ doctorId: string }> = ({ doctorId }) => {
  const [donors, setDonors] = useState<DonorCareData[]>(getDemoDonors());
  const [selectedDonor, setSelectedDonor] = useState<DonorCareData | null>(donors[0] || null);
  const [carePlanNotes, setCarePlanNotes] = useState('');
  const [showNoteEditor, setShowNoteEditor] = useState(false);

  const handleUpdateCarePlan = () => {
    if (selectedDonor) {
      console.log('Updating care plan for', selectedDonor.id);
      setShowNoteEditor(false);
    }
  };

  return (
    <div className="doctor-console">
      <div className="console-header">
        <h1>Doctor Console</h1>
        <p>Review care plans and monitor donor progress</p>
      </div>

      <div className="console-content">
        {/* Donor List */}
        <div className="donor-list">
          <h3>Assigned Donors</h3>
          <div className="list">
            {donors.map((donor) => (
              <div
                key={donor.id}
                className={`donor-item ${selectedDonor?.id === donor.id ? 'active' : ''}`}
                onClick={() => setSelectedDonor(donor)}
              >
                <div className="donor-name">{donor.name}</div>
                <div className="donor-condition">{donor.condition}</div>
                <div className="donor-age">Age {donor.age}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Care Plan Details */}
        {selectedDonor && (
          <div className="care-details">
            <div className="details-header">
              <h2>{selectedDonor.name}</h2>
              <span className="condition-tag">{selectedDonor.condition}</span>
            </div>

            {/* Vitals Section */}
            <section className="vitals-section">
              <h3>Current Vitals</h3>
              <div className="vitals-grid">
                <div className="vital">
                  <span className="vital-label">Blood Pressure</span>
                  <span className="vital-value">{selectedDonor.vitals.bloodPressure}</span>
                </div>
                <div className="vital">
                  <span className="vital-label">Hemoglobin</span>
                  <span className="vital-value">{selectedDonor.vitals.hemoglobin} g/dL</span>
                </div>
                <div className="vital">
                  <span className="vital-label">Glucose</span>
                  <span className="vital-value">{selectedDonor.vitals.glucose} mg/dL</span>
                </div>
                <div className="vital">
                  <span className="vital-label">Last Updated</span>
                  <span className="vital-value">
                    {new Date(selectedDonor.vitals.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </section>

            {/* Appointments */}
            <section className="appointments-section">
              <h3>Appointment History</h3>
              <div className="appointments">
                {selectedDonor.appointments.map((appt) => (
                  <div key={appt.id} className="appointment">
                    <div className="appt-date">
                      {new Date(appt.date).toLocaleDateString()}
                    </div>
                    <div className="appt-type">{appt.type}</div>
                    <div className={`appt-status status-${appt.status}`}>
                      {appt.status}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Outcomes */}
            <section className="outcomes-section">
              <h3>Recent Outcomes</h3>
              <div className="outcomes">
                {selectedDonor.outcomes.map((outcome) => (
                  <div key={outcome.id} className="outcome">
                    <div className="outcome-date">
                      {new Date(outcome.date).toLocaleDateString()}
                    </div>
                    <div className="outcome-desc">{outcome.description}</div>
                    <div className="outcome-rating">
                      Improvement: <strong>{outcome.improvement}/5</strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Care Plan */}
            <section className="care-plan-section">
              <div className="plan-header">
                <h3>Active Care Plan</h3>
                <button className="btn-edit" onClick={() => setShowNoteEditor(!showNoteEditor)}>
                  {showNoteEditor ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {showNoteEditor ? (
                <div className="plan-editor">
                  <textarea
                    value={carePlanNotes}
                    onChange={(e) => setCarePlanNotes(e.target.value)}
                    placeholder="Enter care plan recommendations..."
                    rows={6}
                  />
                  <button className="btn-save" onClick={handleUpdateCarePlan}>
                    Save Care Plan
                  </button>
                </div>
              ) : (
                <div className="plan-content">
                  {selectedDonor.carePlan || 'No care plan set'}
                </div>
              )}
            </section>

            {/* Notes */}
            <section className="notes-section">
              <h3>Clinical Notes</h3>
              <div className="notes-content">
                {selectedDonor.notes || 'No notes yet'}
              </div>
            </section>
          </div>
        )}
      </div>

      <style>{`
        .doctor-console {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
          background: #f8f9fa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .console-header {
          margin-bottom: 30px;
        }

        .console-header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          color: #1a1a1a;
          font-weight: 700;
        }

        .console-header p {
          margin: 0;
          color: #666;
        }

        .console-content {
          display: grid;
          grid-template-columns: 250px 1fr;
          gap: 24px;
        }

        .donor-list {
          background: white;
          border-radius: 8px;
          padding: 16px;
          height: fit-content;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .donor-list h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #1a1a1a;
          font-weight: 600;
        }

        .donor-item {
          padding: 12px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
          margin-bottom: 8px;
        }

        .donor-item:hover {
          background: #f5f5f5;
        }

        .donor-item.active {
          background: #e3f2fd;
          border-left-color: #2196F3;
        }

        .donor-name {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .donor-condition {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }

        .donor-age {
          font-size: 12px;
          color: #999;
        }

        .care-details {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #eee;
        }

        .details-header h2 {
          margin: 0;
          font-size: 24px;
          color: #1a1a1a;
          font-weight: 700;
        }

        .condition-tag {
          background: #e3f2fd;
          color: #1976D2;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        section {
          margin-bottom: 24px;
        }

        section h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #1a1a1a;
          font-weight: 600;
        }

        .vitals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        .vital {
          display: flex;
          flex-direction: column;
          padding: 12px;
          background: #f5f5f5;
          border-radius: 6px;
          gap: 4px;
        }

        .vital-label {
          font-size: 11px;
          color: #666;
          font-weight: 600;
          text-transform: uppercase;
        }

        .vital-value {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .appointments {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .appointment {
          display: grid;
          grid-template-columns: 120px 1fr auto;
          gap: 12px;
          padding: 12px;
          background: #f9f9f9;
          border-radius: 6px;
          align-items: center;
        }

        .appt-date {
          font-size: 13px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .appt-type {
          font-size: 13px;
          color: #666;
        }

        .appt-status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .appt-status.status-completed {
          background: #c8e6c9;
          color: #2e7d32;
        }

        .appt-status.status-scheduled {
          background: #bbdefb;
          color: #1565c0;
        }

        .outcomes {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .outcome {
          padding: 12px;
          background: #f9f9f9;
          border-radius: 6px;
          border-left: 3px solid #4CAF50;
        }

        .outcome-date {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }

        .outcome-desc {
          font-size: 13px;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .outcome-rating {
          font-size: 12px;
          color: #666;
        }

        .plan-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .btn-edit,
        .btn-save {
          padding: 6px 12px;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-edit:hover,
        .btn-save:hover {
          background: #1976D2;
        }

        .plan-editor textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-family: inherit;
          font-size: 13px;
          resize: vertical;
          margin-bottom: 12px;
        }

        .plan-content,
        .notes-content {
          padding: 12px;
          background: #f9f9f9;
          border-radius: 6px;
          font-size: 13px;
          color: #1a1a1a;
          line-height: 1.6;
        }

        @media (prefers-color-scheme: dark) {
          .doctor-console {
            background: #121212;
          }

          .donor-list,
          .care-details {
            background: #1e1e1e;
          }

          .details-header {
            border-bottom-color: #333;
            color: #e0e0e0;
          }

          .donor-name {
            color: #e0e0e0;
          }

          .vital,
          .appointment,
          .outcome,
          .plan-content,
          .notes-content {
            background: #2a2a2a;
          }

          .vital-value,
          .appt-date,
          .outcome-desc,
          .plan-content,
          .notes-content {
            color: #e0e0e0;
          }

          .plan-editor textarea {
            background: #2a2a2a;
            color: #e0e0e0;
            border-color: #333;
          }
        }

        @media (max-width: 768px) {
          .console-content {
            grid-template-columns: 1fr;
          }

          .appointment {
            grid-template-columns: 1fr;
          }

          .details-header {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default DoctorConsole;

function getDemoDonors(): DonorCareData[] {
  return [
    {
      id: 'd1',
      name: 'Rajesh Kumar',
      age: 45,
      condition: 'High Blood Pressure',
      vitals: {
        bloodPressure: '140/90 mmHg',
        hemoglobin: 13.5,
        glucose: 105,
        timestamp: new Date().toISOString(),
      },
      appointments: [
        { id: 'a1', date: '2024-10-08', type: 'Cardiology', status: 'completed' },
      ],
      outcomes: [
        { id: 'o1', date: '2024-10-08', description: 'Blood pressure stable', improvement: 4 },
      ],
      carePlan: 'Continue medication. Follow DASH diet. Exercise 30 mins daily.',
      notes: 'Patient compliant with treatment. Scheduled for 30-day follow-up.',
    },
  ];
}
