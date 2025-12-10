/**
 * useImportFromCSV Hook
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { importApi } from '../api/import.api';

export const useImportFromCSV = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => importApi.importFromCSV(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cost-codes'] });
      toast.success(
        `Import completed: ${data.successful_imports} codes imported, ${data.duplicate_skips} duplicates skipped`
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to import from CSV');
    },
  });
};

export default useImportFromCSV;