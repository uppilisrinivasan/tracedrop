/**
 * Agent API Endpoints - Route handlers for agent operations
 */

import { Router, Request, Response } from 'express';
import { NavigateRequest, GenerateMessageRequest, CreateRecordRequest } from '../types/agents';
import { authMiddleware, requireDonor } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * POST /api/agents/navigate
 * Determine next best action for a donor
 */
router.post('/navigate', requireDonor, async (req: Request, res: Response) => {
  try {
    const { donorId, findingId } = req.body as NavigateRequest;

    if (!donorId || !findingId) {
      res.status(400).json({
        success: false,
        error: 'Missing donorId or findingId',
      });
      return;
    }

    // TODO: Call NavigatorAgent
    res.json({
      success: true,
      data: {
        nextAction: 'book_visit',
        timeline: '2-4 weeks',
        message: 'Please schedule an appointment',
        alternatives: [],
        urgencyLevel: 2,
        requiresFollowUp: true,
        followUpIntervalDays: 21,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/agents/generate-message
 * Generate personalized health message
 */
router.post('/generate-message', requireDonor, async (req: Request, res: Response) => {
  try {
    const { findingId, donorId, language } = req.body as GenerateMessageRequest;

    if (!findingId || !donorId || !language) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: findingId, donorId, language',
      });
      return;
    }

    // TODO: Call MessageGeneratorAgent
    res.json({
      success: true,
      data: {
        message: 'Your health reading shows elevated values. Please consult with a healthcare provider.',
        actionRequired: 'Schedule appointment',
        timeline: '2-4 weeks',
        language,
        alternatives: ['Continue monitoring at home'],
        tone: 'supportive',
        includesEducation: true,
        recommendedChannel: 'whatsapp',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/agents/record
 * Create observation from multimodal input
 */
router.post('/record', requireDonor, async (req: Request, res: Response) => {
  try {
    const { donorId, input, type } = req.body as CreateRecordRequest;

    if (!donorId || !input || !type) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: donorId, input, type',
      });
      return;
    }

    if (!['text', 'voice', 'image'].includes(type)) {
      res.status(400).json({
        success: false,
        error: 'Invalid type. Must be text, voice, or image',
      });
      return;
    }

    // TODO: Call RecordBuilderAgent
    res.json({
      success: true,
      data: {
        observationId: `obs_${Date.now()}`,
        message: 'Record created successfully',
        urgent: false,
        extractedData: {
          BP: '120/80',
          Hb: '13.5',
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /api/agents/status
 * Get rate limiter and agent status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    // TODO: Get actual rate limiter status
    res.json({
      success: true,
      data: {
        tokensUsed: 5000,
        tokensRemaining: 95000,
        rpsUsed: 3,
        rpsRemaining: 7,
        nextReset: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        backoffActive: false,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/agents/health-check
 * Health check endpoint
 */
router.post('/health-check', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Agent system operational',
    timestamp: new Date().toISOString(),
  });
});

export default router;
