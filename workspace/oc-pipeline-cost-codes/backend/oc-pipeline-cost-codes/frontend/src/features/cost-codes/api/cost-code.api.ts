/**
 * Cost Code API Client
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import axios from 'axios';
import {
  CostCode,
  CostCodeWithChildren,
  CreateCostCodeDTO,
  UpdateCostCodeDTO,
  CostCodeQueryParams,
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

export const costCodeApi = {
  /**
   * Get all cost codes with optional filters
   */
  getAll: async (params?: CostCodeQueryParams): Promise<CostCodeWithChildren[]> => {
    const response = await apiClient.get<{ success: boolean; data: CostCodeWithChildren[] }>(
      '/cost-codes',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get a single cost code by ID
   */
  getById: async (id: string): Promise<CostCode> => {
    const response = await apiClient.get<{ success: boolean; data: CostCode }>(
      `/cost-codes/${id}`
    );
    return response.data.data;
  },

  /**
   * Create a new cost code
   */
  create: async (data: CreateCostCodeDTO): Promise<CostCode> => {
    const response = await apiClient.post<{ success: boolean; data: CostCode }>(
      '/cost-codes',
      data
    );
    return response.data.data;
  },

  /**
   * Update an existing cost code
   */
  update: async (id: string, data: UpdateCostCodeDTO): Promise<CostCode> => {
    const response = await apiClient.patch<{ success: boolean; data: CostCode }>(
      `/cost-codes/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Archive a cost code
   */
  archive: async (id: string): Promise<CostCode> => {
    const response = await apiClient.delete<{ success: boolean; data: CostCode }>(
      `/cost-codes/${id}`
    );
    return response.data.data;
  },

  /**
   * Check if a code number is unique
   */
  checkUnique: async (codeNumber: string, excludeId?: string): Promise<boolean> => {
    const response = await apiClient.get<{ success: boolean; data: { unique: boolean } }>(
      '/cost-codes/check-unique',
      {
        params: { code_number: codeNumber, exclude_id: excludeId },
      }
    );
    return response.data.data.unique;
  },

  /**
   * Export cost codes as CSV
   */
  exportCSV: async (params?: CostCodeQueryParams): Promise<Blob> => {
    const response = await apiClient.get('/cost-codes/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default costCodeApi;