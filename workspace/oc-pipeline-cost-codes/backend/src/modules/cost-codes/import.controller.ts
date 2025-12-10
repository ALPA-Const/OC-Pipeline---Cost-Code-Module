/**
 * Import Controller
 * HTTP request handlers for cost code import endpoints
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { Request, Response } from 'express';
import { importService } from './import.service';
import {
  ImportStandardRequest,
  ImportCSVRequest,
} from '../../../../shared/types/cost-code.types';

// ============================================================================
// IMPORT CONTROLLER CLASS
// ============================================================================

export class ImportController {
  /**
   * GET /api/cost-codes/import/databases
   * Get available standard databases for import
   */
  async getStandardDatabases(req: Request, res: Response): Promise<void> {
    try {
      const databases = await importService.getStandardDatabases();
      res.json(databases);
    } catch (error: any) {
      console.error('Get standard databases error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/cost-codes/import/standard
   * Import cost codes from a standard database
   */
  async importFromStandard(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.id;
      const request: ImportStandardRequest = req.body;

      if (!request.database_id) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'database_id is required',
        });
        return;
      }

      const summary = await importService.importFromStandard(organizationId, request);
      res.json(summary);
    } catch (error: any) {
      console.error('Import from standard error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/cost-codes/import/csv
   * Import cost codes from CSV file
   * TODO: Implement file upload handling
   */
  async importFromCSV(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.id;
      
      // TODO: Handle file upload with multer or similar
      // For now, expect CSV data in request body
      const request: ImportCSVRequest = req.body;

      if (!request.file || !request.mapping) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'file and mapping are required',
        });
        return;
      }

      const summary = await importService.importFromCSV(organizationId, request);
      res.json(summary);
    } catch (error: any) {
      console.error('Import from CSV error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/cost-codes/import/history
   * Get import history for the organization
   */
  async getImportHistory(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.id;
      const history = await importService.getImportHistory(organizationId);
      res.json(history);
    } catch (error: any) {
      console.error('Get import history error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/cost-codes/import/validate-csv
   * Validate CSV file before import
   * TODO: Implement CSV validation
   */
  async validateCSV(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Validate CSV structure and data
      res.json({
        is_valid: true,
        errors: [],
        preview: [],
      });
    } catch (error: any) {
      console.error('Validate CSV error:', error);
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
export const importController = new ImportController();