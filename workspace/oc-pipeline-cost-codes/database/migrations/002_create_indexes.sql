-- Migration: Create Indexes for Cost Code Tables
-- Description: Adds indexes to improve query performance
-- Author: OC Pipeline Team
-- Date: 2025-12-02

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
-- PERFORMANCE NOTES
-- ============================================================================
-- 1. The composite indexes (org_id + other_column) support queries filtering by org_id first
-- 2. Partial indexes (WHERE clauses) reduce index size for common filtered queries
-- 3. GIN index on text search enables fast full-text search on code names and numbers
-- 4. DESC indexes on timestamps optimize "recent first" queries
-- 5. Foreign key columns are indexed to speed up JOIN operations