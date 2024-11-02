import React, { useState } from 'react';
import { format } from 'date-fns';
import { FileText, Plus } from 'lucide-react';
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

interface DailyNotesProps {
  patientId: string;
  notes: Note[];
  onNoteAdded: () => void;
}

export function DailyNotes({ patientId, notes, onNoteAdded }: DailyNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      const userString = localStorage.getItem('user');
      if (!userString) {
        toast.error('Please log in again');
        return;
      }

      const { error } = await supabase
        .from('progress_notes')
        .insert([
          {
            patient_id: patientId,
            content: newNote.trim(),
            created_by: JSON.parse(userString).id,
          },
        ]);

      if (error) throw error;

      setNewNote('');
      onNoteAdded();
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add New Note Form */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="mb-4">
          <label htmlFor="newNote" className="block text-sm font-medium text-gray-700">
            Add Progress Note
          </label>
          <textarea
            id="newNote"
            rows={4}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter progress note..."
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !newNote.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </button>
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{note.content}</p>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <span>{note.created_by.name}</span>
                  <span className="mx-1">•</span>
                  <span>{note.created_by.role}</span>
                  <span className="mx-1">•</span>
                  <span>{format(new Date(note.created_at), 'PPp')}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}