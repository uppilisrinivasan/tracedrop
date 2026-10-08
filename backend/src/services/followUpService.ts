/**
 * Follow-up Tracking Service - Phase 4
 * Tracks donor outcomes post-appointment
 * Manages follow-up scheduling and outcome recording
 *
 * @file backend/src/services/followUpService.ts
 * @author Claude
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface FollowUp {
  id: string;
  appointmentId: string;
  donorId: string;
  carePartnerId: string;
  condition: string;
  scheduledDate: string; // ISO 8601
  completedDate?: string; // ISO 8601
  status: 'pending' | 'sent' | 'completed' | 'overdue';
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Outcome {
  id: string;
  appointmentId: string;
  followUpId: string;
  donorId: string;
  condition: string;
  visited: boolean; // Did donor visit the doctor?
  diagnosis?: string; // What was the diagnosis?
  followingTreatment?: 'yes' | 'no' | 'partial'; // Following treatment?
  improvementRating?: number; // 1-5 scale
  feedback?: string; // Additional feedback
  recordedAt: string; // ISO 8601
  updatedAt: string;
  aiAssessment?: {
    confidenceScore: number;
    recommendations: string[];
  };
}

export interface FollowUpSchedule {
  followUps: FollowUp[];
  completedCount: number;
  pendingCount: number;
  overdueCount: number;
  completionRate: number;
}

// ============================================================================
// FollowUpService Class
// ============================================================================

export class FollowUpService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Schedule a follow-up for an appointment (typically 90 days post-finding)
   */
  async scheduleFollowUp(
    appointmentId: string,
    daysFromNow: number = 90
  ): Promise<FollowUp> {
    try {
      // Get appointment details
      const appointmentDoc = await this.db
        .collection('appointments')
        .doc(appointmentId)
        .get();
      if (!appointmentDoc.exists) {
        throw new Error(`Appointment ${appointmentId} not found`);
      }

      const appointment = appointmentDoc.data() as any;

      // Calculate scheduled date
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + daysFromNow);

      // Create follow-up record
      const followUpRef = this.db.collection('follow_ups').doc();
      const now = new Date().toISOString();

      const followUp: FollowUp = {
        id: followUpRef.id,
        appointmentId,
        donorId: appointment.donorId,
        carePartnerId: appointment.carePartnerId,
        condition: appointment.condition,
        scheduledDate: scheduledDate.toISOString(),
        status: 'pending',
        reminderSent: false,
        createdAt: now,
        updatedAt: now,
      };

      await followUpRef.set(followUp);

      // Log action
      await this.db.collection('audit_logs').add({
        action: 'follow_up_scheduled',
        followUpId: followUpRef.id,
        appointmentId,
        donorId: appointment.donorId,
        timestamp: Timestamp.now(),
      });

      return followUp;
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      throw new Error(`Failed to schedule follow-up: ${error}`);
    }
  }

  /**
   * Record outcome for a follow-up
   */
  async recordOutcome(
    followUpId: string,
    outcomeData: {
      visited: boolean;
      diagnosis?: string;
      followingTreatment?: 'yes' | 'no' | 'partial';
      improvementRating?: number;
      feedback?: string;
    }
  ): Promise<Outcome> {
    try {
      // Get follow-up details
      const followUpDoc = await this.db
        .collection('follow_ups')
        .doc(followUpId)
        .get();
      if (!followUpDoc.exists) {
        throw new Error(`Follow-up ${followUpId} not found`);
      }

      const followUp = followUpDoc.data() as FollowUp;

      // Validate improvement rating if provided
      if (
        outcomeData.improvementRating &&
        (outcomeData.improvementRating < 1 || outcomeData.improvementRating > 5)
      ) {
        throw new Error('Improvement rating must be between 1 and 5');
      }

      // Create outcome record
      const outcomeRef = this.db.collection('outcomes').doc();
      const now = new Date().toISOString();

      const outcome: Outcome = {
        id: outcomeRef.id,
        appointmentId: followUp.appointmentId,
        followUpId,
        donorId: followUp.donorId,
        condition: followUp.condition,
        visited: outcomeData.visited,
        diagnosis: outcomeData.diagnosis,
        followingTreatment: outcomeData.followingTreatment,
        improvementRating: outcomeData.improvementRating,
        feedback: outcomeData.feedback,
        recordedAt: now,
        updatedAt: now,
      };

      // Save outcome
      await outcomeRef.set(outcome);

      // Update follow-up status
      await followUpDoc.ref.update({
        status: 'completed',
        completedDate: now,
        updatedAt: now,
      });

      // Calculate and store AI assessment
      const assessment = this.calculateAIAssessment(
        followUp.condition,
        outcomeData
      );
      if (assessment) {
        outcome.aiAssessment = assessment;
        await outcomeRef.update({ aiAssessment: assessment });
      }

      // Update donor health status if needed
      await this.updateDonorHealthStatus(followUp.donorId, outcome);

      // Create audit log
      await this.db.collection('audit_logs').add({
        action: 'outcome_recorded',
        outcomeId: outcomeRef.id,
        followUpId,
        donorId: followUp.donorId,
        timestamp: Timestamp.now(),
      });

      return outcome;
    } catch (error) {
      console.error('Error recording outcome:', error);
      throw new Error(`Failed to record outcome: ${error}`);
    }
  }

  /**
   * Get follow-up schedule for a donor
   */
  async getFollowUpSchedule(donorId: string): Promise<FollowUpSchedule> {
    try {
      const query = this.db
        .collection('follow_ups')
        .where('donorId', '==', donorId)
        .orderBy('scheduledDate', 'desc');

      const snapshot = await query.get();
      const followUps: FollowUp[] = [];
      let completedCount = 0;
      let pendingCount = 0;
      let overdueCount = 0;

      const now = new Date();

      snapshot.forEach((doc) => {
        const followUp = doc.data() as FollowUp;
        followUps.push(followUp);

        if (followUp.status === 'completed') {
          completedCount++;
        } else if (followUp.status === 'pending') {
          const scheduledDate = new Date(followUp.scheduledDate);
          if (scheduledDate < now) {
            overdueCount++;
          } else {
            pendingCount++;
          }
        }
      });

      const total = followUps.length;
      const completionRate = total > 0 ? completedCount / total : 0;

      return {
        followUps,
        completedCount,
        pendingCount,
        overdueCount,
        completionRate,
      };
    } catch (error) {
      console.error('Error fetching follow-up schedule:', error);
      throw new Error(`Failed to fetch follow-up schedule: ${error}`);
    }
  }

  /**
   * Send follow-up reminder (typically via SMS/WhatsApp)
   */
  async sendFollowUpReminder(followUpId: string): Promise<void> {
    try {
      const followUpDoc = await this.db
        .collection('follow_ups')
        .doc(followUpId)
        .get();
      if (!followUpDoc.exists) {
        throw new Error(`Follow-up ${followUpId} not found`);
      }

      const followUp = followUpDoc.data() as FollowUp;

      // Get donor info
      const donorDoc = await this.db
        .collection('donors')
        .doc(followUp.donorId)
        .get();
      if (!donorDoc.exists) {
        throw new Error(`Donor ${followUp.donorId} not found`);
      }

      const donor = donorDoc.data() as any;

      // Create reminder message (would be sent via SMS/WhatsApp in production)
      const reminderMessage = this.createReminderMessage(followUp, donor);

      // Mark reminder as sent
      await followUpDoc.ref.update({
        reminderSent: true,
        updatedAt: new Date().toISOString(),
      });

      // Log the reminder
      await this.db.collection('reminder_logs').add({
        followUpId,
        donorId: followUp.donorId,
        message: reminderMessage,
        sentAt: Timestamp.now(),
        channel: 'sms', // or 'whatsapp'
      });

      console.log(`Reminder sent to donor ${followUp.donorId}`);
    } catch (error) {
      console.error('Error sending follow-up reminder:', error);
      throw new Error(`Failed to send reminder: ${error}`);
    }
  }

  /**
   * Calculate completion rate for a donor
   */
  async calculateCompletionRate(donorId: string): Promise<number> {
    try {
      const schedule = await this.getFollowUpSchedule(donorId);
      return schedule.completionRate;
    } catch (error) {
      console.error('Error calculating completion rate:', error);
      throw new Error(`Failed to calculate completion rate: ${error}`);
    }
  }

  /**
   * Helper: Calculate AI assessment based on outcome
   */
  private calculateAIAssessment(
    condition: string,
    outcome: {
      visited: boolean;
      diagnosis?: string;
      followingTreatment?: 'yes' | 'no' | 'partial';
      improvementRating?: number;
    }
  ): { confidenceScore: number; recommendations: string[] } | null {
    if (!outcome.visited) {
      return {
        confidenceScore: 0.9,
        recommendations: [
          'Donor did not visit doctor. Consider outreach and counseling.',
          'Assess barriers to care access.',
          'Provide additional support resources.',
        ],
      };
    }

    const recommendations: string[] = [];
    let confidence = 0.7;

    // Evaluate based on outcomes
    if (outcome.improvementRating && outcome.improvementRating >= 4) {
      recommendations.push('Excellent response to treatment. Continue care.');
      confidence = 0.95;
    } else if (outcome.improvementRating && outcome.improvementRating >= 3) {
      recommendations.push('Moderate improvement. Maintain current treatment.');
      confidence = 0.85;
    } else if (outcome.improvementRating && outcome.improvementRating < 3) {
      recommendations.push(
        'Limited improvement. May need treatment adjustment.'
      );
      recommendations.push('Consider specialist consultation.');
      confidence = 0.75;
    }

    if (outcome.followingTreatment === 'no') {
      recommendations.push('Donor not following treatment plan.');
      recommendations.push('Assess adherence barriers and adjust plan.');
      confidence = Math.max(0.5, confidence - 0.2);
    } else if (outcome.followingTreatment === 'partial') {
      recommendations.push('Partial adherence noted. Strengthen support.');
      confidence = Math.max(0.6, confidence - 0.1);
    }

    if (condition.includes('TTI')) {
      recommendations.push('Ensure infectious disease specialist follow-up.');
      recommendations.push('Verify partner notification if applicable.');
    }

    return {
      confidenceScore: Math.min(confidence, 1.0),
      recommendations,
    };
  }

  /**
   * Helper: Update donor health status based on outcome
   */
  private async updateDonorHealthStatus(
    donorId: string,
    outcome: Outcome
  ): Promise<void> {
    try {
      let healthStatus = 'monitored';

      if (!outcome.visited) {
        healthStatus = 'at_risk';
      } else if (outcome.improvementRating && outcome.improvementRating >= 4) {
        healthStatus = 'healthy';
      } else if (outcome.improvementRating && outcome.improvementRating < 3) {
        healthStatus = 'at_risk';
      }

      await this.db.collection('donors').doc(donorId).update({
        healthStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating donor health status:', error);
    }
  }

  /**
   * Helper: Create reminder message
   */
  private createReminderMessage(followUp: FollowUp, donor: any): string {
    const scheduledDate = new Date(followUp.scheduledDate);
    const dateStr = scheduledDate.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `Hi ${donor.name}, this is a reminder to complete your health follow-up for ${followUp.condition} by ${dateStr}. Please visit your doctor and update your status in the TraceDrop app. Reply with your outcome or contact our counselor for support.`;
  }
}

export default FollowUpService;
