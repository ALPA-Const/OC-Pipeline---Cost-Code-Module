/**
 * Custom Application Error Class
 * Provides structured error handling with HTTP status codes
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

// ============================================================================
// APP ERROR CLASS
// ============================================================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly field?: string;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    field?: string,
    isOperational: boolean = true
  ) {
    super(message);

    // Maintains proper stack trace for where error was thrown
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
  }

  // ============================================================================
  // STATIC FACTORY METHODS
  // ============================================================================

  /**
   * 400 Bad Request
   */
  static badRequest(message: string, field?: string): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', field);
  }

  /**
   * 401 Unauthorized
   */
  static unauthorized(message: string = 'Authentication required'): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  /**
   * 403 Forbidden
   */
  static forbidden(message: string = 'Access denied'): AppError {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  /**
   * 404 Not Found
   */
  static notFound(resource: string = 'Resource'): AppError {
    return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  /**
   * 409 Conflict
   */
  static conflict(message: string, field?: string): AppError {
    return new AppError(message, 409, 'CONFLICT', field);
  }

  /**
   * 422 Unprocessable Entity (Validation Error)
   */
  static validationError(message: string, field?: string): AppError {
    return new AppError(message, 422, 'VALIDATION_ERROR', field);
  }

  /**
   * 429 Too Many Requests
   */
  static tooManyRequests(message: string = 'Too many requests'): AppError {
    return new AppError(message, 429, 'TOO_MANY_REQUESTS');
  }

  /**
   * 500 Internal Server Error
   */
  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(message, 500, 'INTERNAL_ERROR', undefined, false);
  }

  /**
   * 503 Service Unavailable
   */
  static serviceUnavailable(message: string = 'Service temporarily unavailable'): AppError {
    return new AppError(message, 503, 'SERVICE_UNAVAILABLE', undefined, false);
  }

  // ============================================================================
  // DOMAIN-SPECIFIC ERRORS
  // ============================================================================

  /**
   * Cost code not found
   */
  static costCodeNotFound(codeNumber?: string): AppError {
    const message = codeNumber
      ? `Cost code "${codeNumber}" not found`
      : 'Cost code not found';
    return new AppError(message, 404, 'COST_CODE_NOT_FOUND');
  }

  /**
   * Duplicate cost code
   */
  static duplicateCostCode(codeNumber: string): AppError {
    return new AppError(
      `Cost code "${codeNumber}" already exists in your organization`,
      409,
      'DUPLICATE_COST_CODE',
      'code_number'
    );
  }

  /**
   * Invalid parent code
   */
  static invalidParentCode(message?: string): AppError {
    return new AppError(
      message || 'Invalid parent cost code',
      400,
      'INVALID_PARENT_CODE',
      'parent_id'
    );
  }

  /**
   * Cannot delete parent with children
   */
  static cannotDeleteParentWithChildren(): AppError {
    return new AppError(
      'Cannot delete parent cost code that has child codes. Delete or reassign children first.',
      400,
      'PARENT_HAS_CHILDREN'
    );
  }

  /**
   * Circular reference detected
   */
  static circularReference(): AppError {
    return new AppError(
      'Circular reference detected in cost code hierarchy',
      400,
      'CIRCULAR_REFERENCE',
      'parent_id'
    );
  }

  /**
   * Organization not found
   */
  static organizationNotFound(): AppError {
    return new AppError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
  }

  /**
   * Invalid import batch
   */
  static invalidImportBatch(message?: string): AppError {
    return new AppError(
      message || 'Invalid import batch',
      400,
      'INVALID_IMPORT_BATCH'
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Convert error to JSON response
   */
  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        ...(this.field && { field: this.field }),
        timestamp: this.timestamp,
      },
    };
  }

  /**
   * Check if error is operational (expected) or programming error
   */
  isOperationalError(): boolean {
    return this.isOperational;
  }

  /**
   * Create from unknown error
   */
  static fromUnknown(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(error.message, 500, 'INTERNAL_ERROR', undefined, false);
    }

    return new AppError('An unexpected error occurred', 500, 'INTERNAL_ERROR', undefined, false);
  }
}

// ============================================================================
// ERROR RESPONSE FORMATTER
// ============================================================================

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
    field?: string;
    timestamp: string;
    stack?: string;
  };
}

/**
 * Format error for HTTP response
 */
export const formatErrorResponse = (
  error: AppError,
  includeStack: boolean = false
): ErrorResponse => {
  const response: ErrorResponse = {
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
    },
  };

  if (error.field) {
    response.error.field = error.field;
  }

  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default AppError;