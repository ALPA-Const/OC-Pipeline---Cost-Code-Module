/**
 * Cost Code Service Layer
 * Business logic for cost code operations
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { supabaseAdmin } from '../../../shared/database/supabase.client';
import { AppError } from '../../../shared/errors/AppError';
import { logger } from '../../../shared/utils/logger';
import {
  CostCode,
  CostCodeWithChildren,
  CreateCostCodeInput,
  UpdateCostCodeInput,
  CostCodeFilters,
  CodeNumberValidation,
} from '../types/cost-code.types';

// ============================================================================
// COST CODE SERVICE CLASS
// ============================================================================

export class CostCodeService {
  /**
   * Find all cost codes for an organization with optional filters
   * Returns hierarchical structure with parents and nested children
   * 
   * @param orgId - Organization ID
   * @param filters - Optional filters (status, tier, parent_id, available_in_time_cards)
   * @returns Array of cost codes in hierarchical structure
   * 
   * @example
   * const costCodes = await costCodeService.findAll('org-123', { status: 'active' });
   */
  async findAll(
    orgId: string,
    filters: CostCodeFilters = {}
  ): Promise<CostCodeWithChildren[]> {
    try {
      logger.info('Finding all cost codes', { orgId, filters });

      // Build query
      let query = supabaseAdmin
        .from('cost_codes')
        .select('*')
        .eq('org_id', orgId)
        .order('code_number', { ascending: true });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.tier) {
        query = query.eq('tier', filters.tier);
      }

      if (filters.parent_id !== undefined) {
        if (filters.parent_id === null) {
          query = query.is('parent_id', null);
        } else {
          query = query.eq('parent_id', filters.parent_id);
        }
      }

      if (filters.available_in_time_cards !== undefined) {
        query = query.eq('available_in_time_cards', filters.available_in_time_cards);
      }

      if (filters.source) {
        query = query.eq('source', filters.source);
      }

      if (filters.search) {
        query = query.or(
          `code_number.ilike.%${filters.search}%,code_name.ilike.%${filters.search}%`
        );
      }

      // Execute query
      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch cost codes', { orgId, error: error.message });
        throw AppError.internal('Failed to fetch cost codes');
      }

      if (!data || data.length === 0) {
        logger.info('No cost codes found', { orgId, filters });
        return [];
      }

      // Build hierarchical structure
      const hierarchy = this.buildHierarchy(data as CostCode[]);

      logger.info('Cost codes fetched successfully', {
        orgId,
        count: data.length,
        hierarchyCount: hierarchy.length,
      });

      return hierarchy;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error in findAll', { orgId, error });
      throw AppError.internal('Failed to fetch cost codes');
    }
  }

  /**
   * Find a single cost code by ID
   * 
   * @param orgId - Organization ID
   * @param id - Cost code ID
   * @returns Cost code if found
   * @throws AppError.notFound if cost code doesn't exist
   * 
   * @example
   * const costCode = await costCodeService.findById('org-123', 'code-456');
   */
  async findById(orgId: string, id: string): Promise<CostCode> {
    try {
      logger.info('Finding cost code by ID', { orgId, id });

      const { data, error } = await supabaseAdmin
        .from('cost_codes')
        .select('*')
        .eq('id', id)
        .eq('org_id', orgId)
        .single();

      if (error || !data) {
        logger.warn('Cost code not found', { orgId, id, error: error?.message });
        throw AppError.costCodeNotFound();
      }

      logger.info('Cost code found', { orgId, id, codeNumber: data.code_number });
      return data as CostCode;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error in findById', { orgId, id, error });
      throw AppError.internal('Failed to fetch cost code');
    }
  }

  /**
   * Create a new cost code
   * Validates uniqueness of code_number within organization
   * 
   * @param orgId - Organization ID
   * @param userId - User ID creating the code
   * @param data - Cost code creation data
   * @returns Created cost code
   * @throws AppError.conflict if code_number already exists
   * @throws AppError.invalidParentCode if parent_id is invalid
   * 
   * @example
   * const newCode = await costCodeService.create('org-123', 'user-456', {
   *   tier: 'parent',
   *   code_number: '01',
   *   code_name: 'General Requirements',
   *   source: 'manual'
   * });
   */
  async create(
    orgId: string,
    userId: string,
    data: CreateCostCodeInput
  ): Promise<CostCode> {
    try {
      logger.info('Creating cost code', { orgId, userId, codeNumber: data.code_number });

      // Check code_number uniqueness
      const isUnique = await this.checkUniqueCodeNumber(orgId, data.code_number);
      if (!isUnique.is_valid) {
        logger.warn('Duplicate code number', { orgId, codeNumber: data.code_number });
        throw AppError.duplicateCostCode(data.code_number);
      }

      // Validate parent_id if provided
      if (data.parent_id) {
        const parent = await this.findById(orgId, data.parent_id);
        
        // Ensure parent is actually a parent tier
        if (parent.tier !== 'parent') {
          logger.warn('Invalid parent tier', {
            orgId,
            parentId: data.parent_id,
            parentTier: parent.tier,
          });
          throw AppError.invalidParentCode('Parent must have tier "parent"');
        }
      }

      // Prepare cost code data
      const costCodeData = {
        org_id: orgId,
        tier: data.tier,
        parent_id: data.parent_id || null,
        code_number: data.code_number,
        code_name: data.code_name,
        status: data.status || 'active',
        available_in_time_cards: data.available_in_time_cards || false,
        source: data.source || 'manual',
        import_batch_id: data.import_batch_id || null,
        created_by: userId,
        updated_by: userId,
      };

      // Insert into database
      const { data: createdCode, error } = await supabaseAdmin
        .from('cost_codes')
        .insert(costCodeData)
        .select()
        .single();

      if (error || !createdCode) {
        logger.error('Failed to create cost code', {
          orgId,
          error: error?.message,
        });
        throw AppError.internal('Failed to create cost code');
      }

      logger.info('Cost code created successfully', {
        orgId,
        id: createdCode.id,
        codeNumber: createdCode.code_number,
      });

      return createdCode as CostCode;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error in create', { orgId, error });
      throw AppError.internal('Failed to create cost code');
    }
  }

  /**
   * Update an existing cost code
   * Validates code exists, belongs to org, and code_number uniqueness if changed
   * 
   * @param orgId - Organization ID
   * @param userId - User ID updating the code
   * @param id - Cost code ID to update
   * @param data - Update data
   * @returns Updated cost code
   * @throws AppError.notFound if cost code doesn't exist
   * @throws AppError.conflict if new code_number already exists
   * 
   * @example
   * const updated = await costCodeService.update('org-123', 'user-456', 'code-789', {
   *   code_name: 'Updated Name',
   *   status: 'archived'
   * });
   */
  async update(
    orgId: string,
    userId: string,
    id: string,
    data: UpdateCostCodeInput
  ): Promise<CostCode> {
    try {
      logger.info('Updating cost code', { orgId, userId, id });

      // Verify cost code exists and belongs to org
      const existingCode = await this.findById(orgId, id);

      // Check code_number uniqueness if being changed
      if (data.code_number && data.code_number !== existingCode.code_number) {
        const isUnique = await this.checkUniqueCodeNumber(orgId, data.code_number, id);
        if (!isUnique.is_valid) {
          logger.warn('Duplicate code number on update', {
            orgId,
            id,
            codeNumber: data.code_number,
          });
          throw AppError.duplicateCostCode(data.code_number);
        }
      }

      // Validate parent_id if being changed
      if (data.parent_id !== undefined && data.parent_id !== existingCode.parent_id) {
        if (data.parent_id !== null) {
          // Check parent exists
          const parent = await this.findById(orgId, data.parent_id);
          
          // Ensure parent is actually a parent tier
          if (parent.tier !== 'parent') {
            throw AppError.invalidParentCode('Parent must have tier "parent"');
          }

          // Prevent circular reference (setting parent to self)
          if (data.parent_id === id) {
            throw AppError.circularReference();
          }
        }
      }

      // Validate tier change
      if (data.tier && data.tier !== existingCode.tier) {
        // If changing to parent, ensure no parent_id
        if (data.tier === 'parent' && existingCode.parent_id && data.parent_id === undefined) {
          throw AppError.badRequest(
            'Cannot change to parent tier without removing parent_id',
            'tier'
          );
        }

        // If changing to child, ensure parent_id exists
        if (data.tier === 'child' && !existingCode.parent_id && data.parent_id === undefined) {
          throw AppError.badRequest(
            'Cannot change to child tier without setting parent_id',
            'tier'
          );
        }

        // If changing from parent to child, check for existing children
        if (existingCode.tier === 'parent' && data.tier === 'child') {
          const { data: children } = await supabaseAdmin
            .from('cost_codes')
            .select('id')
            .eq('parent_id', id)
            .limit(1);

          if (children && children.length > 0) {
            throw AppError.badRequest(
              'Cannot change parent code to child while it has children',
              'tier'
            );
          }
        }
      }

      // Prepare update data
      const updateData = {
        ...data,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      };

      // Update in database
      const { data: updatedCode, error } = await supabaseAdmin
        .from('cost_codes')
        .update(updateData)
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();

      if (error || !updatedCode) {
        logger.error('Failed to update cost code', {
          orgId,
          id,
          error: error?.message,
        });
        throw AppError.internal('Failed to update cost code');
      }

      logger.info('Cost code updated successfully', {
        orgId,
        id,
        codeNumber: updatedCode.code_number,
      });

      return updatedCode as CostCode;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error in update', { orgId, id, error });
      throw AppError.internal('Failed to update cost code');
    }
  }

  /**
   * Archive a cost code (soft delete)
   * Sets status to 'archived' instead of deleting
   * 
   * @param orgId - Organization ID
   * @param userId - User ID archiving the code
   * @param id - Cost code ID to archive
   * @returns Archived cost code
   * @throws AppError.notFound if cost code doesn't exist
   * 
   * @example
   * const archived = await costCodeService.archive('org-123', 'user-456', 'code-789');
   */
  async archive(orgId: string, userId: string, id: string): Promise<CostCode> {
    try {
      logger.info('Archiving cost code', { orgId, userId, id });

      // Verify cost code exists
      await this.findById(orgId, id);

      // Update status to archived
      const { data: archivedCode, error } = await supabaseAdmin
        .from('cost_codes')
        .update({
          status: 'archived',
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();

      if (error || !archivedCode) {
        logger.error('Failed to archive cost code', {
          orgId,
          id,
          error: error?.message,
        });
        throw AppError.internal('Failed to archive cost code');
      }

      logger.info('Cost code archived successfully', {
        orgId,
        id,
        codeNumber: archivedCode.code_number,
      });

      return archivedCode as CostCode;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error in archive', { orgId, id, error });
      throw AppError.internal('Failed to archive cost code');
    }
  }

  /**
   * Check if code_number is unique within organization
   * 
   * @param orgId - Organization ID
   * @param codeNumber - Code number to check
   * @param excludeId - Optional ID to exclude from check (for updates)
   * @returns Validation result with uniqueness status
   * 
   * @example
   * const validation = await costCodeService.checkUniqueCodeNumber('org-123', '01');
   * if (!validation.is_valid) {
   *   console.log('Code number already exists');
   * }
   */
  async checkUniqueCodeNumber(
    orgId: string,
    codeNumber: string,
    excludeId?: string
  ): Promise<CodeNumberValidation> {
    try {
      let query = supabaseAdmin
        .from('cost_codes')
        .select('id, code_number')
        .eq('org_id', orgId)
        .eq('code_number', codeNumber);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to check code number uniqueness', {
          orgId,
          codeNumber,
          error: error.message,
        });
        throw AppError.internal('Failed to validate code number');
      }

      const isDuplicate = data && data.length > 0;

      return {
        is_valid: !isDuplicate,
        is_duplicate: isDuplicate,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error in checkUniqueCodeNumber', { orgId, codeNumber, error });
      throw AppError.internal('Failed to validate code number');
    }
  }

  /**
   * Build hierarchical structure from flat array of cost codes
   * Parents will have a 'children' array containing their child codes
   * 
   * @param codes - Flat array of cost codes
   * @returns Hierarchical array with parents and nested children
   * 
   * @example
   * const flatCodes = await fetchAllCodes();
   * const hierarchy = costCodeService.buildHierarchy(flatCodes);
   * // Result: [{ ...parentCode, children: [{ ...childCode }] }]
   */
  buildHierarchy(codes: CostCode[]): CostCodeWithChildren[] {
    try {
      // Create a map for quick lookup
      const codeMap = new Map<string, CostCodeWithChildren>();
      const rootCodes: CostCodeWithChildren[] = [];

      // First pass: Create map and initialize children arrays
      codes.forEach((code) => {
        codeMap.set(code.id, { ...code, children: [] });
      });

      // Second pass: Build hierarchy
      codes.forEach((code) => {
        const codeWithChildren = codeMap.get(code.id)!;

        if (code.parent_id) {
          // This is a child code, add to parent's children
          const parent = codeMap.get(code.parent_id);
          if (parent) {
            parent.children!.push(codeWithChildren);
          } else {
            // Parent not found in current set, treat as root
            rootCodes.push(codeWithChildren);
          }
        } else {
          // This is a parent code (no parent_id)
          rootCodes.push(codeWithChildren);
        }
      });

      // Sort children within each parent by code_number
      rootCodes.forEach((parent) => {
        if (parent.children && parent.children.length > 0) {
          parent.children.sort((a, b) =>
            a.code_number.localeCompare(b.code_number, undefined, { numeric: true })
          );
        }
      });

      // Sort root codes by code_number
      rootCodes.sort((a, b) =>
        a.code_number.localeCompare(b.code_number, undefined, { numeric: true })
      );

      logger.debug('Hierarchy built', {
        totalCodes: codes.length,
        rootCodes: rootCodes.length,
      });

      return rootCodes;
    } catch (error) {
      logger.error('Error building hierarchy', { error });
      // Return flat structure if hierarchy building fails
      return codes.map((code) => ({ ...code, children: [] }));
    }
  }

  /**
   * Get all child codes for a specific parent
   * 
   * @param orgId - Organization ID
   * @param parentId - Parent cost code ID
   * @returns Array of child cost codes
   * 
   * @example
   * const children = await costCodeService.getChildren('org-123', 'parent-456');
   */
  async getChildren(orgId: string, parentId: string): Promise<CostCode[]> {
    try {
      logger.info('Getting child codes', { orgId, parentId });

      const { data, error } = await supabaseAdmin
        .from('cost_codes')
        .select('*')
        .eq('org_id', orgId)
        .eq('parent_id', parentId)
        .order('code_number', { ascending: true });

      if (error) {
        logger.error('Failed to fetch child codes', {
          orgId,
          parentId,
          error: error.message,
        });
        throw AppError.internal('Failed to fetch child codes');
      }

      logger.info('Child codes fetched', {
        orgId,
        parentId,
        count: data?.length || 0,
      });

      return (data as CostCode[]) || [];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error in getChildren', { orgId, parentId, error });
      throw AppError.internal('Failed to fetch child codes');
    }
  }

  /**
   * Check if a parent code has any children
   * 
   * @param orgId - Organization ID
   * @param parentId - Parent cost code ID
   * @returns True if parent has children
   */
  async hasChildren(orgId: string, parentId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('cost_codes')
        .select('id')
        .eq('org_id', orgId)
        .eq('parent_id', parentId)
        .limit(1);

      if (error) {
        logger.error('Failed to check for children', {
          orgId,
          parentId,
          error: error.message,
        });
        return false;
      }

      return data !== null && data.length > 0;
    } catch (error) {
      logger.error('Error in hasChildren', { orgId, parentId, error });
      return false;
    }
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const costCodeService = new CostCodeService();
export default costCodeService;