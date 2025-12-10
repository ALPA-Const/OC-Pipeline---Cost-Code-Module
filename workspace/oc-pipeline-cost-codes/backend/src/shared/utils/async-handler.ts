/**
 * Async Handler Utility
 * Wrapper for async Express route handlers to catch errors
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { Request, Response, NextFunction } from 'express';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Async route handler function type
 */
export type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Express middleware function type
 */
export type ExpressMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

// ============================================================================
// ASYNC HANDLER
// ============================================================================

/**
 * Wraps async route handlers to catch errors and pass to Express error handler
 * 
 * Usage:
 * ```typescript
 * router.get('/cost-codes', asyncHandler(async (req, res) => {
 *   const costCodes = await costCodeService.getCostCodes();
 *   res.json(costCodes);
 * }));
 * ```
 * 
 * @param fn - Async route handler function
 * @returns Express middleware function
 */
export const asyncHandler = (fn: AsyncRouteHandler): ExpressMiddleware => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============================================================================
// ASYNC MIDDLEWARE WRAPPER
// ============================================================================

/**
 * Wraps async middleware to catch errors
 * Similar to asyncHandler but specifically for middleware
 * 
 * Usage:
 * ```typescript
 * app.use(asyncMiddleware(async (req, res, next) => {
 *   await someAsyncOperation();
 *   next();
 * }));
 * ```
 * 
 * @param fn - Async middleware function
 * @returns Express middleware function
 */
export const asyncMiddleware = (fn: AsyncRouteHandler): ExpressMiddleware => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Wrap multiple async handlers
 * 
 * Usage:
 * ```typescript
 * const handlers = wrapHandlers([handler1, handler2, handler3]);
 * router.get('/path', ...handlers);
 * ```
 * 
 * @param handlers - Array of async route handlers
 * @returns Array of wrapped Express middleware functions
 */
export const wrapHandlers = (handlers: AsyncRouteHandler[]): ExpressMiddleware[] => {
  return handlers.map(handler => asyncHandler(handler));
};

/**
 * Create a try-catch wrapper for async operations
 * Returns [error, result] tuple
 * 
 * Usage:
 * ```typescript
 * const [error, result] = await tryCatch(asyncOperation());
 * if (error) {
 *   // handle error
 * }
 * ```
 * 
 * @param promise - Promise to wrap
 * @returns Tuple of [error, result]
 */
export const tryCatch = async <T>(
  promise: Promise<T>
): Promise<[Error | null, T | null]> => {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    return [error as Error, null];
  }
};

/**
 * Retry async operation with exponential backoff
 * 
 * Usage:
 * ```typescript
 * const result = await retryAsync(
 *   () => fetchData(),
 *   { maxRetries: 3, delayMs: 1000 }
 * );
 * ```
 * 
 * @param fn - Async function to retry
 * @param options - Retry options
 * @returns Result of the async function
 */
export const retryAsync = async <T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
};

/**
 * Timeout wrapper for async operations
 * 
 * Usage:
 * ```typescript
 * const result = await withTimeout(
 *   fetchData(),
 *   5000,
 *   'Operation timed out'
 * );
 * ```
 * 
 * @param promise - Promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Error message if timeout occurs
 * @returns Result of the promise
 */
export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
};

/**
 * Batch async operations with concurrency limit
 * 
 * Usage:
 * ```typescript
 * const results = await batchAsync(
 *   items,
 *   async (item) => processItem(item),
 *   { concurrency: 5 }
 * );
 * ```
 * 
 * @param items - Array of items to process
 * @param fn - Async function to apply to each item
 * @param options - Batch options
 * @returns Array of results
 */
export const batchAsync = async <T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  options: { concurrency?: number } = {}
): Promise<R[]> => {
  const { concurrency = 10 } = options;
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  
  return results;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  asyncHandler,
  asyncMiddleware,
  wrapHandlers,
  tryCatch,
  retryAsync,
  withTimeout,
  batchAsync,
};