/**
 * Firestore Client Wrapper
 *
 * This module provides a centralized client for all Firestore operations.
 * It includes:
 * - Singleton Firestore instance
 * - Type-safe collection references
 * - Helper functions for common operations
 * - Error handling and retry logic
 * - Query optimization utilities
 *
 * Usage:
 * import { getFirestoreClient, collections } from './firestore';
 * const db = getFirestoreClient();
 * const donors = await collections.donors(db).get();
 */

import * as admin from 'firebase-admin';
import {
  Donor,
  Donation,
  Observation,
  Finding,
  CarePlan,
  Appointment,
  Communication,
  Outcome,
  CounsellorQueue,
  Template,
  Protocol,
} from './firestore-schema';

// ============================================================================
// Singleton Instance
// ============================================================================

let firestoreInstance: admin.firestore.Firestore | null = null;

/**
 * Get or create singleton Firestore instance
 *
 * @returns Firestore instance
 * @throws Error if Firebase is not initialized
 */
export function getFirestoreClient(): admin.firestore.Firestore {
  if (!firestoreInstance) {
    if (!admin.apps.length) {
      throw new Error(
        'Firebase Admin SDK not initialized. Call admin.initializeApp() first.'
      );
    }
    firestoreInstance = admin.firestore();
  }
  return firestoreInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetFirestoreClient(): void {
  firestoreInstance = null;
}

// ============================================================================
// Type-Safe Collection References
// ============================================================================

/**
 * Type-safe collection reference factory
 *
 * Provides strongly-typed references to all collections.
 * Ensures consistency and enables IDE autocompletion.
 *
 * Example:
 * const donorsRef = collections.donors(db);
 * const doc = await donorsRef.doc('donor123').get();
 */
export const collections = {
  donors: (
    db: admin.firestore.Firestore
  ): admin.firestore.CollectionReference<Donor> =>
    db.collection('donors') as admin.firestore.CollectionReference<Donor>,

  donations: (
    db: admin.firestore.Firestore
  ): admin.firestore.CollectionReference<Donation> =>
    db.collection('donations') as admin.firestore.CollectionReference<Donation>,

  observations: (
    db: admin.firestore.Firestore
  ): admin.firestore.CollectionReference<Observation> =>
    db
      .collection('observations') as admin.firestore.CollectionReference<Observation>,

  findings: (
    db: admin.firestore.Firestore
  ): admin.firestore.CollectionReference<Finding> =>
    db.collection('findings') as admin.firestore.CollectionReference<Finding>,

  carePlans: (
    db: admin.firestore.Firestore
  ): admin.firestore.CollectionReference<CarePlan> =>
    db
      .collection('care_plans') as admin.firestore.CollectionReference<CarePlan>,

  appointments: (
    db: admin.firestore.Firestore
  ): admin.firestore.CollectionReference<Appointment> =>
    db
      .collection('appointments') as admin.firestore.CollectionReference<Appointment>,

  communications: (
    db: admin.firestore.Firestore
  ): admin.firestore.CollectionReference<Communication> =>
    db
      .collection(
        'communications'
      ) as admin.firestore.CollectionReference<Communication>,

  outcomes: (
    db: admin.firestore.Firestore
  ): admin.firestore.CollectionReference<Outcome> =>
    db.collection('outcomes') as admin.firestore.CollectionReference<Outcome>,

  counsellorQueue: (
    db: admin.firestore.Firestore
  ): admin.firestore.CollectionReference<CounsellorQueue> =>
    db
      .collection(
        'counsellor_queue'
      ) as admin.firestore.CollectionReference<CounsellorQueue>,

  templates: (
    db: admin.firestore.Firestore
  ): admin.firestore.CollectionReference<Template> =>
    db.collection('templates') as admin.firestore.CollectionReference<Template>,

  protocols: (
    db: admin.firestore.Firestore
  ): admin.firestore.CollectionReference<Protocol> =>
    db.collection('protocols') as admin.firestore.CollectionReference<Protocol>,
};

// ============================================================================
// Helper Functions: CRUD Operations
// ============================================================================

/**
 * Create a new document in a collection
 *
 * @param db Firestore instance
 * @param collection Collection reference factory
 * @param data Document data
 * @returns Document reference with auto-generated ID
 */
export async function createDocument<T>(
  db: admin.firestore.Firestore,
  collection: (db: admin.firestore.Firestore) => admin.firestore.CollectionReference<T>,
  data: Omit<T, 'id'>
): Promise<admin.firestore.DocumentReference<T>> {
  const ref = collection(db).doc();
  await ref.set(data as T);
  return ref;
}

/**
 * Get a document by ID
 *
 * @param db Firestore instance
 * @param collection Collection reference factory
 * @param docId Document ID
 * @returns Document data or null if not found
 */
export async function getDocument<T>(
  db: admin.firestore.Firestore,
  collection: (db: admin.firestore.Firestore) => admin.firestore.CollectionReference<T>,
  docId: string
): Promise<T | null> {
  const doc = await collection(db).doc(docId).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() } as T;
}

/**
 * Update a document by ID
 *
 * @param db Firestore instance
 * @param collection Collection reference factory
 * @param docId Document ID
 * @param updates Partial data to update
 */
export async function updateDocument<T>(
  db: admin.firestore.Firestore,
  collection: (db: admin.firestore.Firestore) => admin.firestore.CollectionReference<T>,
  docId: string,
  updates: Partial<T>
): Promise<void> {
  await collection(db).doc(docId).update(updates);
}

/**
 * Delete a document by ID
 *
 * @param db Firestore instance
 * @param collection Collection reference factory
 * @param docId Document ID
 */
export async function deleteDocument<T>(
  db: admin.firestore.Firestore,
  collection: (db: admin.firestore.Firestore) => admin.firestore.CollectionReference<T>,
  docId: string
): Promise<void> {
  await collection(db).doc(docId).delete();
}

// ============================================================================
// Helper Functions: Queries
// ============================================================================

/**
 * Query documents by a single field
 *
 * @param db Firestore instance
 * @param collection Collection reference factory
 * @param fieldPath Field to query
 * @param operator Query operator (==, <, <=, >, >=, !=, array-contains, in)
 * @param value Value to compare
 * @returns Array of matching documents
 */
export async function queryDocuments<T>(
  db: admin.firestore.Firestore,
  collection: (db: admin.firestore.Firestore) => admin.firestore.CollectionReference<T>,
  fieldPath: string,
  operator: admin.firestore.WhereFilterOp,
  value: any
): Promise<T[]> {
  const snapshot = await collection(db)
    .where(fieldPath, operator, value)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
}

/**
 * Query documents by donor ID with pagination
 *
 * Used for fetching donor-specific records (donations, observations, findings, etc.)
 *
 * @param db Firestore instance
 * @param collection Collection reference factory
 * @param donorId Donor document ID
 * @param orderByField Field to order by (default: createdAt)
 * @param orderDirection Sort direction (default: descending)
 * @param limit Maximum documents to fetch (default: 50)
 * @param startAfter Cursor for pagination
 * @returns Array of matching documents
 */
export async function queryByDonor<T extends { donorId: string }>(
  db: admin.firestore.Firestore,
  collection: (db: admin.firestore.Firestore) => admin.firestore.CollectionReference<T>,
  donorId: string,
  options?: {
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    limit?: number;
    startAfter?: admin.firestore.DocumentSnapshot<T>;
  }
): Promise<T[]> {
  const {
    orderByField = 'createdAt',
    orderDirection = 'desc',
    limit = 50,
    startAfter,
  } = options || {};

  let query: admin.firestore.Query<T> = collection(db).where(
    'donorId',
    '==',
    donorId
  );

  query = query.orderBy(orderByField, orderDirection);

  if (startAfter) {
    query = query.startAfter(startAfter);
  }

  query = query.limit(limit);

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
}

/**
 * Get paginated results with cursor
 *
 * Returns data plus last document for cursor-based pagination.
 *
 * @param db Firestore instance
 * @param collection Collection reference factory
 * @param donorId Donor document ID
 * @param cursor Pagination cursor (last document from previous query)
 * @param pageSize Number of documents per page
 * @returns Object with documents array and cursor for next page
 */
export async function getPaginatedDonorRecords<
  T extends { donorId: string }
>(
  db: admin.firestore.Firestore,
  collection: (db: admin.firestore.Firestore) => admin.firestore.CollectionReference<T>,
  donorId: string,
  cursor?: admin.firestore.DocumentSnapshot<T>,
  pageSize: number = 25
): Promise<{ documents: T[]; nextCursor?: admin.firestore.DocumentSnapshot<T> }> {
  const documents = await queryByDonor<T>(db, collection, donorId, {
    limit: pageSize + 1,
    startAfter: cursor,
  });

  // If we got more than pageSize docs, use the last one as next cursor
  const hasMore = documents.length > pageSize;
  const returnDocs = hasMore ? documents.slice(0, pageSize) : documents;

  // Get the actual DocumentSnapshot for the cursor
  let nextCursor: admin.firestore.DocumentSnapshot<T> | undefined;
  if (hasMore && returnDocs.length > 0) {
    const lastDoc = returnDocs[returnDocs.length - 1];
    nextCursor = await collection(db).doc(lastDoc.id).get() as admin.firestore.DocumentSnapshot<T>;
  }

  return { documents: returnDocs, nextCursor };
}

// ============================================================================
// Helper Functions: Aggregations
// ============================================================================

/**
 * Count documents matching a query
 *
 * @param db Firestore instance
 * @param collection Collection reference factory
 * @param fieldPath Field to query
 * @param operator Query operator
 * @param value Value to compare
 * @returns Count of matching documents
 */
export async function countDocuments<T>(
  db: admin.firestore.Firestore,
  collection: (db: admin.firestore.Firestore) => admin.firestore.CollectionReference<T>,
  fieldPath: string,
  operator: admin.firestore.WhereFilterOp,
  value: any
): Promise<number> {
  const snapshot = await collection(db)
    .where(fieldPath, operator, value)
    .count()
    .get();
  return snapshot.data().count;
}

/**
 * Get distinct values for a field
 *
 * Useful for analytics and filtering UI dropdowns
 *
 * @param db Firestore instance
 * @param collection Collection reference factory
 * @param fieldPath Field to get distinct values from
 * @param limit Maximum distinct values to return
 * @returns Array of distinct field values
 */
export async function getDistinctValues<T>(
  db: admin.firestore.Firestore,
  collection: (db: admin.firestore.Firestore) => admin.firestore.CollectionReference<T>,
  fieldPath: string,
  limit: number = 100
): Promise<any[]> {
  const snapshot = await collection(db)
    .select(fieldPath)
    .limit(limit)
    .get();

  const distinctValues = new Set<any>();
  snapshot.docs.forEach((doc) => {
    const value = (doc.data() as any)[fieldPath];
    if (value !== undefined && value !== null) {
      distinctValues.add(value);
    }
  });

  return Array.from(distinctValues);
}

// ============================================================================
// Helper Functions: Batch Operations
// ============================================================================

/**
 * Batch write multiple documents
 *
 * Firestore batch writes are limited to 500 operations per batch.
 * This function automatically chunks large operations.
 *
 * @param db Firestore instance
 * @param operations Array of operations: { type: 'set'|'update'|'delete', ref, data? }
 */
export async function batchWrite<T>(
  db: admin.firestore.Firestore,
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    ref: admin.firestore.DocumentReference<T>;
    data?: Partial<T>;
  }>
): Promise<void> {
  const BATCH_SIZE = 500;
  const batches = Math.ceil(operations.length / BATCH_SIZE);

  for (let i = 0; i < batches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min((i + 1) * BATCH_SIZE, operations.length);
    const batchOps = operations.slice(start, end);

    const batch = db.batch();
    for (const op of batchOps) {
      if (op.type === 'set') {
        batch.set(op.ref, op.data as T);
      } else if (op.type === 'update') {
        batch.update(op.ref, op.data as Partial<T>);
      } else if (op.type === 'delete') {
        batch.delete(op.ref);
      }
    }
    await batch.commit();
  }
}

// ============================================================================
// Helper Functions: Transactions
// ============================================================================

/**
 * Perform a transaction
 *
 * Transactions ensure ACID properties for multi-document operations.
 * Used for operations that must be atomic (e.g., creating care plan + updating finding).
 *
 * @param db Firestore instance
 * @param updateFunction Transaction function
 * @returns Result of transaction function
 */
export async function runTransaction<R>(
  db: admin.firestore.Firestore,
  updateFunction: (
    transaction: admin.firestore.Transaction
  ) => Promise<R>
): Promise<R> {
  return db.runTransaction(updateFunction);
}

// ============================================================================
// Specialized Query Helpers
// ============================================================================

/**
 * Get donor's donation timeline (most recent first)
 *
 * @param db Firestore instance
 * @param donorId Donor document ID
 * @param limit Maximum donations to fetch
 * @returns Array of donations sorted by date descending
 */
export async function getDonorDonationTimeline(
  db: admin.firestore.Firestore,
  donorId: string,
  limit: number = 10
): Promise<Donation[]> {
  const snapshot = await collections
    .donations(db)
    .where('donorId', '==', donorId)
    .orderBy('performedAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get donor's active findings
 *
 * @param db Firestore instance
 * @param donorId Donor document ID
 * @returns Array of active findings
 */
export async function getDonorActiveFindings(
  db: admin.firestore.Firestore,
  donorId: string
): Promise<Finding[]> {
  const snapshot = await collections
    .findings(db)
    .where('donorId', '==', donorId)
    .where('status', '==', 'active')
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get all care plans for a donor with specific status
 *
 * @param db Firestore instance
 * @param donorId Donor document ID
 * @param status Filter by status (optional)
 * @returns Array of care plans
 */
export async function getDonorCarePlans(
  db: admin.firestore.Firestore,
  donorId: string,
  status?: CarePlan['status']
): Promise<CarePlan[]> {
  let query = collections.carePlans(db).where('donorId', '==', donorId);

  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get donor's upcoming appointments
 *
 * @param db Firestore instance
 * @param donorId Donor document ID
 * @returns Array of scheduled/confirmed appointments sorted by date
 */
export async function getDonorUpcomingAppointments(
  db: admin.firestore.Firestore,
  donorId: string
): Promise<Appointment[]> {
  const now = new Date().toISOString();

  const snapshot = await collections
    .appointments(db)
    .where('donorId', '==', donorId)
    .where('startTime', '>=', now)
    .where('status', 'in', ['scheduled', 'confirmed'])
    .orderBy('startTime', 'asc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get counsellor queue with active items
 *
 * @param db Firestore instance
 * @param urgency Optional filter by urgency level
 * @returns Array of queue items sorted by urgency
 */
export async function getCounsellorQueueItems(
  db: admin.firestore.Firestore,
  urgency?: CounsellorQueue['urgency']
): Promise<CounsellorQueue[]> {
  let query = collections
    .counsellorQueue(db)
    .where('status', 'in', ['pending', 'assigned', 'in_progress']);

  if (urgency) {
    query = query.where('urgency', '==', urgency);
  }

  const snapshot = await query
    .orderBy('urgency', 'desc')
    .orderBy('createdAt', 'asc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get protocol by name
 *
 * @param db Firestore instance
 * @param protocolName Protocol name (e.g., 'BP-G1')
 * @returns Protocol document or null if not found
 */
export async function getProtocol(
  db: admin.firestore.Firestore,
  protocolName: string
): Promise<Protocol | null> {
  const doc = await collections.protocols(db).doc(protocolName).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...doc.data() };
}

/**
 * Get templates for a language + category combination
 *
 * @param db Firestore instance
 * @param language ISO 639-1 language code
 * @param findingCategory Finding category or 'appointment_reminder'
 * @returns Array of templates
 */
export async function getTemplates(
  db: admin.firestore.Firestore,
  language: string,
  findingCategory: string
): Promise<Template[]> {
  const snapshot = await collections
    .templates(db)
    .where('language', '==', language)
    .where('findingCategory', '==', findingCategory)
    .where('isActive', '==', true)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// ============================================================================
// Export Types
// ============================================================================

export type {
  Donor,
  Donation,
  Observation,
  Finding,
  CarePlan,
  Appointment,
  Communication,
  Outcome,
  CounsellorQueue,
  Template,
  Protocol,
};
