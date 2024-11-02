-- First, temporarily disable the existing constraint
ALTER TABLE patients 
  DROP CONSTRAINT IF EXISTS patients_status_check;

-- Update any null or invalid status values
UPDATE patients 
SET status = 'Active' 
WHERE status IS NULL OR status NOT IN ('Active', 'Discharged');

-- Add the new constraint
ALTER TABLE patients 
  ADD CONSTRAINT patients_status_check 
  CHECK (status IN ('Active', 'Discharged'));

-- Update or recreate the admission trigger function
CREATE OR REPLACE FUNCTION update_patient_status_on_admission()
RETURNS TRIGGER AS $$
BEGIN
  -- Update patient status to Active when a new admission episode is created
  UPDATE patients
  SET 
    status = 'Active',
    updated_at = NOW()
  WHERE id = NEW.patient_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update or recreate the discharge trigger function
CREATE OR REPLACE FUNCTION update_patient_status_on_discharge()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update status if this is a discharge event
  IF NEW.status = 'Discharged' AND OLD.status = 'Active' THEN
    -- Check if patient has any other active admissions
    IF NOT EXISTS (
      SELECT 1 
      FROM admission_episodes 
      WHERE patient_id = NEW.patient_id 
        AND status = 'Active'
        AND id != NEW.id
    ) THEN
      UPDATE patients
      SET 
        status = 'Discharged',
        updated_at = NOW()
      WHERE id = NEW.patient_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_patient_status_on_admission_trigger ON admission_episodes;
DROP TRIGGER IF EXISTS update_patient_status_on_discharge_trigger ON admission_episodes;

-- Recreate the triggers
CREATE TRIGGER update_patient_status_on_admission_trigger
  AFTER INSERT ON admission_episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_status_on_admission();

CREATE TRIGGER update_patient_status_on_discharge_trigger
  AFTER UPDATE ON admission_episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_status_on_discharge();

-- Function to sync patient status with admission episodes
CREATE OR REPLACE FUNCTION sync_patient_status()
RETURNS void AS $$
BEGIN
  -- Update all patients based on their admission episodes
  UPDATE patients p
  SET status = CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM admission_episodes ae 
      WHERE ae.patient_id = p.id 
        AND ae.status = 'Active'
    ) THEN 'Active'
    ELSE 'Discharged'
  END,
  updated_at = NOW()
  WHERE p.status IS NULL 
     OR p.status NOT IN ('Active', 'Discharged')
     OR p.status != CASE 
          WHEN EXISTS (
            SELECT 1 
            FROM admission_episodes ae 
            WHERE ae.patient_id = p.id 
              AND ae.status = 'Active'
          ) THEN 'Active'
          ELSE 'Discharged'
        END;
END;
$$ LANGUAGE plpgsql;

-- Execute the sync function
SELECT sync_patient_status();