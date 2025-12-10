-- Migration: Create Cost Code Tables
-- Description: Creates the main tables for cost code management system
-- Author: OC Pipeline Team
-- Date: 2025-12-02

BEGIN;

-- ============================================================================
-- CREATE ENUMS
-- ============================================================================

-- Tier enum for cost code hierarchy
CREATE TYPE cost_code_tier AS ENUM ('parent', 'child');

-- Status enum for cost code lifecycle
CREATE TYPE cost_code_status AS ENUM ('active', 'archived');

-- Source enum for tracking cost code origin
CREATE TYPE cost_code_source AS ENUM ('manual', 'csi_2016', 'nahb', 'csv_import');

-- ============================================================================
-- ORGANIZATIONS TABLE (if not exists)
-- Assuming this table exists in your system, but creating it for reference
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- COST CODES TABLE
-- Main table storing all cost codes with hierarchical structure
-- ============================================================================
CREATE TABLE IF NOT EXISTS cost_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tier cost_code_tier NOT NULL,
    parent_id UUID REFERENCES cost_codes(id) ON DELETE CASCADE,
    code_number VARCHAR(50) NOT NULL,
    code_name VARCHAR(255) NOT NULL,
    status cost_code_status DEFAULT 'active' NOT NULL,
    available_in_time_cards BOOLEAN DEFAULT false NOT NULL,
    source cost_code_source NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Unique constraint: one code_number per organization
    CONSTRAINT unique_org_code_number UNIQUE(org_id, code_number),
    
    -- Check constraint: parent codes must have NULL parent_id
    CONSTRAINT check_parent_tier CHECK (
        (tier = 'parent' AND parent_id IS NULL) OR
        (tier = 'child' AND parent_id IS NOT NULL)
    ),
    
    -- Check constraint: parent_id must reference a parent tier code
    CONSTRAINT check_parent_reference CHECK (
        parent_id IS NULL OR
        EXISTS (
            SELECT 1 FROM cost_codes pc
            WHERE pc.id = parent_id AND pc.tier = 'parent'
        )
    )
);

-- ============================================================================
-- COST CODE DATABASES TABLE
-- Stores different cost code database types (e.g., CSI MasterFormat, NAHB)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cost_code_databases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    version VARCHAR(50),
    is_standard BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- COST CODE IMPORT HISTORY TABLE
-- Tracks all import operations for auditing
-- ============================================================================
CREATE TABLE IF NOT EXISTS cost_code_import_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    import_type VARCHAR(50) NOT NULL, -- 'standard', 'csv', 'manual'
    source_name VARCHAR(255),
    total_records INTEGER DEFAULT 0,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    error_log JSONB DEFAULT '[]'::jsonb,
    imported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- COST CODE CATEGORIES TABLE (Optional - for additional organization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cost_code_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_org_category_name UNIQUE(org_id, name)
);

-- ============================================================================
-- COST CODE CATEGORY MAPPINGS TABLE
-- Many-to-many relationship between cost codes and categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS cost_code_category_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cost_code_id UUID REFERENCES cost_codes(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES cost_code_categories(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_cost_code_category UNIQUE(cost_code_id, category_id)
);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- Automatically update updated_at timestamp on record modification
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_codes_updated_at 
    BEFORE UPDATE ON cost_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_code_databases_updated_at 
    BEFORE UPDATE ON cost_code_databases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_code_categories_updated_at 
    BEFORE UPDATE ON cost_code_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE cost_codes IS 'Stores organizational cost codes with hierarchical parent-child structure';
COMMENT ON COLUMN cost_codes.tier IS 'Defines hierarchy level: parent (top-level) or child (sub-code)';
COMMENT ON COLUMN cost_codes.parent_id IS 'References parent cost code; NULL for parent tier, required for child tier';
COMMENT ON COLUMN cost_codes.code_number IS 'Unique identifier code within organization (e.g., 01, 01.01)';
COMMENT ON COLUMN cost_codes.code_name IS 'Human-readable name/description of the cost code';
COMMENT ON COLUMN cost_codes.status IS 'Current status: active (in use) or archived (historical)';
COMMENT ON COLUMN cost_codes.available_in_time_cards IS 'Whether this code can be used in time tracking';
COMMENT ON COLUMN cost_codes.source IS 'Origin of the cost code: manual entry, imported from standard database, or CSV';
COMMENT ON CONSTRAINT unique_org_code_number ON cost_codes IS 'Ensures code_number is unique within each organization';
COMMENT ON CONSTRAINT check_parent_tier ON cost_codes IS 'Enforces parent codes have NULL parent_id, child codes require parent_id';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these after migration to verify)
-- ============================================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'cost%';
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'cost_codes';
-- SELECT conname, contype, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'cost_codes'::regclass;