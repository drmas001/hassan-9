-- First update any 'Other' gender to a default value
UPDATE patients 
SET gender = 'Male' 
WHERE gender = 'Other';

-- Now update the gender check constraint
ALTER TABLE patients 
  DROP CONSTRAINT IF EXISTS patients_gender_check;

ALTER TABLE patients 
  ADD CONSTRAINT patients_gender_check 
  CHECK (gender IN ('Male', 'Female'));