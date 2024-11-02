-- Drop existing enum if it exists
DROP TYPE IF EXISTS lab_test_type CASCADE;

-- Create new enum with all test types
CREATE TYPE lab_test_type AS ENUM (
  -- Hematology
  'cbc',
  'd_dimer',
  'eosinophil_count',
  'hemoglobin_hematocrit',
  'platelet_count',
  'pt',
  'ptt',
  'esr',
  'wbc',
  'occult_blood',
  
  -- Chemistry
  'albumin',
  'alkaline_phosphatase',
  'alt',
  'ast',
  'amylase',
  'bun',
  'crp',
  'ck',
  'ck_mb',
  'creatinine',
  'ggt',
  'hepatic_panel',
  'lactic_acid',
  'ldh',
  'lipase',
  'phosphorus',
  'potassium',
  'renal_panel',
  'sodium',
  'total_bilirubin',
  'troponin_i',
  'uric_acid',
  'urinalysis',

  -- Microbiology
  'blood_culture',
  'urine_culture',
  'sputum_culture',
  'csf_culture',
  'wound_culture',
  'mrsa_screen',
  'covid_pcr',
  
  -- Other
  'other'
);

-- Update lab_results table to use the new enum
ALTER TABLE lab_results 
  DROP COLUMN IF EXISTS test_type,
  ADD COLUMN test_type lab_test_type;