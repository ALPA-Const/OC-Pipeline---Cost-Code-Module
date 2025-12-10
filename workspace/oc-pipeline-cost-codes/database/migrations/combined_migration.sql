-- ============================================================================
-- COMBINED MIGRATION FILE
-- Description: All migrations combined into a single file for easy execution
-- Author: OC Pipeline Team
-- Date: 2025-12-02
-- ============================================================================
-- 
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/cwrjhtpycynjzeiggyhf
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Copy and paste this entire file into the SQL editor
-- 4. Click "Run" to execute all migrations at once
-- 5. After successful execution, run the seed script to populate CSI 2016 data
--
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: CREATE COST CODE TABLES
-- ============================================================================

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
-- COST CODE STANDARD DATABASES TABLE
-- Stores standard cost code databases (e.g., CSI MasterFormat, NAHB)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cost_code_standard_databases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    database_name VARCHAR(255) NOT NULL,
    tier cost_code_tier NOT NULL,
    parent_code_number VARCHAR(50),
    code_number VARCHAR(50) NOT NULL,
    code_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Unique constraint: one code per database
    CONSTRAINT unique_database_code UNIQUE(database_name, code_number)
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

CREATE TRIGGER update_cost_code_standard_databases_updated_at 
    BEFORE UPDATE ON cost_code_standard_databases
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
-- MIGRATION 2: CREATE INDEXES
-- ============================================================================

BEGIN;

-- ============================================================================
-- COST CODES INDEXES
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_cost_codes_org_id ON cost_codes(org_id);
CREATE INDEX IF NOT EXISTS idx_cost_codes_parent_id ON cost_codes(parent_id);
CREATE INDEX IF NOT EXISTS idx_cost_codes_code_number ON cost_codes(code_number);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cost_codes_org_tier ON cost_codes(org_id, tier);
CREATE INDEX IF NOT EXISTS idx_cost_codes_org_status ON cost_codes(org_id, status);
CREATE INDEX IF NOT EXISTS idx_cost_codes_org_parent ON cost_codes(org_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_cost_codes_org_code ON cost_codes(org_id, code_number);

-- Filter indexes for specific queries
CREATE INDEX IF NOT EXISTS idx_cost_codes_active ON cost_codes(org_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_cost_codes_parent_tier ON cost_codes(org_id) WHERE tier = 'parent';
CREATE INDEX IF NOT EXISTS idx_cost_codes_child_tier ON cost_codes(org_id) WHERE tier = 'child';
CREATE INDEX IF NOT EXISTS idx_cost_codes_time_cards ON cost_codes(org_id) WHERE available_in_time_cards = true;

-- Full-text search index for cost code names
CREATE INDEX IF NOT EXISTS idx_cost_codes_search ON cost_codes 
    USING gin(to_tsvector('english', code_name || ' ' || code_number));

-- Source tracking index
CREATE INDEX IF NOT EXISTS idx_cost_codes_source ON cost_codes(org_id, source);

-- Audit indexes
CREATE INDEX IF NOT EXISTS idx_cost_codes_created_by ON cost_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_cost_codes_created_at ON cost_codes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_codes_updated_at ON cost_codes(updated_at DESC);

-- ============================================================================
-- ORGANIZATIONS INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);

-- ============================================================================
-- COST CODE DATABASES INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_cost_code_databases_name ON cost_code_databases(name);
CREATE INDEX IF NOT EXISTS idx_cost_code_databases_is_standard ON cost_code_databases(is_standard);

-- ============================================================================
-- COST CODE STANDARD DATABASES INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_standard_databases_database_name ON cost_code_standard_databases(database_name);
CREATE INDEX IF NOT EXISTS idx_standard_databases_code_number ON cost_code_standard_databases(code_number);
CREATE INDEX IF NOT EXISTS idx_standard_databases_tier ON cost_code_standard_databases(tier);
CREATE INDEX IF NOT EXISTS idx_standard_databases_parent_code ON cost_code_standard_databases(parent_code_number);

-- ============================================================================
-- COST CODE IMPORT HISTORY INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_import_history_org_id ON cost_code_import_history(org_id);
CREATE INDEX IF NOT EXISTS idx_import_history_import_type ON cost_code_import_history(import_type);
CREATE INDEX IF NOT EXISTS idx_import_history_created_at ON cost_code_import_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_history_imported_by ON cost_code_import_history(imported_by);

-- ============================================================================
-- COST CODE CATEGORIES INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_cost_code_categories_org_id ON cost_code_categories(org_id);
CREATE INDEX IF NOT EXISTS idx_cost_code_categories_name ON cost_code_categories(name);

-- ============================================================================
-- COST CODE CATEGORY MAPPINGS INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_category_mappings_cost_code_id ON cost_code_category_mappings(cost_code_id);
CREATE INDEX IF NOT EXISTS idx_category_mappings_category_id ON cost_code_category_mappings(category_id);

COMMIT;

-- ============================================================================
-- MIGRATION 3: ENABLE ROW LEVEL SECURITY
-- ============================================================================

BEGIN;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_code_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_code_standard_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_code_import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_code_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_code_category_mappings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Get User's Organization ID
-- Assumes user metadata contains org_id
-- ============================================================================
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS UUID AS $$
BEGIN
    -- Get org_id from user's metadata
    -- Adjust this based on your auth setup
    RETURN (
        SELECT (auth.jwt() -> 'user_metadata' ->> 'org_id')::UUID
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ORGANIZATIONS POLICIES
-- Users can only access their own organization
-- ============================================================================
CREATE POLICY "users_read_own_org" ON organizations
    FOR SELECT
    TO authenticated
    USING (id = auth.user_org_id());

CREATE POLICY "users_update_own_org" ON organizations
    FOR UPDATE
    TO authenticated
    USING (id = auth.user_org_id())
    WITH CHECK (id = auth.user_org_id());

-- ============================================================================
-- COST CODES POLICIES
-- Users can only access cost codes from their organization
-- ============================================================================
CREATE POLICY "users_read_own_org_cost_codes" ON cost_codes
    FOR SELECT
    TO authenticated
    USING (org_id = auth.user_org_id());

CREATE POLICY "users_insert_own_org_cost_codes" ON cost_codes
    FOR INSERT
    TO authenticated
    WITH CHECK (org_id = auth.user_org_id());

CREATE POLICY "users_update_own_org_cost_codes" ON cost_codes
    FOR UPDATE
    TO authenticated
    USING (org_id = auth.user_org_id())
    WITH CHECK (org_id = auth.user_org_id());

CREATE POLICY "users_delete_own_org_cost_codes" ON cost_codes
    FOR DELETE
    TO authenticated
    USING (org_id = auth.user_org_id());

-- ============================================================================
-- COST CODE DATABASES POLICIES
-- Standard databases are readable by all authenticated users
-- ============================================================================
CREATE POLICY "users_read_standard_databases" ON cost_code_databases
    FOR SELECT
    TO authenticated
    USING (is_standard = true);

CREATE POLICY "admins_manage_databases" ON cost_code_databases
    FOR ALL
    TO authenticated
    USING (
        -- Only allow if user is admin (adjust based on your role system)
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    )
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- ============================================================================
-- COST CODE STANDARD DATABASES POLICIES
-- All authenticated users can read standard databases
-- ============================================================================
CREATE POLICY "users_read_standard_database_codes" ON cost_code_standard_databases
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "admins_manage_standard_codes" ON cost_code_standard_databases
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    )
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- ============================================================================
-- COST CODE IMPORT HISTORY POLICIES
-- Users can only access their organization's import history
-- ============================================================================
CREATE POLICY "users_read_own_org_import_history" ON cost_code_import_history
    FOR SELECT
    TO authenticated
    USING (org_id = auth.user_org_id());

CREATE POLICY "users_insert_own_org_import_history" ON cost_code_import_history
    FOR INSERT
    TO authenticated
    WITH CHECK (org_id = auth.user_org_id());

-- ============================================================================
-- COST CODE CATEGORIES POLICIES
-- Users can only access their organization's categories
-- ============================================================================
CREATE POLICY "users_read_own_org_categories" ON cost_code_categories
    FOR SELECT
    TO authenticated
    USING (org_id = auth.user_org_id());

CREATE POLICY "users_insert_own_org_categories" ON cost_code_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (org_id = auth.user_org_id());

CREATE POLICY "users_update_own_org_categories" ON cost_code_categories
    FOR UPDATE
    TO authenticated
    USING (org_id = auth.user_org_id())
    WITH CHECK (org_id = auth.user_org_id());

CREATE POLICY "users_delete_own_org_categories" ON cost_code_categories
    FOR DELETE
    TO authenticated
    USING (org_id = auth.user_org_id());

-- ============================================================================
-- COST CODE CATEGORY MAPPINGS POLICIES
-- Users can manage mappings for their organization's cost codes
-- ============================================================================
CREATE POLICY "users_read_own_org_mappings" ON cost_code_category_mappings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM cost_codes
            WHERE cost_codes.id = cost_code_category_mappings.cost_code_id
            AND cost_codes.org_id = auth.user_org_id()
        )
    );

CREATE POLICY "users_insert_own_org_mappings" ON cost_code_category_mappings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cost_codes
            WHERE cost_codes.id = cost_code_category_mappings.cost_code_id
            AND cost_codes.org_id = auth.user_org_id()
        )
    );

CREATE POLICY "users_delete_own_org_mappings" ON cost_code_category_mappings
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM cost_codes
            WHERE cost_codes.id = cost_code_category_mappings.cost_code_id
            AND cost_codes.org_id = auth.user_org_id()
        )
    );

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- ✅ All migrations have been executed successfully!
-- 
-- NEXT STEPS:
-- 1. Verify tables were created: Check the "Table Editor" in Supabase
-- 2. Run the seed script to populate CSI 2016 data:
--    cd /workspace/oc-pipeline-cost-codes && npx tsx database/seeds/csi-2016-seed.ts
-- 
-- ============================================================================