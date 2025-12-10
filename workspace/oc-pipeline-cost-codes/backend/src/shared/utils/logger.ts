/**
 * Winston Logger Configuration
 * Provides structured logging with console and file transports
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import winston from 'winston';
import path from 'path';

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');
const LOG_DIR = process.env.LOG_DIR || 'logs';

// ============================================================================
// LOG FORMAT
// ============================================================================

/**
 * Custom log format with timestamp and metadata
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add metadata if present
    if (metadata && Object.keys(metadata).length > 0) {
      log += ` ${JSON.stringify(metadata)}`;
    }
    
    return log;
  })
);

/**
 * Colorized format for console output
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present (excluding empty objects)
    const metaKeys = Object.keys(metadata).filter(
      key => !['timestamp', 'level', 'message'].includes(key)
    );
    
    if (metaKeys.length > 0) {
      const metaData = metaKeys.reduce((acc, key) => {
        acc[key] = metadata[key];
        return acc;
      }, {} as Record<string, any>);
      
      log += ` ${JSON.stringify(metaData, null, 2)}`;
    }
    
    return log;
  })
);

// ============================================================================
// TRANSPORTS
// ============================================================================

const transports: winston.transport[] = [];

/**
 * Console transport (always enabled)
 */
transports.push(
  new winston.transports.Console({
    format: NODE_ENV === 'production' ? logFormat : consoleFormat,
    level: LOG_LEVEL,
  })
);

/**
 * File transport for errors (production only)
 */
if (NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  /**
   * File transport for all logs (production only)
   */
  transports.push(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// ============================================================================
// LOGGER INSTANCE
// ============================================================================

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  transports,
  exitOnError: false,
});

// ============================================================================
// HELPER METHODS
// ============================================================================

/**
 * Log with request context
 */
export const logWithContext = (
  level: string,
  message: string,
  context?: Record<string, any>
) => {
  logger.log(level, message, context);
};

/**
 * Log HTTP request
 */
export const logRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string
) => {
  logger.info('HTTP Request', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    userId,
  });
};

/**
 * Log database query
 */
export const logQuery = (
  query: string,
  duration: number,
  params?: any[]
) => {
  logger.debug('Database Query', {
    query,
    duration: `${duration}ms`,
    params,
  });
};

/**
 * Log cache operation
 */
export const logCache = (
  operation: 'hit' | 'miss' | 'set' | 'delete',
  key: string,
  duration?: number
) => {
  logger.debug('Cache Operation', {
    operation,
    key,
    ...(duration && { duration: `${duration}ms` }),
  });
};

/**
 * Log external API call
 */
export const logExternalAPI = (
  service: string,
  endpoint: string,
  statusCode: number,
  duration: number
) => {
  logger.info('External API Call', {
    service,
    endpoint,
    statusCode,
    duration: `${duration}ms`,
  });
};

/**
 * Log error with stack trace
 */
export const logError = (
  error: Error,
  context?: Record<string, any>
) => {
  logger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
};

/**
 * Log security event
 */
export const logSecurity = (
  event: string,
  userId?: string,
  details?: Record<string, any>
) => {
  logger.warn('Security Event', {
    event,
    userId,
    ...details,
  });
};

// ============================================================================
// STREAM FOR MORGAN (HTTP REQUEST LOGGING)
// ============================================================================

export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  logger,
  logWithContext,
  logRequest,
  logQuery,
  logCache,
  logExternalAPI,
  logError,
  logSecurity,
  morganStream,
};