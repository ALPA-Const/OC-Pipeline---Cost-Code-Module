/**
 * Cost Code Controller
 * HTTP request handlers for cost code endpoints
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../../shared/utils/async-handler';
import { AppError } from '../../../shared/errors/AppError';
import { logger } from '../../../shared/utils/logger';
import { costCodeService } from '../services/cost-code.service';
import { costCodeCacheService } from '../services/cache.service';
import {
  createCostCodeSchema,
  updateCostCodeSchema,
  costCodeFiltersSchema,
  validateIdParam,
} from '../schemas/cost-code.schema';
import { CostCodeFilters } from '../types/cost-code.types';

// ============================================================================
// EXTEND EXPRESS REQUEST TYPE
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        org_id: string;
      };
    }
  }
}

// ============================================================================
// COST CODE CONTROLLER CLASS
// ============================================================================

export class CostCodeController {
  /**
   * GET /api/cost-codes
   * Get all cost codes for the authenticated user's organization
   * 
   * @route GET /api/cost-codes
   * @query status - Filter by status (active, archived)
   * @query tier - Filter by tier (parent, child)
   * @query parent_id - Filter by parent ID
   * @query available_in_time_cards - Filter by time card availability
   * @query search - Search in code_number and code_name
   * @returns Cost codes in hierarchical structure
   * 
   * @example
   * GET /api/cost-codes?status=active&tier=parent
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.org_id;

    logger.info('Getting all cost codes', {
      orgId,
      query: req.query,
    });

    // Parse and validate query parameters
    const filters = costCodeFiltersSchema.parse({
      status: req.query.status,
      tier: req.query.tier,
      parent_id: req.query.parent_id,
      available_in_time_cards: req.query.available_in_time_cards === 'true',
      source: req.query.source,
      search: req.query.search,
    }) as CostCodeFilters;

    // Try to get from cache first
    const cacheStatus = filters.status || 'all';
    const cachedCodes = await costCodeCacheService.getCachedCostCodes(
      orgId,
      cacheStatus as any
    );

    if (cachedCodes) {
      logger.info('Returning cached cost codes', {
        orgId,
        count: cachedCodes.length,
      });

      return res.json({
        success: true,
        data: costCodeService.buildHierarchy(cachedCodes),
        cached: true,
      });
    }

    // Fetch from database
    const costCodes = await costCodeService.findAll(orgId, filters);

    // Cache the results (flatten hierarchy for caching)
    const flatCodes = this.flattenHierarchy(costCodes);
    await costCodeCacheService.setCachedCostCodes(orgId, cacheStatus as any, flatCodes);

    logger.info('Cost codes retrieved successfully', {
      orgId,
      count: flatCodes.length,
    });

    res.json({
      success: true,
      data: costCodes,
      cached: false,
    });
  });

  /**
   * GET /api/cost-codes/:id
   * Get a single cost code by ID
   * 
   * @route GET /api/cost-codes/:id
   * @param id - Cost code UUID
   * @returns Single cost code
   * 
   * @example
   * GET /api/cost-codes/123e4567-e89b-12d3-a456-426614174000
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.org_id;
    const { id } = validateIdParam({ id: req.params.id });

    logger.info('Getting cost code by ID', { orgId, id });

    const costCode = await costCodeService.findById(orgId, id);

    logger.info('Cost code retrieved successfully', {
      orgId,
      id,
      codeNumber: costCode.code_number,
    });

    res.json({
      success: true,
      data: costCode,
    });
  });

  /**
   * POST /api/cost-codes
   * Create a new cost code
   * 
   * @route POST /api/cost-codes
   * @body CreateCostCodeInput
   * @returns Created cost code with 201 status
   * 
   * @example
   * POST /api/cost-codes
   * Body: {
   *   "tier": "parent",
   *   "code_number": "01",
   *   "code_name": "General Requirements",
   *   "source": "manual"
   * }
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.org_id;
    const userId = req.user!.id;

    logger.info('Creating cost code', {
      orgId,
      userId,
      body: req.body,
    });

    // Validate request body
    const validatedData = createCostCodeSchema.parse(req.body);

    // Create cost code
    const costCode = await costCodeService.create(orgId, userId, validatedData);

    // Invalidate cache
    await costCodeCacheService.invalidateOrgCache(orgId);

    logger.info('Cost code created successfully', {
      orgId,
      id: costCode.id,
      codeNumber: costCode.code_number,
    });

    res.status(201).json({
      success: true,
      data: costCode,
      message: 'Cost code created successfully',
    });
  });

  /**
   * PATCH /api/cost-codes/:id
   * Update an existing cost code
   * 
   * @route PATCH /api/cost-codes/:id
   * @param id - Cost code UUID
   * @body UpdateCostCodeInput
   * @returns Updated cost code
   * 
   * @example
   * PATCH /api/cost-codes/123e4567-e89b-12d3-a456-426614174000
   * Body: {
   *   "code_name": "Updated Name",
   *   "status": "archived"
   * }
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.org_id;
    const userId = req.user!.id;
    const { id } = validateIdParam({ id: req.params.id });

    logger.info('Updating cost code', {
      orgId,
      userId,
      id,
      body: req.body,
    });

    // Validate request body
    const validatedData = updateCostCodeSchema.parse(req.body);

    // Update cost code
    const costCode = await costCodeService.update(orgId, userId, id, validatedData);

    // Invalidate cache
    await costCodeCacheService.invalidateOrgCache(orgId);

    logger.info('Cost code updated successfully', {
      orgId,
      id,
      codeNumber: costCode.code_number,
    });

    res.json({
      success: true,
      data: costCode,
      message: 'Cost code updated successfully',
    });
  });

  /**
   * DELETE /api/cost-codes/:id
   * Archive a cost code (soft delete)
   * 
   * @route DELETE /api/cost-codes/:id
   * @param id - Cost code UUID
   * @returns Archived cost code
   * 
   * @example
   * DELETE /api/cost-codes/123e4567-e89b-12d3-a456-426614174000
   */
  archive = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.org_id;
    const userId = req.user!.id;
    const { id } = validateIdParam({ id: req.params.id });

    logger.info('Archiving cost code', { orgId, userId, id });

    // Archive cost code
    const costCode = await costCodeService.archive(orgId, userId, id);

    // Invalidate cache
    await costCodeCacheService.invalidateOrgCache(orgId);

    logger.info('Cost code archived successfully', {
      orgId,
      id,
      codeNumber: costCode.code_number,
    });

    res.json({
      success: true,
      data: costCode,
      message: 'Cost code archived successfully',
    });
  });

  /**
   * GET /api/cost-codes/check-unique
   * Check if a code number is unique within the organization
   * 
   * @route GET /api/cost-codes/check-unique
   * @query code_number - Code number to check
   * @query exclude_id - Optional ID to exclude from check (for updates)
   * @returns Uniqueness validation result
   * 
   * @example
   * GET /api/cost-codes/check-unique?code_number=01
   */
  checkUnique = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.org_id;
    const codeNumber = req.query.code_number as string;
    const excludeId = req.query.exclude_id as string | undefined;

    if (!codeNumber) {
      throw AppError.badRequest('code_number query parameter is required', 'code_number');
    }

    logger.info('Checking code number uniqueness', {
      orgId,
      codeNumber,
      excludeId,
    });

    const validation = await costCodeService.checkUniqueCodeNumber(
      orgId,
      codeNumber,
      excludeId
    );

    logger.info('Code number uniqueness checked', {
      orgId,
      codeNumber,
      isUnique: validation.is_valid,
    });

    res.json({
      success: true,
      data: {
        unique: validation.is_valid,
        code_number: codeNumber,
      },
    });
  });

  /**
   * GET /api/cost-codes/export
   * Export cost codes as CSV
   * 
   * @route GET /api/cost-codes/export
   * @query status - Filter by status (optional)
   * @returns CSV file download
   * 
   * @example
   * GET /api/cost-codes/export?status=active
   */
  export = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.org_id;

    logger.info('Exporting cost codes', { orgId, query: req.query });

    // Parse filters
    const filters = costCodeFiltersSchema.parse({
      status: req.query.status,
      tier: req.query.tier,
    }) as CostCodeFilters;

    // Fetch cost codes
    const costCodes = await costCodeService.findAll(orgId, filters);

    // Flatten hierarchy for CSV export
    const flatCodes = this.flattenHierarchy(costCodes);

    // Generate CSV content
    const csv = this.generateCSV(flatCodes);

    // Set response headers
    const filename = `cost-codes-${orgId}-${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    logger.info('Cost codes exported successfully', {
      orgId,
      count: flatCodes.length,
      filename,
    });

    res.send(csv);
  });

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Flatten hierarchical cost code structure to flat array
   */
  private flattenHierarchy(costCodes: any[]): any[] {
    const result: any[] = [];

    const flatten = (codes: any[]) => {
      for (const code of codes) {
        const { children, ...codeWithoutChildren } = code;
        result.push(codeWithoutChildren);
        if (children && children.length > 0) {
          flatten(children);
        }
      }
    };

    flatten(costCodes);
    return result;
  }

  /**
   * Generate CSV content from cost codes
   */
  private generateCSV(costCodes: any[]): string {
    // CSV headers
    const headers = [
      'Code Number',
      'Code Name',
      'Tier',
      'Status',
      'Available in Time Cards',
      'Source',
      'Created At',
      'Updated At',
    ];

    // CSV rows
    const rows = costCodes.map((code) => [
      this.escapeCSV(code.code_number),
      this.escapeCSV(code.code_name),
      code.tier,
      code.status,
      code.available_in_time_cards ? 'Yes' : 'No',
      code.source,
      new Date(code.created_at).toISOString(),
      new Date(code.updated_at).toISOString(),
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Escape CSV field value
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const costCodeController = new CostCodeController();
export default costCodeController;