# TraceDrop Firestore Database Schema - Phase 1

Complete Firestore schema design for the TraceDrop blood donor care platform. This documentation provides an overview of all 11 collections, indexes, security architecture, and initialization procedures.

## Collections Overview

### 1. Donors Collection
**Central patient identity and demographic records**

- **Purpose**: Single source of truth for all donor information
- **Privacy Model**: Donors see only their own record
- **Key Fields**: id, name, phone, email, language, gender, age, healthStatus
- **Indexes**: None (queries by ID are fast by default)
- **Data Retention**: Indefinitely for blood bank records; implement right-to-deletion on request

**Use Cases**:
- Quick eligibility lookups
- Donor communication preferences
- Emergency contact information

---

### 2. Donations Collection
**Blood donation events and outcomes**

- **Purpose**: Track each donation event, status, and deferral reasons
- **Privacy Model**: Donors see own donations, centre staff see all at their centre
- **Key Fields**: id, donorId, status, performedAt, bloodCentreId, amountCollected, bloodType
- **Critical Index**: `(donorId, performedAt DESC)` - enables donation timeline queries
- **Data Retention**: Keep permanently for medical records

**Status Values**:
- `completed`: Blood successfully collected and processed
- `deferred`: Donor deferred (usually temporary, triggers care plan)
- `cancelled`: Donation cancelled by staff

**Use Cases**:
- Donation history for a donor
- Recent deferral detection
- Blood inventory tracking

---

### 3. Observations Collection
**Vital signs and lab results**

- **Purpose**: Raw data store for all measurements (BP, Hb, HR, labs)
- **Privacy Model**: Donors see own, doctors see for patients under care
- **Key Fields**: id, donorId, type (BP/Hb/lab/HR/RR/BMI), value, unit, recordedAt, source
- **Critical Indexes**:
  - `(donorId, recordedAt DESC)` - get donor's observation history
  - `(type, recordedAt DESC)` - analytics by observation type
- **Data Retention**: 2+ years for trending; older records can be archived

**Source Types**:
- `donation_centre`: Measured during donation drive
- `self_reported`: Donor reported via app/SMS
- `clinic`: Clinical appointment
- `lab`: Laboratory test

**BP Storage Format**: Store as string "systolic/diastolic" (e.g., "120/80")

**Use Cases**:
- Building donor health timeline
- Trend analysis for AI findings
- Lab result tracking
- Medication adherence monitoring

---

### 4. Findings Collection
**AI-synthesized clinical findings**

- **Purpose**: Store findings combining multiple observations that trigger care plans
- **Privacy Model**: Doctors see for patients, escalated findings go to counsellor_queue
- **Key Fields**: id, donorId, category, sourceObservationId, trend, status, description, urgency
- **Critical Indexes**:
  - `(donorId, createdAt DESC)` - all findings for a donor
  - `(category, createdAt DESC)` - findings by category for analytics
- **Data Retention**: Indefinitely; archive when outcome recorded (30+ days)

**Category Examples**:
- `BP_GRADE1`: Systolic 130-139 or diastolic 80-89
- `BP_GRADE2`: Systolic ≥140 or diastolic ≥90
- `Hb_LOW`, `Hb_CRITICAL`: Hemoglobin thresholds
- `HR_ELEVATED`: Heart rate ≥100 bpm
- `DEFERRED`: Recent deferral flag
- `OTHER`: Custom AI patterns

**Urgency Levels**:
- `routine`: Schedule 1-2 months
- `soon`: Schedule 1-2 weeks
- `urgent`: Schedule 24-48 hours
- `critical`: Immediate medical attention

**Use Cases**:
- Donor health alerts
- Care plan generation triggers
- Counsellor escalation queue
- Health trend monitoring dashboard

---

### 5. Care Plans Collection
**Doctor-approved clinical care plans**

- **Purpose**: Actionable prescriptions derived from findings
- **Privacy Model**: Doctors manage all, donors see their plans
- **Key Fields**: id, donorId, findingId, status, proposedAction, approvedBy, approvedAt
- **Critical Index**: `(donorId, createdAt DESC)` - care history timeline
- **Data Retention**: Indefinitely for care audit trail

**Status Workflow**:
- `draft` → `pending` → `active` → `completed`
- Alternative: `draft` → `rejected` → archived
- `archived`: Old plans no longer relevant

**Proposed Actions**:
- `visit_clinic`: Schedule clinic visit
- `lab_test`: Specific lab test order
- `monitor`: Self-monitoring with app
- `referral`: Specialist referral
- `deferral`: Advise deferral from donation
- `lifestyle`: Counselling for behavior change

**Use Cases**:
- Care coordination between doctors and donors
- Appointment scheduling
- Treatment tracking
- Care compliance monitoring

---

### 6. Appointments Collection
**Care appointment bookings and fulfillment**

- **Purpose**: Track scheduled clinical appointments and outcomes
- **Privacy Model**: Donors see own, clinic staff see facility appointments
- **Key Fields**: id, donorId, carePlanId, facilityId, startTime, endTime, status, type
- **Critical Index**: `(donorId, startTime)` - upcoming appointments for donor
- **Data Retention**: Indefinitely for appointment history

**Status Values**:
- `scheduled`: Initial booking
- `confirmed`: Donor confirmed attendance
- `completed`: Attended
- `no_show`: Didn't attend
- `cancelled`, `rescheduled`

**Appointment Types**:
- `clinic_visit`: Doctor consultation
- `lab_test`: Lab procedure
- `counselling`: Counsellor session
- `follow_up`: Post-treatment follow-up

**Use Cases**:
- Appointment reminders (SMS/WhatsApp)
- Clinic scheduling
- No-show tracking
- Attendance analytics

---

### 7. Communications Collection
**Message audit trail (SMS, WhatsApp, email, web)**

- **Purpose**: Complete audit of all outbound communications
- **Privacy Model**: Donors see own, staff see for audit
- **Key Fields**: id, donorId, type, channel, payload, sentAt, deliveredAt, status, attemptCount
- **Critical Index**: `(donorId, sentAt DESC)` - message history
- **Data Retention**: 1+ year for compliance; archive older messages

**Channels**:
- `sms`: Text message (160 chars limit)
- `whatsapp`: WhatsApp message
- `email`: Email notification
- `web`: In-app web notification

**Message Types**:
- `finding_alert`: New clinical finding
- `appointment_reminder`: Appointment notification
- `care_plan`: Care plan notification
- `feedback_request`: Measurement request
- `educational`: Health tips/info

**Delivery Status**:
- `pending` → `sent` → `delivered` → `read`
- Alternative: `failed` (with failureReason), `bounced`

**Payload Format** (flexible, template-driven):
```json
{
  "title": "Blood Pressure Alert",
  "body": "Your BP is elevated. Please schedule a clinic visit.",
  "findingId": "finding123",
  "actionUrl": "app://findings/finding123",
  "priority": "high"
}
```

**Use Cases**:
- Message delivery tracking
- Retry management
- Delivery analytics
- Compliance logging
- Donor communication history

---

### 8. Outcomes Collection
**Follow-up results from appointments**

- **Purpose**: Record appointment attendance and clinical outcomes
- **Privacy Model**: Doctors see for patients, donors see their outcomes
- **Key Fields**: id, appointmentId, donorId, attended, resultValue, status, recordedBy, linkedFindingId
- **Critical Index**: `(donorId, recordedAt DESC)` - outcome history
- **Data Retention**: Indefinitely for care continuity

**Status Workflow**:
- `pending` → `recorded` → `reviewed` → `acted_upon`

**Use Cases**:
- Appointment follow-up recording
- Lab result capture
- Counselling session notes
- Care plan effectiveness tracking
- Generating new findings from outcomes

---

### 9. Counsellor Queue Collection ⚠️ CONFIDENTIAL
**Urgent/sensitive findings requiring human counsellor intervention**

- **Purpose**: Isolated queue for sensitive escalations (mental health, high-risk patterns)
- **Privacy Model**: **CONFIDENTIAL - Counsellors only**
- **Access Control**: Firestore security rules restrict to `counsellor` role
- **Key Fields**: id, donorId, flagType, urgency, status, handledBy, counsellorNotes
- **Critical Index**: `(status, urgency DESC)` - counsellor dashboard filtering
- **Data Retention**: Archive after 30 days or when resolved; keep archived 1 year for audit

**Flag Types**:
- `mental_health_risk`: Mental health concerns expressed
- `deferral_pattern`: Repeated deferrals indicating health issue
- `high_risk_condition`: Critical vital signs
- `non_compliance`: Missing appointments/measurements
- `other`: Custom escalation

**Status Workflow**:
- `pending` → `assigned` → `in_progress` → `resolved`
- Alternative: → `escalated` (emergency)

**Security Considerations**:
- Individual doc-level access control
- No batch operations (prevent data harvesting)
- Strict audit logging of all reads/writes
- Donor IDs encrypted in audit logs where possible
- No export/backup to non-secure systems

**Use Cases**:
- High-priority donor interventions
- Mental health risk management
- Emergency response coordination
- Sensitive case handling

---

### 10. Templates Collection
**Localized message templates**

- **Purpose**: Pre-approved message templates for all communication scenarios
- **Privacy Model**: System data (visible to admins, content managers)
- **Key Fields**: id, language, findingCategory, channel, template, variables, name, characterCount, isActive
- **Critical Index**: `(language, findingCategory)` - template lookup
- **Data Retention**: Indefinitely; archive old versions

**Variables** (template syntax: `{{varName}}`):
- `{{donorName}}`: Donor's first name
- `{{vitals}}`: Summary of recent vitals
- `{{actionRequired}}`: Recommended action
- `{{facilityName}}`: Healthcare facility name
- `{{appointmentDate}}`: Appointment date/time
- Custom variables per template

**Supported Languages** (ISO 639-1):
- `en`: English
- `hi`: Hindi
- `ta`: Tamil
- `te`: Telugu
- `ka`: Kannada
- `ml`: Malayalam
- Extend as needed

**Use Cases**:
- Message personalization
- Localization management
- A/B testing message variants
- Compliance-approved messaging
- SMS length validation (160 char limit)

---

### 11. Protocols Collection
**Clinical decision protocol rules**

- **Purpose**: Encode clinical rules that trigger findings and care plans
- **Privacy Model**: System data (doctors can view, admins modify)
- **Key Fields**: id, name, category, rule, action, urgency, metadata, isActive, version
- **Indexes**: None (typically bulk-loaded on app startup)
- **Data Retention**: Indefinitely; archive old versions

**Protocol Names** (examples):
- `BP-G1`, `BP-G2`: Blood pressure grades
- `Hb-Low`, `Hb-Critical`: Hemoglobin thresholds
- `HR-Elevated`: Heart rate
- `DEFERRED-PATTERN`: Recent deferral
- Custom protocols as needed

**Rule Format**:
- Can be simple threshold: `"value < 7.5 and type = 'Hb'"`
- Or complex logic: `"systolic >= 130 and systolic < 140 or diastolic >= 80 and diastolic < 90"`
- Evaluated by backend AI/rules engine

**Actions**:
- `find_clinician`: Create finding, don't auto-escalate
- `create_care_plan`: Auto-create care plan for review
- `schedule_appointment`: Automatically book appointment
- `escalate_immediate`: Send to counsellor_queue

**Metadata Examples**:
```json
{
  "clinical_evidence": "ACC/AHA 2017 Guidelines",
  "affected_population": "all",
  "threshold_systolic": 130,
  "threshold_diastolic": 80
}
```

**Use Cases**:
- AI findings generation engine
- Care plan automation
- Clinical guideline implementation
- Protocol versioning and audit trail
- Clinical decision support

---

## Composite Index Requirements

11 composite indexes are required for optimal query performance:

| Collection | Fields | Query Pattern |
|---|---|---|
| donations | (donorId ↑, performedAt ↓) | Donation history |
| observations | (donorId ↑, recordedAt ↓) | Observation timeline |
| observations | (type ↑, recordedAt ↓) | Observations by type |
| findings | (donorId ↑, createdAt ↓) | Findings per donor |
| findings | (category ↑, createdAt ↓) | Findings by category |
| care_plans | (donorId ↑, createdAt ↓) | Care plan history |
| appointments | (donorId ↑, startTime ↑) | Upcoming appointments |
| communications | (donorId ↑, sentAt ↓) | Message history |
| outcomes | (donorId ↑, recordedAt ↓) | Outcome history |
| counsellor_queue | (status ↑, urgency ↓) | Counsellor dashboard |
| templates | (language ↑, findingCategory ↑) | Template lookup |

**Create indexes**:
1. Manual: Firestore Console UI
2. CLI: `gcloud firestore indexes create index.yaml`
3. Terraform: Use firestore_index resource
4. See firestore-init.ts for `generateIndexYaml()` helper

---

## Security Architecture

### Authentication
- All operations require Firebase Authentication
- Supports email, phone, social identity providers

### Role-Based Access Control (RBAC)

Firestore security rules implement role-based access:

**Roles**:
- `donor`: Can read own records, write self-reported observations
- `doctor`: Can read patients under care, manage care plans
- `counsellor`: Can access counsellor_queue (CONFIDENTIAL)
- `centre_staff`: Can record donations and vitals at their centre
- `admin`: Full read/write access

**Collection Access Matrix**:

| Collection | Donor | Doctor | Counsellor | Centre Staff | Admin |
|---|---|---|---|---|---|
| donors | Read own | Read patients | — | — | RW |
| donations | Read own | Read | — | Create | RW |
| observations | Read own, Write self-reported | Read | — | Create | RW |
| findings | Read own | RW | — | — | RW |
| care_plans | Read own | RW | — | — | RW |
| appointments | Read own | RW | — | — | RW |
| communications | Read own | Read | — | — | RW |
| outcomes | Read own | RW | — | — | RW |
| counsellor_queue | — | — | RW | — | RW |
| templates | — | Read | Read | — | RW |
| protocols | — | Read | — | — | RW |

### Data Protection

**Encryption**:
- At rest: Firebase encrypts all data by default
- In transit: TLS 1.2+ for all API calls
- Optional: Encrypt sensitive fields (PII, lab results)

**Sensitive Fields**:
- Donor PII (name, phone, email) should be encrypted at application level
- Lab results can be marked `isConfidential`
- Counsellor notes are audit-logged

**Audit Logging**:
- Enable Cloud Audit Logs for all counsellor_queue operations
- Log all care_plan approvals
- Maintain tamper-proof audit trail

---

## Initialization & Deployment

### Prerequisites
- Firebase project with Firestore database
- firebase-admin SDK (v11.0.0+)
- Service account credentials (GOOGLE_APPLICATION_CREDENTIALS)

### Step 1: Initialize Database
```bash
# Set service account credentials
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Run initialization script
node dist/database/firestore-init.js

# Or with options
node dist/database/firestore-init.js --generate-indexes --seed-protocols --seed-templates
```

### Step 2: Create Composite Indexes
Generated index configuration is saved to `firestore-indexes.yaml`:
```bash
gcloud firestore indexes create index.yaml
```

### Step 3: Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

### Step 4: Verify Schema
```typescript
import { getFirestoreClient, collections } from './database/firestore';

const db = getFirestoreClient();
const protocols = await collections.protocols(db).get();
console.log(`${protocols.size} protocols loaded`);
```

---

## Usage Examples

### Creating a Donor
```typescript
import { getFirestoreClient, collections } from './database/firestore';

const db = getFirestoreClient();
const donorRef = await db.collection('donors').add({
  name: 'Ramesh Kumar',
  phone: '+919876543210',
  email: 'ramesh@example.com',
  language: 'hi',
  gender: 'M',
  age: 35,
  healthStatus: 'healthy',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
```

### Recording a Donation
```typescript
await db.collection('donations').add({
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

### Querying Donor's Recent Observations
```typescript
import { queryByDonor, collections } from './database/firestore';

const observations = await queryByDonor(
  db,
  collections.observations,
  'donor123',
  { orderByField: 'recordedAt', orderDirection: 'desc', limit: 10 }
);
```

### Getting Donor's Active Findings
```typescript
import { getDonorActiveFindings } from './database/firestore';

const findings = await getDonorActiveFindings(db, 'donor123');
findings.forEach(f => console.log(`${f.category}: ${f.description}`));
```

### Creating a Care Plan
```typescript
await db.collection('care_plans').add({
  donorId: 'donor123',
  findingId: 'finding456',
  status: 'pending',
  proposedAction: 'visit_clinic',
  notes: 'BP elevated. Schedule clinic visit for detailed assessment.',
  createdBy: 'doctor789',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
```

### Counsellor Queue Operations (Restricted Access)
```typescript
import { getCounsellorQueueItems } from './database/firestore';

// Only accessible to users with 'counsellor' role
const urgentItems = await getCounsellorQueueItems(db, 'urgent');
```

---

## Data Retention & Archival Policies

| Collection | Retention | Archival Strategy |
|---|---|---|
| donors | Indefinite | Right-to-deletion on request |
| donations | Indefinite | Medical records requirement |
| observations | 2+ years | Archive to cold storage, GCS |
| findings | Indefinite | Archive 30+ days after outcome |
| care_plans | Indefinite | Archive when completed/rejected |
| appointments | Indefinite | Standard historical records |
| communications | 1+ year | Delete/archive older than 2 years |
| outcomes | Indefinite | Linked to care history |
| counsellor_queue | 30 days | Archive when status=resolved |
| templates | Indefinite | Archive old versions |
| protocols | Indefinite | Maintain version history |

---

## Performance Optimization

### Query Best Practices
1. Always use indexed fields in WHERE clauses
2. Order by indexed fields
3. Limit results (default: 50, max: 1000)
4. Use pagination for large datasets
5. Batch read operations when possible

### Cost Optimization
- Regional indexes reduce query costs
- Archive old observations to reduce data size
- Use __name__ ordering carefully (adds read cost)
- Monitor query usage in Firebase Console

### Scaling Considerations
- Each collection can hold billions of documents
- Composite indexes add write latency (~100ms)
- Sharding strategies for write-heavy collections
- Consider Firestore in Datastore mode for different consistency model

---

## Testing & Development

### Local Development (Firestore Emulator)
```bash
firebase emulators:start --only firestore
```

### Connection in Tests
```typescript
if (process.env.FIRESTORE_EMULATOR_HOST) {
  // Tests use emulator
  const db = getFirestoreClient();
} else {
  // Production database
}
```

### Clearing Test Data
```typescript
// Reset collection between tests
await db.collection('donors').get().then(snap => {
  snap.docs.forEach(doc => doc.ref.delete());
});
```

---

## Schema Versioning

- **Current Version**: 1.0.0
- **Backward Compatibility**: Collections are additive; field additions are non-breaking
- **Deprecation**: Mark fields as deprecated, migrate data gradually
- **Migration Scripts**: Store in `/backend/migrations/` directory

---

## Support & Troubleshooting

### Common Issues

**Q: "No matching index found"**
- A: Create required composite index (see Index Requirements section)

**Q: "Insufficient permission to access resource"**
- A: Check Firestore security rules and user role assignment

**Q: "Document too large"**
- A: Firestore max 1MB per document. Split into sub-collections.

**Q: Slow queries on donorId?**
- A: Verify composite indexes are created and active

---

## API Reference

See `firestore.ts` for complete API:

### Collection References
- `collections.donors(db)`
- `collections.donations(db)`
- `collections.observations(db)`
- `collections.findings(db)`
- `collections.carePlans(db)`
- `collections.appointments(db)`
- `collections.communications(db)`
- `collections.outcomes(db)`
- `collections.counsellorQueue(db)`
- `collections.templates(db)`
- `collections.protocols(db)`

### CRUD Operations
- `createDocument<T>(db, collection, data)`
- `getDocument<T>(db, collection, docId)`
- `updateDocument<T>(db, collection, docId, updates)`
- `deleteDocument<T>(db, collection, docId)`

### Query Operations
- `queryDocuments<T>(db, collection, fieldPath, operator, value)`
- `queryByDonor<T>(db, collection, donorId, options)`
- `getPaginatedDonorRecords<T>(db, collection, donorId, cursor, pageSize)`

### Aggregations
- `countDocuments<T>(db, collection, fieldPath, operator, value)`
- `getDistinctValues<T>(db, collection, fieldPath, limit)`

### Specialized Queries
- `getDonorDonationTimeline(db, donorId, limit)`
- `getDonorActiveFindings(db, donorId)`
- `getDonorCarePlans(db, donorId, status?)`
- `getDonorUpcomingAppointments(db, donorId)`
- `getCounsellorQueueItems(db, urgency?)`
- `getTemplates(db, language, findingCategory)`

---

## Next Steps

1. **Security Rules**: Implement Firestore security rules in `firestore.rules`
2. **Cloud Functions**: Create triggers for automated workflows
3. **Analytics**: Set up BigQuery export for data analysis
4. **Monitoring**: Configure alerts for query performance degradation
5. **Backup**: Enable automated backups for disaster recovery

---

**Last Updated**: 2026-10-08
**Schema Version**: 1.0.0
**Status**: Phase 1 Production Ready
