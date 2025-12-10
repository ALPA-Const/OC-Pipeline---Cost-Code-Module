/**
 * Cost Code Controller
 * HTTP request handlers for cost code endpoints
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { Request, Response } from 'express';
import { costCodeService } from './cost-code.service';
import {
  CreateCostCodeRequest,
  UpdateCostCodeRequest,
  CostCodeQueryParams,
} from '../../../../shared/types/cost-code.types';

// ============================================================================
// COST CODE CONTROLLER CLASS
// ============================================================================

export class CostCodeController {
  /**
   * GET /api/cost-codes
   * Get all cost codes with pagination and filtering
   */
  async getCostCodes(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.id;
      const params: CostCodeQueryParams = {
        search: req.query.search as string,
        database_id: req.query.database_id as string,
        parent_id: req.query.parent_id as string,
        level: req.query.level ? parseInt(req.query.level as string) : undefined,
        is_active: req.query.is_active === 'true',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        sort_by: req.query.sort_by as string,
        sort_order: req.query.sort_order as 'asc' | 'desc',
      };

      const result = await costCodeService.getCostCodes(organizationId, params);
      res.json(result);
    } catch (error: any) {
      console.error('Get cost codes error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/cost-codes/:id
   * Get a single cost code by ID
   */
  async getCostCodeById(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.id;
      const costCodeId = req.params.id;

      const costCode = await costCodeService.getCostCodeById(organizationId, costCodeId);

      if (!costCode) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Cost code not found',
        });
        return;
      }

      res.json(costCode);
    } catch (error: any) {
      console.error('Get cost code by ID error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/cost-codes
   * Create a new cost code
   */
  async createCostCode(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.id;
      const data: CreateCostCodeRequest = req.body;

      const costCode = await costCodeService.createCostCode(organizationId, data);
      res.status(201).json(costCode);
    } catch (error: any) {
      console.error('Create cost code error:', error);
      
      if (error.message.includes('Validation failed')) {
        res.status(400).json({
          error: 'Validation Error',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/cost-codes/:id
   * Update an existing cost code
   */
  async updateCostCode(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.id;
      const costCodeId = req.params.id;
      const data: UpdateCostCodeRequest = req.body;

      const costCode = await costCodeService.updateCostCode(
        organizationId,
        costCodeId,
        data
      );

      res.json(costCode);
    } catch (error: any) {
      console.error('Update cost code error:', error);

      if (error.message.includes('Validation failed')) {
        res.status(400).json({
          error: 'Validation Error',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/cost-codes/:id
   * Delete a cost code
   */
  async deleteCostCode(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.id;
      const costCodeId = req.params.id;

      await costCodeService.deleteCostCode(organizationId, costCodeId);
      res.status(204).send();
    } catch (error: any) {
      console.error('Delete cost code error:', error);

      if (error.message.includes('Cannot delete')) {
        res.status(400).json({
          error: 'Bad Request',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/cost-codes/tree
   * Get cost code hierarchy as a tree
   */
  async getCostCodeTree(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.id;
      const options = {
        max_depth: req.query.max_depth ? parseInt(req.query.max_depth as string) : undefined,
        include_inactive: req.query.include_inactive === 'true',
        filter_by_database: req.query.database_id as string,
      };

      const tree = await costCodeService.buildCostCodeTree(organizationId, options);
      res.json(tree);
    } catch (error: any) {
      console.error('Get cost code tree error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/cost-codes/:id/children
   * Get children of a specific cost code
   */
  async getChildren(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.id;
      const parentId = req.params.id;

      const children = await costCodeService.getChildren(organizationId, parentId);
      res.json(children);
    } catch (error: any) {
      console.error('Get children error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================
export const costCodeController = new CostCodeController();