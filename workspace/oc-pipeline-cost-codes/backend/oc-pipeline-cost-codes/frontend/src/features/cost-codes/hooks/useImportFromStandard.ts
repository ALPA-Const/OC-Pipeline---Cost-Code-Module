/**
 * useImportFromStandard Hook
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { importApi } from '../api/import.api';
import { ImportFromStandardDTO } from '../types/cost-code.types';

export const useImportFromStandard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ImportFromStandardDTO) => importApi.importFromStandard(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cost-codes'] });
      toast.success(
        `Import completed: ${data.successful_imports} codes imported, ${data.duplicate_skips} duplicates skipped`
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to import from standard database');
    },
  });
};

export default useImportFromStandard;