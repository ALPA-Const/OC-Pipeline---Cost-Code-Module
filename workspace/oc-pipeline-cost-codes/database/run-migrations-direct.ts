/**
 * Database Migration Runner - Direct SQL Execution
 * Executes SQL migration files using Supabase Management API
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

// Extract project ref from URL (e.g., https://abc123.supabase.co -> abc123)
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

// ============================================================================
// MIGRATION FILES
// ============================================================================

const MIGRATIONS = [
  '001_create_cost_code_tables.sql',
  '002_create_indexes.sql',
  '003_enable_rls.sql',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Read SQL file content
 */
function readMigrationFile(filename: string): string {
  const filePath = join(process.cwd(), 'database', 'migrations', filename);
  return readFileSync(filePath, 'utf-8');
}

/**
 * Execute SQL using Supabase Management API
 */
async function executeSql(sql: string): Promise<any> {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}

/**
 * Execute migration file
 */
async function executeMigration(filename: string): Promise<void> {
  console.log(`\n📄 Running migration: ${filename}`);
  
  try {
    const sql = readMigrationFile(filename);
    await executeSql(sql);
    console.log(`   ✅ Migration completed: ${filename}`);
  } catch (err: any) {
    console.error(`   ❌ Migration failed: ${filename}`);
    console.error(`   Error: ${err.message}`);
    throw err;
  }
}

// ============================================================================
// MAIN MIGRATION FUNCTION
// ============================================================================

async function runMigrations(): Promise<void> {
  console.log('🚀 Starting database migrations...\n');
  console.log(`Project Ref: ${projectRef}`);
  console.log(`Total migrations to run: ${MIGRATIONS.length}`);

  try {
    for (const filename of MIGRATIONS) {
      await executeMigration(filename);
    }

    console.log('\n✅ All migrations completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration process failed');
    throw error;
  }
}

// ============================================================================
// RUN MIGRATIONS
// ============================================================================

runMigrations()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });