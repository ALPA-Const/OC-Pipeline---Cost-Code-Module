-- Migration: Enable Row Level Security (RLS)
-- Description: Implements RLS policies to ensure data isolation per organization
-- Author: OC Pipeline Team
-- Date: 2025-12-02

BEGIN;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_code_databases ENABLE ROW LEVEL SECURITY;
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
-- SECURITY NOTES
-- ============================================================================
-- 1. All policies use auth.user_org_id() to ensure organization-level isolation
-- 2. Standard databases are readable by all authenticated users
-- 3. Admin role is required to manage cost code databases
-- 4. Users can only create/modify data within their own organization
-- 5. Adjust auth.user_org_id() function based on your authentication setup
-- 6. Consider adding more granular permissions (e.g., read-only users)
--
-- IMPORTANT: Update auth.user_org_id() function to match your auth system:
-- - If using Supabase Auth with custom claims
-- - If using JWT with specific structure
-- - If using a separate user_organizations table