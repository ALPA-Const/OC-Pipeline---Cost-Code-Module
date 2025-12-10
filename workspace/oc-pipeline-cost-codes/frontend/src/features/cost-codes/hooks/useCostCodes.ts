/**
 * Cost Codes Hook
 * React hook for managing cost code state and operations
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { useState, useEffect, useCallback } from 'react';
import { costCodeApi } from '../api/cost-code-api';
import {
  CostCodeWithRelations,
  CreateCostCodeRequest,
  UpdateCostCodeRequest,
  CostCodeQueryParams,
  PaginatedResponse,
} from '../types/cost-code.types';

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

interface UseCostCodesReturn {
  // Data
  costCodes: CostCodeWithRelations[];
  pagination: PaginatedResponse<CostCodeWithRelations>['pagination'] | null;
  selectedCostCode: CostCodeWithRelations | null;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchCostCodes: (params?: CostCodeQueryParams) => Promise<void>;
  fetchCostCodeById: (id: string) => Promise<void>;
  createCostCode: (data: CreateCostCodeRequest) => Promise<void>;
  updateCostCode: (id: string, data: UpdateCostCodeRequest) => Promise<void>;
  deleteCostCode: (id: string) => Promise<void>;
  refreshCostCodes: () => Promise<void>;
  clearError: () => void;
  clearSelection: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export const useCostCodes = (initialParams?: CostCodeQueryParams): UseCostCodesReturn => {
  const [costCodes, setCostCodes] = useState<CostCodeWithRelations[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<CostCodeWithRelations>['pagination'] | null>(null);
  const [selectedCostCode, setSelectedCostCode] = useState<CostCodeWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastParams, setLastParams] = useState<CostCodeQueryParams | undefined>(initialParams);

  /**
   * Fetch cost codes with params
   */
  const fetchCostCodes = useCallback(async (params?: CostCodeQueryParams) => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = params || lastParams || {};
      setLastParams(queryParams);
      
      const response = await costCodeApi.getCostCodes(queryParams);
      setCostCodes(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cost codes');
      console.error('Fetch cost codes error:', err);
    } finally {
      setLoading(false);
    }
  }, [lastParams]);

  /**
   * Fetch a single cost code by ID
   */
  const fetchCostCodeById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const costCode = await costCodeApi.getCostCodeById(id);
      setSelectedCostCode(costCode);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cost code');
      console.error('Fetch cost code by ID error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new cost code
   */
  const createCostCode = useCallback(async (data: CreateCostCodeRequest) => {
    try {
      setLoading(true);
      setError(null);
      await costCodeApi.createCostCode(data);
      // Refresh the list after creation
      await fetchCostCodes(lastParams);
    } catch (err: any) {
      setError(err.message || 'Failed to create cost code');
      console.error('Create cost code error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCostCodes, lastParams]);

  /**
   * Update an existing cost code
   */
  const updateCostCode = useCallback(async (id: string, data: UpdateCostCodeRequest) => {
    try {
      setLoading(true);
      setError(null);
      await costCodeApi.updateCostCode(id, data);
      // Refresh the list after update
      await fetchCostCodes(lastParams);
      // Update selected cost code if it's the one being edited
      if (selectedCostCode?.id === id) {
        await fetchCostCodeById(id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update cost code');
      console.error('Update cost code error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCostCodes, fetchCostCodeById, lastParams, selectedCostCode]);

  /**
   * Delete a cost code
   */
  const deleteCostCode = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await costCodeApi.deleteCostCode(id);
      // Refresh the list after deletion
      await fetchCostCodes(lastParams);
      // Clear selection if deleted cost code was selected
      if (selectedCostCode?.id === id) {
        setSelectedCostCode(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete cost code');
      console.error('Delete cost code error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCostCodes, lastParams, selectedCostCode]);

  /**
   * Refresh cost codes with last used params
   */
  const refreshCostCodes = useCallback(async () => {
    await fetchCostCodes(lastParams);
  }, [fetchCostCodes, lastParams]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear selected cost code
   */
  const clearSelection = useCallback(() => {
    setSelectedCostCode(null);
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchCostCodes(initialParams);
  }, []); // Only run once on mount

  return {
    costCodes,
    pagination,
    selectedCostCode,
    loading,
    error,
    fetchCostCodes,
    fetchCostCodeById,
    createCostCode,
    updateCostCode,
    deleteCostCode,
    refreshCostCodes,
    clearError,
    clearSelection,
  };
};