import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddLabResultFormProps {
  patientId: string;
  onClose: () => void;
}

const TEST_CATEGORIES = {
  Hematology: [
    { value: 'cbc', label: 'CBC (Complete Blood Count)' },
    { value: 'd_dimer', label: 'D-Dimer' },
    { value: 'eosinophil_count', label: 'Eosinophil Count' },
    { value: 'hemoglobin_hematocrit', label: 'Hemoglobin & Hematocrit' },
    { value: 'platelet_count', label: 'Platelet Count' },
    { value: 'pt', label: 'PT (Prothrombin Time)' },
    { value: 'ptt', label: 'PTT (Partial Thromboplastin Time)' },
    { value: 'esr', label: 'Sedimentation Rate (ESR)' },
    { value: 'wbc', label: 'White Blood Cell Count (WBC)' },
    { value: 'occult_blood', label: 'Occult Blood (Feces)' }
  ],
  Chemistry: [
    { value: 'albumin', label: 'Albumin' },
    { value: 'alkaline_phosphatase', label: 'Alkaline Phosphatase' },
    { value: 'alt', label: 'ALT (SGPT)' },
    { value: 'ast', label: 'AST (SGOT)' },
    { value: 'amylase', label: 'Amylase' },
    { value: 'bun', label: 'Blood Urea Nitrogen (BUN)' },
    { value: 'crp', label: 'C-Reactive Protein (CRP)' },
    { value: 'ck', label: 'CK (Creatine Kinase)' },
    { value: 'ck_mb', label: 'CK-MB' },
    { value: 'creatinine', label: 'Creatinine' },
    { value: 'ggt', label: 'GGT' },
    { value: 'hepatic_panel', label: 'Hepatic Function Panel' },
    { value: 'lactic_acid', label: 'Lactic Acid' },
    { value: 'ldh', label: 'LDH' },
    { value: 'lipase', label: 'Lipase' },
    { value: 'phosphorus', label: 'Phosphorus' },
    { value: 'potassium', label: 'Potassium' },
    { value: 'renal_panel', label: 'Renal Function Panel' },
    { value: 'sodium', label: 'Sodium' },
    { value: 'total_bilirubin', label: 'Total Bilirubin' },
    { value: 'troponin_i', label: 'Troponin I' },
    { value: 'uric_acid', label: 'Uric Acid' },
    { value: 'urinalysis', label: 'Urinalysis' }
  ],
  Microbiology: [
    { value: 'blood_culture', label: 'Blood Culture' },
    { value: 'urine_culture', label: 'Urine Culture' },
    { value: 'sputum_culture', label: 'Sputum Culture' },
    { value: 'csf_culture', label: 'CSF Culture' },
    { value: 'wound_culture', label: 'Wound Culture' },
    { value: 'mrsa_screen', label: 'MRSA Screen' },
    { value: 'covid_pcr', label: 'COVID-19 PCR' }
  ],
  Other: [
    { value: 'other', label: 'Other Test' }
  ]
};

export function AddLabResultForm({ patientId, onClose }: AddLabResultFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    test_type: '',
    test_name: '',
    result: '',
    unit: '',
    reference_range: '',
    status: 'Normal' as const,
    notes: '',
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

      const { error } = await supabase.from('lab_results').insert([
        {
          patient_id: patientId,
          category: formData.category,
          test_type: formData.test_type,
          test_name: formData.test_name || TEST_CATEGORIES[formData.category as keyof typeof TEST_CATEGORIES]
            ?.find(test => test.value === formData.test_type)?.label || formData.test_type,
          result: formData.result,
          unit: formData.unit || null,
          reference_range: formData.reference_range || null,
          status: formData.status,
          notes: formData.notes || null,
          ordered_by: user.id,
        },
      ]);

      if (error) throw error;

      toast.success('Lab result added successfully');
      onClose();
    } catch (error) {
      console.error('Error adding lab result:', error);
      toast.error('Failed to add lab result');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // Reset test_type when category changes
      if (name === 'category') {
        return { ...prev, [name]: value, test_type: '', test_name: '' };
      }
      // Auto-fill test name when test_type changes
      if (name === 'test_type') {
        const testLabel = TEST_CATEGORIES[formData.category as keyof typeof TEST_CATEGORIES]
          ?.find(test => test.value === value)?.label || value;
        return { ...prev, [name]: value, test_name: testLabel };
      }
      return { ...prev, [name]: value };
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Add Lab Result</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category"
            required
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select category</option>
            {Object.keys(TEST_CATEGORIES).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {formData.category && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Test Type</label>
            <select
              name="test_type"
              required
              value={formData.test_type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select test type</option>
              {TEST_CATEGORIES[formData.category as keyof typeof TEST_CATEGORIES]?.map(test => (
                <option key={test.value} value={test.value}>{test.label}</option>
              ))}
            </select>
          </div>
        )}

        {formData.test_type === 'other' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Test Name</label>
            <input
              type="text"
              name="test_name"
              required
              value={formData.test_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Result</label>
          <input
            type="text"
            name="result"
            required
            value={formData.result}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Unit</label>
          <input
            type="text"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Reference Range</label>
          <input
            type="text"
            name="reference_range"
            value={formData.reference_range}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            required
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="Normal">Normal</option>
            <option value="Abnormal">Abnormal</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
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
            {loading ? 'Adding...' : 'Add Result'}
          </button>
        </div>
      </form>
    </div>
  );
}