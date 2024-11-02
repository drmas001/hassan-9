import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ReferenceRange } from '../types/lab';
import toast from 'react-hot-toast';

export function useLabReferenceRanges() {
  const [referenceRanges, setReferenceRanges] = useState<ReferenceRange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReferenceRanges() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('lab_reference_ranges')
          .select('*')
          .order('test_type');

        if (error) throw error;
        setReferenceRanges(data || []);
      } catch (error) {
        console.error('Error fetching reference ranges:', error);
        toast.error('Failed to load reference ranges');
      } finally {
        setLoading(false);
      }
    }

    fetchReferenceRanges();
  }, []);

  const getReferenceRange = (testType: string): ReferenceRange | undefined => {
    return referenceRanges.find(range => range.test_type === testType);
  };

  return { referenceRanges, getReferenceRange, loading };
}