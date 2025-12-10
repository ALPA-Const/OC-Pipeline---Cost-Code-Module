/**
 * Redis Client Configuration
 * Provides Redis connection with retry strategy and event logging
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import Redis, { RedisOptions } from 'ioredis';
import { logger } from '../utils/logger';

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);
const REDIS_KEY_PREFIX = process.env.REDIS_KEY_PREFIX || 'oc-pipeline:';

// ============================================================================
// REDIS CONFIGURATION
// ============================================================================

const redisOptions: RedisOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  db: REDIS_DB,
  keyPrefix: REDIS_KEY_PREFIX,
  
  // Retry strategy with exponential backoff
  retryStrategy: (times: number) => {
    const maxRetries = 3;
    
    if (times > maxRetries) {
      logger.error('Redis max retries exceeded', { attempts: times });
      return null; // Stop retrying
    }
    
    // Exponential backoff: 2^times * 100ms (100ms, 200ms, 400ms)
    const delay = Math.min(Math.pow(2, times) * 100, 2000);
    logger.warn('Redis connection retry', { attempt: times, delayMs: delay });
    
    return delay;
  },
  
  // Connection timeout
  connectTimeout: 10000,
  
  // Enable offline queue
  enableOfflineQueue: true,
  
  // Lazy connect (don't connect until first command)
  lazyConnect: false,
  
  // Reconnect on error
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Reconnect when Redis is in readonly mode
      return true;
    }
    return false;
  },
};

// ============================================================================
// CREATE REDIS CLIENT
// ============================================================================

export const redisClient = new Redis(redisOptions);

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Connection successful
 */
redisClient.on('connect', () => {
  logger.info('Redis client connecting', {
    host: REDIS_HOST,
    port: REDIS_PORT,
    db: REDIS_DB,
  });
});

/**
 * Connection ready
 */
redisClient.on('ready', () => {
  logger.info('Redis client ready', {
    host: REDIS_HOST,
    port: REDIS_PORT,
    db: REDIS_DB,
  });
});

/**
 * Connection error
 */
redisClient.on('error', (error: Error) => {
  logger.error('Redis client error', {
    error: error.message,
    stack: error.stack,
    host: REDIS_HOST,
    port: REDIS_PORT,
  });
});

/**
 * Connection closed
 */
redisClient.on('close', () => {
  logger.warn('Redis client connection closed', {
    host: REDIS_HOST,
    port: REDIS_PORT,
  });
});

/**
 * Connection reconnecting
 */
redisClient.on('reconnecting', (delay: number) => {
  logger.info('Redis client reconnecting', {
    delayMs: delay,
    host: REDIS_HOST,
    port: REDIS_PORT,
  });
});

/**
 * Connection ended
 */
redisClient.on('end', () => {
  logger.warn('Redis client connection ended', {
    host: REDIS_HOST,
    port: REDIS_PORT,
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Cache key builder for cost codes
 */
export const cacheKeys = {
  costCode: (orgId: string, codeId: string) => `cost-code:${orgId}:${codeId}`,
  costCodeList: (orgId: string, filters?: string) => 
    `cost-code-list:${orgId}${filters ? `:${filters}` : ''}`,
  costCodeTree: (orgId: string) => `cost-code-tree:${orgId}`,
  parentCodes: (orgId: string) => `parent-codes:${orgId}`,
  childCodes: (orgId: string, parentId: string) => `child-codes:${orgId}:${parentId}`,
  importBatch: (batchId: string) => `import-batch:${batchId}`,
};

/**
 * Default cache TTL values (in seconds)
 */
export const cacheTTL = {
  costCode: 3600, // 1 hour
  costCodeList: 300, // 5 minutes
  costCodeTree: 1800, // 30 minutes
  parentCodes: 3600, // 1 hour
  childCodes: 3600, // 1 hour
  importBatch: 86400, // 24 hours
};

/**
 * Get value from cache
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await redisClient.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error('Redis get error', { key, error });
    return null;
  }
};

/**
 * Set value in cache with TTL
 */
export const setCache = async (
  key: string,
  value: any,
  ttl: number = cacheTTL.costCode
): Promise<void> => {
  try {
    await redisClient.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.error('Redis set error', { key, ttl, error });
  }
};

/**
 * Delete key from cache
 */
export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Redis delete error', { key, error });
  }
};

/**
 * Delete multiple keys matching pattern
 */
export const deleteCachePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.info('Cache pattern deleted', { pattern, count: keys.length });
    }
  } catch (error) {
    logger.error('Redis delete pattern error', { pattern, error });
  }
};

/**
 * Invalidate all cost code caches for an organization
 */
export const invalidateOrgCostCodeCache = async (orgId: string): Promise<void> => {
  try {
    await deleteCachePattern(`*cost-code*:${orgId}:*`);
    await deleteCachePattern(`*cost-code-list:${orgId}*`);
    await deleteCachePattern(`*cost-code-tree:${orgId}*`);
    await deleteCachePattern(`*parent-codes:${orgId}*`);
    await deleteCachePattern(`*child-codes:${orgId}:*`);
    logger.info('Organization cost code cache invalidated', { orgId });
  } catch (error) {
    logger.error('Failed to invalidate org cache', { orgId, error });
  }
};

/**
 * Health check for Redis connection
 */
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    const result = await redisClient.ping();
    return result === 'PONG';
  } catch (error) {
    logger.error('Redis health check failed', { error });
    return false;
  }
};

/**
 * Graceful shutdown
 */
export const closeRedisConnection = async (): Promise<void> => {
  try {
    await redisClient.quit();
    logger.info('Redis connection closed gracefully');
  } catch (error) {
    logger.error('Error closing Redis connection', { error });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================
export default {
  client: redisClient,
  keys: cacheKeys,
  ttl: cacheTTL,
  get: getCache,
  set: setCache,
  delete: deleteCache,
  deletePattern: deleteCachePattern,
  invalidateOrgCache: invalidateOrgCostCodeCache,
  checkHealth: checkRedisHealth,
  close: closeRedisConnection,
};