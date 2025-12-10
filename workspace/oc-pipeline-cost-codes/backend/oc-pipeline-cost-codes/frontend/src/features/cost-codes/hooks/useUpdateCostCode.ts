/**
 * useUpdateCostCode Hook
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { costCodeApi } from '../api/cost-code.api';
import { UpdateCostCodeDTO } from '../types/cost-code.types';

export const useUpdateCostCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCostCodeDTO }) =>
      costCodeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-codes'] });
      toast.success('Cost code updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update cost code');
    },
  });
};

export default useUpdateCostCode;