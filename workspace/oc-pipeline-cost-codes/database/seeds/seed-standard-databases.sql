-- Seed: Standard Cost Code Databases
-- Description: Populates standard cost code databases (CSI MasterFormat, Uniformat, etc.)
-- Author: OC Pipeline Team
-- Date: 2025-12-02

BEGIN;

-- ============================================================================
-- INSERT STANDARD DATABASES
-- ============================================================================
INSERT INTO cost_code_databases (id, name, description, version, is_standard)
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'CSI MasterFormat 2020',
        'Construction Specifications Institute MasterFormat - Industry standard for organizing construction specifications and cost data',
        '2020',
        true
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'Uniformat II',
        'ASTM Uniformat II - Classification for building elements, organized by functional systems',
        'E1557-20',
        true
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        'R.S. Means',
        'R.S. Means Cost Data - Comprehensive construction cost database',
        '2024',
        true
    )
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SAMPLE CSI MASTERFORMAT CODES (Division 00-01)
-- TODO: Add complete MasterFormat hierarchy
-- ============================================================================
INSERT INTO cost_codes (organization_id, database_id, code, title, description, level, parent_id, is_active)
SELECT
    '00000000-0000-0000-0000-000000000000'::uuid, -- System organization
    '00000000-0000-0000-0000-000000000001'::uuid,
    code,
    title,
    description,
    level,
    NULL,
    true
FROM (VALUES
    ('00', 'Procurement and Contracting Requirements', 'General project requirements and bidding procedures', 1),
    ('01', 'General Requirements', 'Administrative and procedural requirements for construction', 1),
    ('02', 'Existing Conditions', 'Assessment and remediation of existing site conditions', 1),
    ('03', 'Concrete', 'Cast-in-place and precast concrete work', 1),
    ('04', 'Masonry', 'Unit masonry, stone, and masonry restoration', 1),
    ('05', 'Metals', 'Structural and miscellaneous metal work', 1),
    ('06', 'Wood, Plastics, and Composites', 'Rough and finish carpentry, architectural woodwork', 1),
    ('07', 'Thermal and Moisture Protection', 'Waterproofing, insulation, roofing, and siding', 1),
    ('08', 'Openings', 'Doors, windows, and glazing systems', 1),
    ('09', 'Finishes', 'Interior finishes including drywall, flooring, and painting', 1),
    ('10', 'Specialties', 'Specialized construction items and equipment', 1),
    ('21', 'Fire Suppression', 'Fire protection systems and equipment', 1),
    ('22', 'Plumbing', 'Plumbing fixtures, piping, and equipment', 1),
    ('23', 'HVAC', 'Heating, ventilation, and air conditioning systems', 1),
    ('26', 'Electrical', 'Electrical systems, lighting, and power distribution', 1),
    ('27', 'Communications', 'Data, voice, and communication systems', 1),
    ('28', 'Electronic Safety and Security', 'Security and monitoring systems', 1),
    ('31', 'Earthwork', 'Site clearing, excavation, and grading', 1),
    ('32', 'Exterior Improvements', 'Paving, landscaping, and site amenities', 1),
    ('33', 'Utilities', 'Water, sewer, and utility distribution systems', 1)
) AS t(code, title, description, level)
ON CONFLICT (organization_id, code) DO NOTHING;

-- ============================================================================
-- SAMPLE UNIFORMAT II CODES (Level 1)
-- TODO: Add complete Uniformat hierarchy
-- ============================================================================
INSERT INTO cost_codes (organization_id, database_id, code, title, description, level, parent_id, is_active)
SELECT
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    code,
    title,
    description,
    level,
    NULL,
    true
FROM (VALUES
    ('A', 'Substructure', 'Foundation and basement construction', 1),
    ('B', 'Shell', 'Superstructure, exterior closure, and roofing', 1),
    ('C', 'Interiors', 'Interior construction and finishes', 1),
    ('D', 'Services', 'Conveying, plumbing, HVAC, fire protection, and electrical', 1),
    ('E', 'Equipment and Furnishings', 'Equipment, furnishings, and special construction', 1),
    ('F', 'Special Construction and Demolition', 'Special construction systems and selective demolition', 1),
    ('G', 'Building Sitework', 'Site preparation, improvements, and utilities', 1),
    ('Z', 'General', 'General requirements and conditions', 1)
) AS t(code, title, description, level)
ON CONFLICT (organization_id, code) DO NOTHING;

COMMIT;

-- ============================================================================
-- NOTES FOR IMPLEMENTATION
-- ============================================================================
-- TODO: Add complete hierarchical structure for each standard database
-- TODO: Consider creating a separate script for each major database
-- TODO: Add Level 2 and Level 3 codes with proper parent_id relationships
-- TODO: Implement a data import utility for large datasets
-- TODO: Add validation to ensure code uniqueness within each database