-- Create a function to handle patient admission
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
      p_diagnosis,
      p_bed_number,
      p_history,
      p_examination,
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
      diagnosis = p_diagnosis,
      bed_number = p_bed_number,
      history = p_history,
      examination = p_examination,
      notes = p_notes,
      status = 'Active',
      attending_physician_id = p_attending_physician_id,
      updated_at = NOW()
    WHERE id = v_patient_id
    RETURNING * INTO v_patient;
  END IF;

  -- Create admission episode
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
    p_diagnosis,
    p_attending_physician_id,
    'Active',
    p_readmission_reason,
    p_history,
    p_examination,
    p_notes,
    NOW(),
    NOW()
  );

  RETURN v_patient;
END;
$$ LANGUAGE plpgsql;