/**
 * Cost Code Type Definitions
 * TypeScript types and interfaces for the Cost Code module
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Cost code tier levels
 */
export type CostCodeTier = 'parent' | 'child';

/**
 * Cost code status
 */
export type CostCodeStatus = 'active' | 'archived';

/**
 * Cost code source/origin
 */
export type CostCodeSource = 'manual' | 'csi_2016' | 'nahb' | 'csv_import' | 'system';

// ============================================================================
// DATABASE ENTITIES
// ============================================================================

/**
 * Cost Code entity (matches database schema)
 */
export interface CostCode {
  id: string;
  org_id: string;
  tier: CostCodeTier;
  parent_id: string | null;
  code_number: string;
  code_name: string;
  status: CostCodeStatus;
  available_in_time_cards: boolean;
  source: CostCodeSource;
  import_batch_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

/**
 * Cost Code with parent information
 */
export interface CostCodeWithParent extends CostCode {
  parent?: CostCode | null;
}

/**
 * Cost Code with children
 */
export interface CostCodeWithChildren extends CostCode {
  children?: CostCode[];
}

/**
 * Cost Code with full hierarchy
 */
export interface CostCodeWithHierarchy extends CostCode {
  parent?: CostCode | null;
  children?: CostCode[];
  depth?: number;
  path?: string[];
}

// ============================================================================
// INPUT TYPES (FOR CREATE/UPDATE)
// ============================================================================

/**
 * Input for creating a new cost code
 */
export interface CreateCostCodeInput {
  tier: CostCodeTier;
  parent_id?: string | null;
  code_number: string;
  code_name: string;
  status?: CostCodeStatus;
  available_in_time_cards?: boolean;
  source: CostCodeSource;
  import_batch_id?: string | null;
}

/**
 * Input for updating an existing cost code
 */
export interface UpdateCostCodeInput {
  tier?: CostCodeTier;
  parent_id?: string | null;
  code_number?: string;
  code_name?: string;
  status?: CostCodeStatus;
  available_in_time_cards?: boolean;
}

/**
 * Input for bulk creating cost codes
 */
export interface BulkCreateCostCodeInput {
  cost_codes: CreateCostCodeInput[];
  import_batch_id?: string;
}

// ============================================================================
// FILTER/QUERY TYPES
// ============================================================================

/**
 * Filters for querying cost codes
 */
export interface CostCodeFilters {
  search?: string;
  tier?: CostCodeTier;
  parent_id?: string | null;
  status?: CostCodeStatus;
  available_in_time_cards?: boolean;
  source?: CostCodeSource;
  import_batch_id?: string;
  code_numbers?: string[];
  created_by?: string;
  updated_by?: string;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Complete query parameters
 */
export interface CostCodeQueryParams extends CostCodeFilters, PaginationParams {}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * Cost code response with pagination
 */
export type CostCodeListResponse = PaginatedResponse<CostCode>;

/**
 * Tree node for hierarchical view
 */
export interface CostCodeTreeNode extends CostCode {
  children: CostCodeTreeNode[];
  depth: number;
  has_children: boolean;
}

/**
 * Statistics for cost codes
 */
export interface CostCodeStats {
  total: number;
  active: number;
  archived: number;
  parents: number;
  children: number;
  by_source: Record<CostCodeSource, number>;
  available_in_time_cards: number;
}

// ============================================================================
// IMPORT TYPES
// ============================================================================

/**
 * Import batch information
 */
export interface ImportBatch {
  id: string;
  org_id: string;
  source: CostCodeSource;
  total_records: number;
  successful_records: number;
  failed_records: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_log?: ImportError[];
  imported_by: string;
  created_at: string;
  completed_at?: string;
}

/**
 * Import error details
 */
export interface ImportError {
  row?: number;
  code_number?: string;
  message: string;
  details?: any;
}

/**
 * Import summary
 */
export interface ImportSummary {
  batch_id: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  errors: ImportError[];
  duration_ms: number;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  is_valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Code number validation result
 */
export interface CodeNumberValidation {
  is_valid: boolean;
  is_duplicate: boolean;
  suggested_number?: string;
}

// ============================================================================
// SERVICE CONTEXT
// ============================================================================

/**
 * Request context with user and org information
 */
export interface RequestContext {
  user_id: string;
  org_id: string;
  access_token?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Partial update type (all fields optional)
 */
export type PartialCostCode = Partial<CostCode>;

/**
 * Cost code without system fields
 */
export type CostCodePublic = Omit<
  CostCode,
  'created_by' | 'updated_by' | 'import_batch_id'
>;

/**
 * Cost code creation payload
 */
export type CostCodeCreatePayload = CreateCostCodeInput & {
  org_id: string;
  created_by: string;
};

/**
 * Cost code update payload
 */
export type CostCodeUpdatePayload = UpdateCostCodeInput & {
  updated_by: string;
};