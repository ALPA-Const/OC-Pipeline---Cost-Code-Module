/**
 * Shared TypeScript Types for Cost Code Module
 * Used across both frontend and backend
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum ImportType {
  STANDARD = 'standard',
  CSV = 'csv',
  MANUAL = 'manual',
}

export enum CostCodeLevel {
  DIVISION = 1,
  SECTION = 2,
  SUBSECTION = 3,
  DETAIL = 4,
}

// ============================================================================
// DATABASE ENTITIES
// ============================================================================

export interface CostCodeDatabase {
  id: string;
  name: string;
  description?: string;
  version?: string;
  is_standard: boolean;
  created_at: string;
  updated_at: string;
}

export interface CostCode {
  id: string;
  organization_id: string;
  database_id?: string;
  code: string;
  title: string;
  description?: string;
  level: number;
  parent_id?: string;
  is_active: boolean;
  sort_order: number;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CostCodeCategory {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface CostCodeImportHistory {
  id: string;
  organization_id: string;
  import_type: ImportType;
  source_name?: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  error_log?: ImportError[];
  imported_by?: string;
  created_at: string;
}

// ============================================================================
// EXTENDED TYPES (WITH RELATIONS)
// ============================================================================

export interface CostCodeWithRelations extends CostCode {
  database?: CostCodeDatabase;
  parent?: CostCode;
  children?: CostCode[];
  categories?: CostCodeCategory[];
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateCostCodeRequest {
  code: string;
  title: string;
  description?: string;
  level?: number;
  parent_id?: string;
  database_id?: string;
  is_active?: boolean;
  sort_order?: number;
  custom_fields?: Record<string, any>;
}

export interface UpdateCostCodeRequest {
  code?: string;
  title?: string;
  description?: string;
  level?: number;
  parent_id?: string;
  database_id?: string;
  is_active?: boolean;
  sort_order?: number;
  custom_fields?: Record<string, any>;
}

export interface CostCodeQueryParams {
  search?: string;
  database_id?: string;
  parent_id?: string;
  level?: number;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ============================================================================
// IMPORT TYPES
// ============================================================================

export interface ImportStandardRequest {
  database_id: string;
  overwrite_existing?: boolean;
}

export interface ImportCSVRequest {
  file: File | string; // File object in frontend, base64 string in backend
  mapping: CSVColumnMapping;
  overwrite_existing?: boolean;
}

export interface CSVColumnMapping {
  code: string | number; // Column name or index
  title: string | number;
  description?: string | number;
  level?: string | number;
  parent_code?: string | number;
}

export interface ImportError {
  row?: number;
  code?: string;
  message: string;
  details?: any;
}

export interface ImportSummary {
  import_id: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  errors: ImportError[];
  duration_ms: number;
}

export interface ValidateCostCodeRequest {
  code: string;
  title: string;
  parent_id?: string;
  exclude_id?: string; // For update validation
}

export interface ValidationResult {
  is_valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// TREE/HIERARCHY TYPES
// ============================================================================

export interface CostCodeTreeNode extends CostCode {
  children: CostCodeTreeNode[];
  depth: number;
  path: string[]; // Array of parent codes leading to this node
}

export interface BuildTreeOptions {
  max_depth?: number;
  include_inactive?: boolean;
  filter_by_database?: string;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface ExportOptions {
  format: 'csv' | 'json' | 'excel';
  include_inactive?: boolean;
  database_id?: string;
  fields?: string[];
}

export interface ExportResult {
  filename: string;
  content: string | Blob;
  mime_type: string;
}