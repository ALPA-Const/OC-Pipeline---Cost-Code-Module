/**
 * useArchiveCostCode Hook
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { costCodeApi } from '../api/cost-code.api';

export const useArchiveCostCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => costCodeApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-codes'] });
      toast.success('Cost code archived successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to archive cost code');
    },
  });
};

export default useArchiveCostCode;