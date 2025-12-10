/**
 * Supabase Configuration
 * Initializes and exports Supabase client for backend use
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

// ============================================================================
// SUPABASE CLIENT INSTANCES
// ============================================================================

/**
 * Service role client - bypasses RLS, use with caution
 * Use for admin operations and server-side logic
 */
export const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Anonymous client - respects RLS policies
 * Use for user-scoped operations
 */
export const supabaseClient: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get Supabase client with user context
 * @param accessToken - User's JWT access token
 * @returns Supabase client with user session
 */
export const getSupabaseClientWithAuth = (accessToken: string): SupabaseClient => {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Verify user authentication and return user ID
 * @param accessToken - User's JWT access token
 * @returns User ID if authenticated, null otherwise
 */
export const verifyAuth = async (accessToken: string): Promise<string | null> => {
  try {
    const client = getSupabaseClientWithAuth(accessToken);
    const { data: { user }, error } = await client.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user.id;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================
export default {
  admin: supabaseAdmin,
  client: supabaseClient,
  getClientWithAuth: getSupabaseClientWithAuth,
  verifyAuth,
};