/**
 * Import API Client
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import axios from 'axios';
import {
  CostCodeWithChildren,
  CostCodeImport,
  ImportFromStandardDTO,
  ImportSummary,
} from '../types/cost-code.types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const importApi = {
  /**
   * Get standard database codes
   */
  getStandardDatabaseCodes: async (
    databaseName: 'csi_2016' | 'nahb'
  ): Promise<CostCodeWithChildren[]> => {
    const response = await apiClient.get<{ success: boolean; data: CostCodeWithChildren[] }>(
      `/cost-codes/standard-databases/${databaseName}`
    );
    return response.data.data;
  },

  /**
   * Import from standard database
   */
  importFromStandard: async (data: ImportFromStandardDTO): Promise<ImportSummary> => {
    const response = await apiClient.post<{ success: boolean; data: ImportSummary }>(
      '/cost-codes/import/standard',
      data
    );
    return response.data.data;
  },

  /**
   * Import from CSV file
   */
  importFromCSV: async (file: File): Promise<ImportSummary> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{ success: boolean; data: ImportSummary }>(
      '/cost-codes/import/csv',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  /**
   * Get import history
   */
  getImportHistory: async (): Promise<CostCodeImport[]> => {
    const response = await apiClient.get<{ success: boolean; data: CostCodeImport[] }>(
      '/cost-codes/imports'
    );
    return response.data.data;
  },
};

export default importApi;