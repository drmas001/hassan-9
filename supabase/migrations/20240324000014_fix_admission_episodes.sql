-- Drop and recreate the admit_patient function with proper field handling
CREATE OR REPLACE FUNCTION admit_patient(
  p_mrn TEXT,
  p_name TEXT,
  p_age INTEGER,
  p_gender TEXT,
  p_diagnosis TEXT,
  p_bed_number TEXT,
  p_history TEXT,
  p_examination TEXT,
  p_notes TEXT,
  p_readmission_reason TEXT,
  p_attending_physician_id UUID
) RETURNS patients AS $$
DECLARE
  v_patient_id UUID;
  v_patient patients;
BEGIN
  -- Check if patient exists
  SELECT id INTO v_patient_id
  FROM patients
  WHERE mrn = p_mrn;

  IF v_patient_id IS NULL THEN
    -- Create new patient
    INSERT INTO patients (
      mrn,
      name,
      age,
      gender,
      diagnosis,
      bed_number,
      history,
      examination,
      notes,
      status,
      attending_physician_id,
      created_at,
      updated_at
    ) VALUES (
      p_mrn,
      p_name,
      p_age,
      p_gender,
      COALESCE(p_diagnosis, 'Under evaluation'),
      p_bed_number,
      COALESCE(p_history, 'Initial admission'),
      COALESCE(p_examination, 'Pending'),
      p_notes,
      'Active',
      p_attending_physician_id,
      NOW(),
      NOW()
    ) RETURNING * INTO v_patient;
    
    v_patient_id := v_patient.id;
  ELSE
    -- Update existing patient
    UPDATE patients SET
      name = p_name,
      age = p_age,
      gender = p_gender,
      diagnosis = COALESCE(p_diagnosis, diagnosis),
      bed_number = p_bed_number,
      history = COALESCE(p_history, history),
      examination = COALESCE(p_examination, examination),
      notes = COALESCE(p_notes, notes),
      status = 'Active',
      attending_physician_id = p_attending_physician_id,
      updated_at = NOW()
    WHERE id = v_patient_id
    RETURNING * INTO v_patient;
  END IF;

  -- Create admission episode with proper field handling
  INSERT INTO admission_episodes (
    patient_id,
    admission_date,
    bed_number,
    primary_diagnosis,
    attending_physician_id,
    status,
    readmission_reason,
    history,
    examination,
    notes,
    created_at,
    updated_at
  ) VALUES (
    v_patient_id,
    NOW(),
    p_bed_number,
    COALESCE(p_diagnosis, 'Under evaluation'),
    p_attending_physician_id,
    'Active',
    p_readmission_reason,
    COALESCE(p_history, 'Initial admission'),
    COALESCE(p_examination, 'Pending'),
    p_notes,
    NOW(),
    NOW()
  );

  -- Create notification for admission
  INSERT INTO notifications (
    type,
    message,
    severity,
    user_id,
    patient_id,
    created_at
  ) VALUES (
    'status',
    CASE 
      WHEN p_readmission_reason IS NOT NULL THEN 
        'Patient ' || p_name || ' readmitted: ' || p_readmission_reason
      ELSE 
        'New patient ' || p_name || ' admitted'
    END,
    'info',
    p_attending_physician_id,
    v_patient_id,
    NOW()
  );

  RETURN v_patient;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to ensure admission episodes are properly linked
CREATE OR REPLACE FUNCTION ensure_admission_episode_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure primary diagnosis is never null
  NEW.primary_diagnosis := COALESCE(NEW.primary_diagnosis, 'Under evaluation');
  
  -- Ensure history is never null
  NEW.history := COALESCE(NEW.history, 'Initial admission');
  
  -- Ensure examination is never null
  NEW.examination := COALESCE(NEW.examination, 'Pending');
  
  -- Set created_at and updated_at if not provided
  NEW.created_at := COALESCE(NEW.created_at, NOW());
  NEW.updated_at := COALESCE(NEW.updated_at, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for admission episodes
DROP TRIGGER IF EXISTS ensure_admission_episode_fields_trigger ON admission_episodes;
CREATE TRIGGER ensure_admission_episode_fields_trigger
  BEFORE INSERT OR UPDATE ON admission_episodes
  FOR EACH ROW
  EXECUTE FUNCTION ensure_admission_episode_fields();