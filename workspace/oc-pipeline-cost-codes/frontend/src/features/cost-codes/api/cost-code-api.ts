/**
 * Cost Code API Client
 * Handles all API calls to the backend
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import {
  CostCode,
  CostCodeWithRelations,
  CreateCostCodeRequest,
  UpdateCostCodeRequest,
  CostCodeQueryParams,
  PaginatedResponse,
  ImportStandardRequest,
  ImportCSVRequest,
  ImportSummary,
  CostCodeDatabase,
  CostCodeImportHistory,
  CostCodeTreeNode,
  BuildTreeOptions,
} from '../types/cost-code.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const API_ENDPOINT = `${API_BASE_URL}/api/cost-codes`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get authorization header with JWT token
 */
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Handle API response
 */
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred',
    }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Build query string from params
 */
const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
};

// ============================================================================
// COST CODE API
// ============================================================================

export const costCodeApi = {
  /**
   * Get all cost codes with pagination and filtering
   */
  getCostCodes: async (
    params: CostCodeQueryParams = {}
  ): Promise<PaginatedResponse<CostCodeWithRelations>> => {
    const queryString = buildQueryString(params);
    const response = await fetch(`${API_ENDPOINT}?${queryString}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<PaginatedResponse<CostCodeWithRelations>>(response);
  },

  /**
   * Get a single cost code by ID
   */
  getCostCodeById: async (id: string): Promise<CostCodeWithRelations> => {
    const response = await fetch(`${API_ENDPOINT}/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<CostCodeWithRelations>(response);
  },

  /**
   * Create a new cost code
   */
  createCostCode: async (data: CreateCostCodeRequest): Promise<CostCode> => {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<CostCode>(response);
  },

  /**
   * Update an existing cost code
   */
  updateCostCode: async (id: string, data: UpdateCostCodeRequest): Promise<CostCode> => {
    const response = await fetch(`${API_ENDPOINT}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<CostCode>(response);
  },

  /**
   * Delete a cost code
   */
  deleteCostCode: async (id: string): Promise<void> => {
    const response = await fetch(`${API_ENDPOINT}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Failed to delete cost code',
      }));
      throw new Error(error.message);
    }
  },

  /**
   * Get cost code hierarchy as a tree
   */
  getCostCodeTree: async (options: BuildTreeOptions = {}): Promise<CostCodeTreeNode[]> => {
    const queryString = buildQueryString(options);
    const response = await fetch(`${API_ENDPOINT}/tree?${queryString}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<CostCodeTreeNode[]>(response);
  },

  /**
   * Get children of a specific cost code
   */
  getChildren: async (parentId: string): Promise<CostCode[]> => {
    const response = await fetch(`${API_ENDPOINT}/${parentId}/children`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<CostCode[]>(response);
  },
};

// ============================================================================
// IMPORT API
// ============================================================================

export const importApi = {
  /**
   * Get available standard databases
   */
  getStandardDatabases: async (): Promise<CostCodeDatabase[]> => {
    const response = await fetch(`${API_ENDPOINT}/import/databases`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<CostCodeDatabase[]>(response);
  },

  /**
   * Import from standard database
   */
  importFromStandard: async (data: ImportStandardRequest): Promise<ImportSummary> => {
    const response = await fetch(`${API_ENDPOINT}/import/standard`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ImportSummary>(response);
  },

  /**
   * Import from CSV file
   * TODO: Implement file upload
   */
  importFromCSV: async (data: ImportCSVRequest): Promise<ImportSummary> => {
    const response = await fetch(`${API_ENDPOINT}/import/csv`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ImportSummary>(response);
  },

  /**
   * Get import history
   */
  getImportHistory: async (): Promise<CostCodeImportHistory[]> => {
    const response = await fetch(`${API_ENDPOINT}/import/history`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<CostCodeImportHistory[]>(response);
  },

  /**
   * Validate CSV before import
   * TODO: Implement CSV validation
   */
  validateCSV: async (file: File): Promise<any> => {
    // TODO: Implement file upload and validation
    throw new Error('CSV validation not yet implemented');
  },
};

export default {
  costCode: costCodeApi,
  import: importApi,
};