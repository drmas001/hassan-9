CREATE OR REPLACE FUNCTION create_discharge_notification(
  p_patient_id UUID,
  p_user_id UUID,
  p_discharge_condition TEXT
)
RETURNS void
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO notifications (
    type,
    message,
    severity,
    user_id,
    patient_id,
    created_at
  )
  SELECT
    'discharge',
    CASE 
      WHEN p_discharge_condition = 'Deceased' THEN 'Patient ' || p.name || ' deceased'
      WHEN p_discharge_condition = 'Deteriorated' THEN 'Patient ' || p.name || ' discharged in deteriorated condition'
      ELSE 'Patient ' || p.name || ' discharged'
    END,
    CASE 
      WHEN p_discharge_condition IN ('Deceased', 'Deteriorated') THEN 'critical'
      ELSE 'info'
    END,
    p_user_id,
    p_patient_id,
    NOW()
  FROM patients p
  WHERE p.id = p_patient_id;
END;
$$;