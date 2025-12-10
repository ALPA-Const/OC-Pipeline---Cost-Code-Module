/**
 * Cost Code Routes
 * Defines API routes for cost code operations
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { Router } from 'express';
import multer from 'multer';
import { costCodeController } from '../controllers/cost-code.controller';
import { requireAuth, requireRole } from '../../../shared/middleware/auth.middleware';
import { rateLimiter } from '../../../shared/middleware/rate-limit.middleware';

// ============================================================================
// MULTER CONFIGURATION FOR CSV UPLOADS
// ============================================================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// ============================================================================
// RATE LIMITERS
// ============================================================================

// Import operations: 5 requests per hour
const importRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many import requests. Please try again later.',
});

// ============================================================================
// CREATE ROUTER
// ============================================================================

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// ============================================================================
// PUBLIC ROUTES (READ-ONLY)
// All authenticated users can access these
// ============================================================================

/**
 * GET /api/cost-codes
 * Get all cost codes with optional filters
 */
router.get('/', costCodeController.getAll);

/**
 * GET /api/cost-codes/check-unique
 * Check if code_number is unique
 * IMPORTANT: Must come before /:id route to avoid conflict
 */
router.get('/check-unique', costCodeController.checkUnique);

/**
 * GET /api/cost-codes/export
 * Export cost codes as CSV
 * IMPORTANT: Must come before /:id route to avoid conflict
 */
router.get('/export', costCodeController.export);

/**
 * GET /api/cost-codes/:id
 * Get a single cost code by ID
 */
router.get('/:id', costCodeController.getById);

// ============================================================================
// ADMIN ROUTES (WRITE OPERATIONS)
// Only users with 'admin' role can access these
// ============================================================================

/**
 * POST /api/cost-codes
 * Create a new cost code
 */
router.post('/', requireRole('admin'), costCodeController.create);

/**
 * PATCH /api/cost-codes/:id
 * Update an existing cost code
 */
router.patch('/:id', requireRole('admin'), costCodeController.update);

/**
 * DELETE /api/cost-codes/:id
 * Archive a cost code (soft delete)
 */
router.delete('/:id', requireRole('admin'), costCodeController.archive);

// ============================================================================
// IMPORT ROUTES (ADMIN ONLY WITH RATE LIMITING)
// ============================================================================

// Note: Import controller methods would need to be created
// Placeholder comments for future implementation

/**
 * GET /api/cost-codes/standard-databases/:name
 * Get standard database codes (e.g., CSI 2016, NAHB)
 * TODO: Implement importController.getStandardDatabase
 */
// router.get(
//   '/standard-databases/:name',
//   importController.getStandardDatabase
// );

/**
 * POST /api/cost-codes/import/standard
 * Import cost codes from a standard database
 * Rate limited: 5 requests per hour
 * TODO: Implement importController.importStandard
 */
// router.post(
//   '/import/standard',
//   requireRole('admin'),
//   importRateLimiter,
//   importController.importStandard
// );

/**
 * POST /api/cost-codes/import/csv
 * Import cost codes from CSV file
 * Rate limited: 5 requests per hour
 * File upload: 5MB limit, CSV only
 * TODO: Implement importController.importCSV
 */
// router.post(
//   '/import/csv',
//   requireRole('admin'),
//   importRateLimiter,
//   upload.single('file'),
//   importController.importCSV
// );

// ============================================================================
// EXPORT ROUTER
// ============================================================================

export default router;