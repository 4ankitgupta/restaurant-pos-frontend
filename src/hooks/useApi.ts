import { useState, useCallback } from 'react';
import { ApiError } from '@/services/apiService';
import { toast } from '@/hooks/use-toast';

export const useApi = <T>() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      
      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, data, execute };
};