/**
 * Cost Code Service
 * Business logic for cost code operations
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { supabaseAdmin } from '../../config/supabase';
import { validationService } from './validation.service';
import {
  CostCode,
  CostCodeWithRelations,
  CreateCostCodeRequest,
  UpdateCostCodeRequest,
  CostCodeQueryParams,
  PaginatedResponse,
  CostCodeTreeNode,
  BuildTreeOptions,
} from '../../../../shared/types/cost-code.types';

// ============================================================================
// COST CODE SERVICE CLASS
// ============================================================================

export class CostCodeService {
  /**
   * Get all cost codes for an organization with pagination and filtering
   */
  async getCostCodes(
    organizationId: string,
    params: CostCodeQueryParams = {}
  ): Promise<PaginatedResponse<CostCodeWithRelations>> {
    const {
      search,
      database_id,
      parent_id,
      level,
      is_active,
      page = 1,
      limit = 50,
      sort_by = 'code',
      sort_order = 'asc',
    } = params;

    // Build query
    let query = supabaseAdmin
      .from('cost_codes')
      .select('*, database:cost_code_databases(*)', { count: 'exact' })
      .eq('organization_id', organizationId);

    // Apply filters
    if (search) {
      query = query.or(`code.ilike.%${search}%,title.ilike.%${search}%`);
    }
    if (database_id) {
      query = query.eq('database_id', database_id);
    }
    if (parent_id !== undefined) {
      if (parent_id === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', parent_id);
      }
    }
    if (level) {
      query = query.eq('level', level);
    }
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active);
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch cost codes: ${error.message}`);
    }

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Get a single cost code by ID
   */
  async getCostCodeById(
    organizationId: string,
    costCodeId: string
  ): Promise<CostCodeWithRelations | null> {
    const { data, error } = await supabaseAdmin
      .from('cost_codes')
      .select('*, database:cost_code_databases(*), parent:cost_codes!parent_id(*)')
      .eq('id', costCodeId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch cost code: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new cost code
   */
  async createCostCode(
    organizationId: string,
    data: CreateCostCodeRequest
  ): Promise<CostCode> {
    // Validate data
    const validation = await validationService.validateCreateRequest(organizationId, data);
    if (!validation.is_valid) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    // Prepare cost code data
    const costCodeData = {
      organization_id: organizationId,
      code: data.code,
      title: data.title,
      description: data.description,
      level: data.level || 1,
      parent_id: data.parent_id,
      database_id: data.database_id,
      is_active: data.is_active !== undefined ? data.is_active : true,
      sort_order: data.sort_order || 0,
      custom_fields: data.custom_fields || {},
    };

    const { data: costCode, error } = await supabaseAdmin
      .from('cost_codes')
      .insert(costCodeData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create cost code: ${error.message}`);
    }

    return costCode;
  }

  /**
   * Update an existing cost code
   */
  async updateCostCode(
    organizationId: string,
    costCodeId: string,
    data: UpdateCostCodeRequest
  ): Promise<CostCode> {
    // Validate data
    const validation = await validationService.validateUpdateRequest(
      organizationId,
      costCodeId,
      data
    );
    if (!validation.is_valid) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    // Update cost code
    const { data: costCode, error } = await supabaseAdmin
      .from('cost_codes')
      .update(data)
      .eq('id', costCodeId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update cost code: ${error.message}`);
    }

    return costCode;
  }

  /**
   * Delete a cost code
   */
  async deleteCostCode(organizationId: string, costCodeId: string): Promise<void> {
    // Check if cost code has children
    const { data: children } = await supabaseAdmin
      .from('cost_codes')
      .select('id')
      .eq('parent_id', costCodeId)
      .eq('organization_id', organizationId);

    if (children && children.length > 0) {
      throw new Error('Cannot delete cost code with children. Delete children first.');
    }

    const { error } = await supabaseAdmin
      .from('cost_codes')
      .delete()
      .eq('id', costCodeId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to delete cost code: ${error.message}`);
    }
  }

  /**
   * Build hierarchical tree of cost codes
   * TODO: Implement tree building logic
   */
  async buildCostCodeTree(
    organizationId: string,
    options: BuildTreeOptions = {}
  ): Promise<CostCodeTreeNode[]> {
    // TODO: Implement tree building
    // 1. Fetch all cost codes
    // 2. Build parent-child relationships
    // 3. Calculate depth and path
    // 4. Return root nodes with nested children

    const { data: costCodes, error } = await supabaseAdmin
      .from('cost_codes')
      .select('*')
      .eq('organization_id', organizationId)
      .order('sort_order', { ascending: true })
      .order('code', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch cost codes for tree: ${error.message}`);
    }

    // Simple implementation: return root nodes only
    // TODO: Build complete tree structure
    return (costCodes || [])
      .filter(cc => !cc.parent_id)
      .map(cc => ({
        ...cc,
        children: [],
        depth: 0,
        path: [cc.code],
      }));
  }

  /**
   * Get children of a specific cost code
   */
  async getChildren(
    organizationId: string,
    parentId: string
  ): Promise<CostCode[]> {
    const { data, error } = await supabaseAdmin
      .from('cost_codes')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('parent_id', parentId)
      .order('sort_order', { ascending: true })
      .order('code', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch children: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Bulk update cost codes
   * TODO: Implement bulk update logic
   */
  async bulkUpdate(
    organizationId: string,
    updates: Array<{ id: string; data: UpdateCostCodeRequest }>
  ): Promise<void> {
    // TODO: Implement bulk update
    // Use transaction to ensure atomicity
    throw new Error('Bulk update not yet implemented');
  }

  /**
   * Bulk delete cost codes
   * TODO: Implement bulk delete logic
   */
  async bulkDelete(organizationId: string, costCodeIds: string[]): Promise<void> {
    // TODO: Implement bulk delete
    // Check for children before deleting
    // Use transaction to ensure atomicity
    throw new Error('Bulk delete not yet implemented');
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================
export const costCodeService = new CostCodeService();