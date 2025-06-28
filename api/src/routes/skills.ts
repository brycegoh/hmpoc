import { Router, Request, Response } from 'express'
import * as skillsService from '../services/skills'
import { requireAuth } from '../middleware/auth'

const router = Router()

/**
 * GET /api/skills
 * 
 * Get all available skills
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const skills = await skillsService.getAllSkills()
    res.json({ skills })
  } catch (error) {
    console.error('Error fetching skills:', error)
    res.status(500).json({
      error: 'Internal server error during skills fetch'
    })
  }
})

export default router 