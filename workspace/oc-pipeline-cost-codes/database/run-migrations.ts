/**
 * Database Migration Runner
 * Executes SQL migration files in order
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config();

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
 * Execute SQL migration
 */
async function executeMigration(filename: string, sql: string): Promise<void> {
  console.log(`\n📄 Running migration: ${filename}`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      const { error: queryError } = await supabase.from('_migrations').select('*').limit(1);
      
      if (queryError && queryError.message.includes('does not exist')) {
        console.log('   ℹ️  Using alternative execution method...');
        
        // Split SQL into individual statements and execute them
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
          const { error: stmtError } = await supabase.rpc('exec', { sql: statement });
          if (stmtError) {
            throw stmtError;
          }
        }
      } else {
        throw error;
      }
    }
    
    console.log(`   ✅ Migration completed: ${filename}`);
  } catch (err: any) {
    console.error(`   ❌ Migration failed: ${filename}`);
    throw err;
  }
}

// ============================================================================
// MAIN MIGRATION FUNCTION
// ============================================================================

async function runMigrations(): Promise<void> {
  console.log('🚀 Starting database migrations...\n');
  console.log(`Total migrations to run: ${MIGRATIONS.length}`);

  try {
    for (let i = 0; i < MIGRATIONS.length; i++) {
      const filename = MIGRATIONS[i];
      const sql = readMigrationFile(filename);
      
      await executeMigration(filename, sql);
    }

    console.log('\n✅ All migrations completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration process failed:', error);
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