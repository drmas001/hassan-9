import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AddDailyNoteFormProps {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddDailyNoteForm({ patientId, onClose, onSuccess }: AddDailyNoteFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    note_date: new Date().toISOString().split('T')[0],
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userString = localStorage.getItem('user');
      if (!userString) {
        toast.error('Please log in again');
        return;
      }

      const user = JSON.parse(userString);

      const { error } = await supabase.from('daily_notes').insert([
        {
          patient_id: patientId,
          note_date: formData.note_date,
          subjective: formData.subjective.trim(),
          objective: formData.objective.trim(),
          assessment: formData.assessment.trim(),
          plan: formData.plan.trim(),
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast.success('Progress note added successfully');
      onSuccess();
    } catch (error) {
      console.error('Error adding progress note:', error);
      toast.error('Failed to add progress note');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Add Progress Note</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            name="note_date"
            required
            value={formData.note_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Subjective
          </label>
          <textarea
            name="subjective"
            required
            rows={3}
            value={formData.subjective}
            onChange={handleChange}
            placeholder="Patient's symptoms, complaints, and history"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Objective
          </label>
          <textarea
            name="objective"
            required
            rows={3}
            value={formData.objective}
            onChange={handleChange}
            placeholder="Physical examination findings, vital signs, and test results"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Assessment
          </label>
          <textarea
            name="assessment"
            required
            rows={3}
            value={formData.assessment}
            onChange={handleChange}
            placeholder="Diagnosis and clinical impression"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Plan</label>
          <textarea
            name="plan"
            required
            rows={3}
            value={formData.plan}
            onChange={handleChange}
            placeholder="Treatment plan, medications, and follow-up"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </form>
    </div>
  );
}