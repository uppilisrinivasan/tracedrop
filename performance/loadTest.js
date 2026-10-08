/**
 * Load Testing Script for TraceDrop
 * Tests API performance under concurrent load (k6)
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // Dashboard Load
  group('Dashboard', () => {
    const r = http.get(`${BASE_URL}/api/donors/D-001/dashboard`);
    check(r, {
      'status 200': (res) => res.status === 200,
      'duration < 500ms': (res) => res.timings.duration < 500,
    });
    sleep(1);
  });

  // Message Generation
  group('Messages', () => {
    const r = http.post(
      `${BASE_URL}/api/messages/generate`,
      JSON.stringify({
        findingId: 'F-001',
        donorId: 'D-001',
        language: 'en',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(r, {
      'status ok': (res) => res.status === 200 || res.status === 429,
      'duration < 1000ms': (res) => res.timings.duration < 1000,
    });
    sleep(1);
  });

  // Booking
  group('Booking', () => {
    const r = http.post(
      `${BASE_URL}/api/appointments/book`,
      JSON.stringify({
        donorId: 'D-001',
        carePartnerId: 'CP-001',
        findingId: 'F-001',
        preferredDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        preferredTime: '14:00',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(r, {
      'status ok': (res) => res.status === 200 || res.status === 201 || res.status === 429,
      'duration < 800ms': (res) => res.timings.duration < 800,
    });
    sleep(1);
  });

  sleep(2);
}
