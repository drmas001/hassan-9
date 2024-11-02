-- Create a security definer function to handle notification creation
CREATE OR REPLACE FUNCTION create_system_notification(
  p_type TEXT,
  p_message TEXT,
  p_severity TEXT,
  p_user_id UUID,
  p_patient_id UUID
)
RETURNS UUID
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    type,
    message,
    severity,
    user_id,
    patient_id,
    created_at
  ) VALUES (
    p_type,
    p_message,
    p_severity,
    p_user_id,
    p_patient_id,
    NOW()
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;