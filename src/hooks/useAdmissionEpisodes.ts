import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { AdmissionEpisode } from '../types/admission';

export function useAdmissionEpisodes(patientId?: string) {
  const [episodes, setEpisodes] = useState<AdmissionEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        setLoading(true);
        setError(null);

        const query = supabase
          .from('admission_episodes')
          .select(`
            *,
            patient:patients(name, mrn),
            physician:users!admission_episodes_attending_physician_id_fkey(name)
          `)
          .order('admission_date', { ascending: false });

        if (patientId) {
          query.eq('patient_id', patientId);
        }

        const { data, error: supabaseError } = await query;

        if (supabaseError) throw supabaseError;

        setEpisodes(data || []);
      } catch (err) {
        console.error('Error fetching admission episodes:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch admission episodes'));
        toast.error('Failed to load admission records');
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodes();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('admission_episodes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admission_episodes',
          ...(patientId ? { filter: `patient_id=eq.${patientId}` } : {})
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('admission_episodes')
              .select(`
                *,
                patient:patients(name, mrn),
                physician:users!admission_episodes_attending_physician_id_fkey(name)
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              setEpisodes(current => [data, ...current]);
              toast.success('New admission recorded');
            }
          } else if (payload.eventType === 'UPDATE') {
            setEpisodes(current =>
              current.map(episode =>
                episode.id === payload.new.id
                  ? { ...episode, ...payload.new }
                  : episode
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId]);

  return { episodes, loading, error };
}