/**
 * Supabase Client Configuration
 * Provides both service role client (bypasses RLS) and user-scoped client (enforces RLS)
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error('Missing required environment variable: SUPABASE_URL');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

// ============================================================================
// SUPABASE CLIENTS
// ============================================================================

/**
 * Service role client - bypasses RLS, use with caution
 * Use for admin operations and server-side logic that needs full access
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
 * Use for operations that should be scoped to user/organization
 */
export const supabaseAnon: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create Supabase client with user context (enforces RLS)
 * @param accessToken - User's JWT access token
 * @returns Supabase client with user session
 */
export const createUserClient = (accessToken: string): SupabaseClient => {
  if (!accessToken) {
    throw AppError.unauthorized('Access token is required');
  }

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
 * Verify JWT token and extract user information
 * @param accessToken - User's JWT access token
 * @returns User object with id and metadata
 */
export const verifyToken = async (accessToken: string) => {
  try {
    const client = createUserClient(accessToken);
    const { data: { user }, error } = await client.auth.getUser();

    if (error || !user) {
      logger.warn('Token verification failed', { error: error?.message });
      throw AppError.unauthorized('Invalid or expired token');
    }

    return user;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Token verification error', { error });
    throw AppError.unauthorized('Failed to verify token');
  }
};

/**
 * Extract organization ID from JWT token
 * @param accessToken - User's JWT access token
 * @returns Organization ID
 */
export const getOrgIdFromToken = async (accessToken: string): Promise<string> => {
  try {
    const user = await verifyToken(accessToken);

    // Extract org_id from user metadata
    const orgId = user.user_metadata?.org_id || user.app_metadata?.org_id;

    if (!orgId) {
      logger.warn('No org_id found in token', { userId: user.id });
      throw AppError.forbidden('Organization ID not found in token');
    }

    return orgId;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Failed to extract org_id from token', { error });
    throw AppError.unauthorized('Failed to extract organization ID');
  }
};

/**
 * Extract user ID from JWT token
 * @param accessToken - User's JWT access token
 * @returns User ID
 */
export const getUserIdFromToken = async (accessToken: string): Promise<string> => {
  try {
    const user = await verifyToken(accessToken);
    return user.id;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Failed to extract user_id from token', { error });
    throw AppError.unauthorized('Failed to extract user ID');
  }
};

/**
 * Extract both user ID and org ID from token
 * @param accessToken - User's JWT access token
 * @returns Object with userId and orgId
 */
export const getTokenContext = async (
  accessToken: string
): Promise<{ userId: string; orgId: string }> => {
  try {
    const user = await verifyToken(accessToken);
    const orgId = user.user_metadata?.org_id || user.app_metadata?.org_id;

    if (!orgId) {
      throw AppError.forbidden('Organization ID not found in token');
    }

    return {
      userId: user.id,
      orgId,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Failed to extract token context', { error });
    throw AppError.unauthorized('Failed to extract token context');
  }
};

/**
 * Health check for Supabase connection
 * @returns True if connection is healthy
 */
export const checkSupabaseHealth = async (): Promise<boolean> => {
  try {
    const { error } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .limit(1);

    if (error) {
      logger.error('Supabase health check failed', { error: error.message });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Supabase health check error', { error });
    return false;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================
export default {
  admin: supabaseAdmin,
  anon: supabaseAnon,
  createUserClient,
  verifyToken,
  getOrgIdFromToken,
  getUserIdFromToken,
  getTokenContext,
  checkHealth: checkSupabaseHealth,
};