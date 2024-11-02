-- Create function to handle patient status updates
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

-- Create trigger for patient status updates
DROP TRIGGER IF EXISTS update_patient_status_on_admission_trigger ON admission_episodes;
CREATE TRIGGER update_patient_status_on_admission_trigger
  AFTER INSERT ON admission_episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_status_on_admission();

-- Create function to handle discharge status
CREATE OR REPLACE FUNCTION update_patient_status_on_discharge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Discharged' AND OLD.status = 'Active' THEN
    UPDATE patients
    SET 
      status = 'Discharged',
      updated_at = NOW()
    WHERE id = NEW.patient_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for discharge status updates
DROP TRIGGER IF EXISTS update_patient_status_on_discharge_trigger ON admission_episodes;
CREATE TRIGGER update_patient_status_on_discharge_trigger
  AFTER UPDATE ON admission_episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_status_on_discharge();