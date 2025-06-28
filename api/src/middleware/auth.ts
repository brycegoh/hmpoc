import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserData } from '../models';
import { CONFIG } from '../constants';

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      user?: UserData;
    }
  }
}

export class AuthError extends Error {
  public statusCode: number;
  
  constructor(message: string, statusCode = 403) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export class SupabaseAuth {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = CONFIG.SUPABASE_JWT_SECRET;
    if (!this.jwtSecret) {
      throw new Error('SUPABASE_JWT_SECRET environment variable is required');
    }
  }

  private extractToken(authHeader?: string): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  private async verifyJWT(token: string): Promise<UserData | null> {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256']
      }) as any;

      const userId = payload.sub;
      if (!userId) {
        return null;
      }

      return {
        user_id: userId,
        email: payload.email,
        role: payload.role || 'authenticated',
        payload
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return null;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return null;
      }
      return null;
    }
  }

  public requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractToken(req.headers.authorization);
      
      if (!token) {
        throw new AuthError('Invalid authorization code.', 403);
      }

      const userData = await this.verifyJWT(token);
      if (!userData) {
        throw new AuthError('Invalid token or expired token.', 403);
      }

      req.user = userData;
      next();
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  public optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractToken(req.headers.authorization);
      
      if (token) {
        const userData = await this.verifyJWT(token);
        if (userData) {
          req.user = userData;
        }
      }
      
      next();
    } catch (error) {
      // For optional auth, we continue even if there's an error
      next();
    }
  };
}

// Create auth instance
const authInstance = new SupabaseAuth();

// Export middleware functions
export const requireAuth = authInstance.requireAuth;
export const optionalAuth = authInstance.optionalAuth;

// Helper function to get current user (equivalent to Python version)
export const getCurrentUser = (req: Request): UserData | undefined => {
  return req.user;
}; 