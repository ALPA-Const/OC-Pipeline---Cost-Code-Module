/**
 * Import Service for Cost Codes
 * Handles importing cost codes from various sources
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { supabaseAdmin } from '../../config/supabase';
import { costCodeService } from './cost-code.service';
import {
  ImportType,
  ImportStandardRequest,
  ImportCSVRequest,
  ImportSummary,
  ImportError,
  CreateCostCodeRequest,
} from '../../../../shared/types/cost-code.types';

// ============================================================================
// IMPORT SERVICE CLASS
// ============================================================================

export class ImportService {
  /**
   * Import cost codes from a standard database
   */
  async importFromStandard(
    organizationId: string,
    request: ImportStandardRequest
  ): Promise<ImportSummary> {
    const startTime = Date.now();
    const errors: ImportError[] = [];
    let successCount = 0;
    let failCount = 0;

    try {
      // Fetch standard cost codes from the selected database
      const { data: standardCodes, error } = await supabaseAdmin
        .from('cost_codes')
        .select('*')
        .eq('database_id', request.database_id)
        .eq('organization_id', '00000000-0000-0000-0000-000000000000'); // System org

      if (error) {
        throw new Error(`Failed to fetch standard codes: ${error.message}`);
      }

      if (!standardCodes || standardCodes.length === 0) {
        throw new Error('No standard codes found for the selected database');
      }

      // Check if user already has codes from this database
      if (!request.overwrite_existing) {
        const { data: existing } = await supabaseAdmin
          .from('cost_codes')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('database_id', request.database_id)
          .limit(1);

        if (existing && existing.length > 0) {
          throw new Error(
            'Cost codes from this database already exist. Use overwrite option to replace.'
          );
        }
      } else {
        // Delete existing codes from this database
        await supabaseAdmin
          .from('cost_codes')
          .delete()
          .eq('organization_id', organizationId)
          .eq('database_id', request.database_id);
      }

      // Import codes
      for (const standardCode of standardCodes) {
        try {
          const costCodeData: CreateCostCodeRequest = {
            code: standardCode.code,
            title: standardCode.title,
            description: standardCode.description,
            level: standardCode.level,
            database_id: request.database_id,
            is_active: true,
            sort_order: standardCode.sort_order,
          };

          await costCodeService.createCostCode(organizationId, costCodeData);
          successCount++;
        } catch (error: any) {
          failCount++;
          errors.push({
            code: standardCode.code,
            message: error.message,
            details: standardCode,
          });
        }
      }

      // Record import history
      const importId = await this.recordImportHistory(
        organizationId,
        ImportType.STANDARD,
        request.database_id,
        standardCodes.length,
        successCount,
        failCount,
        errors
      );

      return {
        import_id: importId,
        total_records: standardCodes.length,
        successful_records: successCount,
        failed_records: failCount,
        errors,
        duration_ms: Date.now() - startTime,
      };
    } catch (error: any) {
      throw new Error(`Import from standard failed: ${error.message}`);
    }
  }

  /**
   * Import cost codes from CSV
   * TODO: Implement CSV parsing and import logic
   */
  async importFromCSV(
    organizationId: string,
    request: ImportCSVRequest
  ): Promise<ImportSummary> {
    const startTime = Date.now();
    const errors: ImportError[] = [];
    let successCount = 0;
    let failCount = 0;

    try {
      // TODO: Parse CSV file
      // 1. Read CSV content (from File or base64 string)
      // 2. Parse rows using CSV parser library
      // 3. Map columns according to request.mapping
      // 4. Validate each row
      // 5. Import valid rows

      // Placeholder implementation
      const rows: any[] = []; // TODO: Parse CSV

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          // TODO: Map row to CreateCostCodeRequest
          const costCodeData: CreateCostCodeRequest = {
            code: row[request.mapping.code],
            title: row[request.mapping.title],
            description: request.mapping.description
              ? row[request.mapping.description]
              : undefined,
            level: request.mapping.level ? parseInt(row[request.mapping.level]) : 1,
          };

          await costCodeService.createCostCode(organizationId, costCodeData);
          successCount++;
        } catch (error: any) {
          failCount++;
          errors.push({
            row: i + 1,
            message: error.message,
            details: row,
          });
        }
      }

      // Record import history
      const importId = await this.recordImportHistory(
        organizationId,
        ImportType.CSV,
        'CSV Import',
        rows.length,
        successCount,
        failCount,
        errors
      );

      return {
        import_id: importId,
        total_records: rows.length,
        successful_records: successCount,
        failed_records: failCount,
        errors,
        duration_ms: Date.now() - startTime,
      };
    } catch (error: any) {
      throw new Error(`CSV import failed: ${error.message}`);
    }
  }

  /**
   * Get import history for an organization
   */
  async getImportHistory(organizationId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('cost_code_import_history')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch import history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Record import operation in history
   */
  private async recordImportHistory(
    organizationId: string,
    importType: ImportType,
    sourceName: string,
    totalRecords: number,
    successfulRecords: number,
    failedRecords: number,
    errors: ImportError[]
  ): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('cost_code_import_history')
      .insert({
        organization_id: organizationId,
        import_type: importType,
        source_name: sourceName,
        total_records: totalRecords,
        successful_records: successfulRecords,
        failed_records: failedRecords,
        error_log: errors,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to record import history:', error);
      return 'unknown';
    }

    return data.id;
  }

  /**
   * Get available standard databases
   */
  async getStandardDatabases(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('cost_code_databases')
      .select('*')
      .eq('is_standard', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch standard databases: ${error.message}`);
    }

    return data || [];
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================
export const importService = new ImportService();