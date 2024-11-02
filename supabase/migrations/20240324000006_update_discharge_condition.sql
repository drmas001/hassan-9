-- First drop the existing constraint to allow updates
ALTER TABLE discharges 
  DROP CONSTRAINT IF EXISTS discharges_discharge_condition_check;

-- Update existing records to match new values
UPDATE discharges 
SET discharge_condition = 
  CASE 
    WHEN discharge_condition IN ('Deceased', 'Deteriorated', 'Stable') THEN 'Improved'
    WHEN discharge_condition = 'Died' THEN 'Died'
    ELSE 'Improved'
  END;

-- Now add the new constraint
ALTER TABLE discharges 
  ADD CONSTRAINT discharges_discharge_condition_check 
  CHECK (discharge_condition IN ('Improved', 'Died'));