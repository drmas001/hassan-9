import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AdmissionEpisode {
  id: string;
  patient_id: string;
  admission_date: string;
  discharge_date: string | null;
  bed_number: string;
  status: 'Active' | 'Discharged';
  created_at: string;
  updated_at: string;
}

export function useAdmissionEpisode(patientId: string) {
  const [episode, setEpisode] = useState<AdmissionEpisode | null>(null);
  const [previousEpisode, setPreviousEpisode] = useState<AdmissionEpisode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdmissionEpisodes() {
      try {
        setLoading(true);

        // Get current/latest episode
        const { data: currentEpisode, error: currentError } = await supabase
          .from('admission_episodes')
          .select('*')
          .eq('patient_id', patientId)
          .order('admission_date', { ascending: false })
          .limit(1)
          .single();

        if (currentError && currentError.code !== 'PGRST116') {
          throw currentError;
        }

        if (currentEpisode) {
          setEpisode(currentEpisode);

          // Get previous episode if it exists
          if (currentEpisode.status === 'Active') {
            const { data: previousData, error: previousError } = await supabase
              .from('admission_episodes')
              .select('*')
              .eq('patient_id', patientId)
              .eq('status', 'Discharged')
              .order('discharge_date', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (previousError) {
              console.error('Error fetching previous episode:', previousError);
            } else if (previousData) {
              setPreviousEpisode(previousData);
            }
          }
        } else {
          // Create new episode if none exists
          const { data: newEpisode, error: createError } = await supabase
            .from('admission_episodes')
            .insert([
              {
                patient_id: patientId,
                bed_number: 'TBD', // This should be updated with actual bed number
                status: 'Active',
              },
            ])
            .select()
            .single();

          if (createError) throw createError;
          setEpisode(newEpisode);
        }
      } catch (error) {
        console.error('Error fetching admission episode:', error);
        toast.error('Failed to load admission details');
      } finally {
        setLoading(false);
      }
    }

    if (patientId) {
      fetchAdmissionEpisodes();
    }
  }, [patientId]);

  return { episode, previousEpisode, loading };
}