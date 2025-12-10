/**
 * Cost Code Type Definitions
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

export type CostCodeTier = 'parent' | 'child';
export type CostCodeStatus = 'active' | 'archived';
export type CostCodeSource = 'manual' | 'csi_2016' | 'nahb' | 'csv_import' | 'system';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

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
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CostCodeWithChildren extends CostCode {
  children: CostCode[];
}

export interface CreateCostCodeDTO {
  tier: CostCodeTier;
  parent_id?: string | null;
  code_number: string;
  code_name: string;
  available_in_time_cards?: boolean;
  source?: CostCodeSource;
}

export interface UpdateCostCodeDTO {
  code_number?: string;
  code_name?: string;
  status?: CostCodeStatus;
  available_in_time_cards?: boolean;
  parent_id?: string | null;
}

export interface CostCodeQueryParams {
  status?: CostCodeStatus;
  tier?: CostCodeTier;
  parent_id?: string;
  available_in_time_cards?: boolean;
  source?: CostCodeSource;
  search?: string;
}

export interface CostCodeImport {
  id: string;
  org_id: string;
  import_type: 'standard' | 'csv';
  source_name: string;
  status: ImportStatus;
  total_rows: number;
  successful_imports: number;
  duplicate_skips: number;
  errors: string[];
  created_by: string;
  created_at: string;
  completed_at: string | null;
}

export interface ImportFromStandardDTO {
  database_name: 'csi_2016' | 'nahb';
  code_numbers?: string[];
}

export interface ImportSummary {
  import_id: string;
  status: 'completed' | 'failed';
  total_rows: number;
  successful_imports: number;
  duplicate_skips: number;
  errors: string[];
  duration_ms: number;
}