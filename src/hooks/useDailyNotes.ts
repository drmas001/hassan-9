import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Note {
  id: string;
  content: string;
  created_at: string;
  created_by: {
    name: string;
    role: string;
  };
}

export function useDailyNotes(patientId: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_notes')
        .select(`
          *,
          created_by:users (
            name,
            role
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load progress notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchNotes();
    }
  }, [patientId]);

  return { notes, loading, refreshNotes: fetchNotes };
}