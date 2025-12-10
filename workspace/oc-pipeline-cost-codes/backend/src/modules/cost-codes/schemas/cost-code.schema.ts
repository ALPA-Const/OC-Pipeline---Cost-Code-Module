/**
 * Cost Code Validation Schemas
 * Zod schemas for validating cost code inputs
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const costCodeTierSchema = z.enum(['parent', 'child'], {
  errorMap: () => ({ message: 'Tier must be either "parent" or "child"' }),
});

export const costCodeStatusSchema = z.enum(['active', 'archived'], {
  errorMap: () => ({ message: 'Status must be either "active" or "archived"' }),
});

export const costCodeSourceSchema = z.enum(
  ['manual', 'csi_2016', 'nahb', 'csv_import', 'system'],
  {
    errorMap: () => ({
      message: 'Source must be one of: manual, csi_2016, nahb, csv_import, system',
    }),
  }
);

// ============================================================================
// BASE FIELD SCHEMAS
// ============================================================================

export const codeNumberSchema = z
  .string({
    required_error: 'Code number is required',
    invalid_type_error: 'Code number must be a string',
  })
  .trim()
  .min(1, 'Code number cannot be empty')
  .max(50, 'Code number must not exceed 50 characters')
  .regex(
    /^[A-Za-z0-9.\-_]+$/,
    'Code number can only contain letters, numbers, dots, hyphens, and underscores'
  );

export const codeNameSchema = z
  .string({
    required_error: 'Code name is required',
    invalid_type_error: 'Code name must be a string',
  })
  .trim()
  .min(1, 'Code name cannot be empty')
  .max(255, 'Code name must not exceed 255 characters');

export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

export const booleanSchema = z.boolean({
  invalid_type_error: 'Must be a boolean value',
});

// ============================================================================
// CREATE COST CODE SCHEMA
// ============================================================================

export const createCostCodeSchema = z
  .object({
    tier: costCodeTierSchema,
    parent_id: uuidSchema.nullable().optional(),
    code_number: codeNumberSchema,
    code_name: codeNameSchema,
    status: costCodeStatusSchema.default('active').optional(),
    available_in_time_cards: booleanSchema.default(false).optional(),
    source: costCodeSourceSchema,
    import_batch_id: uuidSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (data) => {
      // If tier is 'child', parent_id is required
      if (data.tier === 'child') {
        return data.parent_id !== null && data.parent_id !== undefined;
      }
      return true;
    },
    {
      message: 'Parent ID is required when tier is "child"',
      path: ['parent_id'],
    }
  )
  .refine(
    (data) => {
      // If tier is 'parent', parent_id must be null
      if (data.tier === 'parent') {
        return data.parent_id === null || data.parent_id === undefined;
      }
      return true;
    },
    {
      message: 'Parent ID must be null when tier is "parent"',
      path: ['parent_id'],
    }
  );

// ============================================================================
// UPDATE COST CODE SCHEMA
// ============================================================================

export const updateCostCodeSchema = z
  .object({
    tier: costCodeTierSchema.optional(),
    parent_id: uuidSchema.nullable().optional(),
    code_number: codeNumberSchema.optional(),
    code_name: codeNameSchema.optional(),
    status: costCodeStatusSchema.optional(),
    available_in_time_cards: booleanSchema.optional(),
  })
  .strict()
  .refine(
    (data) => {
      // If tier is being changed to 'child', parent_id must be provided
      if (data.tier === 'child' && data.parent_id === undefined) {
        return false;
      }
      return true;
    },
    {
      message: 'Parent ID is required when changing tier to "child"',
      path: ['parent_id'],
    }
  )
  .refine(
    (data) => {
      // If tier is being changed to 'parent', parent_id must be null
      if (data.tier === 'parent' && data.parent_id !== null && data.parent_id !== undefined) {
        return false;
      }
      return true;
    },
    {
      message: 'Parent ID must be null when changing tier to "parent"',
      path: ['parent_id'],
    }
  )
  .refine(
    (data) => {
      // At least one field must be provided for update
      return Object.keys(data).length > 0;
    },
    {
      message: 'At least one field must be provided for update',
    }
  );

// ============================================================================
// BULK CREATE SCHEMA
// ============================================================================

export const bulkCreateCostCodeSchema = z.object({
  cost_codes: z.array(createCostCodeSchema).min(1, 'At least one cost code is required'),
  import_batch_id: uuidSchema.optional(),
});

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

export const costCodeFiltersSchema = z
  .object({
    search: z.string().trim().optional(),
    tier: costCodeTierSchema.optional(),
    parent_id: uuidSchema.nullable().optional(),
    status: costCodeStatusSchema.optional(),
    available_in_time_cards: booleanSchema.optional(),
    source: costCodeSourceSchema.optional(),
    import_batch_id: uuidSchema.optional(),
    code_numbers: z.array(z.string()).optional(),
    created_by: uuidSchema.optional(),
    updated_by: uuidSchema.optional(),
    created_after: z.string().datetime().optional(),
    created_before: z.string().datetime().optional(),
    updated_after: z.string().datetime().optional(),
    updated_before: z.string().datetime().optional(),
  })
  .strict();

// ============================================================================
// PAGINATION SCHEMA
// ============================================================================

export const paginationSchema = z.object({
  page: z
    .number()
    .int('Page must be an integer')
    .positive('Page must be positive')
    .default(1)
    .optional(),
  limit: z
    .number()
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .max(100, 'Limit cannot exceed 100')
    .default(50)
    .optional(),
  sort_by: z
    .string()
    .regex(/^[a-z_]+$/, 'Sort field must contain only lowercase letters and underscores')
    .default('code_number')
    .optional(),
  sort_order: z.enum(['asc', 'desc']).default('asc').optional(),
});

// ============================================================================
// QUERY PARAMS SCHEMA
// ============================================================================

export const costCodeQueryParamsSchema = costCodeFiltersSchema.merge(paginationSchema);

// ============================================================================
// ID PARAM SCHEMA
// ============================================================================

export const idParamSchema = z.object({
  id: uuidSchema,
});

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validate create cost code input
 */
export const validateCreateCostCode = (data: unknown) => {
  return createCostCodeSchema.parse(data);
};

/**
 * Validate update cost code input
 */
export const validateUpdateCostCode = (data: unknown) => {
  return updateCostCodeSchema.parse(data);
};

/**
 * Validate cost code filters
 */
export const validateCostCodeFilters = (data: unknown) => {
  return costCodeFiltersSchema.parse(data);
};

/**
 * Validate query parameters
 */
export const validateQueryParams = (data: unknown) => {
  return costCodeQueryParamsSchema.parse(data);
};

/**
 * Validate UUID parameter
 */
export const validateIdParam = (data: unknown) => {
  return idParamSchema.parse(data);
};

/**
 * Safe parse with error formatting
 */
export const safeParseWithErrors = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
    
    return { success: false, errors };
  }
  
  return { success: true, data: result.data };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createCostCode: createCostCodeSchema,
  updateCostCode: updateCostCodeSchema,
  bulkCreateCostCode: bulkCreateCostCodeSchema,
  filters: costCodeFiltersSchema,
  pagination: paginationSchema,
  queryParams: costCodeQueryParamsSchema,
  idParam: idParamSchema,
  validate: {
    createCostCode: validateCreateCostCode,
    updateCostCode: validateUpdateCostCode,
    filters: validateCostCodeFilters,
    queryParams: validateQueryParams,
    idParam: validateIdParam,
  },
  safeParse: safeParseWithErrors,
};