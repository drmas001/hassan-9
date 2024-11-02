export type LabCategory = 'Hematology' | 'Chemistry' | 'Microbiology' | 'Other';

export interface LabTest {
  id: string;
  category: LabCategory;
  test_type: string;
  test_name: string;
  result: string;
  unit?: string;
  reference_range?: string;
  status: 'Normal' | 'Abnormal' | 'Critical';
  previous_result?: string;
  delta?: number;
  resulted_at: string;
  notes?: string;
}

export interface ReferenceRange {
  id: string;
  test_type: string;
  min_value?: number;
  max_value?: number;
  unit?: string;
  description: string;
}

export const LAB_CATEGORIES: Record<LabCategory, string[]> = {
  Hematology: [
    'CBC',
    'D-Dimer',
    'Eosinophil Count',
    'Hemoglobin & Hematocrit',
    'Platelet Count',
    'PT',
    'PTT',
    'ESR',
    'WBC',
    'Occult Blood'
  ],
  Chemistry: [
    'Albumin',
    'Alkaline Phosphatase',
    'ALT',
    'AST',
    'Amylase',
    'BUN',
    'CRP',
    'CK',
    'CK-MB',
    'Creatinine',
    'GGT',
    'Hepatic Function Panel',
    'Lactic Acid',
    'LDH',
    'Lipase',
    'Phosphorus',
    'Potassium',
    'Renal Function Panel',
    'Sodium',
    'Total Bilirubin',
    'Troponin I',
    'Uric Acid',
    'Urinalysis'
  ],
  Microbiology: [
    'Blood Culture',
    'Urine Culture',
    'Sputum Culture',
    'CSF Culture',
    'Wound Culture',
    'Gram Stain'
  ],
  Other: ['Other']
};