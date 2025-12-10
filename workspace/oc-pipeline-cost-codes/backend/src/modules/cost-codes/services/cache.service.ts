/**
 * Cost Code Cache Service
 * Handles caching operations for cost codes using Redis
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { redisClient } from '../../../shared/cache/redis.client';
import { logger } from '../../../shared/utils/logger';
import { CostCode, CostCodeStatus } from '../types/cost-code.types';

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const CACHE_TTL = {
  COST_CODES: 300, // 5 minutes
  STANDARD_CODES: 86400, // 24 hours
} as const;

const CACHE_KEY_PREFIX = {
  COST_CODES: 'cost_codes',
  STANDARD_CODES: 'standard_codes',
} as const;

// ============================================================================
// COST CODE CACHE SERVICE CLASS
// ============================================================================

export class CostCodeCacheService {
  /**
   * Get cached cost codes for an organization
   * 
   * @param orgId - Organization ID
   * @param status - Cost code status filter ('active', 'archived', or 'all')
   * @returns Cached cost codes or null if not found
   * 
   * @example
   * const cachedCodes = await cacheService.getCachedCostCodes('org-123', 'active');
   * if (cachedCodes) {
   *   return cachedCodes; // Use cached data
   * }
   */
  async getCachedCostCodes(
    orgId: string,
    status: CostCodeStatus | 'all' = 'all'
  ): Promise<CostCode[] | null> {
    try {
      const cacheKey = this.buildCostCodeKey(orgId, status);
      
      logger.debug('Attempting to get cached cost codes', {
        orgId,
        status,
        cacheKey,
      });

      const cachedData = await redisClient.get(cacheKey);

      if (!cachedData) {
        logger.debug('Cache miss for cost codes', { orgId, status });
        return null;
      }

      const parsedData = JSON.parse(cachedData) as CostCode[];
      
      logger.info('Cache hit for cost codes', {
        orgId,
        status,
        count: parsedData.length,
      });

      return parsedData;
    } catch (error) {
      // Log error but don't crash - gracefully degrade to database query
      logger.error('Failed to get cached cost codes', {
        orgId,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Set cached cost codes for an organization
   * 
   * @param orgId - Organization ID
   * @param status - Cost code status filter
   * @param data - Cost codes to cache
   * @returns True if successfully cached, false otherwise
   * 
   * @example
   * await cacheService.setCachedCostCodes('org-123', 'active', costCodes);
   */
  async setCachedCostCodes(
    orgId: string,
    status: CostCodeStatus | 'all',
    data: CostCode[]
  ): Promise<boolean> {
    try {
      const cacheKey = this.buildCostCodeKey(orgId, status);
      const serializedData = JSON.stringify(data);

      logger.debug('Setting cached cost codes', {
        orgId,
        status,
        cacheKey,
        count: data.length,
        ttl: CACHE_TTL.COST_CODES,
      });

      await redisClient.setex(cacheKey, CACHE_TTL.COST_CODES, serializedData);

      logger.info('Cost codes cached successfully', {
        orgId,
        status,
        count: data.length,
      });

      return true;
    } catch (error) {
      // Log error but don't crash - application continues without cache
      logger.error('Failed to set cached cost codes', {
        orgId,
        status,
        count: data.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Invalidate all cached cost codes for an organization
   * Deletes cache for active, archived, and all statuses
   * 
   * @param orgId - Organization ID
   * @returns True if successfully invalidated, false otherwise
   * 
   * @example
   * await cacheService.invalidateOrgCache('org-123');
   */
  async invalidateOrgCache(orgId: string): Promise<boolean> {
    try {
      logger.info('Invalidating organization cache', { orgId });

      const keysToDelete = [
        this.buildCostCodeKey(orgId, 'active'),
        this.buildCostCodeKey(orgId, 'archived'),
        this.buildCostCodeKey(orgId, 'all'),
      ];

      // Delete all keys
      const deletePromises = keysToDelete.map((key) => 
        redisClient.del(key).catch((error) => {
          logger.warn('Failed to delete cache key', {
            key,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return 0;
        })
      );

      await Promise.all(deletePromises);

      logger.info('Organization cache invalidated', {
        orgId,
        keysDeleted: keysToDelete.length,
      });

      return true;
    } catch (error) {
      // Log error but don't crash
      logger.error('Failed to invalidate organization cache', {
        orgId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Get cached standard database codes
   * Standard codes are cached for 24 hours as they rarely change
   * 
   * @param databaseName - Name of the standard database (e.g., 'csi_2016', 'nahb')
   * @returns Cached standard codes or null if not found
   * 
   * @example
   * const standardCodes = await cacheService.getStandardDatabaseCodes('csi_2016');
   */
  async getStandardDatabaseCodes(
    databaseName: string
  ): Promise<CostCode[] | null> {
    try {
      const cacheKey = this.buildStandardCodeKey(databaseName);

      logger.debug('Attempting to get cached standard codes', {
        databaseName,
        cacheKey,
      });

      const cachedData = await redisClient.get(cacheKey);

      if (!cachedData) {
        logger.debug('Cache miss for standard codes', { databaseName });
        return null;
      }

      const parsedData = JSON.parse(cachedData) as CostCode[];

      logger.info('Cache hit for standard codes', {
        databaseName,
        count: parsedData.length,
      });

      return parsedData;
    } catch (error) {
      logger.error('Failed to get cached standard codes', {
        databaseName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Set cached standard database codes
   * 
   * @param databaseName - Name of the standard database
   * @param data - Standard cost codes to cache
   * @returns True if successfully cached, false otherwise
   * 
   * @example
   * await cacheService.setStandardDatabaseCodes('csi_2016', standardCodes);
   */
  async setStandardDatabaseCodes(
    databaseName: string,
    data: CostCode[]
  ): Promise<boolean> {
    try {
      const cacheKey = this.buildStandardCodeKey(databaseName);
      const serializedData = JSON.stringify(data);

      logger.debug('Setting cached standard codes', {
        databaseName,
        cacheKey,
        count: data.length,
        ttl: CACHE_TTL.STANDARD_CODES,
      });

      await redisClient.setex(
        cacheKey,
        CACHE_TTL.STANDARD_CODES,
        serializedData
      );

      logger.info('Standard codes cached successfully', {
        databaseName,
        count: data.length,
      });

      return true;
    } catch (error) {
      logger.error('Failed to set cached standard codes', {
        databaseName,
        count: data.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Invalidate cached standard database codes
   * 
   * @param databaseName - Name of the standard database
   * @returns True if successfully invalidated, false otherwise
   * 
   * @example
   * await cacheService.invalidateStandardCache('csi_2016');
   */
  async invalidateStandardCache(databaseName: string): Promise<boolean> {
    try {
      const cacheKey = this.buildStandardCodeKey(databaseName);

      logger.info('Invalidating standard database cache', { databaseName });

      await redisClient.del(cacheKey);

      logger.info('Standard database cache invalidated', { databaseName });

      return true;
    } catch (error) {
      logger.error('Failed to invalidate standard cache', {
        databaseName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Get cache statistics for an organization
   * 
   * @param orgId - Organization ID
   * @returns Cache statistics
   * 
   * @example
   * const stats = await cacheService.getCacheStats('org-123');
   * console.log(`Active codes cached: ${stats.active}`);
   */
  async getCacheStats(orgId: string): Promise<{
    active: boolean;
    archived: boolean;
    all: boolean;
  }> {
    try {
      const keys = [
        this.buildCostCodeKey(orgId, 'active'),
        this.buildCostCodeKey(orgId, 'archived'),
        this.buildCostCodeKey(orgId, 'all'),
      ];

      const existsPromises = keys.map((key) =>
        redisClient.exists(key).catch(() => 0)
      );

      const results = await Promise.all(existsPromises);

      return {
        active: results[0] === 1,
        archived: results[1] === 1,
        all: results[2] === 1,
      };
    } catch (error) {
      logger.error('Failed to get cache stats', {
        orgId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { active: false, archived: false, all: false };
    }
  }

  /**
   * Clear all cost code caches (use with caution)
   * 
   * @returns True if successfully cleared, false otherwise
   * 
   * @example
   * await cacheService.clearAllCaches();
   */
  async clearAllCaches(): Promise<boolean> {
    try {
      logger.warn('Clearing all cost code caches');

      // Get all cost code cache keys
      const pattern = `${CACHE_KEY_PREFIX.COST_CODES}:*`;
      const keys = await redisClient.keys(pattern);

      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info('All cost code caches cleared', { count: keys.length });
      } else {
        logger.info('No cost code caches to clear');
      }

      return true;
    } catch (error) {
      logger.error('Failed to clear all caches', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Build cache key for cost codes
   * 
   * @param orgId - Organization ID
   * @param status - Cost code status
   * @returns Cache key string
   */
  private buildCostCodeKey(
    orgId: string,
    status: CostCodeStatus | 'all'
  ): string {
    return `${CACHE_KEY_PREFIX.COST_CODES}:${orgId}:${status}`;
  }

  /**
   * Build cache key for standard database codes
   * 
   * @param databaseName - Database name
   * @returns Cache key string
   */
  private buildStandardCodeKey(databaseName: string): string {
    return `${CACHE_KEY_PREFIX.STANDARD_CODES}:${databaseName}`;
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const costCodeCacheService = new CostCodeCacheService();
export default costCodeCacheService;