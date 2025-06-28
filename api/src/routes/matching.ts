import { Router, Request, Response } from 'express';
import * as matchingService from '../services/matching';
import type { MatchingParams } from '../types/matching';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/matches/candidates
 * 
 * Two-phase matching algorithm:
 * Phase 1: Search using find_mutual_skill_candidates RPC
 * Phase 2: Rerank using behavioral and preference features
 */
router.get('/candidates', requireAuth, async (req: Request, res: Response) => {
  try {
    const { viewer_id, limit = 30 } = req.query;

    if (!viewer_id || typeof viewer_id !== 'string') {
      return res.status(400).json({ 
        error: 'viewer_id is required and must be a valid UUID' 
      });
    }

    const params: MatchingParams = {
      viewerId: viewer_id,
      limit: Number(limit)
    };

    const result = await matchingService.findMatches(params);

    if (result.total === 0) {
      return res.json({ 
        ...result,
        message: 'No mutual skill matches found' 
      });
    }

    res.json(result);

  } catch (error) {
    console.error('Error in matching candidates:', error);
    res.status(500).json({ 
      error: 'Internal server error during candidate matching' 
    });
  }
});

/**
 * POST /api/matches/swipe
 * 
 * Record a swipe action in the swipe_history table
 */
router.post('/swipe', requireAuth, async (req: Request, res: Response) => {
  try {
    const { viewer_id, candidate_id, action } = req.body;

    if (!viewer_id || !candidate_id || !action) {
      return res.status(400).json({ 
        error: 'viewer_id, candidate_id, and action are required' 
      });
    }

    if (!['declined', 'offered'].includes(action)) {
      return res.status(400).json({ 
        error: 'action must be either "declined" or "offered"' 
      });
    }

    await matchingService.recordSwipe(viewer_id, candidate_id, action);

    res.json({ success: true, message: 'Swipe recorded successfully' });

  } catch (error) {
    console.error('Error recording swipe:', error);
    res.status(500).json({ 
      error: 'Internal server error while recording swipe' 
    });
  }
});

/**
 * GET /api/matches/candidates/:candidate_id/details
 * 
 * Get detailed information about a specific candidate match
 */
router.get('/candidates/:candidate_id/details', requireAuth, async (req: Request, res: Response) => {
  try {
    const { candidate_id } = req.params;
    const { viewer_id } = req.query;

    if (!viewer_id || typeof viewer_id !== 'string') {
      return res.status(400).json({ 
        error: 'viewer_id is required and must be a valid UUID' 
      });
    }

    const candidateDetails = await matchingService.getCandidateDetails(candidate_id, viewer_id);
    res.json(candidateDetails);

  } catch (error) {
    console.error('Error fetching candidate details:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 