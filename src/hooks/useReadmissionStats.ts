import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ReadmissionStats } from '../types/admission';
import toast from 'react-hot-toast';

export function useReadmissionStats(dateRange?: { startDate: Date; endDate: Date }) {
  const [stats, setStats] = useState<ReadmissionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        let query = supabase
          .from('admission_episodes')
          .select('*')
          .eq('is_readmission', true);

        if (dateRange) {
          query = query
            .gte('admission_date', dateRange.startDate.toISOString())
            .lte('admission_date', dateRange.endDate.toISOString());
        }

        const { data: readmissions, error } = await query;

        if (error) throw error;

        // Calculate total admissions for the same period
        let admissionsQuery = supabase.from('admission_episodes').select('count');
        
        if (dateRange) {
          admissionsQuery = admissionsQuery
            .gte('admission_date', dateRange.startDate.toISOString())
            .lte('admission_date', dateRange.endDate.toISOString());
        }

        const { count: totalAdmissions, error: countError } = await admissionsQuery;

        if (countError) throw countError;

        // Calculate average days to readmission
        const daysToReadmission = readmissions.map(readmission => {
          if (!readmission.previous_episode_id) return 0;
          const admissionDate = new Date(readmission.admission_date);
          const previousDischarge = new Date(readmission.discharge_date || '');
          return (admissionDate.getTime() - previousDischarge.getTime()) / (1000 * 60 * 60 * 24);
        });

        const averageDays = daysToReadmission.length > 0
          ? daysToReadmission.reduce((a, b) => a + b, 0) / daysToReadmission.length
          : 0;

        // Count common reasons
        const reasonCounts = readmissions.reduce((acc, curr) => {
          if (curr.readmission_reason) {
            acc[curr.readmission_reason] = (acc[curr.readmission_reason] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const commonReasons = Object.entries(reasonCounts)
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({
          total_readmissions: readmissions.length,
          readmission_rate: totalAdmissions ? readmissions.length / totalAdmissions : 0,
          average_days_to_readmission: averageDays,
          common_reasons: commonReasons
        });
      } catch (error) {
        console.error('Error fetching readmission stats:', error);
        toast.error('Failed to load readmission statistics');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [dateRange]);

  return { stats, loading };
}