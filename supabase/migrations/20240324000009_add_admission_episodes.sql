-- Create admission_episodes table if it doesn't exist
CREATE TABLE IF NOT EXISTS admission_episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  admission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discharge_date TIMESTAMPTZ,
  primary_diagnosis TEXT,
  attending_physician_id UUID NOT NULL REFERENCES users(id),  -- Make this NOT NULL
  bed_number VARCHAR(20) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('Active', 'Discharged')) NOT NULL DEFAULT 'Active',
  readmission_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely create indexes
DO $$ 
BEGIN
  -- Create index for patient_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_admission_episodes_patient_id'
  ) THEN
    CREATE INDEX idx_admission_episodes_patient_id ON admission_episodes(patient_id);
  END IF;

  -- Create index for status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_admission_episodes_status'
  ) THEN
    CREATE INDEX idx_admission_episodes_status ON admission_episodes(status);
  END IF;
END $$;

-- Create trigger for updating timestamps if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_admission_episodes_updated_at'
  ) THEN
    CREATE TRIGGER update_admission_episodes_updated_at
      BEFORE UPDATE ON admission_episodes
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE admission_episodes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON admission_episodes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON admission_episodes;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON admission_episodes;

-- Create RLS policies
CREATE POLICY "Enable read access for all users"
  ON admission_episodes FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON admission_episodes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON admission_episodes FOR UPDATE
  USING (true);

-- Get default admin user for migration
DO $$
DECLARE
  default_physician_id UUID;
BEGIN
  SELECT id INTO default_physician_id
  FROM users
  WHERE role = 'Doctor'
  ORDER BY created_at
  LIMIT 1;

  -- Migrate existing patient data to admission_episodes if not already migrated
  INSERT INTO admission_episodes (
    patient_id,
    admission_date,
    bed_number,
    primary_diagnosis,
    attending_physician_id,  -- Include attending physician
    status,
    created_at,
    updated_at
  )
  SELECT 
    p.id as patient_id,
    p.admission_date,
    p.bed_number,
    p.diagnosis as primary_diagnosis,
    COALESCE(p.attending_physician_id, default_physician_id) as attending_physician_id,  -- Use default if null
    CASE 
      WHEN p.status = 'Discharged' THEN 'Discharged'
      ELSE 'Active'
    END as status,
    p.created_at,
    p.updated_at
  FROM patients p
  WHERE NOT EXISTS (
    SELECT 1 
    FROM admission_episodes ae 
    WHERE ae.patient_id = p.id
  );
END $$;