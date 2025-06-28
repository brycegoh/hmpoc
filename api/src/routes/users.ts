import { Router, Request, Response } from 'express'
import * as usersService from '../services/users'
import type { CreateUserRequest } from '../types/users'
import queueService from '../clients/queueService'
import { requireAuth } from '../middleware/auth'

const router = Router()

/**
 * POST /api/users
 * 
 * Create a new user after signup/onboarding
 * Optionally triggers LinkedIn data extraction if linkedin_url is provided
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.user_id

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      })
    }
    const userData: CreateUserRequest = req.body

    // Validate required fields
    if (!userData.first_name || !userData.last_name || !userData.birthdate || !userData.gender) {
      return res.status(400).json({
        error: 'Missing required fields: first_name, last_name, birthdate, gender are required'
      })
    }

    // Validate gender
    if (!['M', 'F', 'O'].includes(userData.gender)) {
      return res.status(400).json({
        error: 'Invalid gender: must be M, F, or O'
      })
    }

    // Validate birthdate format (basic validation)
    const birthdateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!birthdateRegex.test(userData.birthdate)) {
      return res.status(400).json({
        error: 'Invalid birthdate format: must be YYYY-MM-DD'
      })
    }

    // Validate birthdate is not in the future
    const birthdate = new Date(userData.birthdate)
    if (birthdate > new Date()) {
      return res.status(400).json({
        error: 'Birthdate cannot be in the future'
      })
    }

    // Validate age (must be at least 13 years old)
    const minAge = 13
    const minBirthdate = new Date()
    minBirthdate.setFullYear(minBirthdate.getFullYear() - minAge)
    if (birthdate > minBirthdate) {
      return res.status(400).json({
        error: `User must be at least ${minAge} years old`
      })
    }

    const result = await usersService.createUser(userId, userData)

    // Create a row in the linkedin_data table if LinkedIn URL is provided
    if (userData.linkedin_url) {
      const linkedinDataResult = await usersService.createLinkedInDataRecord(
        result.user.id, 
        userData.linkedin_url
      )

      // Enqueue the task with the linkedin_data row id
      queueService.addJob('get-linkedin-data', {
        linkedin_data_id: linkedinDataResult.id
      })
    }

    res.status(201).json(result)

  } catch (error) {
    console.error('Error creating user:', error)
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(409).json({
        error: 'User with this information already exists'
      })
    }

    res.status(500).json({
      error: 'Internal server error during user creation'
    })
  }
})

/**
 * GET /api/users/me
 * 
 * Get current user profile with onboarding status
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    // Extract user ID from authenticated request
    const userId = req.user?.user_id

    console.log('userId', userId)
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      })
    }

    const userProfile = await usersService.getUserProfile(userId)

    res.json({ user: userProfile })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({
      error: 'Internal server error during user profile fetch'
    })
  }
})

/**
 * GET /api/users/:id
 * 
 * Get user by ID
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const user = await usersService.getUserById(id)

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    res.json({ user })

  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({
      error: 'Internal server error during user fetch'
    })
  }
})

export default router 