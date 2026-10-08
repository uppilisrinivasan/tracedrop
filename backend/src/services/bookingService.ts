/**
 * Care Booking Service - Phase 4
 * Manages integration with care partners (AAM, hospitals, labs)
 * Handles appointment scheduling, confirmations, and rescheduling
 *
 * @file backend/src/services/bookingService.ts
 * @author Claude
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface CarePartner {
  id: string;
  name: string;
  location: {
    city: string;
    state: string;
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  rating: number; // 1-5 stars
  specialties: string[]; // cardiology, hematology, etc.
  availableHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
    daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
  };
  walkInAvailable: boolean;
  appointmentRequired: boolean;
  cost?: number; // in INR, if any
  contactNumber: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Slot {
  carePartnerId: string;
  slotId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  available: boolean;
  capacity: number;
  booked: number;
}

export interface Appointment {
  id: string;
  donorId: string;
  carePartnerId: string;
  carePartnerName: string;
  slotId: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  donorName: string;
  donorPhone: string;
  condition: string; // Finding type: TTI, low Hb, etc.
  notes?: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  completedAt?: string;
}

export interface SearchFilters {
  donorLocation: {
    city: string;
    state: string;
    latitude?: number;
    longitude?: number;
  };
  condition: string;
  date?: string; // YYYY-MM-DD
  preferredTime?: string; // "morning" | "afternoon" | "evening"
  maxDistance?: number; // km
}

// ============================================================================
// BookingService Class
// ============================================================================

export class BookingService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Search for available care partners based on location, condition, and preferences
   */
  async searchCarePartners(
    donorLocation: { city: string; state: string },
    condition: string,
    maxResults: number = 10
  ): Promise<CarePartner[]> {
    try {
      // Query care partners in the same city/state
      let query: FirebaseFirestore.Query = this.db
        .collection('care_partners')
        .where('location.city', '==', donorLocation.city)
        .where('location.state', '==', donorLocation.state);

      // Filter by specialty relevant to condition
      const relevantSpecialties = this.getSpecialtiesForCondition(condition);
      if (relevantSpecialties.length > 0) {
        query = query.where(
          'specialties',
          'array-contains-any',
          relevantSpecialties
        );
      }

      const snapshot = await query.limit(maxResults).get();
      const partners: CarePartner[] = [];

      snapshot.forEach((doc) => {
        partners.push({
          id: doc.id,
          ...doc.data(),
        } as CarePartner);
      });

      // Sort by rating (highest first)
      partners.sort((a, b) => b.rating - a.rating);
      return partners;
    } catch (error) {
      console.error('Error searching care partners:', error);
      throw new Error(`Failed to search care partners: ${error}`);
    }
  }

  /**
   * Get available appointment slots for a care partner
   */
  async getAvailableSlots(
    carePartnerId: string,
    startDate: string, // YYYY-MM-DD
    endDate?: string   // YYYY-MM-DD
  ): Promise<Slot[]> {
    try {
      const end = endDate || startDate;
      const query = this.db
        .collection('appointment_slots')
        .where('carePartnerId', '==', carePartnerId)
        .where('date', '>=', startDate)
        .where('date', '<=', end)
        .where('available', '==', true);

      const snapshot = await query.get();
      const slots: Slot[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.booked < data.capacity) {
          slots.push({
            carePartnerId: data.carePartnerId,
            slotId: doc.id,
            date: data.date,
            time: data.time,
            available: data.available,
            capacity: data.capacity,
            booked: data.booked,
          });
        }
      });

      // Sort by date and time
      slots.sort((a, b) => {
        const aDateTime = new Date(`${a.date}T${a.time}`);
        const bDateTime = new Date(`${b.date}T${b.time}`);
        return aDateTime.getTime() - bDateTime.getTime();
      });

      return slots;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw new Error(`Failed to fetch slots: ${error}`);
    }
  }

  /**
   * Book an appointment for a donor
   */
  async bookAppointment(
    donorId: string,
    carePartnerId: string,
    slotId: string,
    condition: string
  ): Promise<Appointment> {
    try {
      // Get donor info
      const donorDoc = await this.db.collection('donors').doc(donorId).get();
      if (!donorDoc.exists) {
        throw new Error(`Donor ${donorId} not found`);
      }
      const donor = donorDoc.data() as any;

      // Get care partner info
      const partnerDoc = await this.db
        .collection('care_partners')
        .doc(carePartnerId)
        .get();
      if (!partnerDoc.exists) {
        throw new Error(`Care partner ${carePartnerId} not found`);
      }
      const partner = partnerDoc.data() as any;

      // Get slot info
      const slotDoc = await this.db
        .collection('appointment_slots')
        .doc(slotId)
        .get();
      if (!slotDoc.exists) {
        throw new Error(`Slot ${slotId} not found`);
      }
      const slot = slotDoc.data() as any;

      // Check slot availability
      if (slot.booked >= slot.capacity) {
        throw new Error('Slot is full');
      }

      // Create appointment
      const appointmentRef = this.db.collection('appointments').doc();
      const now = new Date().toISOString();
      const appointment: Appointment = {
        id: appointmentRef.id,
        donorId,
        carePartnerId,
        carePartnerName: partner.name,
        slotId,
        appointmentDate: slot.date,
        appointmentTime: slot.time,
        status: 'scheduled',
        donorName: donor.name,
        donorPhone: donor.phone,
        condition,
        reminderSent: false,
        createdAt: now,
        updatedAt: now,
      };

      // Save appointment
      await appointmentRef.set(appointment);

      // Update slot booking count
      await this.db
        .collection('appointment_slots')
        .doc(slotId)
        .update({
          booked: slot.booked + 1,
        });

      // Create audit log
      await this.db.collection('audit_logs').add({
        action: 'appointment_booked',
        appointmentId: appointmentRef.id,
        donorId,
        carePartnerId,
        timestamp: Timestamp.now(),
      });

      return appointment;
    } catch (error) {
      console.error('Error booking appointment:', error);
      throw new Error(`Failed to book appointment: ${error}`);
    }
  }

  /**
   * Confirm an appointment (donor/care partner confirmation)
   */
  async confirmAppointment(appointmentId: string): Promise<Appointment> {
    try {
      const appointmentDoc = await this.db
        .collection('appointments')
        .doc(appointmentId)
        .get();
      if (!appointmentDoc.exists) {
        throw new Error(`Appointment ${appointmentId} not found`);
      }

      const now = new Date().toISOString();
      await appointmentDoc.ref.update({
        status: 'confirmed',
        confirmedAt: now,
        updatedAt: now,
      });

      const updated = await appointmentDoc.ref.get();
      return updated.data() as Appointment;
    } catch (error) {
      console.error('Error confirming appointment:', error);
      throw new Error(`Failed to confirm appointment: ${error}`);
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: string): Promise<void> {
    try {
      const appointmentDoc = await this.db
        .collection('appointments')
        .doc(appointmentId)
        .get();
      if (!appointmentDoc.exists) {
        throw new Error(`Appointment ${appointmentId} not found`);
      }

      const appointment = appointmentDoc.data() as Appointment;

      // Update appointment status
      await appointmentDoc.ref.update({
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      });

      // Free up slot
      const slotDoc = await this.db
        .collection('appointment_slots')
        .doc(appointment.slotId)
        .get();
      if (slotDoc.exists) {
        const slot = slotDoc.data() as any;
        await slotDoc.ref.update({
          booked: Math.max(0, slot.booked - 1),
        });
      }

      // Create audit log
      await this.db.collection('audit_logs').add({
        action: 'appointment_cancelled',
        appointmentId,
        donorId: appointment.donorId,
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw new Error(`Failed to cancel appointment: ${error}`);
    }
  }

  /**
   * Reschedule an appointment to a new slot
   */
  async rescheduleAppointment(
    appointmentId: string,
    newSlotId: string
  ): Promise<Appointment> {
    try {
      const appointmentDoc = await this.db
        .collection('appointments')
        .doc(appointmentId)
        .get();
      if (!appointmentDoc.exists) {
        throw new Error(`Appointment ${appointmentId} not found`);
      }

      const appointment = appointmentDoc.data() as Appointment;

      // Get new slot
      const newSlotDoc = await this.db
        .collection('appointment_slots')
        .doc(newSlotId)
        .get();
      if (!newSlotDoc.exists) {
        throw new Error(`New slot ${newSlotId} not found`);
      }
      const newSlot = newSlotDoc.data() as any;

      // Check capacity
      if (newSlot.booked >= newSlot.capacity) {
        throw new Error('New slot is full');
      }

      // Free old slot
      const oldSlotDoc = await this.db
        .collection('appointment_slots')
        .doc(appointment.slotId)
        .get();
      if (oldSlotDoc.exists) {
        const oldSlot = oldSlotDoc.data() as any;
        await oldSlotDoc.ref.update({
          booked: Math.max(0, oldSlot.booked - 1),
        });
      }

      // Book new slot
      await newSlotDoc.ref.update({
        booked: newSlot.booked + 1,
      });

      // Update appointment
      const now = new Date().toISOString();
      await appointmentDoc.ref.update({
        slotId: newSlotId,
        appointmentDate: newSlot.date,
        appointmentTime: newSlot.time,
        status: 'scheduled',
        confirmedAt: null,
        updatedAt: now,
      });

      const updated = await appointmentDoc.ref.get();
      return updated.data() as Appointment;
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw new Error(`Failed to reschedule appointment: ${error}`);
    }
  }

  /**
   * Helper: Get relevant specialties for a finding type
   */
  private getSpecialtiesForCondition(condition: string): string[] {
    const specialtyMap: Record<string, string[]> = {
      'TTI reactive': ['infectious_disease', 'hematology'],
      'low hemoglobin': ['hematology', 'internal_medicine'],
      'high cholesterol': ['cardiology', 'internal_medicine'],
      'high blood pressure': ['cardiology', 'internal_medicine'],
      'low platelet': ['hematology', 'oncology'],
      'high glucose': ['endocrinology', 'internal_medicine'],
      'liver abnormality': ['gastroenterology', 'internal_medicine'],
      'kidney abnormality': ['nephrology', 'internal_medicine'],
    };

    // Find matching condition
    for (const [key, specialties] of Object.entries(specialtyMap)) {
      if (condition.toLowerCase().includes(key.toLowerCase())) {
        return specialties;
      }
    }

    // Default: return general specialties
    return ['internal_medicine', 'general_practice'];
  }
}

export default BookingService;
