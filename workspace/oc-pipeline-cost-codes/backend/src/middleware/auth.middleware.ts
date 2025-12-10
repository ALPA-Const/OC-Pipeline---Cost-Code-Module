/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user context to requests
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAuth } from '../config/supabase';

// ============================================================================
// EXTEND EXPRESS REQUEST TYPE
// ============================================================================
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Middleware to verify JWT token and attach user to request
 * Usage: app.use(authMiddleware)
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token and get user ID
    const userId = await verifyAuth(token);

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      return;
    }

    // Attach user to request object
    req.user = { id: userId };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't block request if not
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const userId = await verifyAuth(token);
      
      if (userId) {
        req.user = { id: userId };
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if auth fails
  }
};

// ============================================================================
// ROLE-BASED MIDDLEWARE (TODO: Implement when roles are added)
// ============================================================================

/**
 * Middleware to check if user has admin role
 * TODO: Implement role checking logic
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // TODO: Implement admin role checking
  // For now, all authenticated users are considered admins
  next();
};

/**
 * Middleware to check if user has specific permission
 * TODO: Implement permission checking logic
 */
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // TODO: Implement permission checking
    next();
  };
};