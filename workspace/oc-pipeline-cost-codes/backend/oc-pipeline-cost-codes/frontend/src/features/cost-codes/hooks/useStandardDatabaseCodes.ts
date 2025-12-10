/**
 * useStandardDatabaseCodes Hook
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { useQuery } from '@tanstack/react-query';
import { importApi } from '../api/import.api';

export const useStandardDatabaseCodes = (databaseName: 'csi_2016' | 'nahb') => {
  return useQuery({
    queryKey: ['standard-database-codes', databaseName],
    queryFn: () => importApi.getStandardDatabaseCodes(databaseName),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export default useStandardDatabaseCodes;