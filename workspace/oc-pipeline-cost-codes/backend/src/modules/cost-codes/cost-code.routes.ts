/**
 * Cost Code Routes
 * Defines API routes for cost code operations
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { Router } from 'express';
import { costCodeController } from './cost-code.controller';
import { importController } from './import.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

// ============================================================================
// CREATE ROUTER
// ============================================================================

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// ============================================================================
// COST CODE CRUD ROUTES
// ============================================================================

/**
 * GET /api/cost-codes
 * Get all cost codes with pagination and filtering
 */
router.get('/', (req, res) => costCodeController.getCostCodes(req, res));

/**
 * GET /api/cost-codes/tree
 * Get cost code hierarchy as a tree
 */
router.get('/tree', (req, res) => costCodeController.getCostCodeTree(req, res));

/**
 * GET /api/cost-codes/:id
 * Get a single cost code by ID
 */
router.get('/:id', (req, res) => costCodeController.getCostCodeById(req, res));

/**
 * GET /api/cost-codes/:id/children
 * Get children of a specific cost code
 */
router.get('/:id/children', (req, res) => costCodeController.getChildren(req, res));

/**
 * POST /api/cost-codes
 * Create a new cost code
 */
router.post('/', (req, res) => costCodeController.createCostCode(req, res));

/**
 * PUT /api/cost-codes/:id
 * Update an existing cost code
 */
router.put('/:id', (req, res) => costCodeController.updateCostCode(req, res));

/**
 * DELETE /api/cost-codes/:id
 * Delete a cost code
 */
router.delete('/:id', (req, res) => costCodeController.deleteCostCode(req, res));

// ============================================================================
// IMPORT ROUTES
// ============================================================================

/**
 * GET /api/cost-codes/import/databases
 * Get available standard databases for import
 */
router.get('/import/databases', (req, res) =>
  importController.getStandardDatabases(req, res)
);

/**
 * GET /api/cost-codes/import/history
 * Get import history for the organization
 */
router.get('/import/history', (req, res) =>
  importController.getImportHistory(req, res)
);

/**
 * POST /api/cost-codes/import/standard
 * Import cost codes from a standard database
 */
router.post('/import/standard', (req, res) =>
  importController.importFromStandard(req, res)
);

/**
 * POST /api/cost-codes/import/csv
 * Import cost codes from CSV file
 */
router.post('/import/csv', (req, res) => importController.importFromCSV(req, res));

/**
 * POST /api/cost-codes/import/validate-csv
 * Validate CSV file before import
 */
router.post('/import/validate-csv', (req, res) =>
  importController.validateCSV(req, res)
);

// ============================================================================
// EXPORT ROUTER
// ============================================================================

export default router;