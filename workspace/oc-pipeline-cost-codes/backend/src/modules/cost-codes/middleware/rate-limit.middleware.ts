/**
 * Rate Limiting Middleware for Cost Code Module
 * Prevents abuse by limiting request frequency using Redis
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../../../shared/cache/redis.client';
import { AppError } from '../../../shared/errors/AppError';
import { logger } from '../../../shared/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  message?: string; // Custom error message
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

// ============================================================================
// KEY GENERATORS
// ============================================================================

/**
 * Default key generator
 * Uses organization ID and endpoint path
 * Format: rate_limit:{orgId}:{method}:{path}
 */
function defaultKeyGenerator(req: Request): string {
  const orgId = req.user?.org_id || 'anonymous';
  const endpoint = `${req.method}:${req.baseUrl}${req.path}`;
  return `rate_limit:${orgId}:${endpoint}`;
}

/**
 * Organization-only key generator
 * Rate limit per organization (all endpoints combined)
 * Format: rate_limit:{orgId}
 */
export function orgKeyGenerator(req: Request): string {
  const orgId = req.user?.org_id || 'anonymous';
  return `rate_limit:${orgId}`;
}

/**
 * User-specific key generator
 * Rate limit per user
 * Format: rate_limit:user:{userId}:{endpoint}
 */
export function userKeyGenerator(req: Request): string {
  const userId = req.user?.id || 'anonymous';
  const endpoint = `${req.method}:${req.baseUrl}${req.path}`;
  return `rate_limit:user:${userId}:${endpoint}`;
}

/**
 * IP-based key generator
 * Rate limit per IP address (for unauthenticated requests)
 * Format: rate_limit:ip:{ip}:{endpoint}
 */
export function ipKeyGenerator(req: Request): string {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const endpoint = `${req.method}:${req.baseUrl}${req.path}`;
  return `rate_limit:ip:${ip}:${endpoint}`;
}

// ============================================================================
// RATE LIMITER MIDDLEWARE
// ============================================================================

/**
 * Create a rate limiter middleware
 * Uses Redis to track request counts per organization/user/IP
 * 
 * @param options - Rate limiter configuration
 * @returns Express middleware function
 * 
 * @example
 * const limiter = rateLimiter({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   maxRequests: 100,
 *   message: 'Too many requests'
 * });
 * router.post('/api/endpoint', limiter, handler);
 */
export const rateLimiter = (options: RateLimiterOptions) => {
  const {
    windowMs = 15 * 60 * 1000, // Default: 15 minutes
    maxRequests = 100, // Default: 100 requests
    message = 'Too many requests. Please try again later.',
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Generate unique key for this request
      const key = keyGenerator(req);
      const windowSeconds = Math.ceil(windowMs / 1000);

      logger.debug('Rate limit check', {
        key,
        windowMs,
        maxRequests,
        path: req.path,
      });

      // Get current count from Redis
      const currentCount = await redisClient.get(key);
      const count = currentCount ? parseInt(currentCount, 10) : 0;

      // Get TTL for reset time calculation
      let ttl = await redisClient.ttl(key);
      if (ttl === -1) {
        // Key exists but has no expiry, set it
        await redisClient.expire(key, windowSeconds);
        ttl = windowSeconds;
      } else if (ttl === -2) {
        // Key doesn't exist
        ttl = windowSeconds;
      }

      // Check if limit exceeded
      if (count >= maxRequests) {
        const resetTime = Date.now() + (ttl * 1000);
        const retryAfter = Math.ceil(ttl);

        logger.warn('Rate limit exceeded', {
          key,
          count,
          maxRequests,
          resetTime: new Date(resetTime).toISOString(),
          path: req.path,
          method: req.method,
          orgId: req.user?.org_id,
          userId: req.user?.id,
        });

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', Math.floor(resetTime / 1000).toString());
        res.setHeader('Retry-After', retryAfter.toString());

        throw AppError.tooManyRequests(message);
      }

      // Increment counter
      const newCount = count + 1;
      
      if (count === 0) {
        // First request in window, set with expiry
        await redisClient.setex(key, windowSeconds, newCount.toString());
      } else {
        // Increment existing counter
        await redisClient.incr(key);
      }

      // Calculate reset time
      const resetTime = Date.now() + (ttl * 1000);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - newCount).toString());
      res.setHeader('X-RateLimit-Reset', Math.floor(resetTime / 1000).toString());

      logger.debug('Rate limit check passed', {
        key,
        count: newCount,
        maxRequests,
        remaining: maxRequests - newCount,
        resetTime: new Date(resetTime).toISOString(),
        path: req.path,
      });

      // Handle skip options
      if (skipSuccessfulRequests || skipFailedRequests) {
        // Store original end function
        const originalEnd = res.end;

        // Override end function to decrement counter if needed
        res.end = function (this: Response, ...args: any[]): Response {
          const statusCode = res.statusCode;
          const shouldSkip =
            (skipSuccessfulRequests && statusCode < 400) ||
            (skipFailedRequests && statusCode >= 400);

          if (shouldSkip) {
            // Decrement counter asynchronously
            redisClient.decr(key).catch((error) => {
              logger.error('Failed to decrement rate limit counter', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            });
          }

          // Call original end function
          return originalEnd.apply(this, args);
        };
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      }

      // If Redis fails, log error but allow request through
      logger.error('Rate limiter error - allowing request', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method,
      });

      // Don't block requests if rate limiter fails (graceful degradation)
      next();
    }
  };
};

// ============================================================================
// PRESET RATE LIMITERS
// ============================================================================

/**
 * Standard rate limiter for general API endpoints
 * 100 requests per 15 minutes per organization
 */
export const standardRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests. Please try again in 15 minutes.',
});

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per hour per organization
 */
export const strictRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  message: 'Too many requests. Please try again in 1 hour.',
});

/**
 * Import rate limiter for bulk operations
 * 5 requests per hour per organization
 */
export const importRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  message: 'Too many import requests. Please try again in 1 hour.',
  keyGenerator: orgKeyGenerator, // Rate limit per organization
});

/**
 * Export rate limiter
 * 20 requests per hour per organization
 */
export const exportRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,
  message: 'Too many export requests. Please try again in 1 hour.',
  keyGenerator: orgKeyGenerator,
});

/**
 * Auth rate limiter for login/signup
 * 5 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts. Please try again later.',
  keyGenerator: ipKeyGenerator,
  skipSuccessfulRequests: true, // Only count failed attempts
});

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  rateLimiter,
  standardRateLimiter,
  strictRateLimiter,
  importRateLimiter,
  exportRateLimiter,
  authRateLimiter,
  orgKeyGenerator,
  userKeyGenerator,
  ipKeyGenerator,
};