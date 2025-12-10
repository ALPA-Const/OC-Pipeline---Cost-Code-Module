/**
 * Frontend TypeScript Types for Cost Code Module
 * Re-exports shared types and adds frontend-specific types
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

// Re-export all shared types
export * from '../../../../../shared/types/cost-code.types';

// ============================================================================
// FRONTEND-SPECIFIC TYPES
// ============================================================================

/**
 * UI State for Cost Code List
 */
export interface CostCodeListState {
  loading: boolean;
  error: string | null;
  selectedIds: string[];
  expandedIds: string[];
  viewMode: 'list' | 'tree';
}

/**
 * UI State for Cost Code Form
 */
export interface CostCodeFormState {
  mode: 'create' | 'edit';
  loading: boolean;
  error: string | null;
}

/**
 * Import Modal State
 */
export interface ImportModalState {
  isOpen: boolean;
  step: 'select' | 'configure' | 'preview' | 'importing' | 'complete';
  type: 'standard' | 'csv' | null;
}

/**
 * Filter State
 */
export interface CostCodeFilters {
  search: string;
  database_id: string | null;
  level: number | null;
  is_active: boolean | null;
  parent_id: string | null;
}

/**
 * Sort State
 */
export interface CostCodeSort {
  field: string;
  direction: 'asc' | 'desc';
}