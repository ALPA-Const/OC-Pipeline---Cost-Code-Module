/**
 * useCostCodes Hook
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { useQuery } from '@tanstack/react-query';
import { costCodeApi } from '../api/cost-code.api';
import { CostCodeQueryParams } from '../types/cost-code.types';

export const useCostCodes = (params?: CostCodeQueryParams) => {
  return useQuery({
    queryKey: ['cost-codes', params],
    queryFn: () => costCodeApi.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export default useCostCodes;