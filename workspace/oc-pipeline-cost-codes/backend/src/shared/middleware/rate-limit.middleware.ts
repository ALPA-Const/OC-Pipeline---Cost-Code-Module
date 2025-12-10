/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting request frequency
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../cache/redis.client';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

// ============================================================================
// RATE LIMITER CONFIGURATION
// ============================================================================

interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string; // Custom error message
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

// ============================================================================
// RATE LIMITER MIDDLEWARE
// ============================================================================

/**
 * Create a rate limiter middleware
 * Uses Redis to track request counts per user/IP
 * 
 * @param options - Rate limiter configuration
 * @returns Express middleware function
 * 
 * @example
 * const limiter = rateLimiter({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   max: 100, // 100 requests per window
 *   message: 'Too many requests'
 * });
 * router.post('/api/endpoint', limiter, handler);
 */
export const rateLimiter = (options: RateLimiterOptions) => {
  const {
    windowMs,
    max,
    message = 'Too many requests. Please try again later.',
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Generate unique key for this request
      const key = keyGenerator(req);
      const redisKey = `rate_limit:${key}`;

      // Get current count from Redis
      const currentCount = await redisClient.get(redisKey);
      const count = currentCount ? parseInt(currentCount, 10) : 0;

      // Check if limit exceeded
      if (count >= max) {
        logger.warn('Rate limit exceeded', {
          key,
          count,
          max,
          path: req.path,
          method: req.method,
        });

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', max.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', Date.now() + windowMs);

        throw AppError.tooManyRequests(message);
      }

      // Increment counter
      const newCount = count + 1;
      
      if (count === 0) {
        // First request in window, set with expiry
        await redisClient.setex(redisKey, Math.ceil(windowMs / 1000), newCount.toString());
      } else {
        // Increment existing counter
        await redisClient.incr(redisKey);
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', max.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - newCount).toString());
      
      // Get TTL for reset time
      const ttl = await redisClient.ttl(redisKey);
      res.setHeader('X-RateLimit-Reset', Date.now() + (ttl * 1000));

      logger.debug('Rate limit check passed', {
        key,
        count: newCount,
        max,
        remaining: max - newCount,
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
            // Decrement counter
            redisClient.decr(redisKey).catch((error) => {
              logger.error('Failed to decrement rate limit counter', {
                key: redisKey,
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
      logger.error('Rate limiter error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
      });

      // Don't block requests if rate limiter fails
      next();
    }
  };
};

// ============================================================================
// KEY GENERATORS
// ============================================================================

/**
 * Default key generator
 * Uses user ID if authenticated, otherwise IP address
 */
function defaultKeyGenerator(req: Request): string {
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  
  // Get IP address from various headers
  const ip =
    req.ip ||
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Organization-based key generator
 * Rate limit per organization
 */
export function orgKeyGenerator(req: Request): string {
  if (req.user?.org_id) {
    return `org:${req.user.org_id}`;
  }
  return defaultKeyGenerator(req);
}

/**
 * Endpoint-based key generator
 * Rate limit per user per endpoint
 */
export function endpointKeyGenerator(req: Request): string {
  const userKey = defaultKeyGenerator(req);
  const endpoint = `${req.method}:${req.path}`;
  return `${userKey}:${endpoint}`;
}

// ============================================================================
// PRESET RATE LIMITERS
// ============================================================================

/**
 * Standard rate limiter for general API endpoints
 * 100 requests per 15 minutes
 */
export const standardRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests. Please try again in 15 minutes.',
});

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per hour
 */
export const strictRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many requests. Please try again in 1 hour.',
});

/**
 * Auth rate limiter for login/signup
 * 5 requests per 15 minutes
 */
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts. Please try again later.',
  skipSuccessfulRequests: true, // Only count failed attempts
});

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  rateLimiter,
  standardRateLimiter,
  strictRateLimiter,
  authRateLimiter,
  orgKeyGenerator,
  endpointKeyGenerator,
};