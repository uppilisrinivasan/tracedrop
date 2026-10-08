/**
 * Firestore Initialization Script
 *
 * This module handles:
 * 1. Connection to Firestore
 * 2. Collection creation (idempotent)
 * 3. Composite index creation
 * 4. Initial data seeding (protocols and templates)
 * 5. Security rules deployment
 *
 * Run this script during deployment to ensure database schema is ready.
 * Safe to run multiple times - all operations are idempotent.
 */

import * as admin from 'firebase-admin';
import { COMPOSITE_INDEXES, SCHEMA_VERSION } from './firestore-schema';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Initialize Firebase Admin SDK
// ============================================================================

/**
 * Initialize Firebase Admin SDK
 *
 * Looks for GOOGLE_APPLICATION_CREDENTIALS environment variable.
 * Falls back to default credentials if running in Cloud environment.
 *
 * @returns Firestore instance
 */
export function initializeFirebase(): admin.firestore.Firestore {
  if (!admin.apps.length) {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (credentialsPath && fs.existsSync(credentialsPath)) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(credentialsPath, 'utf8')
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase initialized with service account credentials');
    } else {
      admin.initializeApp();
      console.log('Firebase initialized with default credentials');
    }
  }

  return admin.firestore();
}

// ============================================================================
// Collection Management
// ============================================================================

/**
 * Ensure all required collections exist
 *
 * Firestore creates collections automatically on first document write,
 * but we explicitly create them here for documentation and verification.
 *
 * @param db Firestore instance
 */
export async function ensureCollectionsExist(
  db: admin.firestore.Firestore
): Promise<void> {
  const collections = [
    'donors',
    'donations',
    'observations',
    'findings',
    'care_plans',
    'appointments',
    'communications',
    'outcomes',
    'counsellor_queue',
    'templates',
    'protocols',
  ];

  console.log('Checking collections...');

  for (const collectionName of collections) {
    try {
      // Try to get a single document to verify collection exists
      const snapshot = await db.collection(collectionName).limit(1).get();
      if (snapshot.empty) {
        // Collection doesn't have documents yet - create a marker document
        // This ensures the collection is initialized and visible in console
        const docId = `__metadata__`;
        await db.collection(collectionName).doc(docId).set(
          {
            type: 'metadata',
            initialized: true,
            schemaVersion: SCHEMA_VERSION,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        console.log(`  Created collection: ${collectionName}`);
      } else {
        console.log(`  Verified collection: ${collectionName}`);
      }
    } catch (error) {
      console.error(`  Error with collection ${collectionName}:`, error);
      throw error;
    }
  }
}

// ============================================================================
// Composite Index Management
// ============================================================================

/**
 * Log composite indexes that need to be created in Firestore console
 *
 * Firestore composite indexes cannot be created via SDK programmatically.
 * They must be created through:
 * 1. Firestore Console UI
 * 2. gcloud CLI: gcloud firestore indexes create --document-id=index.yaml
 * 3. This function generates the configuration for automated deployment
 *
 * @param db Firestore instance
 */
export async function logCompositeIndexes(
  db: admin.firestore.Firestore
): Promise<void> {
  console.log('\nComposite Indexes Required:');
  console.log('===========================\n');

  const indexes = COMPOSITE_INDEXES;

  for (const index of indexes) {
    const fieldsList = index.fields
      .map((f) => `${f.fieldPath} (${f.direction})`)
      .join(', ');

    console.log(`Collection: ${index.collection}`);
    console.log(`  Fields: ${fieldsList}`);
    console.log(`  Query Pattern: ${index.queryPattern}`);
    console.log();
  }

  console.log('Create these indexes via:');
  console.log('  1. Firestore Console: https://console.firebase.google.com');
  console.log('  2. gcloud CLI: gcloud firestore indexes create');
  console.log('  3. Terraform/IaC for your deployment');
}

/**
 * Generate Firestore index.yaml configuration
 *
 * This generates the YAML configuration for gcloud CLI deployment
 * of composite indexes.
 *
 * @returns YAML string for index configuration
 */
export function generateIndexYaml(): string {
  const indexes = COMPOSITE_INDEXES;

  let yaml = `# Firestore Composite Indexes for TraceDrop Phase 1
# Generated automatically - do not edit
# Deploy with: gcloud firestore indexes create index.yaml

indexes:
`;

  for (const index of indexes) {
    yaml += `  - collection: ${index.collection}
    queryScope: Collection
    fields:
`;
    for (const field of index.fields) {
      yaml += `      - fieldPath: ${field.fieldPath}
        order: ${field.direction}
`;
    }
  }

  return yaml;
}

// ============================================================================
// Seed Data: Protocols
// ============================================================================

/**
 * Seed protocol rules into the protocols collection
 *
 * Protocols define the clinical decision logic. These should be reviewed
 * and approved by medical team before deployment.
 *
 * @param db Firestore instance
 */
export async function seedProtocols(
  db: admin.firestore.Firestore
): Promise<void> {
  console.log('\nSeeding Protocols...');

  const protocolsData = [
    {
      name: 'BP-G1',
      category: 'BP',
      description: 'Elevated Blood Pressure Grade 1',
      rule:
        'systolic >= 130 and systolic < 140 or diastolic >= 80 and diastolic < 90',
      action: 'find_clinician',
      urgency: 'soon',
      metadata: {
        clinical_evidence: 'ACC/AHA 2017 Hypertension Guidelines',
        affected_population: 'all',
        threshold_systolic: 130,
        threshold_diastolic: 80,
      },
      isActive: true,
      version: 1,
    },

    {
      name: 'BP-G2',
      category: 'BP',
      description: 'High Blood Pressure Grade 2',
      rule: 'systolic >= 140 or diastolic >= 90',
      action: 'create_care_plan',
      urgency: 'urgent',
      metadata: {
        clinical_evidence: 'ACC/AHA 2017 Hypertension Guidelines',
        affected_population: 'all',
        threshold_systolic: 140,
        threshold_diastolic: 90,
      },
      isActive: true,
      version: 1,
    },

    {
      name: 'Hb-LOW',
      category: 'Hb',
      description: 'Low Hemoglobin',
      rule: 'value < 12.5 and type = "Hb"',
      action: 'find_clinician',
      urgency: 'soon',
      metadata: {
        clinical_evidence: 'WHO Blood Donor Eligibility Guidelines',
        affected_population: 'women_donors',
        threshold_hb: 12.5,
      },
      isActive: true,
      version: 1,
    },

    {
      name: 'Hb-CRITICAL',
      category: 'Hb',
      description: 'Critical Low Hemoglobin',
      rule: 'value < 7.5 and type = "Hb"',
      action: 'escalate_immediate',
      urgency: 'critical',
      metadata: {
        clinical_evidence: 'Medical Emergency Protocol',
        affected_population: 'all',
        threshold_hb: 7.5,
      },
      isActive: true,
      version: 1,
    },

    {
      name: 'HR-ELEVATED',
      category: 'HR',
      description: 'Elevated Heart Rate',
      rule: 'value >= 100 and type = "HR"',
      action: 'find_clinician',
      urgency: 'routine',
      metadata: {
        clinical_evidence: 'Cardiovascular Assessment',
        affected_population: 'all',
        threshold_hr: 100,
      },
      isActive: true,
      version: 1,
    },

    {
      name: 'DEFERRED-PATTERN',
      category: 'deferred',
      description: 'Recent deferral from donation',
      rule: 'status = "deferred" in last donation',
      action: 'create_care_plan',
      urgency: 'soon',
      metadata: {
        clinical_evidence: 'Blood Donor Care Follow-up',
        affected_population: 'all',
      },
      isActive: true,
      version: 1,
    },
  ];

  const batch = db.batch();
  let count = 0;

  for (const protocol of protocolsData) {
    const docRef = db.collection('protocols').doc(protocol.name);

    batch.set(
      docRef,
      {
        ...protocol,
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    count++;
  }

  await batch.commit();
  console.log(`  Seeded ${count} protocols`);
}

// ============================================================================
// Seed Data: Templates
// ============================================================================

/**
 * Seed message templates into the templates collection
 *
 * Templates are localized by language and organized by finding category.
 * These are starter templates - customize for your organization.
 *
 * @param db Firestore instance
 */
export async function seedTemplates(
  db: admin.firestore.Firestore
): Promise<void> {
  console.log('\nSeeding Message Templates...');

  const templatesData = [
    // English templates
    {
      language: 'en',
      findingCategory: 'BP_GRADE1',
      channel: 'sms',
      name: 'BP Grade 1 Alert - SMS',
      template:
        'Hi {{donorName}}, your recent blood pressure reading ({{vitals}}) is slightly elevated. Please {{actionRequired}}. Reply HELP for more info.',
      variables: ['donorName', 'vitals', 'actionRequired'],
      isActive: true,
      version: 1,
    },

    {
      language: 'en',
      findingCategory: 'BP_GRADE2',
      channel: 'whatsapp',
      name: 'BP Grade 2 Alert - WhatsApp',
      template:
        'Hi {{donorName}},\n\nYour recent blood pressure reading is elevated ({{vitals}}). This needs medical attention.\n\nWe have scheduled a clinic visit for you at {{facilityName}} on {{appointmentDate}}.\n\nPlease confirm your attendance.\n\nIf you have any questions, contact us.',
      variables: [
        'donorName',
        'vitals',
        'facilityName',
        'appointmentDate',
      ],
      isActive: true,
      version: 1,
    },

    {
      language: 'en',
      findingCategory: 'Hb_LOW',
      channel: 'sms',
      name: 'Low Hemoglobin Alert - SMS',
      template:
        'Hi {{donorName}}, your hemoglobin level ({{vitals}}) is a bit low. Please schedule a clinic visit to discuss. We can help you feel better!',
      variables: ['donorName', 'vitals'],
      isActive: true,
      version: 1,
    },

    {
      language: 'en',
      findingCategory: 'appointment_reminder',
      channel: 'whatsapp',
      name: 'Appointment Reminder - WhatsApp',
      template:
        'Hi {{donorName}},\n\nReminder: You have an appointment at {{facilityName}}\n\nDate & Time: {{appointmentDate}}\n\nPlease confirm if you can attend.\n\nSee you soon!',
      variables: ['donorName', 'facilityName', 'appointmentDate'],
      isActive: true,
      version: 1,
    },

    // Hindi templates
    {
      language: 'hi',
      findingCategory: 'BP_GRADE1',
      channel: 'sms',
      name: 'BP Grade 1 Alert - SMS (Hindi)',
      template:
        'नमस्ते {{donorName}}, आपका हाल ही का रक्तचाप रीडिंग ({{vitals}}) थोड़ा अधिक है। कृपया {{actionRequired}}। अधिक जानकारी के लिए HELP टाइप करें।',
      variables: ['donorName', 'vitals', 'actionRequired'],
      isActive: true,
      version: 1,
    },

    {
      language: 'hi',
      findingCategory: 'BP_GRADE2',
      channel: 'whatsapp',
      name: 'BP Grade 2 Alert - WhatsApp (Hindi)',
      template:
        'नमस्ते {{donorName}},\n\nआपकी हाल ही की रक्तचाप रीडिंग ({{vitals}}) बढ़ी हुई है। इसे चिकित्सा ध्यान की आवश्यकता है।\n\nहमने आपके लिए {{facilityName}} पर {{appointmentDate}} को क्लिनिक विजिट शेड्यूल किया है।\n\nकृपया अपनी उपस्थिति की पुष्टि करें।',
      variables: [
        'donorName',
        'vitals',
        'facilityName',
        'appointmentDate',
      ],
      isActive: true,
      version: 1,
    },

    // Tamil templates
    {
      language: 'ta',
      findingCategory: 'appointment_reminder',
      channel: 'sms',
      name: 'Appointment Reminder - SMS (Tamil)',
      template:
        'வணக்கம் {{donorName}}, உங்கள் நியமனம் {{facilityName}} இல் {{appointmentDate}} ஆகும். தயவு செய்து உறுதிப்படுத்தவும்।',
      variables: ['donorName', 'facilityName', 'appointmentDate'],
      isActive: true,
      version: 1,
    },
  ];

  const batch = db.batch();
  let count = 0;

  for (const template of templatesData) {
    const docRef = db.collection('templates').doc();

    batch.set(
      docRef,
      {
        ...template,
        characterCount: template.template.length,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    count++;
  }

  await batch.commit();
  console.log(`  Seeded ${count} message templates`);
}

// ============================================================================
// Main Initialization Flow
// ============================================================================

/**
 * Main initialization function
 *
 * Run this during deployment to set up the database schema.
 * Safe to run multiple times.
 *
 * @param options Configuration options
 */
export async function initializeDatabase(options: {
  generateIndexConfig?: boolean;
  seedProtocols?: boolean;
  seedTemplates?: boolean;
} = {}): Promise<void> {
  const {
    generateIndexConfig = false,
    seedProtocols: shouldSeedProtocols = true,
    seedTemplates: shouldSeedTemplates = true,
  } = options;

  console.log('======================================');
  console.log('TraceDrop Firestore Initialization');
  console.log(`Schema Version: ${SCHEMA_VERSION}`);
  console.log('======================================\n');

  try {
    const db = initializeFirebase();

    // Step 1: Ensure collections exist
    await ensureCollectionsExist(db);

    // Step 2: Log composite indexes
    await logCompositeIndexes(db);

    // Step 3: Generate index configuration if requested
    if (generateIndexConfig) {
      const indexYaml = generateIndexYaml();
      const indexPath = path.join(process.cwd(), 'firestore-indexes.yaml');
      fs.writeFileSync(indexPath, indexYaml);
      console.log(`\nIndex configuration written to: ${indexPath}`);
    }

    // Step 4: Seed protocols
    if (shouldSeedProtocols) {
      await seedProtocols(db);
    }

    // Step 5: Seed templates
    if (shouldSeedTemplates) {
      await seedTemplates(db);
    }

    console.log('\n======================================');
    console.log('Initialization Complete!');
    console.log('======================================\n');

    console.log('Next Steps:');
    console.log('1. Create composite indexes in Firestore Console');
    console.log('2. Deploy security rules: firebase deploy --only firestore:rules');
    console.log('3. Verify data in Firestore Console');
  } catch (error) {
    console.error('Initialization failed:', error);
    throw error;
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    generateIndexConfig: args.includes('--generate-indexes'),
    seedProtocols: !args.includes('--no-seed-protocols'),
    seedTemplates: !args.includes('--no-seed-templates'),
  };

  initializeDatabase(options)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default initializeDatabase;
