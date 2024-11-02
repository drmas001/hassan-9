-- Drop existing RLS policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Enable insert for all users" ON notifications;

-- Create new RLS policies for notifications
CREATE POLICY "Enable read access for all users"
ON notifications FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for notification owner"
ON notifications FOR UPDATE
USING (user_id::text = auth.uid()::text);

-- Create function for handling notifications with elevated privileges
CREATE OR REPLACE FUNCTION handle_notification_insert()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.created_at := COALESCE(NEW.created_at, NOW());
  RETURN NEW;
END;
$$;

-- Create trigger for notifications
DROP TRIGGER IF EXISTS handle_notification_insert_trigger ON notifications;
CREATE TRIGGER handle_notification_insert_trigger
  BEFORE INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION handle_notification_insert();

-- Ensure RLS is enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;