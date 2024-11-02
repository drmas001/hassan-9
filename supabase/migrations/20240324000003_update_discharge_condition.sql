-- Update the discharge_condition check constraint
ALTER TABLE discharges 
  DROP CONSTRAINT IF EXISTS discharges_discharge_condition_check;

ALTER TABLE discharges 
  ADD CONSTRAINT discharges_discharge_condition_check 
  CHECK (discharge_condition IN ('Improved', 'died'));