/**
 * Authentication Middleware
 * Handles JWT authentication and role-based authorization
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { getTokenContext, verifyToken } from '../database/supabase.client';

// ============================================================================
// EXTEND EXPRESS REQUEST TYPE
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        org_id: string;
        email?: string;
        role?: string;
      };
    }
  }
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Require authentication for a route
 * Extracts JWT token from Authorization header and verifies it
 * Attaches user information to req.user
 * 
 * @example
 * router.get('/protected', requireAuth, handler);
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header', {
        path: req.path,
        method: req.method,
      });
      throw AppError.unauthorized('Missing or invalid authorization token');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token and get user context
    const user = await verifyToken(token);
    const { userId, orgId } = await getTokenContext(token);

    // Attach user information to request
    req.user = {
      id: userId,
      org_id: orgId,
      email: user.email,
      role: user.user_metadata?.role || user.app_metadata?.role || 'user',
    };

    logger.debug('User authenticated', {
      userId: req.user.id,
      orgId: req.user.org_id,
      role: req.user.role,
      path: req.path,
    });

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    
    logger.error('Authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
    });
    
    next(AppError.unauthorized('Authentication failed'));
  }
};

// ============================================================================
// AUTHORIZATION MIDDLEWARE
// ============================================================================

/**
 * Require specific role for a route
 * Must be used after requireAuth middleware
 * 
 * @param role - Required role (e.g., 'admin', 'manager')
 * @returns Express middleware function
 * 
 * @example
 * router.post('/admin-only', requireAuth, requireRole('admin'), handler);
 */
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        logger.error('requireRole called without authentication', {
          path: req.path,
        });
        throw AppError.unauthorized('Authentication required');
      }

      const userRole = req.user.role || 'user';

      if (userRole !== role) {
        logger.warn('Insufficient permissions', {
          userId: req.user.id,
          userRole,
          requiredRole: role,
          path: req.path,
        });
        throw AppError.forbidden(
          `This action requires ${role} role. Your role: ${userRole}`
        );
      }

      logger.debug('Role authorization passed', {
        userId: req.user.id,
        role: userRole,
        path: req.path,
      });

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      }
      
      logger.error('Authorization error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
      });
      
      next(AppError.forbidden('Authorization failed'));
    }
  };
};

/**
 * Require any of the specified roles
 * 
 * @param roles - Array of acceptable roles
 * @returns Express middleware function
 * 
 * @example
 * router.post('/managers-and-admins', requireAuth, requireAnyRole(['admin', 'manager']), handler);
 */
export const requireAnyRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required');
      }

      const userRole = req.user.role || 'user';

      if (!roles.includes(userRole)) {
        logger.warn('Insufficient permissions', {
          userId: req.user.id,
          userRole,
          requiredRoles: roles,
          path: req.path,
        });
        throw AppError.forbidden(
          `This action requires one of these roles: ${roles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      }
      next(AppError.forbidden('Authorization failed'));
    }
  };
};

/**
 * Optional authentication
 * Attaches user if token is present, but doesn't require it
 * 
 * @example
 * router.get('/public-or-private', optionalAuth, handler);
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      const user = await verifyToken(token);
      const { userId, orgId } = await getTokenContext(token);

      req.user = {
        id: userId,
        org_id: orgId,
        email: user.email,
        role: user.user_metadata?.role || user.app_metadata?.role || 'user',
      };

      logger.debug('Optional auth: User authenticated', {
        userId: req.user.id,
        path: req.path,
      });
    } catch (error) {
      // Invalid token, continue without user
      logger.debug('Optional auth: Invalid token, continuing without user', {
        path: req.path,
      });
    }

    next();
  } catch (error) {
    // On error, continue without user
    next();
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  requireAuth,
  requireRole,
  requireAnyRole,
  optionalAuth,
};