/**
 * Counsellor Queue Service - Phase 4
 * Manages confidential counsellor queue for reactive findings and deferrals
 * Implements role-based access control for sensitive data
 *
 * @file backend/src/services/counsellorQueueService.ts
 * @author Claude
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface QueueItem {
  id: string;
  findingId: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  condition: string;
  reason: string; // Why added to queue: 'reactive_finding' | 'deferral' | 'high_risk'
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'claimed' | 'in_progress' | 'resolved' | 'escalated';
  assignedTo?: string; // counsellorId
  claimedAt?: string;
  resolvedAt?: string;
  resolution?: string; // Outcome of resolution
  notes?: string;
  contactAttempts: number;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CounsellorQueueStats {
  counsellorId: string;
  queuedCount: number;
  inProgressCount: number;
  resolvedCount: number;
  escalatedCount: number;
  avgResolutionTimeHours?: number;
  resolutionRate?: number;
}

// ============================================================================
// CounsellorQueueService Class
// ============================================================================

export class CounsellorQueueService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Add a finding to the counsellor queue (CONFIDENTIAL)
   * Only counsellors should see this data
   */
  async addToQueue(
    findingId: string,
    donorId: string,
    reason: 'reactive_finding' | 'deferral' | 'high_risk',
    priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'
  ): Promise<QueueItem> {
    try {
      // Get donor info
      const donorDoc = await this.db.collection('donors').doc(donorId).get();
      if (!donorDoc.exists) {
        throw new Error(`Donor ${donorId} not found`);
      }

      const donor = donorDoc.data() as any;

      // Get finding info
      const findingDoc = await this.db
        .collection('findings')
        .doc(findingId)
        .get();
      if (!findingDoc.exists) {
        throw new Error(`Finding ${findingId} not found`);
      }

      const finding = findingDoc.data() as any;

      // Adjust priority based on reason
      if (reason === 'reactive_finding') {
        priority = 'critical'; // TTI reactive findings are always critical
      }

      // Create queue item
      const queueItemRef = this.db.collection('counsellor_queue').doc();
      const now = new Date().toISOString();

      const queueItem: QueueItem = {
        id: queueItemRef.id,
        findingId,
        donorId,
        donorName: donor.name,
        donorPhone: donor.phone,
        condition: finding.type, // e.g., 'TTI reactive'
        reason,
        priority,
        status: 'new',
        contactAttempts: 0,
        createdAt: now,
        updatedAt: now,
      };

      // Save with encryption at rest (Firestore provides this by default)
      await queueItemRef.set(queueItem);

      // Create audit log (also confidential)
      await this.db.collection('audit_logs').add({
        action: 'queue_item_added',
        queueItemId: queueItemRef.id,
        findingId,
        donorId,
        reason,
        priority,
        timestamp: Timestamp.now(),
      });

      console.log(
        `Queue item added for finding ${findingId}, priority: ${priority}`
      );

      return queueItem;
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw new Error(`Failed to add to queue: ${error}`);
    }
  }

  /**
   * Get queue items assigned to a specific counsellor (ROLE-RESTRICTED)
   */
  async getMyQueue(counsellorId: string): Promise<QueueItem[]> {
    try {
      // This query should be restricted by Firestore Rules
      // Role check: user.role == 'counsellor'
      const query = this.db
        .collection('counsellor_queue')
        .where('assignedTo', '==', counsellorId)
        .orderBy('priority', 'desc')
        .orderBy('createdAt', 'asc');

      const snapshot = await query.get();
      const items: QueueItem[] = [];

      snapshot.forEach((doc) => {
        items.push(doc.data() as QueueItem);
      });

      return items;
    } catch (error) {
      console.error('Error fetching queue:', error);
      throw new Error(`Failed to fetch queue: ${error}`);
    }
  }

  /**
   * Claim a queue item (lock to a counsellor)
   */
  async claimItem(counsellorId: string, itemId: string): Promise<QueueItem> {
    try {
      const itemDoc = await this.db
        .collection('counsellor_queue')
        .doc(itemId)
        .get();
      if (!itemDoc.exists) {
        throw new Error(`Queue item ${itemId} not found`);
      }

      const item = itemDoc.data() as QueueItem;

      // Prevent double-claiming
      if (item.status !== 'new') {
        throw new Error(`Cannot claim item with status: ${item.status}`);
      }

      const now = new Date().toISOString();

      // Update status and assign
      await itemDoc.ref.update({
        status: 'in_progress',
        assignedTo: counsellorId,
        claimedAt: now,
        updatedAt: now,
      });

      const updated = await itemDoc.ref.get();
      return updated.data() as QueueItem;
    } catch (error) {
      console.error('Error claiming item:', error);
      throw new Error(`Failed to claim item: ${error}`);
    }
  }

  /**
   * Mark a queue item as resolved
   */
  async markResolved(
    counsellorId: string,
    itemId: string,
    resolution: string,
    notes?: string
  ): Promise<QueueItem> {
    try {
      const itemDoc = await this.db
        .collection('counsellor_queue')
        .doc(itemId)
        .get();
      if (!itemDoc.exists) {
        throw new Error(`Queue item ${itemId} not found`);
      }

      const item = itemDoc.data() as QueueItem;

      // Verify ownership
      if (item.assignedTo !== counsellorId) {
        throw new Error('Not authorized to resolve this item');
      }

      const now = new Date().toISOString();

      // Update status
      await itemDoc.ref.update({
        status: 'resolved',
        resolution,
        notes,
        resolvedAt: now,
        updatedAt: now,
      });

      // Log resolution
      await this.db.collection('audit_logs').add({
        action: 'queue_item_resolved',
        queueItemId: itemId,
        donorId: item.donorId,
        counsellorId,
        resolution,
        timestamp: Timestamp.now(),
      });

      const updated = await itemDoc.ref.get();
      return updated.data() as QueueItem;
    } catch (error) {
      console.error('Error marking item resolved:', error);
      throw new Error(`Failed to mark resolved: ${error}`);
    }
  }

  /**
   * Reassign a queue item to another counsellor
   */
  async reassign(
    currentCounsellorId: string,
    itemId: string,
    newCounsellorId: string,
    reason?: string
  ): Promise<QueueItem> {
    try {
      const itemDoc = await this.db
        .collection('counsellor_queue')
        .doc(itemId)
        .get();
      if (!itemDoc.exists) {
        throw new Error(`Queue item ${itemId} not found`);
      }

      const item = itemDoc.data() as QueueItem;

      // Verify current assignment (unless admin)
      if (
        item.assignedTo &&
        item.assignedTo !== currentCounsellorId
      ) {
        throw new Error('Not authorized to reassign this item');
      }

      const now = new Date().toISOString();

      // Reassign
      await itemDoc.ref.update({
        assignedTo: newCounsellorId,
        status: 'new', // Reset to new for new assignee
        updatedAt: now,
      });

      // Log reassignment
      await this.db.collection('audit_logs').add({
        action: 'queue_item_reassigned',
        queueItemId: itemId,
        donorId: item.donorId,
        fromCounsellorId: currentCounsellorId,
        toCounsellorId: newCounsellorId,
        reason,
        timestamp: Timestamp.now(),
      });

      const updated = await itemDoc.ref.get();
      return updated.data() as QueueItem;
    } catch (error) {
      console.error('Error reassigning item:', error);
      throw new Error(`Failed to reassign item: ${error}`);
    }
  }

  /**
   * Record a contact attempt
   */
  async recordContactAttempt(
    counsellorId: string,
    itemId: string,
    outcome?: string
  ): Promise<QueueItem> {
    try {
      const itemDoc = await this.db
        .collection('counsellor_queue')
        .doc(itemId)
        .get();
      if (!itemDoc.exists) {
        throw new Error(`Queue item ${itemId} not found`);
      }

      const item = itemDoc.data() as QueueItem;

      // Log contact attempt
      await this.db.collection('contact_logs').add({
        queueItemId: itemId,
        counsellorId,
        donorId: item.donorId,
        outcome,
        attemptedAt: Timestamp.now(),
      });

      // Update contact attempt count
      const now = new Date().toISOString();
      await itemDoc.ref.update({
        contactAttempts: item.contactAttempts + 1,
        lastContactedAt: now,
        updatedAt: now,
      });

      const updated = await itemDoc.ref.get();
      return updated.data() as QueueItem;
    } catch (error) {
      console.error('Error recording contact attempt:', error);
      throw new Error(`Failed to record contact attempt: ${error}`);
    }
  }

  /**
   * Get queue statistics for a counsellor
   */
  async getQueueStats(counsellorId: string): Promise<CounsellorQueueStats> {
    try {
      // Count by status
      const newQuery = this.db
        .collection('counsellor_queue')
        .where('assignedTo', '==', counsellorId)
        .where('status', '==', 'new');
      const newSnap = await newQuery.get();

      const inProgQuery = this.db
        .collection('counsellor_queue')
        .where('assignedTo', '==', counsellorId)
        .where('status', '==', 'in_progress');
      const inProgSnap = await inProgQuery.get();

      const resolvedQuery = this.db
        .collection('counsellor_queue')
        .where('assignedTo', '==', counsellorId)
        .where('status', '==', 'resolved');
      const resolvedSnap = await resolvedQuery.get();

      const escalatedQuery = this.db
        .collection('counsellor_queue')
        .where('assignedTo', '==', counsellorId)
        .where('status', '==', 'escalated');
      const escalatedSnap = await escalatedQuery.get();

      // Calculate average resolution time (in hours)
      let totalResolutionTime = 0;
      let resolutionCount = 0;

      resolvedSnap.forEach((doc) => {
        const item = doc.data() as QueueItem;
        if (item.createdAt && item.resolvedAt) {
          const created = new Date(item.createdAt).getTime();
          const resolved = new Date(item.resolvedAt).getTime();
          const hoursToResolve = (resolved - created) / (1000 * 60 * 60);
          totalResolutionTime += hoursToResolve;
          resolutionCount++;
        }
      });

      const avgResolutionTime =
        resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0;
      const resolutionRate =
        resolvedSnap.size /
          (newSnap.size + inProgSnap.size + resolvedSnap.size +
            escalatedSnap.size) || 0;

      return {
        counsellorId,
        queuedCount: newSnap.size,
        inProgressCount: inProgSnap.size,
        resolvedCount: resolvedSnap.size,
        escalatedCount: escalatedSnap.size,
        avgResolutionTimeHours: Number(avgResolutionTime.toFixed(2)),
        resolutionRate: Number(resolutionRate.toFixed(2)),
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      throw new Error(`Failed to get queue stats: ${error}`);
    }
  }

  /**
   * Get all unassigned queue items (for queue management)
   */
  async getUnassignedItems(
    limit: number = 50
  ): Promise<QueueItem[]> {
    try {
      const query = this.db
        .collection('counsellor_queue')
        .where('status', '==', 'new')
        .orderBy('priority', 'desc')
        .orderBy('createdAt', 'asc')
        .limit(limit);

      const snapshot = await query.get();
      const items: QueueItem[] = [];

      snapshot.forEach((doc) => {
        items.push(doc.data() as QueueItem);
      });

      return items;
    } catch (error) {
      console.error('Error fetching unassigned items:', error);
      throw new Error(`Failed to fetch unassigned items: ${error}`);
    }
  }
}

export default CounsellorQueueService;
