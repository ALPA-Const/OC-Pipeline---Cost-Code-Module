/**
 * useCreateCostCode Hook
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { costCodeApi } from '../api/cost-code.api';
import { CreateCostCodeDTO } from '../types/cost-code.types';

export const useCreateCostCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCostCodeDTO) => costCodeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-codes'] });
      toast.success('Cost code created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create cost code');
    },
  });
};

export default useCreateCostCode;