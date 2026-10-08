/**
 * Outcomes API Routes - Phase 4
 * Handles follow-up tracking and outcome recording
 *
 * @file backend/src/routes/outcomes.ts
 * @author Claude
 */

import { Router, Request, Response } from 'express';
import FollowUpService from '../services/followUpService';
import AnalyticsService from '../services/analyticsService';

const router = Router();
const followUpService = new FollowUpService();
const analyticsService = new AnalyticsService();

/**
 * POST /api/outcomes/follow-up
 * Record a follow-up outcome
 */
router.post('/follow-up', async (req: Request, res: Response) => {
  try {
    const { followUpId, visited, diagnosis, followingTreatment, improvementRating, feedback } = req.body;

    if (!followUpId) {
      return res.status(400).json({
        error: 'Missing required field: followUpId',
      });
    }

    const outcome = await followUpService.recordOutcome(followUpId, {
      visited,
      diagnosis,
      followingTreatment,
      improvementRating,
      feedback,
    });

    res.json({
      success: true,
      outcome,
    });
  } catch (error: any) {
    console.error('Error in /follow-up:', error);
    res.status(500).json({
      error: error.message || 'Failed to record outcome',
    });
  }
});

/**
 * GET /api/outcomes/donor/:donorId
 * Get all outcomes for a donor
 */
router.get('/donor/:donorId', async (req: Request, res: Response) => {
  try {
    const { donorId } = req.params;

    const db = require('firebase-admin').firestore();
    const query = db
      .collection('outcomes')
      .where('donorId', '==', donorId)
      .orderBy('recordedAt', 'desc');

    const snapshot = await query.get();
    const outcomes: any[] = [];

    snapshot.forEach((doc: any) => {
      outcomes.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({
      success: true,
      count: outcomes.length,
      outcomes,
    });
  } catch (error: any) {
    console.error('Error in /donor/:donorId:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch outcomes',
    });
  }
});

/**
 * GET /api/outcomes/follow-ups/:donorId
 * Get follow-up schedule for a donor
 */
router.get('/follow-ups/:donorId', async (req: Request, res: Response) => {
  try {
    const { donorId } = req.params;

    const schedule = await followUpService.getFollowUpSchedule(donorId);

    res.json({
      success: true,
      schedule,
    });
  } catch (error: any) {
    console.error('Error in /follow-ups/:donorId:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch follow-up schedule',
    });
  }
});

/**
 * POST /api/outcomes/completion-rate/:donorId
 * Calculate completion rate for a donor
 */
router.get('/completion-rate/:donorId', async (req: Request, res: Response) => {
  try {
    const { donorId } = req.params;

    const completionRate = await followUpService.calculateCompletionRate(donorId);

    res.json({
      success: true,
      completionRate: Number((completionRate * 100).toFixed(2)),
      percentage: `${(completionRate * 100).toFixed(2)}%`,
    });
  } catch (error: any) {
    console.error('Error in /completion-rate/:donorId:', error);
    res.status(500).json({
      error: error.message || 'Failed to calculate completion rate',
    });
  }
});

/**
 * GET /api/analytics/funnel
 * Get complete funnel metrics
 */
router.get('/funnel', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const metrics = await analyticsService.calculateFunnelMetrics(
      startDate as string | undefined,
      endDate as string | undefined
    );

    res.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    console.error('Error in /funnel:', error);
    res.status(500).json({
      error: error.message || 'Failed to calculate funnel metrics',
    });
  }
});

/**
 * GET /api/analytics/cohort/:cohortId
 * Get cohort metrics
 */
router.get('/cohort/:cohortId', async (req: Request, res: Response) => {
  try {
    const { cohortId } = req.params;
    const { daysFromEnrollment } = req.query;

    const metrics = await analyticsService.getCohortMetrics(
      cohortId,
      daysFromEnrollment ? parseInt(daysFromEnrollment as string) : 90
    );

    res.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    console.error('Error in /cohort/:cohortId:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch cohort metrics',
    });
  }
});

export default router;
