/**
 * Booking API Routes - Phase 4
 * Handles care partner searches, appointment booking, and management
 *
 * @file backend/src/routes/booking.ts
 * @author Claude
 */

import { Router, Request, Response } from 'express';
import BookingService from '../services/bookingService';

const router = Router();
const bookingService = new BookingService();

/**
 * POST /api/bookings/search
 * Search for available care partners
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { condition, location, date, preferredTime, maxDistance } = req.body;

    if (!condition || !location) {
      return res.status(400).json({
        error: 'Missing required fields: condition, location',
      });
    }

    const partners = await bookingService.searchCarePartners(
      location,
      condition
    );

    res.json({
      success: true,
      count: partners.length,
      partners,
    });
  } catch (error: any) {
    console.error('Error in /search:', error);
    res.status(500).json({
      error: error.message || 'Failed to search care partners',
    });
  }
});

/**
 * POST /api/bookings/slots
 * Get available appointment slots for a care partner
 */
router.post('/slots', async (req: Request, res: Response) => {
  try {
    const { carePartnerId, startDate, endDate } = req.body;

    if (!carePartnerId || !startDate) {
      return res.status(400).json({
        error: 'Missing required fields: carePartnerId, startDate',
      });
    }

    const slots = await bookingService.getAvailableSlots(
      carePartnerId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      count: slots.length,
      slots,
    });
  } catch (error: any) {
    console.error('Error in /slots:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch slots',
    });
  }
});

/**
 * POST /api/bookings/create
 * Book an appointment
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { donorId, carePartnerId, slotId, condition } = req.body;

    if (!donorId || !carePartnerId || !slotId || !condition) {
      return res.status(400).json({
        error: 'Missing required fields: donorId, carePartnerId, slotId, condition',
      });
    }

    const appointment = await bookingService.bookAppointment(
      donorId,
      carePartnerId,
      slotId,
      condition
    );

    res.json({
      success: true,
      appointment,
    });
  } catch (error: any) {
    console.error('Error in /create:', error);
    res.status(500).json({
      error: error.message || 'Failed to book appointment',
    });
  }
});

/**
 * PUT /api/bookings/:appointmentId/confirm
 * Confirm an appointment
 */
router.put('/:appointmentId/confirm', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await bookingService.confirmAppointment(appointmentId);

    res.json({
      success: true,
      appointment,
    });
  } catch (error: any) {
    console.error('Error in /confirm:', error);
    res.status(500).json({
      error: error.message || 'Failed to confirm appointment',
    });
  }
});

/**
 * PUT /api/bookings/:appointmentId/reschedule
 * Reschedule an appointment
 */
router.put('/:appointmentId/reschedule', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { newSlotId } = req.body;

    if (!newSlotId) {
      return res.status(400).json({
        error: 'Missing required field: newSlotId',
      });
    }

    const appointment = await bookingService.rescheduleAppointment(
      appointmentId,
      newSlotId
    );

    res.json({
      success: true,
      appointment,
    });
  } catch (error: any) {
    console.error('Error in /reschedule:', error);
    res.status(500).json({
      error: error.message || 'Failed to reschedule appointment',
    });
  }
});

/**
 * DELETE /api/bookings/:appointmentId/cancel
 * Cancel an appointment
 */
router.delete('/:appointmentId/cancel', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;

    await bookingService.cancelAppointment(appointmentId);

    res.json({
      success: true,
      message: 'Appointment cancelled',
    });
  } catch (error: any) {
    console.error('Error in /cancel:', error);
    res.status(500).json({
      error: error.message || 'Failed to cancel appointment',
    });
  }
});

/**
 * GET /api/bookings/my-appointments/:donorId
 * Get all appointments for a donor
 */
router.get('/my-appointments/:donorId', async (req: Request, res: Response) => {
  try {
    const { donorId } = req.params;

    // In production, verify donorId matches authenticated user
    const db = require('firebase-admin').firestore();
    const query = db
      .collection('appointments')
      .where('donorId', '==', donorId)
      .orderBy('appointmentDate', 'desc');

    const snapshot = await query.get();
    const appointments: any[] = [];

    snapshot.forEach((doc: any) => {
      appointments.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error: any) {
    console.error('Error in /my-appointments:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch appointments',
    });
  }
});

export default router;
