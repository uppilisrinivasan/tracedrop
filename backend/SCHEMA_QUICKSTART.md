# Firestore Schema Quick Start Guide

Complete setup guide for the TraceDrop Firestore database schema Phase 1.

## 5-Minute Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Set Up Firebase Credentials
```bash
# Download service account key from Firebase Console
# Settings > Service Accounts > Generate New Private Key
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### 3. Initialize Database
```bash
# Create all collections and seed data
npm run init:db

# Output: Collections created, protocols seeded, templates loaded
```

### 4. Create Composite Indexes
```bash
# Generate index configuration
npm run init:db:generate-indexes

# This creates firestore-indexes.yaml
# Deploy via gcloud CLI:
gcloud firestore indexes create firestore-indexes.yaml
```

### 5. Deploy Security Rules
```bash
# Copy firestore.rules to Firebase directory
firebase deploy --only firestore:rules
```

## 10-Minute Development Setup

### Local Testing with Emulator
```bash
# Terminal 1: Start Firestore emulator
npm run emulator:start

# Terminal 2: Run your code
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run dev
```

### Run Tests
```bash
npm test
npm run test:coverage
```

## Schema Structure

### 11 Collections Created

```
firestore/
├── donors/
│   └── {donorId}
│       └── name, phone, email, language, gender, age, healthStatus
│
├── donations/
│   └── {donationId}
│       └── donorId, status, performedAt, bloodCentreId, bloodType
│
├── observations/
│   └── {observationId}
│       └── donorId, type (BP/Hb/HR/etc), value, recordedAt, source
│
├── findings/
│   └── {findingId}
│       └── donorId, category (BP_GRADE1, etc), trend, urgency, status
│
├── care_plans/
│   └── {carePlanId}
│       └── donorId, findingId, status, proposedAction, approvedBy
│
├── appointments/
│   └── {appointmentId}
│       └── donorId, carePlanId, startTime, endTime, status, type
│
├── communications/
│   └── {communicationId}
│       └── donorId, type, channel (sms/whatsapp/email), sentAt, status
│
├── outcomes/
│   └── {outcomeId}
│       └── appointmentId, donorId, attended, resultValue, status
│
├── counsellor_queue/  [CONFIDENTIAL - Counsellors only]
│   └── {queueItemId}
│       └── donorId, flagType, urgency, status, handledBy
│
├── templates/
│   └── {templateId}
│       └── language, findingCategory, channel, template, variables
│
└── protocols/
    └── {protocolId}
        └── name, category, rule, action, urgency, metadata
```

## Composite Indexes

11 required composite indexes for optimal performance:

| Collection | Fields | Purpose |
|---|---|---|
| donations | (donorId, performedAt DESC) | Donation history |
| observations | (donorId, recordedAt DESC) | Health timeline |
| observations | (type, recordedAt DESC) | Observation analytics |
| findings | (donorId, createdAt DESC) | Findings per donor |
| findings | (category, createdAt DESC) | Finding categories |
| care_plans | (donorId, createdAt DESC) | Care history |
| appointments | (donorId, startTime ASC) | Upcoming appointments |
| communications | (donorId, sentAt DESC) | Message history |
| outcomes | (donorId, recordedAt DESC) | Outcome history |
| counsellor_queue | (status, urgency DESC) | Counsellor dashboard |
| templates | (language, findingCategory) | Template lookup |

All indexes created automatically by `firestore-indexes.yaml`.

## Security Model

### Roles
- **donor**: Can read own records, write self-reported observations
- **doctor**: Can read/manage patients, create care plans
- **counsellor**: CONFIDENTIAL access to counsellor_queue only
- **centre_staff**: Can record donations and vitals at their centre
- **admin**: Full read/write access

### Authentication
All operations require Firebase Authentication with custom claims for roles.

### Audit Logging
- All counsellor_queue operations are logged
- All care_plan approvals are audited
- Sensitive PII is encrypted

See `firestore.rules` for complete security implementation.

## Usage Examples

### 1. Create a Donor
```typescript
import { getFirestoreClient, collections } from './src/database/firestore';

const db = getFirestoreClient();
const donor = await db.collection('donors').add({
  name: 'Raj Kumar',
  phone: '+919876543210',
  email: 'raj@example.com',
  language: 'hi',
  gender: 'M',
  age: 35,
  healthStatus: 'healthy',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

console.log(`Donor created: ${donor.id}`);
```

### 2. Record a Donation
```typescript
import { collections } from './src/database/firestore';

const donation = await collections.donations(db).add({
  donorId: 'donor123',
  status: 'completed',
  performedAt: new Date().toISOString(),
  bloodCentreId: 'centre456',
  amountCollected: 450,
  bloodType: 'O+',
  recordedBy: 'staff789',
  createdAt: new Date().toISOString(),
});
```

### 3. Query Donor's Observations
```typescript
import { queryByDonor, collections } from './src/database/firestore';

const observations = await queryByDonor(
  db,
  collections.observations,
  'donor123',
  { 
    orderByField: 'recordedAt',
    orderDirection: 'desc',
    limit: 10
  }
);

observations.forEach(obs => {
  console.log(`${obs.type}: ${obs.value} ${obs.unit}`);
});
```

### 4. Get Active Findings
```typescript
import { getDonorActiveFindings } from './src/database/firestore';

const findings = await getDonorActiveFindings(db, 'donor123');
findings.forEach(f => {
  console.log(`${f.category}: ${f.description} (${f.urgency})`);
});
```

### 5. Create Care Plan
```typescript
const carePlan = await collections.carePlans(db).add({
  donorId: 'donor123',
  findingId: 'finding456',
  status: 'pending',
  proposedAction: 'visit_clinic',
  notes: 'BP elevated. Schedule clinic visit.',
  createdBy: 'doctor789',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
```

### 6. Get Upcoming Appointments
```typescript
import { getDonorUpcomingAppointments } from './src/database/firestore';

const appointments = await getDonorUpcomingAppointments(db, 'donor123');
appointments.forEach(apt => {
  console.log(`${apt.type} at ${apt.facilityName} on ${apt.startTime}`);
});
```

## Seed Data

### Protocols (6 included)
- `BP-G1`: Elevated blood pressure (systolic 130-139 or diastolic 80-89)
- `BP-G2`: High blood pressure (systolic ≥140 or diastolic ≥90)
- `Hb-LOW`: Low hemoglobin (< 12.5 g/dL for women)
- `Hb-CRITICAL`: Critical hemoglobin (< 7.5 g/dL)
- `HR-ELEVATED`: Elevated heart rate (≥100 bpm)
- `DEFERRED-PATTERN`: Recent deferral from donation

### Templates (7 included - English, Hindi, Tamil)
- BP Grade 1 Alert (SMS, WhatsApp)
- BP Grade 2 Alert (WhatsApp)
- Low Hemoglobin Alert (SMS)
- Appointment Reminder (WhatsApp, SMS)

All are marked `isActive: true` and ready to use.

## Data Retention Policies

| Collection | Retention |
|---|---|
| donors | Indefinite (right-to-deletion on request) |
| donations | Indefinite (medical records) |
| observations | 2+ years (archive to cold storage) |
| findings | Indefinite (archive after outcome) |
| care_plans | Indefinite |
| appointments | Indefinite |
| communications | 1+ year (delete > 2 years old) |
| outcomes | Indefinite |
| counsellor_queue | 30 days (archive when resolved) |
| templates | Indefinite |
| protocols | Indefinite (maintain versions) |

## Troubleshooting

### "No matching index found" Error
- Run: `gcloud firestore indexes create firestore-indexes.yaml`
- Wait 5-10 minutes for index creation
- Verify in Firebase Console > Firestore > Indexes

### "Insufficient permission" Error
- Check Firestore security rules deployed: `firebase deploy --only firestore:rules`
- Verify user has correct role in Firebase Authentication custom claims
- Check collection access matrix in README.md

### Slow Queries
- Verify composite indexes are ENABLED in Firebase Console
- Use `.limit()` to reduce result sets
- Add appropriate WHERE clauses before ORDER BY

### Emulator Not Working
- Ensure port 8080 is available
- Set `FIRESTORE_EMULATOR_HOST=localhost:8080` environment variable
- Check emulator is started: `npm run emulator:start`

## Next Steps

1. **Implement Cloud Functions** for automated workflows (finding generation, appointment creation)
2. **Set up BigQuery export** for analytics on observations and findings
3. **Create monitoring alerts** for query performance degradation
4. **Enable automated backups** for disaster recovery
5. **Implement end-to-end tests** with emulator
6. **Document API endpoints** that query this schema

## File Structure

```
backend/
├── src/
│   └── database/
│       ├── firestore-schema.ts      # Type definitions (11 collections)
│       ├── firestore-init.ts        # Initialization script
│       ├── firestore.ts             # Client wrapper & query helpers
│       └── README.md                # Comprehensive documentation
├── firestore.rules                  # Security rules
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── SCHEMA_QUICKSTART.md            # This file
└── firestore-indexes.yaml           # Generated by init:db:generate-indexes
```

## API Reference

### Type-Safe Collections
```typescript
collections.donors(db)
collections.donations(db)
collections.observations(db)
collections.findings(db)
collections.carePlans(db)
collections.appointments(db)
collections.communications(db)
collections.outcomes(db)
collections.counsellorQueue(db)
collections.templates(db)
collections.protocols(db)
```

### CRUD Operations
```typescript
createDocument(db, collection, data)
getDocument(db, collection, docId)
updateDocument(db, collection, docId, updates)
deleteDocument(db, collection, docId)
```

### Query Operations
```typescript
queryDocuments(db, collection, fieldPath, operator, value)
queryByDonor(db, collection, donorId, options?)
getPaginatedDonorRecords(db, collection, donorId, cursor?, pageSize?)
```

### Specialized Queries
```typescript
getDonorDonationTimeline(db, donorId, limit?)
getDonorActiveFindings(db, donorId)
getDonorCarePlans(db, donorId, status?)
getDonorUpcomingAppointments(db, donorId)
getCounsellorQueueItems(db, urgency?)
getTemplates(db, language, findingCategory)
```

## Learning Resources

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/start)
- [Composite Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
- [TypeScript Support](https://firebase.google.com/docs/firestore/type-safe)

## Support

For issues or questions:
1. Check README.md for detailed documentation
2. Review firestore-schema.ts for collection definitions
3. Run tests: `npm test`
4. Check Firestore Console for data/errors

---

**Schema Version**: 1.0.0
**Status**: Production Ready
**Last Updated**: 2026-10-08
