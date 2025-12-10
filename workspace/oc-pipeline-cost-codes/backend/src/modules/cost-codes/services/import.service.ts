/**
 * Cost Code Import Service
 * Handles importing cost codes from standard databases and CSV files
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { createReadStream, unlinkSync } from 'fs';
import { parse } from 'csv-parser';
import { supabaseAdmin } from '../../../shared/database/supabase.client';
import { costCodeCacheService } from './cache.service';
import { AppError } from '../../../shared/errors/AppError';
import { logger } from '../../../shared/utils/logger';
import { CostCode, CostCodeTier, CostCodeSource } from '../types/cost-code.types';

// ============================================================================
// TYPES
// ============================================================================

type StandardDatabase = 'csi_2016' | 'nahb';

interface ImportRecord {
  id: string;
  org_id: string;
  import_type: 'standard' | 'csv';
  source_name: string;
  status: 'processing' | 'completed' | 'failed';
  total_rows: number;
  successful_imports: number;
  duplicate_skips: number;
  errors: any[];
  created_by: string;
  created_at: string;
  completed_at?: string;
}

interface ImportSummary {
  import_id: string;
  status: 'completed' | 'failed';
  total_rows: number;
  successful_imports: number;
  duplicate_skips: number;
  errors: string[];
  duration_ms: number;
}

interface CSVRow {
  parent_code?: string;
  parent_name?: string;
  child_code?: string;
  child_name?: string;
}

interface ParsedCostCode {
  tier: CostCodeTier;
  code_number: string;
  code_name: string;
  parent_code_number?: string;
}

// ============================================================================
// COST CODE IMPORT SERVICE CLASS
// ============================================================================

export class CostCodeImportService {
  /**
   * Get standard database codes with caching
   * 
   * @param databaseName - Name of the standard database
   * @returns Hierarchical cost code structure
   */
  async getStandardDatabaseCodes(
    databaseName: StandardDatabase
  ): Promise<CostCode[]> {
    try {
      logger.info('Getting standard database codes', { databaseName });

      // Try cache first (24hr TTL)
      const cachedCodes = await costCodeCacheService.getStandardDatabaseCodes(
        databaseName
      );

      if (cachedCodes) {
        logger.info('Returning cached standard database codes', {
          databaseName,
          count: cachedCodes.length,
        });
        return this.buildHierarchy(cachedCodes);
      }

      // Query from database
      const { data: codes, error } = await supabaseAdmin
        .from('cost_code_standard_databases')
        .select('*')
        .eq('database_name', databaseName)
        .eq('status', 'active')
        .order('code_number', { ascending: true });

      if (error) {
        logger.error('Failed to fetch standard database codes', {
          databaseName,
          error: error.message,
        });
        throw AppError.internal('Failed to fetch standard database codes');
      }

      if (!codes || codes.length === 0) {
        throw AppError.notFound(
          `Standard database '${databaseName}' not found or empty`
        );
      }

      // Cache the results
      await costCodeCacheService.setStandardDatabaseCodes(databaseName, codes);

      logger.info('Standard database codes fetched successfully', {
        databaseName,
        count: codes.length,
      });

      return this.buildHierarchy(codes);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting standard database codes', {
        databaseName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw AppError.internal('Failed to get standard database codes');
    }
  }

  /**
   * Import cost codes from a standard database
   * 
   * @param orgId - Organization ID
   * @param userId - User ID performing the import
   * @param databaseName - Standard database name
   * @param codeNumbers - Array of code numbers to import (optional, imports all if not provided)
   * @returns Import summary
   */
  async importFromStandard(
    orgId: string,
    userId: string,
    databaseName: StandardDatabase,
    codeNumbers?: string[]
  ): Promise<ImportSummary> {
    const startTime = Date.now();
    let importRecord: ImportRecord | null = null;

    try {
      logger.info('Starting standard database import', {
        orgId,
        userId,
        databaseName,
        codeNumbers: codeNumbers?.length || 'all',
      });

      // Create import record
      importRecord = await this.createImportRecord(
        orgId,
        userId,
        'standard',
        databaseName
      );

      // Get standard codes
      let standardCodes = await this.getStandardDatabaseCodes(databaseName);
      const flatCodes = this.flattenHierarchy(standardCodes);

      // Filter by code numbers if provided
      const codesToImport = codeNumbers
        ? flatCodes.filter((code) => codeNumbers.includes(code.code_number))
        : flatCodes;

      if (codesToImport.length === 0) {
        throw AppError.badRequest('No codes found to import');
      }

      // Get existing codes in organization
      const { data: existingCodes } = await supabaseAdmin
        .from('cost_codes')
        .select('code_number')
        .eq('org_id', orgId);

      const existingCodeNumbers = new Set(
        existingCodes?.map((c) => c.code_number) || []
      );

      // Track import results
      let successfulImports = 0;
      let duplicateSkips = 0;
      const errors: string[] = [];

      // Import codes
      for (const code of codesToImport) {
        try {
          // Skip if already exists
          if (existingCodeNumbers.has(code.code_number)) {
            duplicateSkips++;
            logger.debug('Skipping duplicate code', {
              codeNumber: code.code_number,
            });
            continue;
          }

          // Insert code
          const { error: insertError } = await supabaseAdmin
            .from('cost_codes')
            .insert({
              org_id: orgId,
              tier: code.tier,
              code_number: code.code_number,
              code_name: code.code_name,
              parent_id: code.parent_id || null,
              source: databaseName as CostCodeSource,
              available_in_time_cards: code.available_in_time_cards ?? true,
              status: 'active',
              created_by: userId,
              updated_by: userId,
            });

          if (insertError) {
            errors.push(
              `Code ${code.code_number}: ${insertError.message}`
            );
            logger.warn('Failed to import code', {
              codeNumber: code.code_number,
              error: insertError.message,
            });
          } else {
            successfulImports++;
          }
        } catch (error) {
          errors.push(
            `Code ${code.code_number}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }

      // Update import record
      await this.updateImportRecord(importRecord.id, {
        status: errors.length > 0 && successfulImports === 0 ? 'failed' : 'completed',
        total_rows: codesToImport.length,
        successful_imports: successfulImports,
        duplicate_skips: duplicateSkips,
        errors: errors,
      });

      // Invalidate cache
      await costCodeCacheService.invalidateOrgCache(orgId);

      const duration = Date.now() - startTime;

      logger.info('Standard database import completed', {
        orgId,
        databaseName,
        successfulImports,
        duplicateSkips,
        errors: errors.length,
        duration,
      });

      return {
        import_id: importRecord.id,
        status: errors.length > 0 && successfulImports === 0 ? 'failed' : 'completed',
        total_rows: codesToImport.length,
        successful_imports: successfulImports,
        duplicate_skips: duplicateSkips,
        errors: errors,
        duration_ms: duration,
      };
    } catch (error) {
      // Update import record as failed
      if (importRecord) {
        await this.updateImportRecord(importRecord.id, {
          status: 'failed',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        });
      }

      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Standard database import failed', {
        orgId,
        databaseName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw AppError.internal('Failed to import from standard database');
    }
  }

  /**
   * Import cost codes from CSV file
   * 
   * @param orgId - Organization ID
   * @param userId - User ID performing the import
   * @param filePath - Path to uploaded CSV file
   * @returns Import summary
   */
  async importFromCSV(
    orgId: string,
    userId: string,
    filePath: string
  ): Promise<ImportSummary> {
    const startTime = Date.now();
    let importRecord: ImportRecord | null = null;

    try {
      logger.info('Starting CSV import', { orgId, userId, filePath });

      // Create import record
      importRecord = await this.createImportRecord(
        orgId,
        userId,
        'csv',
        'csv_upload'
      );

      // Parse CSV
      const rows = await this.parseCSV(filePath);

      if (rows.length === 0) {
        throw AppError.badRequest('CSV file is empty');
      }

      // Validate and parse rows
      const parsedCodes = this.validateAndParseCSV(rows);

      // Get existing codes
      const { data: existingCodes } = await supabaseAdmin
        .from('cost_codes')
        .select('code_number')
        .eq('org_id', orgId);

      const existingCodeNumbers = new Set(
        existingCodes?.map((c) => c.code_number) || []
      );

      // Track results
      let successfulImports = 0;
      let duplicateSkips = 0;
      const errors: string[] = [];

      // Create parent codes first
      const parentCodes = parsedCodes.filter((c) => c.tier === 'parent');
      const childCodes = parsedCodes.filter((c) => c.tier === 'child');

      // Import parent codes
      for (const code of parentCodes) {
        try {
          if (existingCodeNumbers.has(code.code_number)) {
            duplicateSkips++;
            continue;
          }

          const { error: insertError } = await supabaseAdmin
            .from('cost_codes')
            .insert({
              org_id: orgId,
              tier: code.tier,
              code_number: code.code_number,
              code_name: code.code_name,
              parent_id: null,
              source: 'manual' as CostCodeSource,
              available_in_time_cards: true,
              status: 'active',
              created_by: userId,
              updated_by: userId,
            });

          if (insertError) {
            errors.push(`Parent ${code.code_number}: ${insertError.message}`);
          } else {
            successfulImports++;
          }
        } catch (error) {
          errors.push(
            `Parent ${code.code_number}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }

      // Get parent IDs for child codes
      const { data: parentRecords } = await supabaseAdmin
        .from('cost_codes')
        .select('id, code_number')
        .eq('org_id', orgId)
        .eq('tier', 'parent');

      const parentIdMap = new Map(
        parentRecords?.map((p) => [p.code_number, p.id]) || []
      );

      // Import child codes
      for (const code of childCodes) {
        try {
          if (existingCodeNumbers.has(code.code_number)) {
            duplicateSkips++;
            continue;
          }

          const parentId = code.parent_code_number
            ? parentIdMap.get(code.parent_code_number)
            : null;

          if (!parentId && code.parent_code_number) {
            errors.push(
              `Child ${code.code_number}: Parent code ${code.parent_code_number} not found`
            );
            continue;
          }

          const { error: insertError } = await supabaseAdmin
            .from('cost_codes')
            .insert({
              org_id: orgId,
              tier: code.tier,
              code_number: code.code_number,
              code_name: code.code_name,
              parent_id: parentId,
              source: 'manual' as CostCodeSource,
              available_in_time_cards: true,
              status: 'active',
              created_by: userId,
              updated_by: userId,
            });

          if (insertError) {
            errors.push(`Child ${code.code_number}: ${insertError.message}`);
          } else {
            successfulImports++;
          }
        } catch (error) {
          errors.push(
            `Child ${code.code_number}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }

      // Update import record
      await this.updateImportRecord(importRecord.id, {
        status: errors.length > 0 && successfulImports === 0 ? 'failed' : 'completed',
        total_rows: parsedCodes.length,
        successful_imports: successfulImports,
        duplicate_skips: duplicateSkips,
        errors: errors,
      });

      // Delete uploaded file
      try {
        unlinkSync(filePath);
        logger.debug('Deleted uploaded CSV file', { filePath });
      } catch (error) {
        logger.warn('Failed to delete uploaded file', {
          filePath,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Invalidate cache
      await costCodeCacheService.invalidateOrgCache(orgId);

      const duration = Date.now() - startTime;

      logger.info('CSV import completed', {
        orgId,
        successfulImports,
        duplicateSkips,
        errors: errors.length,
        duration,
      });

      return {
        import_id: importRecord.id,
        status: errors.length > 0 && successfulImports === 0 ? 'failed' : 'completed',
        total_rows: parsedCodes.length,
        successful_imports: successfulImports,
        duplicate_skips: duplicateSkips,
        errors: errors,
        duration_ms: duration,
      };
    } catch (error) {
      // Update import record as failed
      if (importRecord) {
        await this.updateImportRecord(importRecord.id, {
          status: 'failed',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        });
      }

      // Clean up file
      try {
        unlinkSync(filePath);
      } catch {}

      if (error instanceof AppError) {
        throw error;
      }

      logger.error('CSV import failed', {
        orgId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw AppError.internal('Failed to import from CSV');
    }
  }

  /**
   * Get import history for an organization
   * 
   * @param orgId - Organization ID
   * @returns Array of import records
   */
  async getImportHistory(orgId: string): Promise<ImportRecord[]> {
    try {
      logger.info('Getting import history', { orgId });

      const { data: imports, error } = await supabaseAdmin
        .from('cost_code_imports')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch import history', {
          orgId,
          error: error.message,
        });
        throw AppError.internal('Failed to fetch import history');
      }

      logger.info('Import history fetched successfully', {
        orgId,
        count: imports?.length || 0,
      });

      return imports || [];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting import history', {
        orgId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw AppError.internal('Failed to get import history');
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Create an import record
   */
  private async createImportRecord(
    orgId: string,
    userId: string,
    importType: 'standard' | 'csv',
    sourceName: string
  ): Promise<ImportRecord> {
    const { data, error } = await supabaseAdmin
      .from('cost_code_imports')
      .insert({
        org_id: orgId,
        import_type: importType,
        source_name: sourceName,
        status: 'processing',
        total_rows: 0,
        successful_imports: 0,
        duplicate_skips: 0,
        errors: [],
        created_by: userId,
      })
      .select()
      .single();

    if (error || !data) {
      throw AppError.internal('Failed to create import record');
    }

    return data as ImportRecord;
  }

  /**
   * Update an import record
   */
  private async updateImportRecord(
    importId: string,
    updates: Partial<ImportRecord>
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('cost_code_imports')
      .update({
        ...updates,
        completed_at: updates.status === 'completed' || updates.status === 'failed' 
          ? new Date().toISOString() 
          : undefined,
      })
      .eq('id', importId);

    if (error) {
      logger.error('Failed to update import record', {
        importId,
        error: error.message,
      });
    }
  }

  /**
   * Parse CSV file
   */
  private async parseCSV(filePath: string): Promise<CSVRow[]> {
    return new Promise((resolve, reject) => {
      const rows: CSVRow[] = [];

      createReadStream(filePath)
        .pipe(parse({ headers: true, skipEmptyLines: true }))
        .on('data', (row: any) => {
          rows.push({
            parent_code: row['Parent Code']?.trim(),
            parent_name: row['Parent Name']?.trim(),
            child_code: row['Child Code']?.trim(),
            child_name: row['Child Name']?.trim(),
          });
        })
        .on('end', () => resolve(rows))
        .on('error', (error) => reject(error));
    });
  }

  /**
   * Validate and parse CSV rows
   */
  private validateAndParseCSV(rows: CSVRow[]): ParsedCostCode[] {
    const parsedCodes: ParsedCostCode[] = [];
    const seenCodes = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 for header and 0-index

      // Parent code
      if (row.parent_code && row.parent_name) {
        if (!seenCodes.has(row.parent_code)) {
          parsedCodes.push({
            tier: 'parent',
            code_number: row.parent_code,
            code_name: row.parent_name,
          });
          seenCodes.add(row.parent_code);
        }
      }

      // Child code
      if (row.child_code && row.child_name) {
        if (!row.parent_code) {
          throw AppError.badRequest(
            `Row ${rowNum}: Child code requires a parent code`
          );
        }

        if (!seenCodes.has(row.child_code)) {
          parsedCodes.push({
            tier: 'child',
            code_number: row.child_code,
            code_name: row.child_name,
            parent_code_number: row.parent_code,
          });
          seenCodes.add(row.child_code);
        }
      }

      // Validate row has at least one code
      if (!row.parent_code && !row.child_code) {
        throw AppError.badRequest(
          `Row ${rowNum}: Must contain at least a parent or child code`
        );
      }
    }

    return parsedCodes;
  }

  /**
   * Build hierarchical structure from flat array
   */
  private buildHierarchy(codes: any[]): any[] {
    const parentMap = new Map<string, any>();
    const result: any[] = [];

    // First pass: create parent map
    for (const code of codes) {
      if (code.tier === 'parent') {
        parentMap.set(code.id, { ...code, children: [] });
      }
    }

    // Second pass: attach children and collect roots
    for (const code of codes) {
      if (code.tier === 'parent') {
        result.push(parentMap.get(code.id)!);
      } else if (code.tier === 'child' && code.parent_id) {
        const parent = parentMap.get(code.parent_id);
        if (parent) {
          parent.children.push(code);
        }
      }
    }

    return result;
  }

  /**
   * Flatten hierarchical structure
   */
  private flattenHierarchy(codes: any[]): any[] {
    const result: any[] = [];

    const flatten = (codeList: any[]) => {
      for (const code of codeList) {
        const { children, ...codeWithoutChildren } = code;
        result.push(codeWithoutChildren);
        if (children && children.length > 0) {
          flatten(children);
        }
      }
    };

    flatten(codes);
    return result;
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const costCodeImportService = new CostCodeImportService();
export default costCodeImportService;