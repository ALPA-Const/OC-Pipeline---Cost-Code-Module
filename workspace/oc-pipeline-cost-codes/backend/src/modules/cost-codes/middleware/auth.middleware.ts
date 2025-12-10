/**
 * Authentication Middleware for Cost Code Module
 * Handles JWT authentication and role-based authorization
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AppError } from '../../../shared/errors/AppError';
import { logger } from '../../../shared/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

type UserRole = 'admin' | 'owner' | 'manager' | 'estimator' | 'field_crew';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        org_id: string;
        role: UserRole;
        email: string;
      };
    }
  }
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Require authentication for a route
 * Extracts JWT token from Authorization header and verifies it with Supabase
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
        ip: req.ip,
      });
      throw AppError.unauthorized('Missing or invalid authorization token');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Invalid or expired token', {
        path: req.path,
        method: req.method,
        error: error?.message,
      });
      throw AppError.unauthorized('Invalid or expired token');
    }

    // Extract organization ID from user metadata
    const orgId = user.user_metadata?.org_id || user.app_metadata?.org_id;
    
    if (!orgId) {
      logger.error('User missing organization ID', {
        userId: user.id,
        path: req.path,
      });
      throw AppError.unauthorized('User is not associated with an organization');
    }

    // Extract role from user metadata
    const role = (user.user_metadata?.role || user.app_metadata?.role || 'field_crew') as UserRole;

    // Attach user information to request
    req.user = {
      id: user.id,
      org_id: orgId,
      role: role,
      email: user.email || '',
    };

    logger.debug('User authenticated successfully', {
      userId: req.user.id,
      orgId: req.user.org_id,
      role: req.user.role,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    
    logger.error('Authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      path: req.path,
    });
    
    next(AppError.unauthorized('Authentication failed'));
  }
};

// ============================================================================
// AUTHORIZATION MIDDLEWARE
// ============================================================================

/**
 * Require specific roles for a route
 * Must be used after requireAuth middleware
 * 
 * @param allowedRoles - Array of roles that can access this route
 * @returns Express middleware function
 * 
 * @example
 * router.post('/admin-only', requireAuth, requireRole(['admin', 'owner']), handler);
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        logger.error('requireRole called without authentication', {
          path: req.path,
          method: req.method,
        });
        throw AppError.unauthorized('Authentication required');
      }

      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        logger.warn('Insufficient permissions', {
          userId: req.user.id,
          userRole,
          allowedRoles,
          path: req.path,
          method: req.method,
        });
        throw AppError.forbidden(
          `This action requires one of these roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`
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
 * Check if user has admin or owner role
 * Convenience middleware for common authorization pattern
 * 
 * @example
 * router.post('/settings', requireAuth, requireAdminOrOwner, handler);
 */
export const requireAdminOrOwner = requireRole(['admin', 'owner']);

/**
 * Check if user has management role (admin, owner, or manager)
 * 
 * @example
 * router.get('/reports', requireAuth, requireManagement, handler);
 */
export const requireManagement = requireRole(['admin', 'owner', 'manager']);

/**
 * Check if user can edit cost codes (admin, owner, manager, or estimator)
 * 
 * @example
 * router.post('/cost-codes', requireAuth, requireCostCodeEditor, handler);
 */
export const requireCostCodeEditor = requireRole(['admin', 'owner', 'manager', 'estimator']);

// ============================================================================
// OPTIONAL AUTHENTICATION
// ============================================================================

/**
 * Optional authentication middleware
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
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (!error && user) {
        const orgId = user.user_metadata?.org_id || user.app_metadata?.org_id;
        const role = (user.user_metadata?.role || user.app_metadata?.role || 'field_crew') as UserRole;

        if (orgId) {
          req.user = {
            id: user.id,
            org_id: orgId,
            role: role,
            email: user.email || '',
          };

          logger.debug('Optional auth: User authenticated', {
            userId: req.user.id,
            path: req.path,
          });
        }
      }
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
  requireAdminOrOwner,
  requireManagement,
  requireCostCodeEditor,
  optionalAuth,
};