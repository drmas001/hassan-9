-- First, create the ENUM types if they don't exist
DO $$ BEGIN
  CREATE TYPE lab_category AS ENUM ('Hematology', 'Chemistry', 'Microbiology', 'Other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE lab_test_type AS ENUM (
    -- Hematology
    'CBC', 'D_Dimer', 'Eosinophil_Count', 'Hemoglobin_Hematocrit',
    'Platelet_Count', 'PT', 'PTT', 'ESR', 'WBC', 'Occult_Blood',
    -- Chemistry
    'Albumin', 'Alkaline_Phosphatase', 'ALT', 'AST', 'Amylase',
    'BUN', 'CRP', 'CK', 'CK_MB', 'Creatinine', 'GGT',
    'Hepatic_Function', 'Lactic_Acid', 'LDH', 'Lipase',
    'Phosphorus', 'Potassium', 'Renal_Function', 'Sodium',
    'Total_Bilirubin', 'Troponin_I', 'Uric_Acid', 'Urinalysis',
    -- Microbiology
    'Blood_Culture', 'Urine_Culture', 'Sputum_Culture', 'CSF_Culture',
    'Wound_Culture', 'Gram_Stain',
    -- Other
    'Other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update lab_results table - safely add columns if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_results' AND column_name = 'category') THEN
    ALTER TABLE lab_results ADD COLUMN category lab_category NOT NULL DEFAULT 'Other';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_results' AND column_name = 'test_type') THEN
    ALTER TABLE lab_results ADD COLUMN test_type lab_test_type NOT NULL DEFAULT 'Other';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_results' AND column_name = 'previous_result') THEN
    ALTER TABLE lab_results ADD COLUMN previous_result TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_results' AND column_name = 'delta') THEN
    ALTER TABLE lab_results ADD COLUMN delta DECIMAL;
  END IF;
END $$;

-- Add indexes if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lab_results_category') THEN
    CREATE INDEX idx_lab_results_category ON lab_results(category);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lab_results_test_type') THEN
    CREATE INDEX idx_lab_results_test_type ON lab_results(test_type);
  END IF;
END $$;

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS calculate_lab_result_delta_trigger ON lab_results;
DROP FUNCTION IF EXISTS calculate_lab_result_delta();

-- Create function for delta calculation
CREATE OR REPLACE FUNCTION calculate_lab_result_delta()
RETURNS TRIGGER AS $$
DECLARE
  prev_result TEXT;
  prev_numeric DECIMAL;
  new_numeric DECIMAL;
BEGIN
  -- Get the previous result for the same test type and patient
  SELECT result INTO prev_result
  FROM lab_results
  WHERE patient_id = NEW.patient_id
    AND test_type = NEW.test_type
    AND id != NEW.id
  ORDER BY resulted_at DESC
  LIMIT 1;

  NEW.previous_result := prev_result;

  -- Try to calculate numeric delta if both values are numeric
  BEGIN
    prev_numeric := prev_result::DECIMAL;
    new_numeric := NEW.result::DECIMAL;
    NEW.delta := new_numeric - prev_numeric;
  EXCEPTION WHEN OTHERS THEN
    -- If conversion fails, leave delta as null
    NEW.delta := NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for delta calculation
CREATE TRIGGER calculate_lab_result_delta_trigger
  BEFORE INSERT OR UPDATE ON lab_results
  FOR EACH ROW
  EXECUTE FUNCTION calculate_lab_result_delta();

-- Create reference ranges table if it doesn't exist
CREATE TABLE IF NOT EXISTS lab_reference_ranges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_type lab_test_type NOT NULL,
  min_value DECIMAL,
  max_value DECIMAL,
  unit VARCHAR(50),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add common reference ranges if table is empty
INSERT INTO lab_reference_ranges (test_type, min_value, max_value, unit, description)
SELECT v.test_type::lab_test_type, v.min_value, v.max_value, v.unit, v.description
FROM (VALUES
  ('WBC'::lab_test_type, 4.5, 11.0, '10³/µL', 'White Blood Cell Count'),
  ('Hemoglobin_Hematocrit'::lab_test_type, 12.0, 16.0, 'g/dL', 'Hemoglobin'),
  ('Platelet_Count'::lab_test_type, 150, 450, '10³/µL', 'Platelet Count'),
  ('Creatinine'::lab_test_type, 0.6, 1.2, 'mg/dL', 'Serum Creatinine'),
  ('ALT'::lab_test_type, 7, 56, 'U/L', 'Alanine Aminotransferase'),
  ('AST'::lab_test_type, 10, 40, 'U/L', 'Aspartate Aminotransferase')
) AS v(test_type, min_value, max_value, unit, description)
WHERE NOT EXISTS (SELECT 1 FROM lab_reference_ranges);

-- Enable RLS on reference ranges table
ALTER TABLE lab_reference_ranges ENABLE ROW LEVEL SECURITY;

-- Add policies if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lab_reference_ranges' 
    AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users"
      ON lab_reference_ranges FOR SELECT
      USING (true);
  END IF;
END $$;

-- Add trigger for timestamps if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_lab_reference_ranges_updated_at'
  ) THEN
    CREATE TRIGGER update_lab_reference_ranges_updated_at
      BEFORE UPDATE ON lab_reference_ranges
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;