/**
 * Import Cost Codes Hook
 * React hook for managing cost code import operations
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { useState, useCallback } from 'react';
import { importApi } from '../api/cost-code-api';
import {
  CostCodeDatabase,
  ImportStandardRequest,
  ImportCSVRequest,
  ImportSummary,
  CostCodeImportHistory,
} from '../types/cost-code.types';

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

interface UseImportCostCodesReturn {
  // Data
  standardDatabases: CostCodeDatabase[];
  importHistory: CostCodeImportHistory[];
  lastImportSummary: ImportSummary | null;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchStandardDatabases: () => Promise<void>;
  fetchImportHistory: () => Promise<void>;
  importFromStandard: (data: ImportStandardRequest) => Promise<ImportSummary>;
  importFromCSV: (data: ImportCSVRequest) => Promise<ImportSummary>;
  clearError: () => void;
  clearLastSummary: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export const useImportCostCodes = (): UseImportCostCodesReturn => {
  const [standardDatabases, setStandardDatabases] = useState<CostCodeDatabase[]>([]);
  const [importHistory, setImportHistory] = useState<CostCodeImportHistory[]>([]);
  const [lastImportSummary, setLastImportSummary] = useState<ImportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch available standard databases
   */
  const fetchStandardDatabases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const databases = await importApi.getStandardDatabases();
      setStandardDatabases(databases);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch standard databases');
      console.error('Fetch standard databases error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch import history
   */
  const fetchImportHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await importApi.getImportHistory();
      setImportHistory(history);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch import history');
      console.error('Fetch import history error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Import from standard database
   */
  const importFromStandard = useCallback(async (data: ImportStandardRequest): Promise<ImportSummary> => {
    try {
      setLoading(true);
      setError(null);
      const summary = await importApi.importFromStandard(data);
      setLastImportSummary(summary);
      // Refresh import history after successful import
      await fetchImportHistory();
      return summary;
    } catch (err: any) {
      setError(err.message || 'Failed to import from standard database');
      console.error('Import from standard error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchImportHistory]);

  /**
   * Import from CSV file
   */
  const importFromCSV = useCallback(async (data: ImportCSVRequest): Promise<ImportSummary> => {
    try {
      setLoading(true);
      setError(null);
      const summary = await importApi.importFromCSV(data);
      setLastImportSummary(summary);
      // Refresh import history after successful import
      await fetchImportHistory();
      return summary;
    } catch (err: any) {
      setError(err.message || 'Failed to import from CSV');
      console.error('Import from CSV error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchImportHistory]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear last import summary
   */
  const clearLastSummary = useCallback(() => {
    setLastImportSummary(null);
  }, []);

  return {
    standardDatabases,
    importHistory,
    lastImportSummary,
    loading,
    error,
    fetchStandardDatabases,
    fetchImportHistory,
    importFromStandard,
    importFromCSV,
    clearError,
    clearLastSummary,
  };
};